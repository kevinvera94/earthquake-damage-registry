# AUTH.md — Autenticación y autorización
> PRD MOD-01 · BRIEF §6, RN-10 · DEC-006

---

## 1. Reparto de responsabilidades
| Quién | Hace |
|---|---|
| **Supabase Auth** | Guarda credenciales (hash de contraseñas), inicia sesión, emite y renueva el JWT |
| **Frontend** | Llama a `supabase.auth.signInWithPassword`, guarda la sesión (lo hace supabase-js) y envía el `access_token` al backend |
| **Backend** | Verifica el JWT, carga el perfil (`profiles`), valida `is_active` y el rol. **Es la única autoridad de permisos** |

El rol **no** se lee de los claims del JWT sino de la tabla `profiles`: así desactivar o cambiar un usuario surte efecto en la siguiente petición, sin esperar a que el token expire.

## 2. Verificación del JWT (`app/auth.py`)
1. Leer `Authorization: Bearer <token>`; si falta → 401
2. Verificar la firma con las llaves públicas de `SUPABASE_URL/auth/v1/.well-known/jwks.json` (PyJWT `PyJWKClient`, con caché de llaves). Comprobar `exp`, `aud = "authenticated"` e `iss = SUPABASE_URL/auth/v1`
3. `sub` del token = `profiles.id`. Si no existe perfil o `is_active = false` → 403
4. Dependencias de FastAPI: `current_user` (cualquier rol activo) y `require_admin`

> Si el proyecto de Supabase usa todavía el secreto compartido (HS256) en lugar de llaves asimétricas, se verifica con `SUPABASE_JWT_SECRET`. Se decide al crear el proyecto; el código soporta ambos con una variable de entorno.

## 3. Gestión de usuarios (solo admin)
Usa la **Admin API** de Supabase con `SUPABASE_SERVICE_ROLE_KEY`, que **solo vive en el backend**.

| Acción | Pasos |
|---|---|
| Crear (RF-01-04) | `auth.admin.create_user(email, password, email_confirm=True)` → insertar `profiles` con el mismo `id`, nombre y rol. Si falla el insert, borrar el usuario de Auth (compensación) |
| Desactivar (RF-01-05) | `profiles.is_active = false` **y** `auth.admin.update_user_by_id(id, ban_duration="876000h")` para impedir nuevos logins (CA-3) |
| Reactivar | `is_active = true` y `ban_duration="none"` |
| Admin inicial (RF-01-06) | `scripts/create_admin.py` con `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`; idempotente |

Un admin no puede desactivarse a sí mismo (400).

## 4. Frontend
- Rutas privadas envueltas en un `RequireAuth` que redirige a `/login` si no hay sesión
- Al iniciar sesión llama a `/api/me`; si responde 403 (desactivado) cierra la sesión y muestra el mensaje
- Las opciones de admin se ocultan por rol, pero la protección real es el 403 del backend
- Variables públicas: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (la clave anónima es pública por diseño; no da acceso a datos gracias a RLS, ARCHITECTURE P-2)

## 5. Pruebas mínimas
- Sin token → 401; token con firma inválida → 401; usuario desactivado → 403
- Inspector contra `/api/users` → 403
- `/api/public/stats` funciona sin token
