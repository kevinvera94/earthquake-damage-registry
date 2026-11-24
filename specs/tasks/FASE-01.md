# FASE-01 — Configuración del despliegue a producción
> **24-nov-2026 (mañana)** · Objetivo: antes de escribir funcionalidad, el camino **PR → pruebas → producción** funciona de punta a punta con los esqueletos de backend y frontend (BRIEF §14.1, INFRA §7).
> Por qué va primero: dejar el despliegue para el final es el mayor riesgo de no entregar. Desde aquí, cada PR fusionado llega solo a producción.
> **Esta fase también crea completos los archivos compartidos** (CODING-STANDARDS §3). Después del 24-nov nadie debería necesitar reescribirlos; así Kevin, Valentina y David trabajan en paralelo sin conflictos.

| Mañana del 24-nov | Kevin Vera | Valentina Sepúlveda | David Calambas |
|---|---|---|---|
| Tareas | T-01 → T-03 | T-02 | T-04a → T-01b → T-04b → T-04c → T-04d → T-04e |

---

### T-01 — Esqueleto del backend ⬜
- **Responsable:** Kevin Vera · **Depende de:** —
- **Specs:** ARCHITECTURE §5, INFRA §2
- **Hacer:**
  - `backend/` con FastAPI, `config.py` (pydantic-settings), `db.py` (SQLAlchemy, pool de INFRA §4), `main.py` con CORS desde `FRONTEND_ORIGIN`
  - `GET /api/health` que ejecuta `SELECT 1` (INFRA §6: así el ping también mantiene activo Supabase)
  - `requirements.txt` (versiones fijadas), `.env.example`, configuración de Black y Flake8 (`pyproject.toml`, `.flake8`, CODING-STANDARDS §1.1)
- **Archivos compartidos que deja completos:**
  - `errors.py` con las 4 excepciones de dominio y sus manejadores registrados en `main.py` (CODING-STANDARDS §1.3)
  - `schemas/common.py` con `Page[T]`
  - `routers/` con **un archivo por recurso ya creado y registrado** en `main.py` (`public`, `me`, `users`, `buildings`, `inspections`, `people`), cada uno con su `APIRouter` vacío; lo mismo en `services/` y `schemas/`
  - `auth.py` con las **firmas** `get_current_user()` y `require_admin()` (lanzan `PermissionDeniedError` hasta que T-05 las implemente)
- **Hecho cuando:** `uvicorn` arranca, `/api/health` responde `ok` y `/docs` carga

### T-01b — Infraestructura de pruebas ⬜
- **Responsable:** David Calambas · **Depende de:** T-01, T-02
- **Specs:** TESTING §2.1, §2.2, §2.4, §3.2, §4
- **Hacer:**
  - Backend: `pytest`, `pytest-cov`, `httpx` en `requirements-dev.txt`; `tests/unit/` y `tests/integration/`; `conftest.py` con **todas** las fixtures de TESTING §2.2 (las de tokens se completan en T-05); guardia que aborta si `TEST_DATABASE_URL` apunta a Supabase
  - Fixture **`as_user(role)`** que sobrescribe `get_current_user` con un perfil de prueba: permite que Valentina y David prueben sus endpoints **sin esperar** la autenticación real de T-05
  - Fábricas `make_building`, `make_inspection`, `make_person`, `make_profile` con valores válidos por defecto (requieren T-03)
  - Primera prueba unitaria (p. ej. de `services/ages.py` con sus límites) y primera de integración (`/api/health`)
  - Frontend: Vitest y `npm test`; primera prueba de `lib/`
- **Hecho cuando:** `pytest` y `npm test` pasan en local, y la cobertura se reporta

### T-02 — Esqueleto del frontend ⬜
- **Responsable:** Valentina Sepúlveda · **Depende de:** —
- **Specs:** ARCHITECTURE §5, DESIGN.md, RF-06-02
- **Hacer:**
  - Vite + React (JavaScript), React Router, ESLint + Prettier
  - Rutas vacías: `/` (pública), `/login`, `/app/edificaciones`, `/app/edificaciones/:id`, `/app/usuarios`
  - `DemoBanner` con el aviso de datos ficticios en todas las páginas; estilos base del mockup (`specs/mockup/styles.css`)
  - `.env.example`, configuración de ESLint y Prettier (CODING-STANDARDS §2.1)
- **Archivos compartidos que deja completos** (CODING-STANDARDS §2.2):
  - `App.jsx` con **todas** las rutas, cada una con su página de relleno en `pages/`
  - `lib/api/client.js` (URL base, token de la sesión de Supabase, `ApiError`) y los archivos vacíos `lib/api/{buildings,inspections,people,users,public}.js`
  - `lib/catalogs.js` **completo** con todos los enums de DATA-MODEL §2 y las comunas
  - `hooks/useAsync.js`, `lib/format.js`, `lib/validation.js` y `lib/filters.js` (los tres últimos pueden quedar con funciones vacías)
  - `styles/global.css` portado del mockup y componentes `DemoBanner` y `StickerBadge`
- **Hecho cuando:** `npm run build` pasa y las rutas navegan con el banner visible

