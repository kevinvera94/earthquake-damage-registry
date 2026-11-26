"""Router: verificación de salud para Render y el *smoke* (INFRA §5.3, §6)."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.health import HealthOut
from app.services import health as health_service

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", response_model=HealthOut, status_code=status.HTTP_200_OK)
def get_health(db: Session = Depends(get_db)) -> HealthOut:
    """INFRA §6: responde `ok` si la base de datos contesta. No exige token."""
    health_service.check_database(db)
    return HealthOut(status="ok")
