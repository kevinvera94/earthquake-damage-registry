"""Router: Edificaciones: búsqueda, registro, edición, consulta y PDF (MOD-02, MOD-04)."""

from fastapi import APIRouter

router = APIRouter(prefix="/api/buildings", tags=["buildings"])
