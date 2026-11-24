# API.md — Contrato del backend
> FastAPI · prefijo `/api` · JSON · documentación automática en `/docs` (OpenAPI)

---

## 1. Convenciones
- **Autenticación:** `Authorization: Bearer <JWT de Supabase>` en todo lo que no sea `/api/public/*` ni `/api/health` (ver AUTH.md)
- **Fechas:** ISO 8601 en UTC; el frontend muestra en `America/Bogota`
- **Paginación:** `?page=1&page_size=20` (máx. 100). Respuesta `{ "items": [...], "total": 123, "page": 1, "page_size": 20 }`
- **Errores:** `{ "detail": "mensaje en español" }`

| Código | Cuándo |
|---|---|
| 400 / 422 | Validación de datos (422 lo genera Pydantic) |
| 401 | Sin token, token inválido o expirado |
| 403 | Rol insuficiente o usuario desactivado |
| 404 | Recurso inexistente |
| 409 | Duplicado: código catastral (RN-01) o persona (RN-06) |

---

## 2. Endpoints

| Método | Ruta | Rol | PRD | Descripción |
|---|---|---|---|---|
| GET | `/api/health` | — | INFRA | `{ "status": "ok" }`; health check de Render y "despertador" |
| GET | `/api/public/stats` | — | RF-05-01 | Cifras agregadas |
| GET | `/api/me` | inspector, admin | RF-01-01 | Perfil del usuario autenticado |
| GET | `/api/users` | admin | RF-01-05 | Lista de usuarios |
| POST | `/api/users` | admin | RF-01-04 | Crea usuario |
| PATCH | `/api/users/{id}` | admin | RF-01-05 | `{ "is_active": bool }` |
| GET | `/api/buildings` | inspector, admin | RF-04-01/02 | Consulta con filtros y paginación |
| GET | `/api/buildings/lookup?cadastral_code=` | inspector, admin | RF-02-01 | Coincidencia exacta; 404 si no existe |
| POST | `/api/buildings` | inspector, admin | RF-02-02 | Crea edificación |
| GET | `/api/buildings/{id}` | inspector, admin | RF-04-03 | Ficha: edificación + inspecciones + personas |
| PATCH | `/api/buildings/{id}` | inspector, admin | RF-02-03 | Edita (sin `cadastral_code`) |
| POST | `/api/buildings/{id}/inspections` | inspector, admin | RF-02-04 | Registra inspección |
| POST | `/api/buildings/{id}/people` | inspector, admin | RF-03-01 | Agrega persona |
| PATCH | `/api/people/{id}` | inspector, admin | RF-03-04 | Edita persona |
| DELETE | `/api/people/{id}` | inspector, admin | RF-03-04 | Retira persona (204) |
| GET | `/api/buildings/{id}/pdf` | inspector, admin | RF-04-04 | `application/pdf` con `Content-Disposition: attachment` |

> El PDF se descarga con `fetch` + token y se abre como `Blob` en el frontend: un enlace `<a href>` directo no enviaría el token.

---

## 3. Detalle

### 3.1 `GET /api/public/stats`
```json
{
  "total_inspected": 6043,
  "by_sticker": { "green": 2104, "yellow": 2288, "red": 1651 },
  "by_comuna": [ { "comuna": 1, "green": 80, "yellow": 95, "red": 70, "total": 245 } ],
  "people_by_age_range": { "0-9": 1200, "10-17": 1500, "18-59": 9000, "60+": 2100 },
  "last_updated_at": "2026-11-28T15:04:00Z"
}
```
- Solo edificaciones con `current_sticker IS NOT NULL` cuentan como inspeccionadas
- `last_updated_at` = máximo entre `inspections.created_at` y `people.updated_at`
- El esquema Pydantic de respuesta **solo** tiene estos campos; una prueba verifica que no aparezcan claves de datos personales (RF-05-02)

### 3.2 `GET /api/buildings` — parámetros de filtro (RF-04-01)
| Parámetro | Tipo | Regla |
|---|---|---|
| `comuna` | int | igualdad |
| `neighborhood` | str | `ILIKE %valor%` |
| `cadastral_code` | str | `ILIKE %valor%` |
| `sticker` | lista de `green\|yellow\|red\|none` (repetible) | `current_sticker IN (...)`; `none` = `IS NULL` |
| `inspected_from`, `inspected_to` | date | sobre `last_inspection_at` |
| `sector` | enum | igualdad |
| `is_insured`, `has_mortgage`, `has_leasing` | bool (ausente = indiferente) | igualdad |
| `tenure` | enum | ↓ filtros de personas |
| `age_range` | `0-9\|10-17\|18-59\|60+` | ↓ |
| `special_condition` | enum | ↓ |
| `population_type` | enum | ↓ |
| `page`, `page_size` | int | paginación |

**Filtros de personas:** si llega al menos uno, se agrega **un solo** `EXISTS (SELECT 1 FROM people p WHERE p.building_id = b.id AND <todas las condiciones de persona>)`. Un único `EXISTS` garantiza que una misma persona cumpla todas (RF-04-01 CA-2); varios `EXISTS` separados permitirían que las cumplan personas distintas.

**Orden:** `last_inspection_at DESC NULLS LAST, cadastral_code`.

**Ítem de respuesta:** `id, cadastral_code, address, comuna, neighborhood, sector, current_sticker, last_inspection_at, people_count`.

### 3.3 Cuerpos de entrada
```jsonc
// POST /api/buildings  (PATCH: los mismos campos, todos opcionales, sin cadastral_code)
{ "cadastral_code": "760010100000000010001000000000", "address": "Cra 1 # 2-3",
  "comuna": 3, "neighborhood": "San Antonio", "sector": "housing", "floors": 2,
  "is_insured": false, "has_mortgage": true, "has_leasing": false }

// POST /api/buildings/{id}/inspections
{ "inspected_at": "2026-11-24T14:30:00Z", "sticker": "yellow", "notes": "Grietas en fachada" }

// POST /api/buildings/{id}/people  (PATCH: mismos campos, opcionales)
{ "first_names": "Ana María", "last_names": "Pérez Gómez", "document_type": "cc",
  "document_number": "1000000001", "tenure": "tenant", "birth_date": "1958-03-14",
  "special_conditions": ["disability"], "population_type": "civilian" }

// POST /api/users
{ "full_name": "Juan Inspector", "email": "juan@example.com", "role": "inspector",
  "password": "temporal-123" }
```
Las respuestas de persona agregan `age` y `age_range` calculados.

### 3.4 CORS
Solo el origen de `FRONTEND_ORIGIN` (variable de entorno); en desarrollo, además `http://localhost:5173`.
