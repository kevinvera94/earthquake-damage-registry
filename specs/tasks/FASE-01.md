# FASE-01 — Esqueleto desplegado y autenticación
> **24-nov-2026** · Objetivo: al terminar el día, frontend, backend y BD conectados **en producción** y con login funcionando (BRIEF §14.1).

---

### T-01 — Esqueleto del backend ⬜
- **Carril:** A · **Depende de:** —
- **Specs:** ARCHITECTURE §5, INFRA §2 y §5
- **Hacer:**
  - `backend/` con FastAPI, `config.py` (pydantic-settings), `db.py` (SQLAlchemy, pool de INFRA §4), `main.py` con CORS desde `FRONTEND_ORIGIN`
  - `GET /api/health`
  - `requirements.txt`, `.env.example`, configuración de Black y Flake8
  - `.github/workflows/ci.yml` con los jobs `backend` y `frontend` (el de frontend puede quedar condicionado a que exista `frontend/`)
- **Hecho cuando:** `uvicorn` arranca, `/api/health` responde `ok`, `/docs` carga y CI pasa en el PR

### T-02 — Esqueleto del frontend ⬜
- **Carril:** C · **Depende de:** —
- **Specs:** ARCHITECTURE §5, DESIGN.md, RF-06-02
- **Hacer:**
  - Vite + React (JavaScript), React Router, ESLint + Prettier
  - Rutas vacías: `/` (pública), `/login`, `/app/edificaciones`, `/app/edificaciones/:id`, `/app/usuarios`
  - `DemoBanner` con el aviso de datos ficticios en todas las páginas
  - Estilos base tomados del mockup (`specs/mockup/styles.css`)
  - `lib/api.js` (fetch con `VITE_API_URL`), `.env.example`, `vercel.json` con reescritura al `index.html`
- **Hecho cuando:** `npm run build` pasa y las rutas navegan con el banner visible

### T-03 — Proyecto Supabase y migración inicial ⬜
- **Carril:** E · **Depende de:** T-01
- **Specs:** DATA-MODEL completo
- **Hacer:**
  - Crear el proyecto Supabase de producción; anotar si firma con llaves asimétricas o HS256 (AUTH §2)
  - Alembic configurado; migración inicial: enums, `profiles`, `buildings`, `inspections`, `people`, restricciones e índices de DATA-MODEL §3, RLS activado
  - `models.py` y `enums.py` (de DATA-MODEL §2)
- **Hecho cuando:** `alembic upgrade head` corre en local y en CI sobre PostgreSQL limpio; en Supabase, las tablas aparecen con RLS activado

### T-04 — Despliegue en producción ⬜
- **Carril:** E · **Depende de:** T-02, T-03
- **Specs:** INFRA §3, §4
- **Hacer:**
  - `render.yaml`; servicio en Render conectado por **session pooler**; variables de entorno cargadas
  - Proyecto Vercel con *root directory* `frontend/`
  - Protección de rama `main`: CI obligatorio y 1 aprobación
- **Hecho cuando:** la URL de Vercel carga, y `VITE_API_URL/api/health` responde desde producción. Las URLs quedan en el README

### T-05 — Autenticación en el backend ⬜
- **Carril:** B · **Depende de:** T-01 (y T-03 para `profiles`)
- **Specs:** AUTH §2, §3 (admin inicial); RF-01-03, RF-01-06
- **Hacer:**
  - `auth.py`: verificación JWT (JWKS o HS256 según variable), dependencias `current_user` y `require_admin`
  - `GET /api/me`
  - `scripts/create_admin.py` idempotente
  - Pruebas de AUTH §5 con JWT generados en la prueba
- **Hecho cuando:** pruebas en verde; con un token real de Supabase, `/api/me` devuelve el perfil

### T-06 — Login en el frontend ⬜
- **Carril:** D · **Depende de:** T-02, T-05
- **Specs:** AUTH §4; RF-01-01, RF-01-02, RF-01-03
- **Hacer:**
  - `lib/supabase.js`; página `/login`; `RequireAuth`; llamada a `/api/me` al entrar; cerrar sesión
  - Mensaje genérico de credenciales inválidas; manejo del 403 de usuario desactivado
  - Indicador "Despertando el servidor…" si `/api/health` tarda (INFRA §6)
- **Hecho cuando:** en producción, el admin inicial entra, ve su nombre y rol, y al salir no puede abrir `/app/*`

## Criterio de cierre de la fase
Login del administrador funcionando **en producción** de punta a punta.
