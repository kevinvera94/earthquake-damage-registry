"""Schemas: Personas ocupantes de una edificación (MOD-03)."""

import uuid
from datetime import date, datetime
from typing import Annotated, Self

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    computed_field,
    field_validator,
    model_validator,
)

from app.enums import AgeRange, DocumentType, PopulationType, SpecialCondition, Tenure
from app.services.ages import age, age_range, today_colombia

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
DocumentNumber = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=30)
]


def _check_birth_date(birth_date: date | None) -> date | None:
    """RF-03-01 CA-5: la fecha de nacimiento no puede ser futura."""
    if birth_date is not None and birth_date > today_colombia():
        raise ValueError("La fecha de nacimiento no puede ser futura.")
    return birth_date


def _unique_conditions(
    conditions: list[SpecialCondition] | None,
) -> list[SpecialCondition] | None:
    """Quita repetidos conservando el orden. "Ninguna" es la lista vacía (RF-03-01 CA-3)."""
    return None if conditions is None else list(dict.fromkeys(conditions))


class PersonCreate(BaseModel):
    """RF-03-01: persona nueva en una edificación."""

    first_names: Name
    last_names: Name
    document_type: DocumentType
    document_number: DocumentNumber | None = None
    tenure: Tenure
    birth_date: date
    special_conditions: list[SpecialCondition] = Field(default_factory=list)
    population_type: PopulationType = PopulationType.CIVILIAN

    _birth_date_not_future = field_validator("birth_date")(_check_birth_date)
    _conditions_unique = field_validator("special_conditions")(_unique_conditions)

    @model_validator(mode="after")
    def _document_number_matches_type(self) -> Self:
        """RF-03-01 CA-2: "Sin documento" no lleva número; los demás tipos lo exigen."""
        if self.document_type is DocumentType.NONE and self.document_number is not None:
            raise ValueError('Una persona "Sin documento" no debe tener número de documento.')
        if self.document_type is not DocumentType.NONE and self.document_number is None:
            raise ValueError("El número de documento es obligatorio para este tipo de documento.")
        return self


class PersonUpdate(BaseModel):
    """RF-03-04: edición parcial. La coherencia entre tipo y número de documento se valida en el
    servicio, sobre el resultado de aplicar el cambio a la persona guardada."""

    first_names: Name | None = None
    last_names: Name | None = None
    document_type: DocumentType | None = None
    document_number: DocumentNumber | None = None
    tenure: Tenure | None = None
    birth_date: date | None = None
    special_conditions: list[SpecialCondition] | None = None
    population_type: PopulationType | None = None

    _birth_date_not_future = field_validator("birth_date")(_check_birth_date)
    _conditions_unique = field_validator("special_conditions")(_unique_conditions)

    @model_validator(mode="after")
    def _required_fields_not_null(self) -> Self:
        """Un campo obligatorio puede omitirse, pero no enviarse en `null`. Solo
        `document_number` admite `null` (al pasar a "Sin documento")."""
        nullable = {"document_number"}
        for name in self.model_fields_set - nullable:
            if getattr(self, name) is None:
                raise ValueError(f"El campo {name} no puede ser nulo.")
        return self


class PersonOut(BaseModel):
    """RF-03-05: persona con edad y rango calculados a hoy (RN-07)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    building_id: uuid.UUID
    first_names: str
    last_names: str
    document_type: DocumentType
    document_number: str | None
    tenure: Tenure
    birth_date: date
    special_conditions: list[SpecialCondition]
    population_type: PopulationType
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def age(self) -> int:
        return age(self.birth_date, today_colombia())

    @computed_field
    @property
    def age_range(self) -> AgeRange:
        return age_range(self.birth_date, today_colombia())
