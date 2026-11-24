# TESTING.md — Estrategia de pruebas
> PRD RNF-06, RNF-07 · ARCHITECTURE P-3 · INFRA §5
> Regla del proyecto (CLAUDE.md): **no se despliega sin que las pruebas pasen**.

---

## 1. Niveles de prueba

| Nivel | Qué prueba | Herramienta | Dónde corre | Obligatorio |
|---|---|---|---|---|
| **Unitarias — backend** | Funciones puras de `app/services/` sin BD ni red: edades, rangos, normalización de nombres, validaciones, armado de filtros, cálculo de cifras sobre listas | `pytest` | Local y CI | Sí |
| **Integración — backend** | Endpoints de FastAPI contra PostgreSQL real: restricciones únicas, transacciones, permisos, consultas con filtros | `pytest` + `httpx` (`TestClient`) + Postgres 16 | Local (Docker) y CI | Sí |
| **Unitarias — frontend** | Funciones puras de `src/lib/`: etiquetas y catálogos, serialización de filtros a query string, validaciones de formularios, formato de fechas | `vitest` | Local y CI | Sí |
| **Humo (*smoke*) post-despliegue** | Producción responde: `/api/health`, `/api/public/stats`, frontend carga | GitHub Actions + `curl` | Tras cada despliegue | Sí |
| **Aceptación** | Criterios CA de MOD-01 a MOD-06 recorridos a mano en producción | Lista de chequeo (T-22) | Producción | Sí, antes de entregar |

> **Fuera de alcance:** pruebas de componentes React, pruebas E2E automatizadas (Playwright/Cypress) y pruebas de carga. En 7 días cuestan más de lo que aportan; los flujos se cubren con la aceptación manual (T-22).

### Por qué separar unitarias de integración
- Las **unitarias** corren en milisegundos y aíslan la lógica: si `age_range(birth_date, today)` falla, el error apunta a una función, no a un endpoint
- Las **de integración** son las únicas que validan lo que vive en PostgreSQL (índices únicos parciales, `EXISTS`, `CHECK`). Simularlo con SQLite o *mocks* daría falsos verdes (ARCHITECTURE P-3)
- Para que la lógica sea probable en unitarias, **los servicios reciben valores, no sesiones de BD** cuando es posible (p. ej. `today` como parámetro, no `date.today()` adentro)

---

## 2. Backend

### 2.1 Estructura
```
backend/tests/
  conftest.py              ← fixtures: engine de prueba, sesión con rollback, client, tokens
  unit/
    test_ages.py           ← edad, rango, intervalo de fechas por rango (RN-07)
    test_people_rules.py   ← normalización de nombre, regla documento/sin documento (RN-06)
    test_inspection_rules.py ← validación de fechas, ¿cambia el sticker vigente? (RN-02)
    test_filters.py        ← traducción de parámetros a condiciones (RF-04-01)
    test_stats.py          ← agregación de cifras sobre datos en memoria (RF-05-03)
  integration/
    test_auth.py           ← AUTH §5
    test_buildings.py      ← RF-02-01 a 03, RN-01
    test_inspections.py    ← RF-02-04, 05, RN-02 a 04
    test_people.py         ← RF-03-01 a 05, RN-05, RN-06
    test_users.py          ← RF-01-04, 05 (Admin API simulada)
    test_search.py         ← RF-04-01, 02
    test_public_stats.py   ← RF-05-01 a 03, RN-09
    test_pdf.py            ← RF-04-04
```

### 2.2 Fixtures clave (`conftest.py`)
| Fixture | Qué hace |
|---|---|
| `db_engine` (sesión) | Conecta a `TEST_DATABASE_URL` y ejecuta `alembic upgrade head` una vez |
| `db_session` (función) | Abre una transacción y hace **rollback** al terminar: cada prueba empieza con la BD vacía, sin truncar tablas |
| `client` | `TestClient` de FastAPI con la dependencia de sesión sobrescrita por `db_session` |
| `admin_token`, `inspector_token`, `inactive_token` | JWT firmados con una llave RSA generada en la prueba; `auth.py` usa la llave pública de prueba vía variable de entorno (INFRA §5) |
| `as_user(role)` | Sobrescribe `get_current_user` con un perfil de prueba del rol indicado. Permite probar cualquier módulo sin depender de la implementación real de auth (T-05) |
| `make_profile`, `make_building`, `make_inspection`, `make_person` | Fábricas con valores por defecto válidos para no repetir datos |
| `fake_supabase_admin` | Sustituye el cliente de la Admin API (crear/banear usuario) con un doble en memoria |

