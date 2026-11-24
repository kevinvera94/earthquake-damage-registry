# CODING-STANDARDS.md — Estándares de código del equipo
> **Obligatorio** para las personas y los agentes (Claude Code u otros) que escriben código en este repositorio.
> Objetivo: que el código de Kevin, Valentina y David parezca escrito por una sola persona.
> Si un estándar parece incorrecto, **se propone el cambio en un PR a este archivo**; no se implementa una variante propia.
> Versión: **v1.0** — Última actualización: 2026-11-23

---

## 0. Regla de oro
1. **Este documento** manda sobre las preferencias personales y sobre los valores por defecto del agente
2. Si algo no está aquí, se copia el patrón de la **implementación de referencia** (§5)
3. Si tampoco está ahí, se pregunta en el grupo antes de inventar un patrón nuevo

---

## 1. Backend (Python / FastAPI)

### 1.1 Decisiones fijas
| Tema | Decisión | Por qué |
|---|---|---|
| Sincronía | **Síncrono**: endpoints `def` (no `async def`), `Session` de SQLAlchemy síncrona, psycopg 3 | Más simple de escribir y probar; ReportLab y psycopg son síncronos; el volumen no lo requiere |
| ORM | SQLAlchemy 2.0 con estilo tipado: `Mapped[...]`, `mapped_column`, `select()`. **Nunca** `session.query()` | Estilo vigente y uno solo |
| Validación | Pydantic v2 | Viene con FastAPI |
| Configuración | Solo a través de `app.config.settings`. **Nunca** `os.environ` / `os.getenv` fuera de `config.py` | Un solo punto de configuración (CLAUDE.md) |
| Fechas y horas | Siempre con zona horaria (`datetime.now(timezone.utc)`); en BD, `timestamptz`. Nunca fechas *naive* | Evita errores de zona horaria |
| Logs | `logger = logging.getLogger(__name__)`; nunca `print`. **Nunca** registrar nombres, documentos ni tokens | Datos personales |
| Formato | Black (`line-length = 100`) + Flake8 (`max-line-length = 100`) | — |
| Tipos | *Type hints* en todas las funciones y métodos | — |

### 1.2 Capas y responsabilidades
```
routers/<recurso>.py   → HTTP: recibe, valida con schemas, aplica dependencias de auth, llama al servicio, devuelve schema
services/<recurso>.py  → Reglas de negocio y acceso a datos. No conoce HTTP
schemas/<recurso>.py   → Modelos Pydantic de entrada y salida
models.py              → Modelos SQLAlchemy (todas las tablas)
enums.py               → Catálogos (StrEnum)
errors.py              → Excepciones de dominio
```

| Regla | Detalle |
|---|---|
| Sin SQL en routers | El router solo llama funciones del servicio |
| Sin HTTP en servicios | Los servicios **no** importan `fastapi` ni lanzan `HTTPException`; lanzan excepciones de `errors.py` |
| Servicios reciben valores | Firma `def create_building(db: Session, data: BuildingCreate, user: Profile) -> Building`. Las funciones de lógica pura reciben `today`/`now` como parámetro para poder probarlas (TESTING §1) |
| Transacción | Cada función de servicio que escribe es **una unidad de trabajo**: hace `db.flush()` para detectar violaciones, traduce `IntegrityError` a `ConflictError` y termina con `db.commit()` |
| Un recurso, un archivo | `routers/buildings.py`, `services/buildings.py`, `schemas/buildings.py`, `tests/integration/test_buildings.py` |

### 1.3 Errores
`app/errors.py` (creado en T-01) define:

| Excepción | HTTP | Uso |
|---|---|---|
| `NotFoundError` | 404 | Recurso inexistente |
| `ConflictError` | 409 | Duplicados (RN-01, RN-06) |
| `BusinessRuleError` | 400 | Regla de negocio violada (p. ej. admin se desactiva a sí mismo) |
| `PermissionDeniedError` | 403 | Rol insuficiente o usuario desactivado |

- `main.py` registra **un** manejador por excepción que responde `{"detail": "<mensaje en español>"}`
- El mensaje lo escribe quien lanza la excepción, en español y pensado para el usuario final
- Validaciones de forma (tipos, obligatorios, rangos simples) van en el schema Pydantic → 422 automático

