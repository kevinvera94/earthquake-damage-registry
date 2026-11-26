"""Dependencias de autenticación y autorización (AUTH §2).

T-01 deja las firmas; T-05 implementa la verificación del JWT de Supabase.
Mientras tanto `get_current_user` rechaza toda petición. Las pruebas de los
demás módulos la sobrescriben con la fixture `as_user(role)` (T-01b).
"""

from typing import TYPE_CHECKING

from fastapi import Depends

from app.errors import PermissionDeniedError

if TYPE_CHECKING:
    from app.models import Profile


def get_current_user() -> "Profile":
    """Devuelve el perfil activo del usuario del token. Pendiente de T-05."""
    raise PermissionDeniedError("La autenticación aún no está disponible.")


def require_admin(user: "Profile" = Depends(get_current_user)) -> "Profile":
    """Exige rol Administrador (RN-10). Depende de `get_current_user`."""
    if user.role != "admin":
        raise PermissionDeniedError("Esta acción requiere el rol Administrador.")
    return user
