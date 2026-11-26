"""Schemas: verificación de salud (INFRA §6)."""

from pydantic import BaseModel


class HealthOut(BaseModel):
    """Respuesta de `/api/health`."""

    status: str
