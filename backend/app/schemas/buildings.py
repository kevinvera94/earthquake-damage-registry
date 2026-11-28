"""Schemas: Edificaciones: búsqueda, registro, edición, consulta y PDF (MOD-02, MOD-04)."""

import uuid
from datetime import datetime
from typing import Annotated, Self

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator

from app.enums import MAX_COMUNA, RURAL_COMUNA, Sector, Sticker
from app.schemas.inspections import InspectionOut

# Texto obligatorio: sin espacios sobrantes y no vacío
RequiredText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
# Comuna de Cali: 1..22; 0 = Rural (DATA-MODEL §2)
Comuna = Annotated[int, Field(ge=RURAL_COMUNA, le=MAX_COMUNA)]
# RF-02-02 CA-4: entero ≥ 1. La cota superior es la de la columna `smallint`
Floors = Annotated[int, Field(ge=1, le=32767)]


class BuildingCreate(BaseModel):
    """RF-02-02: edificación nueva. Campos desconocidos → 422: el sticker vigente no se envía,
    solo cambia registrando una inspección (RN-03)."""

    model_config = ConfigDict(extra="forbid")

    cadastral_code: RequiredText
    address: RequiredText
    comuna: Comuna
    neighborhood: RequiredText
    sector: Sector
    floors: Floors
    # RN-08 / RF-02-02 CA-3: coberturas independientes, por defecto "No"
    is_insured: bool = False
    has_mortgage: bool = False
    has_leasing: bool = False


class BuildingUpdate(BaseModel):
    """RF-02-03: edición parcial. `cadastral_code` (CA-1) y el sticker (CA-2, RN-03) no son
    campos de este schema: enviarlos responde 422."""

    model_config = ConfigDict(extra="forbid")

    address: RequiredText | None = None
    comuna: Comuna | None = None
    neighborhood: RequiredText | None = None
    sector: Sector | None = None
    floors: Floors | None = None
    is_insured: bool | None = None
    has_mortgage: bool | None = None
    has_leasing: bool | None = None

    @model_validator(mode="after")
    def _fields_not_null(self) -> Self:
        """Un campo puede omitirse, pero no enviarse en `null`: todos son obligatorios."""
        for name in self.model_fields_set:
            if getattr(self, name) is None:
                raise ValueError(f"El campo {name} no puede ser nulo.")
        return self


class BuildingOut(BaseModel):
    """Edificación con su cobertura y sticker vigente (`None` = sin inspeccionar, RF-02-05 CA-2)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    cadastral_code: str
    address: str
    comuna: int
    neighborhood: str
    sector: Sector
    floors: int
    is_insured: bool
    has_mortgage: bool
    has_leasing: bool
    current_sticker: Sticker | None
    last_inspection_at: datetime | None
    created_at: datetime
    updated_at: datetime


class BuildingDetailOut(BuildingOut):
    """RF-04-03: ficha de la edificación con el historial de inspecciones, de la más reciente a
    la más antigua (RF-02-05 CA-3)."""

    inspections: list[InspectionOut]
