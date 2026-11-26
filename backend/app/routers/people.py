"""Router: Personas ocupantes de una edificación (MOD-03)."""

from fastapi import APIRouter

# Prefijo "/api": las rutas cuelgan de /api/buildings/{id}/... y de /api/people/{id} (API §2)
router = APIRouter(prefix="/api", tags=["people"])
