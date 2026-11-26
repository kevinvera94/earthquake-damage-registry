"""Configuración del backend leída de variables de entorno (INFRA §2).

Es el único módulo que lee el entorno: el resto del código usa `settings`
(CODING-STANDARDS §1.1).
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Variables de entorno del backend. En local se cargan desde `backend/.env`."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Base de datos: session pooler de Supabase en producción (INFRA §4)
    database_url: str

    # Supabase: JWKS, emisor del JWT y Admin API (AUTH §2 y §3)
    supabase_url: str
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str | None = None

    # CORS
    frontend_origin: str = "http://localhost:5173"

    # Solo para scripts/create_admin.py (RF-01-06)
    admin_email: str | None = None
    admin_password: str | None = None
    admin_name: str | None = None


settings = Settings()
