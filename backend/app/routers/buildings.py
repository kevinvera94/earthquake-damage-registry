"""Router: Edificaciones: búsqueda, registro, edición, consulta y PDF (MOD-02, MOD-04)."""

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db import get_db
from app.models import Building, Profile
from app.schemas.buildings import BuildingCreate, BuildingDetailOut, BuildingOut, BuildingUpdate
from app.services import buildings as buildings_service

router = APIRouter(prefix="/api/buildings", tags=["buildings"])


@router.post("", response_model=BuildingOut, status_code=status.HTTP_201_CREATED)
def create_building(
    data: BuildingCreate,
    db: Session = Depends(get_db),
    user: Profile = Depends(get_current_user),
) -> Building:
    """RF-02-02: crea una edificación."""
    return buildings_service.create_building(db, data)


# Va antes de /{building_id} para que "lookup" no se lea como un id
@router.get("/lookup", response_model=BuildingOut, status_code=status.HTTP_200_OK)
def lookup_building(
    cadastral_code: str = Query(min_length=1),
    db: Session = Depends(get_db),
    user: Profile = Depends(get_current_user),
) -> Building:
    """RF-02-01: busca una edificación por código catastral exacto; 404 si no existe."""
    return buildings_service.get_building_by_cadastral_code(db, cadastral_code)


@router.get("/{building_id}", response_model=BuildingDetailOut, status_code=status.HTTP_200_OK)
def get_building(
    building_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: Profile = Depends(get_current_user),
) -> Building:
    """RF-04-03: ficha de la edificación con su historial de inspecciones."""
    return buildings_service.get_building_detail(db, building_id)


@router.patch("/{building_id}", response_model=BuildingOut, status_code=status.HTTP_200_OK)
def update_building(
    building_id: uuid.UUID,
    data: BuildingUpdate,
    db: Session = Depends(get_db),
    user: Profile = Depends(get_current_user),
) -> Building:
    """RF-02-03: edita una edificación (sin código catastral ni sticker)."""
    return buildings_service.update_building(db, building_id, data)
