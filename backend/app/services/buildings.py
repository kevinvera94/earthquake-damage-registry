"""Servicio: Edificaciones: búsqueda, registro, edición, consulta y PDF (MOD-02, MOD-04)."""

import uuid
from collections.abc import Iterator
from contextlib import contextmanager

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.errors import ConflictError, NotFoundError
from app.models import Building, Inspection
from app.schemas.buildings import BuildingCreate, BuildingUpdate

# Nombre que PostgreSQL da a UNIQUE (cadastral_code) en la migración 0001 (RN-01)
_DUPLICATE_MESSAGES = {
    "buildings_cadastral_code_key": "Ya existe una edificación con ese código catastral.",
}


def _get_building(db: Session, building_id: uuid.UUID) -> Building:
    building = db.get(Building, building_id)
    if building is None:
        raise NotFoundError("La edificación no existe.")
    return building


@contextmanager
def _unit_of_work(db: Session) -> Iterator[None]:
    """Unidad de trabajo (CODING-STANDARDS §1.2). Los cambios del bloque van en un *savepoint*:
    el índice único detecta el código catastral repetido en O(log n) y evita la carrera de dos
    inserciones simultáneas; su violación se traduce a `ConflictError`."""
    try:
        with db.begin_nested():
            yield
    except IntegrityError as exc:
        constraint = getattr(getattr(exc.orig, "diag", None), "constraint_name", None)
        if constraint in _DUPLICATE_MESSAGES:
            raise ConflictError(_DUPLICATE_MESSAGES[constraint]) from exc
        raise
    db.commit()


def create_building(db: Session, data: BuildingCreate) -> Building:
    """RF-02-02: crea la edificación sin repetir el código catastral (RN-01)."""
    building = Building(**data.model_dump())
    with _unit_of_work(db):
        db.add(building)
    db.refresh(building)
    return building


def get_building_by_cadastral_code(db: Session, cadastral_code: str) -> Building:
    """RF-02-01: coincidencia exacta del código catastral (sin espacios sobrantes)."""
    building = db.scalar(select(Building).where(Building.cadastral_code == cadastral_code.strip()))
    if building is None:
        raise NotFoundError("No existe una edificación con ese código catastral.")
    return building


def get_building_detail(db: Session, building_id: uuid.UUID) -> Building:
    """RF-04-03: ficha con el historial de inspecciones y su inspector, cargados en dos
    consultas adicionales en lugar de una por inspección."""
    building = db.scalar(
        select(Building)
        .where(Building.id == building_id)
        .options(selectinload(Building.inspections).selectinload(Inspection.inspector))
        # Recarga el historial aunque la edificación ya esté en la sesión: así sale siempre en
        # el orden de la relación (inspected_at DESC)
        .execution_options(populate_existing=True)
    )
    if building is None:
        raise NotFoundError("La edificación no existe.")
    return building


def update_building(db: Session, building_id: uuid.UUID, data: BuildingUpdate) -> Building:
    """RF-02-03: edita los campos enviados. El código catastral y el sticker no llegan aquí:
    el schema los rechaza (CA-1, CA-2)."""
    building = _get_building(db, building_id)
    with _unit_of_work(db):
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(building, field, value)
    db.refresh(building)
    return building
