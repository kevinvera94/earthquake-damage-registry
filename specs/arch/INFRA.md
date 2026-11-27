# INFRA.md — Despliegue, configuración y CI/CD
> BRIEF §12, §12.1 · PRD RNF-01, RNF-05, RNF-06, RNF-07 · TASKS FASE-01

---

## 1. Ambientes
| Ambiente | Frontend | Backend | BD / Auth |
|---|---|---|---|
| **Local** | `npm run dev` (:5173) | `uvicorn app.main:app --reload` (:8000) | PostgreSQL local en Docker (cada persona la suya) + proyecto Supabase **`edr-dev`** compartido, solo para Auth |
| **Producción** | Vercel (rama `main`) | Render (rama `main`) | Proyecto Supabase de producción |

> Instalación y configuración del ambiente local paso a paso: [`LOCAL-SETUP.md`](LOCAL-SETUP.md).

> Con 7 días no se monta un ambiente de staging. Las ramas se validan con CI y los *preview deployments* de Vercel.

> **Proyecto `edr-dev`:** lo crea David en T-04a. Cada persona crea ahí su propio usuario admin de prueba con `create_admin.py`. Nadie desarrolla contra el proyecto de producción. Si la capa gratuita no permite un segundo proyecto activo, se usa producción **solo para Auth** con usuarios de prueba y la BD local para los datos.

## 2. Variables de entorno

### Backend (`backend/.env.example`, Render → Environment)
| Variable | Ejemplo | Uso |
|---|---|---|
| `DATABASE_URL` | `postgresql+psycopg://postgres.<ref>:<pwd>@aws-0-<region>.pooler.supabase.com:5432/postgres` | Conexión por **session pooler** (ver §4) |
| `SUPABASE_URL` | `https://<ref>.supabase.co` | JWKS, `iss`, Admin API |
| `SUPABASE_SERVICE_ROLE_KEY` | — (secreto) | Admin API (AUTH §3) |
| `SUPABASE_JWT_SECRET` | — (secreto, opcional) | Solo si el proyecto firma con HS256 |
| `FRONTEND_ORIGIN` | `https://<app>.vercel.app` | CORS |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | — | Solo para `create_admin.py`; no se necesitan en el servicio |

### Frontend (`frontend/.env.example`, Vercel → Environment Variables)
| Variable | Uso |
|---|---|
| `VITE_API_URL` | URL del backend en Render |
| `VITE_SUPABASE_URL` | Login |
| `VITE_SUPABASE_ANON_KEY` | Login (pública por diseño) |

`.env` está en `.gitignore`; solo se versiona `.env.example` sin valores.

