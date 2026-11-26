# LOCAL-SETUP.md — Ambiente de desarrollo local
> Guía para instalar y configurar el ambiente local desde cero, después de clonar el repositorio.
> Complementa INFRA §1 (ambientes) y TESTING §4 (ejecución de pruebas).
> Tiempo estimado: 30 a 45 minutos la primera vez.

---

## 0. Cómo es el ambiente local

```mermaid
flowchart LR
  FE["Frontend<br/>npm run dev<br/>localhost:5173"] -->|/api/...| BE["Backend<br/>uvicorn<br/>localhost:8000"]
  FE -->|login| SA["Supabase edr-dev<br/>(solo Auth, en la nube)"]
  BE --> DB[("PostgreSQL 16 en Docker<br/>edr-dev-pg · puerto 5432<br/>tus datos de desarrollo")]
  T["pytest"] --> TDB[("PostgreSQL 16 en Docker<br/>edr-test-pg · puerto 5433<br/>solo pruebas")]
```

| Pieza | Dónde corre | Para qué |
|---|---|---|
| Frontend (React + Vite) | Tu máquina, `localhost:5173` | La interfaz |
| Backend (FastAPI) | Tu máquina, `localhost:8000` | La API |
| BD de desarrollo | Docker, puerto **5432** | Tus datos de prueba mientras programas. Cada persona tiene la suya |
| BD de pruebas | Docker, puerto **5433** | Solo `pytest`. Cada prueba la deja vacía al terminar |
| Supabase `edr-dev` | Nube, compartido | **Solo** el login (Auth). No guarda datos de la aplicación |

> **Nunca** se desarrolla ni se prueba contra producción (`edr-prod`). `tests/conftest.py` aborta si la BD de pruebas apunta a Supabase.

---

## 1. Requisitos

| Herramienta | Versión | Por qué esa versión | Comprobar con |
|---|---|---|---|
| **Git** | 2.40 o superior | Ramas por tarea y PRs | `git --version` |
| **Python** | **3.12.x** | Es la de CI y Render. macOS trae 3.9, que **no** sirve | `python3.12 --version` (Windows: `py -3.12 --version`) |
| **Node.js** | **24.x** (recomendada) o 26.x | CI usa la 24. Vitest acepta 22.12+, 24 y 26 o superior; la 23 y la 25 **no** sirven | `node -v` |
| **npm** | La que trae Node 24 | — | `npm -v` |
| **Docker Desktop** | Reciente | PostgreSQL 16 para desarrollo y pruebas | `docker --version` y `docker info` |
| Editor | VS Code recomendado | — | — |
| Claude Code | — | Lo usa el equipo; lee `CLAUDE.md` al iniciar | `claude --version` |

**Accesos que debes tener:**
- Ser colaborador del repositorio en GitHub (invitación aceptada)
- Los valores de **`edr-dev`** (URL, llave *publishable* y llave *secret*). Kevin los comparte por un **canal privado**, nunca por el chat del curso. No necesitas nada de producción

