# INFRA.md — Despliegue, configuración y CI/CD
> BRIEF §12, §12.1 · PRD RNF-01, RNF-05, RNF-06, RNF-07 · TASKS FASE-01

---

## 1. Ambientes
| Ambiente | Frontend | Backend | BD / Auth |
|---|---|---|---|
| **Local** | `npm run dev` (:5173) | `uvicorn app.main:app --reload` (:8000) | PostgreSQL local en Docker (cada persona la suya) + proyecto Supabase **`edr-dev`** compartido, solo para Auth |
| **Producción** | Vercel (rama `main`) | Render (rama `main`) | Proyecto Supabase de producción |

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
- **Protección de `main`:** PR obligatorio, *checks* `backend` y `frontend` obligatorios, 1 aprobación, sin push directo
- **Render:** *Auto-Deploy* = "After CI Checks Pass" sobre `main`
- **Vercel:** `main` → producción; cada PR → *preview deployment* con su URL en el PR
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
> Lo completa y ensaya David Calambas en T-04e. Debe permitir que **otro** integrante despliegue y revierta sin ayuda.

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
| Render | Environment Group `edr-backend-prod`: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_ORIGIN`. El servicio se crea en T-04b con `fromGroup` |
| Vercel | Proyecto `earthquake-damage-registry` · *root* `frontend/` · `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Production y Preview · URL de producción `https://earthquake-damage-registry.vercel.app` |
| Pendiente de T-04b | `VITE_API_URL` (Vercel) y `PROD_API_URL` (GitHub *Secrets*): dependen de la URL de Render |

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

Verificación tras cada despliegue: *smoke* en verde en *Actions*; si el PR tocó la BD, revisar en el log de Render que `alembic upgrade head` terminó sin errores.

### 7.4 Reversión (*rollback*)
| Pieza | Cómo | Cuándo |
|---|---|---|
| Frontend | Vercel → Deployments → despliegue anterior → *Instant Rollback* | Error visible en la interfaz |
| Backend | Render → Events/Deploys → despliegue anterior → *Rollback* | *Smoke* rojo, errores 5xx |
| Código | `git revert` del PR en una rama nueva → PR → fusión (deja `main` coherente con lo desplegado) | Siempre, después del *rollback* |
| Base de datos | Las migraciones son **solo hacia adelante**: un error se corrige con una nueva migración. Antes de fusionar una migración destructiva (borrar o renombrar columnas), avisar en el grupo | Migración defectuosa |

> El *rollback* del backend **no** deshace migraciones. Por eso las migraciones deben ser compatibles con la versión anterior del código (agregar antes de quitar).

### 7.5 Lista de chequeo antes de la entrega (T-23)
- [ ] `smoke.yml` en verde en las últimas 24 h
- [ ] Supabase activo (no pausado) y con los datos ficticios cargados
- [ ] Render despierto 2 minutos antes de la demo
- [ ] Credenciales de demostración enviadas al profesor por canal privado
- [ ] Etiqueta `v1.0.0` en `main` coincide con lo desplegado