## 3. Despliegue
| Pieza | Cómo | Archivo |
|---|---|---|
| Backend | Render Blueprint, web service Python, plan free, auto-deploy desde `main`, `healthCheckPath: /api/health` | `render.yaml` |
| Migraciones | `alembic upgrade head` en el *pre-deploy*/*build command* de Render | `render.yaml` |
| Frontend | Proyecto Vercel con *root directory* `frontend/`, framework Vite; reescritura de rutas al `index.html` para React Router | `frontend/vercel.json` |
| Datos ficticios | `python -m scripts.seed --buildings 6043 --seed 42` ejecutado **una vez** desde local contra producción | — |

```yaml
# render.yaml (esqueleto)
services:
  - type: web
    name: edr-backend
    runtime: python
    plan: free
    rootDir: backend
    buildCommand: pip install -r requirements.txt && alembic upgrade head
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /api/health
    envVars:
      - key: PYTHON_VERSION
        value: 3.12.7
      - key: DATABASE_URL
        sync: false
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: FRONTEND_ORIGIN
        sync: false
```

## 4. Conexión a la base de datos
- Render free **no tiene IPv6**, y la conexión directa de Supabase (`db.<ref>.supabase.co`) es solo IPv6. Por eso se usa el **session pooler** (puerto 5432 del host `pooler.supabase.com`), que es IPv4 y admite *prepared statements*
- No usar el *transaction pooler* (6543): rompe los *prepared statements* de psycopg
- `pool_size=5`, `max_overflow=0`, `pool_pre_ping=True`: el plan gratuito limita conexiones

## 5. CI/CD — GitHub Actions
### 5.1 `ci.yml` — en cada PR y en cada push a `main`
| Job | Pasos |
|---|---|
| `backend` | Servicio `postgres:16` → `pip install -r requirements.txt -r requirements-dev.txt` → `flake8` + `black --check` → `alembic upgrade head` → `pytest --cov=app --cov-fail-under=80` (TESTING §2.4) |
| `frontend` | `npm ci` → `npm run lint` → `npm test` (Vitest) → `npm run build` |

- Variables de CI: `TEST_DATABASE_URL` apunta al servicio Postgres del job; **nunca** a Supabase (TESTING §4)
- Las pruebas de auth generan sus propios JWT con una llave ECC P-256 de prueba (ES256, como producción); no llaman a Supabase
- CI no necesita secretos de producción
- `SONAR_TOKEN` (GitHub → *Secrets*): análisis de calidad del código entrante con SonarCloud, configurado por el equipo. No es de producción y **no se borra**

### 5.2 Despliegue continuo
- **Protección de `main`** (*ruleset* "Regla para aprobacion de PRs", configurado en T-04c):
  - PR obligatorio con 1 aprobación del *code owner* (`.github/CODEOWNERS`); una revisión se descarta si llegan commits nuevos
  - *Checks* obligatorios `backend` y `frontend` (GitHub Actions)
  - **Sin** "rama al día con `main`" (*strict*): con tres personas fusionando en paralelo obligaría a re-ejecutar CI tras cada fusión ajena. CI corre de nuevo en `main` después de cada fusión, y Render solo despliega si pasa
  - Sin borrar `main` ni forzar push
  - *Bypass* solo para el rol Admin y solo vía PR: lo necesita Kevin para fusionar sus propios PRs (TASKS §4.3). **Se usa para saltar la aprobación, nunca con CI en rojo**
  - Verificado con un PR desechable con una prueba rota (#17): quedó bloqueado y se cerró sin fusionar
- **Render:** `autoDeployTrigger: checksPass` en `render.yaml` ("After CI Checks Pass") sobre `main`
- **Vercel:** `main` → producción; cada PR → *preview deployment* con su URL en el PR. *Deployment Protection* desactivada para que el equipo abra los *previews* (solo datos ficticios)
- **Resultado:** si CI falla no se fusiona, y si no se fusiona no se despliega (CLAUDE.md: no desplegar sin tests)

### 5.3 `smoke.yml` — verificación post-despliegue (T-04d)
- **Disparadores:** `deployment_status` exitoso en producción, `workflow_dispatch` (manual) y `schedule` cada 2 días
- **Comprobaciones** (con reintentos durante ~2 min por el arranque en frío): `GET /api/health` = 200, `GET /api/public/stats` = 200 sin token, `GET <frontend>/` = 200
- **Secretos de GitHub:** solo `PROD_API_URL` y `PROD_FRONTEND_URL` (no son sensibles, pero no se escriben en el YAML para poder cambiarlas)

## 6. Operación en capa gratuita
| Riesgo | Acción |
|---|---|
| Render dormido (≈ 1 min) | El frontend muestra "Despertando el servidor…" si `/api/health` tarda; abrir el sitio 2 minutos antes de la demo |
| Supabase pausado (7 días sin uso) | `/api/health` ejecuta `SELECT 1` y `smoke.yml` lo llama cada 2 días; verificar el 29-nov |
| Cuenta única en Vercel Hobby | Un integrante es dueño de las tres cuentas (BRIEF P-02) y comparte las variables por un canal privado |

## 7. Runbook de despliegue
> Documentado por David Calambas en T-04e (2026-11-26); **el ensayo de reversión está pendiente** (ver el registro de §7.4). Debe permitir que **otro** integrante despliegue y revierta sin ayuda. Los tiempos de §7.3 son medidos; los de §7.4 se anotan en su registro de ensayos.

### 7.1 Dueños y accesos
> T-04a (2026-11-26): las cuentas quedaron a nombre de **Kevin Vera** (T-04a se reasignó desde David Calambas; ver BITACORA).

| Plataforma | Dueño de la cuenta | Quién más tiene acceso | Dónde están los secretos |
|---|---|---|---|
| GitHub (repo, *Actions*, *Secrets*) | Kevin Vera | Colaboradores del grupo con rol *Write* | GitHub → Settings → Secrets |
| Supabase (`edr-prod` y `edr-dev`) | Kevin Vera (organización personal) | David Calambas (miembro de la organización) | Copia privada de Kevin Vera, fuera del repositorio |
| Render | Kevin Vera (cuenta personal) | — | Render → Environment Groups → `edr-backend-prod` |
| Vercel | Kevin Vera (Hobby, *scope* `kevinvera94s-projects`) | — (Hobby: una cuenta) | Vercel → proyecto → Settings → Environment Variables |

**Recursos creados** (identificadores públicos, no son secretos):

| Recurso | Valor |
|---|---|
| Supabase producción | `edr-prod` · ref `gkzmvfpeqtdgcnkdhnvr` · `us-east-1` · JWT firmado con **ECC (P-256)** |
| Supabase desarrollo | `edr-dev` · ref `dsdtcsynvrfhxderyjbv` · `us-east-1` · solo Auth (sin migraciones; los datos van en PostgreSQL local) |
| Render | Blueprint `edr` → web service `edr-backend` (Free, `virginia`) · URL `https://edr-backend-4uc1.onrender.com` · variables desde el Environment Group `edr-backend-prod` (`DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_ORIGIN`), vinculado por `fromGroup` en `render.yaml` |
| Vercel | Proyecto `earthquake-damage-registry` · *root* `frontend/` · `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Production y Preview · `VITE_API_URL` en Production y Preview · URL de producción `https://earthquake-damage-registry.vercel.app` |
| GitHub *Secrets* | `PROD_FRONTEND_URL` y `PROD_API_URL` (para `smoke.yml`, T-04d) · `SONAR_TOKEN` (§5.1) |

**Puesta en marcha de un proyecto Supabase:** si se crea con "automatic RLS", Supabase instala `public.rls_auto_enable()` ejecutable por `anon` y `authenticated` (aviso WARN del Security Advisor). Se corrige en el SQL Editor con `revoke execute on function public.rls_auto_enable() from public, anon, authenticated;`. Aplicado en `edr-prod` y `edr-dev`.

### 7.2 Primer despliegue (una sola vez, T-04b)
1. Supabase: crear proyecto → copiar la cadena del **session pooler**, `SUPABASE_URL` y `service_role` key
2. Render: *New → Blueprint* desde el repositorio (`render.yaml`) → cargar variables (§2) → primer despliegue → `alembic upgrade head` corre en el build
3. Desde local, con las variables de producción: `python -m scripts.create_admin`
4. Vercel: *Add New → Project* → *root directory* `frontend/` → variables (§2) → desplegar
5. Render: actualizar `FRONTEND_ORIGIN` con la URL de Vercel y redesplegar
6. Ejecutar `smoke.yml` manualmente y abrir el sitio

### 7.3 Despliegue habitual
Fusionar un PR en `main` → CI pasa → Render y Vercel despliegan solos → `smoke.yml` corre. **Nadie despliega a mano.**

**Qué pasa después de fusionar, y cuánto tarda** (medido el 2026-11-26 en T-04e):

| Paso | Quién lo hace | Cuándo ocurre | Tiempo medido |
|---|---|---|---|
| 1. CI en `main` (`backend` + `frontend`) | GitHub Actions (`ci.yml`) | Al fusionar | ≈ 40 s (#16, #18 y #19) |
| 2. Frontend a producción | Vercel, proyecto `earthquake-damage-registry` | Al fusionar, **sin esperar a CI** (Vercel no lee los *checks*) | ≈ 5–10 s en #16, #18 y #19, que no cambiaron `frontend/`; un cambio real del frontend tarda más (se mide en el ensayo) |
| 3. Backend a producción | Render, servicio `edr-backend` | Cuando CI pasa (`autoDeployTrigger: checksPass`) y **solo si el commit cambia `backend/`** (`rootDir: backend`) | ≈ 1 min de build y arranque (`in_progress` → `success`, despliegue de #14) |
| 4. *Smoke* | GitHub Actions (`smoke.yml`, T-04d) | Al terminar CI en verde (`workflow_run`) y cuando Render reporta el despliegue (`deployment_status`, entorno `main - edr-backend`) | ≈ 30 s con Render despierto; hasta ≈ 2 min si está dormido |

> Un PR que solo toca `frontend/`, `specs/` o `.github/` **no** redespliega el backend. Es lo esperado, no un error.

**Cómo verificar un despliegue**
1. GitHub → *Actions* → **Smoke**: la última ejecución en verde. Un aviso amarillo por `/api/public/stats` es normal mientras T-16 no esté fusionada
2. Si el PR tocó el backend: GitHub → pestaña *Deployments* del repositorio (o Render → `edr-backend` → *Events*) → el despliegue del commit fusionado en *success*
3. Si el PR tocó la BD: Render → `edr-backend` → *Logs* del build → `alembic upgrade head` termina sin errores
4. Abrir https://earthquake-damage-registry.vercel.app y https://edr-backend-4uc1.onrender.com/api/health (debe responder `ok`)

**Si un despliegue falla**

| Síntoma | Dónde mirar | Qué hacer |
|---|---|---|
| CI en rojo en `main` | *Actions* → **CI** → job en rojo | Render **no** despliega. Corregir con un PR nuevo; Vercel sí desplegó el frontend: si está roto, revertirlo (§7.4) |
| Render en *Build failed* | Render → `edr-backend` → *Events* → log del build | Suele ser una dependencia o una migración. El servicio sigue sirviendo la versión anterior: no hay caída. Corregir con un PR |
| Render en *Deploy failed* (no pasa `/api/health`) | Render → *Logs* del servicio | Revisar las variables del Environment Group `edr-backend-prod` y la conexión a Supabase. La versión anterior sigue activa |
| *Smoke* en rojo y lo demás en verde | *Actions* → **Smoke** → paso en rojo | Si falla `/api/health` → revertir el backend (§7.4). Si falla el frontend → revertir en Vercel |
| `/api/health` da 5xx o *timeout* tras un tiempo sin uso | Supabase → `edr-prod` | El proyecto puede estar pausado (7 días sin uso): *Restore project* y esperar a que quede *Active* (unos minutos; no medido) |

### 7.4 Reversión (*rollback*)
| Pieza | Cómo | Cuándo |
|---|---|---|
| Frontend | Vercel → Deployments → despliegue anterior → *Instant Rollback* | Error visible en la interfaz |
| Backend | Render → Events/Deploys → despliegue anterior → *Rollback* | *Smoke* rojo, errores 5xx |
| Código | `git revert` del PR en una rama nueva → PR → fusión (deja `main` coherente con lo desplegado) | Siempre, después del *rollback* |
| Base de datos | Las migraciones son **solo hacia adelante**: un error se corrige con una nueva migración. Antes de fusionar una migración destructiva (borrar o renombrar columnas), avisar en el grupo | Migración defectuosa |

> El *rollback* del backend **no** deshace migraciones. Por eso las migraciones deben ser compatibles con la versión anterior del código (agregar antes de quitar).

> **Quién puede revertir:** Render y Vercel están en las cuentas personales de **Kevin Vera** (§7.1). Mientras nadie más tenga acceso, el *rollback* lo hace Kevin; los demás solo pueden hacer el `git revert` por PR.

> Los avisos ⚠️ de abajo (Vercel deja de promover y Render desactiva el *auto-deploy*) vienen de la documentación de cada proveedor; se confirman en el ensayo.

**Paso a paso: frontend (Vercel)**
1. Vercel → *scope* `kevinvera94s-projects` → proyecto `earthquake-damage-registry` → pestaña *Deployments*
2. Buscar el último despliegue **Production** sano (el anterior al que falló) → menú `⋯` → *Instant Rollback* → confirmar
3. Verificar que https://earthquake-damage-registry.vercel.app muestra la versión anterior
4. ⚠️ Tras un *Instant Rollback*, Vercel **deja de promover** a producción los despliegues nuevos de `main` hasta deshacerlo. Cuando el `git revert` (o la corrección) esté fusionado: *Deployments* → *Undo Rollback*, o *Promote to Production* sobre el despliegue nuevo
5. `git revert` del PR culpable en una rama nueva → PR → fusión

**Paso a paso: backend (Render)**
1. Render → servicio `edr-backend` → *Events*
2. Ubicar el último despliegue *live* sano → *Rollback* → confirmar. Render vuelve a servir ese *build* sin reconstruir
3. Verificar `/api/health` = `ok` y lanzar **Smoke** a mano (*Actions* → **Smoke** → *Run workflow*)
4. ⚠️ Render **desactiva el *auto-deploy*** del servicio al hacer *rollback*, para que el siguiente commit no lo pise. Cuando la corrección esté fusionada: `edr-backend` → *Settings* → *Build & Deploy* → *Auto-Deploy* → volver a **After CI Checks Pass**. Si se olvida, ningún PR posterior llega a producción
5. `git revert` del PR culpable en una rama nueva → PR → fusión

**Cómo ensayar la reversión** (T-04e; repetir si cambia la configuración)
1. Fusionar un PR trivial que cambie algo **visible** en `frontend/` y algo en `backend/` (p. ej. un comentario y el texto de una página de relleno)
2. Esperar el *smoke* en verde y anotar la hora
3. Hacer el *rollback* de los dos con los pasos de arriba, cronometrando cada uno
4. Verificar que producción volvió a la versión anterior
5. Reactivar el *auto-deploy* de Render y deshacer el *rollback* de Vercel; fusionar el `git revert` del PR trivial
6. Anotar el resultado en el registro de abajo

**Registro de ensayos**

| Fecha | Quién | Vercel: tiempo del *rollback* | Render: tiempo del *rollback* | Observaciones |
|---|---|---|---|---|
| *pendiente* | Kevin Vera (dueño de las cuentas), acompañado por David Calambas | — | — | — |

### 7.5 Lista de chequeo antes de la entrega (T-23)
- [ ] `smoke.yml` en verde en las últimas 24 h
- [ ] Supabase activo (no pausado) y con los datos ficticios cargados
- [ ] Render despierto 2 minutos antes de la demo
- [ ] Credenciales de demostración enviadas al profesor por canal privado
- [ ] Etiqueta `v1.0.0` en `main` coincide con lo desplegado
