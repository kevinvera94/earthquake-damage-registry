"""Router: Inspecciones de una edificación (RF-02-04, RF-02-05)."""

from fastapi import APIRouter

# Prefijo "/api": la ruta es /api/buildings/{id}/inspections (API §2)
router = APIRouter(prefix="/api", tags=["inspections"])