### 1.1 macOS
```bash
# Homebrew (si no lo tienes): https://brew.sh
brew install git python@3.12 node@24
brew install --cask docker          # Docker Desktop; ábrelo una vez para terminar la instalación
```
Si `node -v` no muestra 24, agrega Node 24 al PATH como indica `brew info node@24`, o usa [nvm](https://github.com/nvm-sh/nvm): `nvm install 24 && nvm use 24`.

### 1.2 Windows 10/11
Desde PowerShell:
```powershell
winget install Git.Git
winget install Python.Python.3.12
winget install OpenJS.NodeJS.LTS     # instala el LTS vigente (24 o 26); ambos sirven
winget install Docker.DockerDesktop
```
- Docker Desktop en Windows necesita **WSL 2**; el instalador lo ofrece. Reinicia cuando lo pida
- Cierra y abre la terminal después de instalar, para que se actualice el PATH
- Si `node -v` muestra una versión impar (23, 25) o menor que 22.12, instala Node 24 desde https://nodejs.org

### 1.3 Linux (Ubuntu/Debian)
- Python 3.12: viene en Ubuntu 24.04 (`sudo apt install python3.12 python3.12-venv`); en versiones anteriores, [pyenv](https://github.com/pyenv/pyenv)
- Node 24: [nvm](https://github.com/nvm-sh/nvm) → `nvm install 24`
- Docker: [Docker Engine](https://docs.docker.com/engine/install/) y agrega tu usuario al grupo `docker`

### 1.4 Extensiones recomendadas de VS Code
Python (Microsoft), Black Formatter, Flake8, ESLint, Prettier. Activa "Format on Save": así el formato ya cumple lo que revisa CI.

---

## 2. Clonar y configurar Git
```bash
git clone https://github.com/kevinvera94/earthquake-damage-registry.git
cd earthquake-damage-registry
git config user.name  "Tu Nombre"
git config user.email "tu-correo-de-github@ejemplo.com"
```
- El repositorio tiene `.gitattributes`: todos los archivos usan finales de línea **LF**, también en Windows. Si clonaste **antes** de que existiera y estás en Windows, ejecuta una vez, en este orden, `git rm --cached -r .` y luego `git reset --hard` (descarta cambios locales sin commit)
- Antes de cada tarea: `git checkout main && git pull` y una rama nueva (`CLAUDE.md` → Instrucciones operativas)

---

## 3. Bases de datos (Docker)
Docker Desktop debe estar abierto.

```bash
# BD de desarrollo (puerto 5432). El volumen conserva los datos si reinicias el contenedor
docker run -d --name edr-dev-pg -p 5432:5432 -e POSTGRES_PASSWORD=postgres \
  -v edr-dev-pg:/var/lib/postgresql/data postgres:16

# BD de pruebas (puerto 5433). Sin volumen: las pruebas siempre la dejan vacía
docker run -d --name edr-test-pg -p 5433:5432 -e POSTGRES_PASSWORD=test postgres:16
```
En Windows (PowerShell), escribe cada `docker run` en una sola línea, sin el `\`.

**Día a día:** los contenedores ya existen; solo se arrancan y detienen:
```bash
docker start edr-dev-pg edr-test-pg
docker stop  edr-dev-pg edr-test-pg
```

> **¿El puerto 5432 ya está ocupado?** Pasa si tienes PostgreSQL instalado en el sistema. Usa otro puerto (`-p 5434:5432`) y cámbialo en `DATABASE_URL` (§4.2).

---

## 4. Backend

### 4.1 Entorno virtual e instalación
macOS / Linux:
```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
```
Windows (PowerShell):
```powershell
cd backend
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
```
Si PowerShell bloquea `Activate.ps1`: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` y vuelve a intentarlo.

> Con el entorno activado, `python`, `pip`, `pytest`, `alembic` y `uvicorn` son los del proyecto. El resto de esta guía asume que está activado. `.venv/` no se sube al repositorio.

### 4.2 Variables de entorno (`backend/.env`)
```bash
cp .env.example .env            # Windows: copy .env.example .env
```
Edítalo así:

| Variable | Valor en desarrollo |
|---|---|
| `DATABASE_URL` | `postgresql+psycopg://postgres:postgres@localhost:5432/postgres` (la BD de desarrollo de §3) |
| `SUPABASE_URL` | URL de **`edr-dev`** (canal privado) |
| `SUPABASE_SERVICE_ROLE_KEY` | Llave *secret* de **`edr-dev`**. Solo la usa `create_admin.py` (T-05); puede quedar vacía hasta entonces |
| `SUPABASE_JWT_SECRET` | Vacía: Supabase firma con ECC (INFRA §7.1) |
| `FRONTEND_ORIGIN` | `http://localhost:5173` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | Tu usuario admin de prueba en `edr-dev` (T-05). Datos ficticios; nunca tu contraseña personal |

- `.env` está en `.gitignore`: **nunca** se sube. Verifícalo con `git status` (no debe aparecer)
- **Nunca** pongas en tu `.env` valores de `edr-prod`

### 4.3 Crear las tablas en tu BD de desarrollo
```bash
alembic upgrade head
alembic current          # debe mostrar: 0001 (head)
```
Repite `alembic upgrade head` cada vez que `main` traiga una migración nueva (las crea solo Kevin).

### 4.4 Levantar el backend
```bash
uvicorn app.main:app --reload
```
- http://localhost:8000/api/health → `{"status":"ok"}`
- http://localhost:8000/docs → documentación interactiva de la API

### 4.5 Pruebas y lint (lo mismo que revisa CI)
```bash
pytest                                         # todas (necesita edr-test-pg en 5433)
pytest tests/unit                              # solo unitarias, sin BD
pytest --cov --cov-fail-under=80               # con la cobertura mínima de CI
black .                                        # formatea
flake8                                         # revisa estilo
```
- `pytest` usa `TEST_DATABASE_URL` si está definida; si no, `postgresql+psycopg://postgres:test@localhost:5433/postgres` (§3). **Nunca** apunta a tu BD de desarrollo
- Para probar tus endpoints sin login real, usa la fixture `as_user(role)` de `tests/conftest.py` (CODING-STANDARDS §1.7)

---

## 5. Frontend

### 5.1 Instalación
```bash
cd frontend
npm ci
```
Usa `npm ci`, no `npm install`: instala exactamente lo de `package-lock.json`, igual que CI.

### 5.2 Variables de entorno (`frontend/.env.local`)
```bash
cp .env.example .env.local      # Windows: copy .env.example .env.local
```

| Variable | Valor en desarrollo |
|---|---|
| `VITE_API_URL` | `http://localhost:8000` (tu backend local) |
| `VITE_SUPABASE_URL` | URL de **`edr-dev`** |
| `VITE_SUPABASE_ANON_KEY` | Llave ***publishable*** de **`edr-dev`** (nunca la *secret*) |

> Todo lo que empieza por `VITE_` termina en el JavaScript que descarga el navegador: **nunca** pongas ahí una llave secreta.

### 5.3 Levantar el frontend
```bash
npm run dev
```
Abre http://localhost:5173. Debes ver la franja "Datos ficticios con fines académicos". Si cambias `.env.local`, reinicia `npm run dev`.

### 5.4 Pruebas, lint y build (lo mismo que revisa CI)
```bash
npm run lint
npm run format:check     # o `npm run format` para corregir
npm test
npm run build
```

---

## 6. Comprobación final
Con `edr-dev-pg` y `edr-test-pg` corriendo:

- [ ] `python --version` (con el entorno activado) muestra 3.12 y `node -v` muestra 24 (o 26)
- [ ] `alembic current` → `0001 (head)`
- [ ] http://localhost:8000/api/health → `{"status":"ok"}`
- [ ] `pytest` pasa
- [ ] `black --check .` y `flake8` sin errores
- [ ] http://localhost:5173 carga con la franja de datos ficticios
- [ ] `npm run lint`, `npm run format:check`, `npm test` y `npm run build` pasan
- [ ] `git status` no muestra `.env` ni `.env.local`

Si todo está marcado, tu ambiente es equivalente a CI: lo que pasa en local debería pasar en el PR.

---

## 7. Problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `python3.12: command not found` | Python 3.12 no instalado o fuera del PATH | §1; en Windows usa `py -3.12` |
| `database_url Field required` al iniciar | Falta `backend/.env` o la terminal no está en `backend/` | §4.2; ejecuta los comandos desde `backend/` |
| `connection refused` en el puerto 5432 o 5433 | Docker cerrado o contenedor detenido | Abre Docker Desktop y `docker start edr-dev-pg edr-test-pg` |
| `port is already allocated` al crear el contenedor | Otro PostgreSQL usa el puerto | §3: usa otro puerto y ajusta la URL |
| `relation "buildings" does not exist` | Falta la migración en tu BD de desarrollo | `alembic upgrade head` |
| `TEST_DATABASE_URL apunta a Supabase` | `TEST_DATABASE_URL` mal definida | Bórrala o apúntala a `localhost:5433` |
| Error de CORS en la consola del navegador | `FRONTEND_ORIGIN` distinto de `http://localhost:5173` | §4.2; reinicia uvicorn |
| El frontend no ve cambios de `.env.local` | Vite lee las variables al arrancar | Reinicia `npm run dev` |
| `npm ci` falla por versión de Node | Node impar (23, 25) o menor que 22.12 | Instala Node 24 (§1) |
| `prettier --check` falla en todos los archivos (Windows) | Finales de línea CRLF | §2: aplica `.gitattributes` |
| PowerShell no deja activar el entorno | Política de ejecución | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |

---

## 8. Siguientes pasos
1. Lee `CLAUDE.md`, `specs/BRIEF.md` y `specs/arch/CODING-STANDARDS.md` (Claude Code los lee al iniciar la sesión)
2. Revisa tu sección en `specs/BITACORA.md` y la tarea en `specs/tasks/FASE-XX.md`
3. Flujo de cada tarea: rama `feat/T-XX-…` → bitácora `En curso` → PR en borrador → código + pruebas → bitácora `Finalizado` → `/code-review` → revisión. **CI en verde es obligatorio para fusionar** (INFRA §5.2)
4. El login local con un usuario de `edr-dev` estará disponible desde T-05 (backend, `create_admin.py`) y T-06 (pantalla de login)
