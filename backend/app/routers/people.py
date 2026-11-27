"""Router: Personas ocupantes de una edificación (MOD-03)."""

import uuid

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db import get_db
from app.models import Person, Profile
from app.schemas.people import PersonCreate, PersonOut, PersonUpdate
from app.services import people as people_service

# Prefijo "/api": las rutas cuelgan de /api/buildings/{id}/... y de /api/people/{id} (API §2)
router = APIRouter(prefix="/api", tags=["people"])


@router.post(
    "/buildings/{building_id}/people",
    response_model=PersonOut,
    status_code=status.HTTP_201_CREATED,
)
def create_person(
    building_id: uuid.UUID,
    data: PersonCreate,
    db: Session = Depends(get_db),
    user: Profile = Depends(get_current_user),
) -> Person:
    """RF-03-01: agrega una persona a la edificación."""
    return people_service.create_person(db, building_id, data)


@router.patch("/people/{person_id}", response_model=PersonOut, status_code=status.HTTP_200_OK)
def update_person(
    person_id: uuid.UUID,
    data: PersonUpdate,
    db: Session = Depends(get_db),
    user: Profile = Depends(get_current_user),
) -> Person:
    """RF-03-04: edita una persona."""
    return people_service.update_person(db, person_id, data)


@router.delete(
    "/people/{person_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_person(
    person_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: Profile = Depends(get_current_user),
) -> None:
    """RF-03-04: retira a la persona de la edificación."""
    people_service.delete_person(db, person_id)
