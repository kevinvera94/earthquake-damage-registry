# FASE-02 — Autenticación y usuarios
> **24-nov-2026 (tarde) – 25-nov** · Objetivo: el administrador inicia sesión en producción y gestiona usuarios (MOD-01).

---

### T-05 — Autenticación en el backend ⬜
- **Carril:** B · **Depende de:** T-01b, T-03
- **Specs:** AUTH §2, §3 (admin inicial); RF-01-03, RF-01-06; TESTING §2.2
- **Hacer:**
  - `auth.py`: verificación JWT (JWKS o HS256 según variable), dependencias `current_user` y `require_admin`
  - `GET /api/me`
  - `scripts/create_admin.py` idempotente
  - Completar las fixtures de tokens (`admin_token`, `inspector_token`, `inactive_token`) de TESTING §2.2
- **Pruebas:** integración `test_auth.py` (AUTH §5)
- **Hecho cuando:** pruebas en verde; con un token real de Supabase, `/api/me` devuelve el perfil en producción

### T-06 — Login en el frontend ⬜
- **Carril:** D · **Depende de:** T-02, T-05
- **Specs:** AUTH §4; RF-01-01, RF-01-02, RF-01-03
- **Hacer:**
  - `lib/supabase.js`; página `/login`; `RequireAuth`; llamada a `/api/me` al entrar; cerrar sesión
  - Mensaje genérico de credenciales inválidas; manejo del 403 de usuario desactivado
  - Indicador "Despertando el servidor…" si `/api/health` tarda (INFRA §6)
- **Hecho cuando:** en producción, el admin inicial entra, ve su nombre y rol, y al salir no puede abrir `/app/*`

### T-13a — API de usuarios ⬜
- **Carril:** B · **Depende de:** T-05
- **Specs:** RF-01-04, RF-01-05; AUTH §3
- **Hacer:** `GET/POST /api/users`, `PATCH /api/users/{id}` con la Admin API de Supabase (crear con compensación; desactivar con ban)
- **Pruebas:** integración `test_users.py` con `fake_supabase_admin`: inspector → 403; admin no se desactiva a sí mismo → 400; correo duplicado → 409; si falla el insert del perfil, se borra el usuario de Auth (compensación)
- **Hecho cuando:** pruebas en verde y, en producción, un usuario creado puede entrar y uno desactivado no

### T-13b — UI de usuarios ⬜
- **Carril:** D · **Depende de:** T-13a, T-06
- **Specs:** RF-01-04, RF-01-05; mockup (usuarios)
- **Hacer:** página `/app/usuarios` (lista, crear, desactivar/reactivar), visible solo para admin
- **Pruebas:** unitaria de `lib/validation.js` para el formulario de usuario (correo y contraseña obligatorios)
- **Hecho cuando:** el admin gestiona usuarios; el inspector no ve el menú

## Criterio de cierre de la fase
En producción: el admin entra, crea un Inspector, ese Inspector entra y no ve Usuarios; el admin lo desactiva y ya no puede entrar.
