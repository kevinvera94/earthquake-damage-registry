# MOD-01 — Autenticación y usuarios
> Prioridad: **Debe estar** · Roles: Inspector, Administrador · BRIEF §6, RN-10

## Objetivo
Restringir el área privada a usuarios con cuenta y permitir que el Administrador gestione esas cuentas.

## Requerimientos

### RF-01-01 Inicio de sesión
El usuario inicia sesión con correo y contraseña (Supabase Auth).
- **CA-1** Con credenciales válidas entra al área privada y ve su nombre y rol
- **CA-2** Con credenciales inválidas ve "Correo o contraseña incorrectos" sin revelar cuál falló
- **CA-3** Un usuario **desactivado** no puede iniciar sesión aunque su contraseña sea correcta

### RF-01-02 Cierre de sesión
- **CA-1** Al cerrar sesión vuelve a la página pública y las rutas privadas dejan de ser accesibles

### RF-01-03 Protección del área privada
- **CA-1** Toda ruta privada sin sesión redirige al login
- **CA-2** Todo endpoint privado sin token válido responde 401; con rol insuficiente responde 403

### RF-01-04 Crear usuario *(solo Administrador)*
Campos: nombre completo, correo, rol (Inspector / Administrador) y contraseña inicial.
- **CA-1** El correo es único; si ya existe, se muestra el error
- **CA-2** El usuario creado puede iniciar sesión de inmediato
- **CA-3** Un Inspector no ve la opción ni puede invocar el endpoint (403)

### RF-01-05 Listar y desactivar usuarios *(solo Administrador)*
- **CA-1** El Administrador ve la lista de usuarios con nombre, correo, rol y estado
- **CA-2** Puede desactivar y reactivar un usuario; no puede desactivarse a sí mismo
- **CA-3** Los usuarios no se borran: sus inspecciones conservan el nombre del inspector

### RF-01-06 Administrador inicial
- **CA-1** Un script crea el primer Administrador a partir de variables de entorno; no hay credenciales en el código

## Fuera de alcance
Auto-registro, recuperación de contraseña por correo, cambio de rol desde la interfaz (se recrea el usuario), autenticación de dos factores.
