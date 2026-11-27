"""Servicio: Personas ocupantes de una edificación (MOD-03)."""

import re
import unicodedata
import uuid
from collections.abc import Iterator
from contextlib import contextmanager

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.enums import DocumentType
from app.errors import BusinessRuleError, ConflictError, NotFoundError
from app.models import Building, Person
from app.schemas.people import PersonCreate, PersonUpdate

_DUPLICATE_MESSAGES = {
    "uq_people_building_document": (
        "Ya existe una persona con ese tipo y número de documento en esta edificación."
    ),
    "uq_people_building_name_birth_date": (
        "Ya existe una persona sin documento con el mismo nombre y fecha de nacimiento en esta "
        "edificación."
    ),
}


def normalize_name(first_names: str, last_names: str) -> str:
    """Nombre completo para comparar duplicados sin documento (RN-06, DATA-MODEL §3):
    minúsculas, sin tildes ni diéresis y con los espacios colapsados. La "ñ" pasa a "n"."""
    full_name = f"{first_names} {last_names}"
    without_marks = "".join(
        char for char in unicodedata.normalize("NFKD", full_name) if not unicodedata.combining(char)
    )
    return re.sub(r"\s+", " ", without_marks).strip().casefold()


def _check_document(document_type: DocumentType, document_number: str | None) -> None:
    """RF-03-01 CA-2 sobre el resultado de una edición parcial (en la creación lo valida el
    schema y responde 422)."""
    if document_type is DocumentType.NONE and document_number is not None:
        raise BusinessRuleError('Una persona "Sin documento" no debe tener número de documento.')
    if document_type is not DocumentType.NONE and document_number is None:
        raise BusinessRuleError(
            "El número de documento es obligatorio para este tipo de documento."
        )


def _get_person(db: Session, person_id: uuid.UUID) -> Person:
    person = db.get(Person, person_id)
    if person is None:
        raise NotFoundError("La persona no existe.")
    return person


@contextmanager
def _unit_of_work(db: Session) -> Iterator[None]:
    """Unidad de trabajo (CODING-STANDARDS §1.2). Los cambios del bloque van en un *savepoint*:
    los índices únicos detectan los duplicados de RN-06 en O(log n), su violación se traduce a
    `ConflictError` y solo se deshace este cambio, no el resto de la sesión."""
    try:
        with db.begin_nested():
            yield
    except IntegrityError as exc:
        constraint = getattr(getattr(exc.orig, "diag", None), "constraint_name", None)
        if constraint in _DUPLICATE_MESSAGES:
            raise ConflictError(_DUPLICATE_MESSAGES[constraint]) from exc
        raise
    db.commit()


def create_person(db: Session, building_id: uuid.UUID, data: PersonCreate) -> Person:
    """RF-03-01 y RF-03-02: agrega una persona a la edificación sin repetirla (RN-05, RN-06)."""
    if db.get(Building, building_id) is None:
        raise NotFoundError("La edificación no existe.")
    person = Person(
        building_id=building_id,
        normalized_name=normalize_name(data.first_names, data.last_names),
        **data.model_dump(),
    )
    with _unit_of_work(db):
        db.add(person)
    db.refresh(person)
    return person


def update_person(db: Session, person_id: uuid.UUID, data: PersonUpdate) -> Person:
    """RF-03-04 CA-1: edita los campos enviados con las mismas reglas que al crear."""
    person = _get_person(db, person_id)
    changes = data.model_dump(exclude_unset=True)
    # Al pasar a "Sin documento" el número se oculta en la interfaz (RF-03-01 CA-2): se borra
    if changes.get("document_type") is DocumentType.NONE:
        changes.setdefault("document_number", None)
    with _unit_of_work(db):
        for field, value in changes.items():
            setattr(person, field, value)
        _check_document(person.document_type, person.document_number)
        person.normalized_name = normalize_name(person.first_names, person.last_names)
    db.refresh(person)
    return person


def delete_person(db: Session, person_id: uuid.UUID) -> None:
    """RF-03-04 CA-2: retira a la persona de la edificación (la confirmación es de la UI)."""
    person = _get_person(db, person_id)
    db.delete(person)
    db.commit()