### 1.4 Schemas (Pydantic)
| Uso | Nombre | Notas |
|---|---|---|
| Crear | `BuildingCreate` | Campos obligatorios según PRD |
| Editar | `BuildingUpdate` | Todos opcionales; se aplica con `model_dump(exclude_unset=True)` |
| Respuesta detallada | `BuildingOut` / `BuildingDetailOut` | `model_config = ConfigDict(from_attributes=True)` |
| Ítem de listado | `BuildingListItem` | Solo columnas de la tabla de resultados |
| Paginación | `Page[T]` en `schemas/common.py` | `items`, `total`, `page`, `page_size` (API §1) |

### 1.5 Modelos y enums
- Tablas en plural y `snake_case` (`buildings`, `people`); columnas en inglés `snake_case` (DATA-MODEL)
- PK `UUID` con `server_default=text("gen_random_uuid()")`; `created_at`/`updated_at` con `server_default=func.now()`
- Enums como `class Sticker(StrEnum)` en `enums.py`; en el modelo, `SAEnum(Sticker, name="sticker", values_callable=lambda e: [m.value for m in e])` para que coincida con el tipo de PostgreSQL

### 1.6 Routers
```python
router = APIRouter(prefix="/api/buildings", tags=["buildings"])

@router.post("", response_model=BuildingOut, status_code=status.HTTP_201_CREATED)
def create_building(
    data: BuildingCreate,
    db: Session = Depends(get_db),
    user: Profile = Depends(get_current_user),
) -> Building:
    """RF-02-02: crea una edificación."""
    return buildings_service.create_building(db, data, user)
```
- `response_model` y `status_code` siempre explícitos (201 al crear, 204 al borrar)
- *Docstring* corto en español que cita el RF
- Auth: `Depends(get_current_user)` o `Depends(require_admin)` de `app/auth.py`. Nunca se lee el token a mano

### 1.7 Pruebas
Ver `TESTING.md`. Además:
- Para probar un módulo sin depender de la implementación real de auth, se usa la fixture `as_user(role)` de `conftest.py`, que sobrescribe `get_current_user` (T-01b)
- Las fábricas `make_building`, `make_person`, … viven **solo** en `conftest.py`

---

## 2. Frontend (React / JavaScript)

### 2.1 Decisiones fijas
| Tema | Decisión |
|---|---|
| Lenguaje | JavaScript (ES2022), JSX. Sin TypeScript (DEC-008) |
| Componentes | Solo funcionales con *hooks*. Un componente por archivo, `PascalCase.jsx` |
| Estado | `useState`, `useEffect`, `useContext`. Sin Redux, Zustand ni React Query |
| Rutas | Solo en `App.jsx` (creado completo en T-02) |
| Estilos | CSS plano tomado del mockup. `src/styles/global.css` (tokens y clases base del mockup) queda **congelado** después de T-02; los estilos nuevos van en `NombreComponente.css` junto al componente. Sin Tailwind, librerías de UI ni CSS-in-JS |
| Formato | Prettier: `semi: true`, `singleQuote: true`, `printWidth: 100`, `trailingComma: "all"`. ESLint con la configuración de T-02 |

### 2.2 Estructura
```
src/
  App.jsx                    ← rutas (T-02)
  main.jsx
  lib/
    supabase.js              ← cliente de Supabase (solo login)
    api/
      client.js              ← fetch base: URL, token, errores (T-02)
      buildings.js           ← funciones del recurso (dueño: quien implementa el módulo)
      inspections.js · people.js · users.js · public.js
    catalogs.js              ← códigos y etiquetas en español de todos los enums (T-02, completo)
    validation.js · filters.js · format.js
  hooks/
    useAsync.js              ← carga/error/datos para llamadas a la API (T-02)
  pages/                     ← una página por ruta
  components/                ← piezas reutilizables
  styles/global.css
```