### T-03 — Proyecto Supabase y migración inicial ⬜
- **Responsable:** Kevin Vera · **Depende de:** T-01
- **Specs:** DATA-MODEL completo
- **Hacer:**
  - Crear el proyecto Supabase de producción (región más cercana a la de Render); anotar si firma con llaves asimétricas o HS256 (AUTH §2)
  - Alembic configurado; migración inicial: enums, `profiles`, `buildings`, `inspections`, `people`, restricciones e índices de DATA-MODEL §3, RLS activado
  - `models.py` y `enums.py` con **todas** las tablas y catálogos de DATA-MODEL (no solo los de una tarea), siguiendo CODING-STANDARDS §1.5
  - Objetivo: que no haga falta una segunda migración. Si después aparece, la crea solo Kevin
- **Hecho cuando:** `alembic upgrade head` corre en local sobre PostgreSQL limpio; en Supabase las tablas aparecen con RLS activado

### T-04a — Cuentas, accesos y secretos ⬜
- **Responsable:** David Calambas · **Depende de:** —
- **Specs:** INFRA §2, §7.1; BRIEF P-02
- **Hacer:**
  - David crea o usa las cuentas de Supabase, Render y Vercel, y conecta las tres al repositorio de GitHub
  - Crea **dos** proyectos Supabase: `edr-prod` y `edr-dev` (INFRA §1) y agrega a Kevin como miembro
  - Cargar las variables de INFRA §2 en Render y Vercel (Production y Preview); cargar en GitHub → *Secrets* las que usa CI/CD (INFRA §5)
  - Guardar los valores en un gestor compartido privado del equipo (no en el repositorio, no en el chat del curso)
  - Llenar la tabla de INFRA §7.1 (quién es dueño de qué) sin poner secretos
- **Hecho cuando:** las tres plataformas ven el repositorio y la lista de variables está completa en cada una

### T-04b — Despliegue del backend y del frontend ⬜
- **Responsable:** David Calambas · **Depende de:** T-01, T-02, T-03, T-04a
- **Specs:** INFRA §3, §4
- **Hacer:**
  - `render.yaml`: web service free, `rootDir: backend`, `buildCommand` con `alembic upgrade head`, `healthCheckPath: /api/health`, conexión por **session pooler**
  - Proyecto Vercel con *root directory* `frontend/` y `frontend/vercel.json` con reescritura al `index.html`
  - Ajustar `FRONTEND_ORIGIN` en Render con la URL definitiva de Vercel (CORS)
- **Hecho cuando:** la URL de Vercel carga y, desde el navegador, el frontend obtiene respuesta de `VITE_API_URL/api/health`. Las URLs quedan en el README

### T-04c — Pipeline CI/CD y protección de `main` ⬜
- **Responsable:** David Calambas · **Depende de:** T-01b, T-04b
- **Specs:** INFRA §5, TESTING §4
- **Hacer:**
  - `.github/workflows/ci.yml`: jobs `backend` (Postgres 16, lint, migraciones, `pytest` con cobertura mínima) y `frontend` (`npm ci`, lint, `npm test`, build)
  - Render con *auto-deploy* solo cuando el *check* de CI pasa (opción "After CI checks pass"); Vercel despliega `main` a producción y cada PR a *preview*
  - Protección de `main`: PR obligatorio, CI en verde obligatorio, 1 aprobación, sin push directo
  - **No** activar "Require review from Code Owners" mientras `.github/CODEOWNERS` tenga a una sola persona: bloquearía a los otros dos (DEC-011)
- **Hecho cuando:** un PR con una prueba que falla queda **bloqueado** para fusionar, y uno en verde, al fusionarse, aparece en producción sin pasos manuales

### T-04d — Verificación post-despliegue y mantener activo ⬜
- **Responsable:** David Calambas · **Depende de:** T-04c
- **Specs:** INFRA §6, §7.3; TESTING §1 (humo)
- **Hacer:**
  - `.github/workflows/smoke.yml`: se dispara al terminar un despliegue en `main` (o manualmente) y verifica con `curl` que `/api/health` responda 200, que `/api/public/stats` responda 200 sin token y que el frontend devuelva 200. Reintenta durante ~2 min por el arranque en frío de Render
  - El mismo workflow con `schedule` cada 2 días, para que Supabase no se pause (BRIEF §12.1)
- **Hecho cuando:** el workflow corre en verde contra producción y aparece en la pestaña *Actions*

### T-04e — Runbook de despliegue y reversión ⬜
- **Responsable:** David Calambas · **Depende de:** T-04c
- **Specs:** INFRA §7
- **Hacer:** completar INFRA §7 con lo aprendido al configurar (pantallas, nombres reales de servicios, tiempos medidos) y **ensayar una reversión**: desplegar un cambio trivial, revertirlo con *rollback* en Render y *instant rollback* en Vercel, y anotar cuánto tarda
- **Hecho cuando:** otro integrante, siguiendo solo INFRA §7, es capaz de desplegar y revertir

## Criterio de cierre de la fase
Un PR de prueba recorre todo el camino: CI en verde → fusión → despliegue automático → *smoke* en verde en producción. Y uno con una prueba rota queda bloqueado.