### 2.3 Convenciones
- Nombre: `test_<qué>_<condición>_<resultado>`, p. ej. `test_create_person_duplicate_document_returns_409`
- Patrón **Arrange–Act–Assert**, una conducta por prueba
- Casos límite explícitos con `@pytest.mark.parametrize` (edades 9/10/17/18/59/60, fechas 10-ago-2026 y "mañana")
- Cada prueba de integración que cubre una regla cita su ID en el *docstring* (`"""RN-06: ..."""`) para trazar requisitos → pruebas
- Sin acceso a red: Supabase (JWKS y Admin API) siempre simulado

### 2.4 Cobertura
- `pytest --cov=app --cov-report=term-missing --cov-fail-under=80`
- Mínimo **80 %** global y **90 %** en `app/services/` (donde viven las reglas). CI falla por debajo
- `scripts/` (seed, create_admin) queda excluido de la medición; `seed.py` se valida en T-19 por su resultado

### 2.5 Matriz mínima regla → prueba
| Regla / RF | Unitaria | Integración |
|---|---|---|
| RN-01 código catastral único | — | `test_buildings` 409 |
| RN-02 sticker vigente = inspección más reciente | `test_inspection_rules` | `test_inspections` (inspección con fecha anterior no cambia el vigente) |
| RN-03 sticker no editable en edificación | — | `test_buildings` (PATCH ignora/rechaza sticker) |
| RN-04 inspector = usuario del token | — | `test_inspections` |
| RN-06 duplicados de persona | `test_people_rules` (normalización) | `test_people` 409 con y sin documento; OK en otra edificación |
| RN-07 edad y rango calculados | `test_ages` (límites) | `test_people` (respuesta trae `age`, `age_range`) |
| RN-08 cobertura independiente | — | `test_buildings` |
| RN-09 público sin datos personales | `test_stats` | `test_public_stats` (busca valores sembrados en la respuesta) |
| RN-10 auth y roles | — | `test_auth`, `test_users` 401/403 |
| RN-11 PDF autenticado | — | `test_pdf` |
| RF-04-01 CA-2 misma persona cumple todos los filtros | `test_filters` | `test_search` |

---

## 3. Frontend

### 3.1 Alcance
Solo **funciones puras** de `src/lib/` (sin renderizar componentes):

| Archivo | Qué se prueba |
|---|---|
| `lib/catalogs.js` | Cada código de enum tiene etiqueta en español; ninguna etiqueta vacía |
| `lib/filters.js` | Objeto de filtros ⇄ query string (ida y vuelta), filtros vacíos se omiten, `sticker` múltiple |
| `lib/validation.js` | "Sin documento" no exige número; "Ninguna" excluyente; fecha no futura; pisos ≥ 1 |
| `lib/format.js` | Fechas en `America/Bogota`; nombre del archivo PDF |

### 3.2 Herramienta y configuración
- **Vitest** (`devDependency`): usa la misma configuración de Vite, sin Babel ni Jest. Justificación: es la opción de menor costo en un proyecto Vite
- Archivos `*.test.js` junto al archivo que prueban
- `npm test` → `vitest run`; CI lo ejecuta antes del build

---

## 4. Ejecución

| Dónde | Comando |
|---|---|
| Backend local | `docker run -d -p 5433:5432 -e POSTGRES_PASSWORD=test postgres:16` y luego `TEST_DATABASE_URL=postgresql+psycopg://postgres:test@localhost:5433/postgres pytest` |
| Solo unitarias backend | `pytest tests/unit` (no necesita BD) |
| Frontend local | `npm test` |
| CI | Automático en cada PR y push a `main` (INFRA §5) |

**Nunca** se ejecutan pruebas contra la BD de producción: `TEST_DATABASE_URL` es una variable distinta de `DATABASE_URL`, y `conftest.py` aborta si apunta a un host `supabase.co` o `supabase.com`.

---

## 5. Definición de "hecho" respecto a pruebas
Un PR que toca `backend/app/` o `frontend/src/lib/` solo se aprueba si:
1. Agrega o actualiza pruebas para la conducta que cambia
2. CI está en verde, incluida la cobertura mínima
3. Si implementa una regla de la matriz §2.5, la prueba correspondiente existe y cita el ID