### 2.3 Reglas
| Regla | Detalle |
|---|---|
| Llamadas a la API | Solo a través de `lib/api/<recurso>.js`, que usa `client.js`. Ningún componente llama `fetch` directamente |
| Errores de la API | `client.js` lanza `ApiError { status, detail }`; los formularios muestran `detail` tal cual (ya viene en español) |
| Etiquetas | Siempre desde `lib/catalogs.js`. Nunca se escribe "Arrendatario" o "Verde" a mano en un componente |
| Fechas | Solo con las funciones de `lib/format.js` (`America/Bogota`) |
| Validaciones | En `lib/validation.js`, con pruebas en Vitest; el componente solo las llama |
| Sticker | Siempre con el componente `StickerBadge` |
| Textos de la interfaz | En español; código e identificadores en inglés |
| Accesibilidad mínima | Cada `input` con su `label`; botones con texto o `aria-label` |

---

## 3. Archivos compartidos
Los crea **completos** su tarea de FASE-01. Después solo se **agregan** líneas al final y en un PR pequeño y propio, avisando en el grupo antes.

| Archivo | Lo crea | Quién puede cambiarlo después |
|---|---|---|
| `backend/app/models.py`, `enums.py`, `alembic/versions/*` | T-03 (Kevin) | **Solo Kevin.** Quien necesite un cambio de esquema lo pide |
| `backend/app/main.py`, `errors.py`, `config.py`, `db.py`, `routers/__init__.py` | T-01 (Kevin) | Avisar en el grupo; PR propio |
| `backend/app/auth.py` | T-01 (firmas) / T-05 (implementación) (Kevin) | Kevin |
| `backend/tests/conftest.py` | T-01b (David) | Agregar fixtures al final, avisando |
| `backend/requirements*.txt` | T-01 / T-01b | Solo con justificación en el PR (CLAUDE.md) |
| `frontend/src/App.jsx`, `lib/api/client.js`, `lib/catalogs.js`, `hooks/useAsync.js`, `styles/global.css` | T-02 (Valentina) | Avisar en el grupo; PR propio |
| `frontend/package.json`, `package-lock.json` | T-02 | Solo con justificación; si el *lockfile* entra en conflicto, se regenera con `npm install`, no se edita a mano |
| `.github/workflows/*`, `render.yaml`, `vercel.json` | FASE-01 (David) | David |
| `specs/BITACORA.md` | — | **Cada persona, solo su sección**, en el PR de cada tarea (al empezar y al terminar) |
| `specs/**` (resto) | — | PR de documentación; el estado de `TASKS.md` y `FASE-XX.md` lo consolida Kevin al cerrar cada fase |

---

## 4. Git y PRs
| Tema | Regla |
|---|---|
| Ramas | `feat/T-XX-descripcion-corta`, `fix/T-XX-…`, `docs/…`, `chore/…`, siempre desde `main` actualizado |
| Commits | En español, formato `tipo(alcance): descripción` — tipos: `feat`, `fix`, `test`, `docs`, `refactor`, `chore`. Ejemplo: `feat(buildings): crea edificación con control de duplicados` |
| Antes del PR | `git pull --rebase origin main`; correr lint y pruebas en local |
| PR | Usa la plantilla `.github/pull_request_template.md`; abre en **borrador** al empezar la tarea; cita los RF/RN que cubre; incluye la actualización de `specs/BITACORA.md` |
| Tamaño | Un PR = una tarea. Si un módulo tiene parte de backend y de frontend (p. ej. T-07 + T-10), pueden ser dos PRs seguidos de la misma persona |
| Revisión | **Aprueba Kevin Vera** (`.github/CODEOWNERS`). En los PRs de Kevin revisa Valentina o David, y Kevin fusiona como administrador (ver TASKS §4.3). El agente pasa `/code-review` antes de pedir revisión |
| Fusión | *Squash and merge* no; **merge commit** (se conserva el historial de la tarea). Borrar la rama al fusionar |

---

## 5. Implementación de referencia
Cuando se fusionen, estos archivos son el **molde** que todo módulo nuevo copia en estructura, nombres y estilo:

| Capa | Archivos (módulo edificaciones, T-07 + T-10, Valentina) |
|---|---|
| Backend | `routers/buildings.py`, `services/buildings.py`, `schemas/buildings.py`, `tests/integration/test_buildings.py` |
| Frontend | `lib/api/buildings.js`, `pages/BuildingForm.jsx`, `lib/validation.js` (parte de edificación) |

Al empezar una tarea, el agente debe leerlos antes de escribir código. Mientras no existan, manda este documento.
