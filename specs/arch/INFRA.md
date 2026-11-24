# INFRA.md — Despliegue, configuración y CI/CD
> BRIEF §12, §12.1 · PRD RNF-01, RNF-05, RNF-06

---

## 1. Ambientes
| Ambiente | Frontend | Backend | BD / Auth |
|---|---|---|---|
| **Local** | `npm run dev` (:5173) | `uvicorn app.main:app --reload` (:8000) | Proyecto Supabase de desarrollo *o* el de producción con un esquema limpio |
| **Producción** | Vercel (rama `main`) | Render (rama `main`) | Proyecto Supabase de producción |

> Con 7 días no se monta un ambiente de staging. Las ramas se validan con CI y los *preview deployments* de Vercel.

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

## 5. CI — GitHub Actions (`.github/workflows/ci.yml`)
Se ejecuta en cada PR y en cada push a `main`:

| Job | Pasos |
|---|---|
| `backend` | Servicio `postgres:16` → `pip install` → `flake8` + `black --check` → `alembic upgrade head` → `pytest` |
| `frontend` | `npm ci` → `npm run lint` → `npm run build` |

- La rama `main` exige que CI pase antes de fusionar (protección de rama en GitHub)
- Render y Vercel despliegan al fusionar en `main`: **si CI falla no se fusiona, y si no se fusiona no se despliega** (CLAUDE.md: no desplegar sin tests)
- En CI, las pruebas de auth generan sus propios JWT firmados con una llave de prueba; no llaman a Supabase

## 6. Operación en capa gratuita
| Riesgo | Acción |
|---|---|
| Render dormido (≈ 1 min) | El frontend muestra "Despertando el servidor…" si `/api/health` tarda; abrir el sitio 2 minutos antes de la demo |
| Supabase pausado (7 días sin uso) | Cualquier petición mantiene la actividad; verificar el 29-nov |
| Cuenta única en Vercel Hobby | Un integrante es dueño de las tres cuentas (BRIEF P-02) y comparte las variables por un canal privado |
