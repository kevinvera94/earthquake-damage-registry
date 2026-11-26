"""Router: Perfil del usuario autenticado (RF-01-01)."""

from fastapi import APIRouter

router = APIRouter(prefix="/api/me", tags=["me"])
