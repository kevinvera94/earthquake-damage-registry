"""Modelos SQLAlchemy de todas las tablas (DATA-MODEL §1 y §3).

Lo crea T-03 y solo lo modifica Kevin (CODING-STANDARDS §3). Cada cambio de esquema
lleva su migración en `alembic/versions/`.
"""

import uuid
from datetime import date, datetime
from enum import StrEnum

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    SmallInteger,
    Text,
    func,
    text,
)
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.enums import (
    DocumentType,
    PopulationType,
    Sector,
    SpecialCondition,
    Sticker,
    Tenure,
    UserRole,
)


def pg_enum(enum_class: type[StrEnum], name: str) -> SAEnum:
    """Tipo ENUM de PostgreSQL que guarda los valores (no los nombres) del StrEnum."""
    return SAEnum(enum_class, name=name, values_callable=lambda e: [m.value for m in e])


def uuid_pk() -> Mapped[uuid.UUID]:
    return mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )


def created_at_column() -> Mapped[datetime]:
    return mapped_column(DateTime(timezone=True), server_default=func.now())


def updated_at_column() -> Mapped[datetime]:
    return mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Profile(Base):
    """Perfil de un usuario de Supabase Auth: mismo `id` que `auth.users` (AUTH §1)."""

    __tablename__ = "profiles"

    # Sin server_default: el id lo asigna Supabase Auth al crear el usuario
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    full_name: Mapped[str] = mapped_column(Text)
    email: Mapped[str] = mapped_column(Text, unique=True)
    role: Mapped[UserRole] = mapped_column(pg_enum(UserRole, "user_role"))
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
    created_at: Mapped[datetime] = created_at_column()


class Building(Base):
    """Edificación inspeccionada (BRIEF §8.1)."""

    __tablename__ = "buildings"
    __table_args__ = (
        CheckConstraint("floors >= 1", name="ck_buildings_floors_positive"),
        CheckConstraint("comuna BETWEEN 0 AND 22", name="ck_buildings_comuna_range"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    # RN-01: índice único
    cadastral_code: Mapped[str] = mapped_column(Text, unique=True)
    address: Mapped[str] = mapped_column(Text)
    comuna: Mapped[int] = mapped_column(SmallInteger, index=True)
    neighborhood: Mapped[str] = mapped_column(Text)
    sector: Mapped[Sector] = mapped_column(pg_enum(Sector, "sector"), index=True)
    floors: Mapped[int] = mapped_column(SmallInteger)
    # RN-08: tres coberturas independientes
    is_insured: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    has_mortgage: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    has_leasing: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    # RN-02 / DEC-005: sticker vigente desnormalizado; NULL = sin inspeccionar
    current_sticker: Mapped[Sticker | None] = mapped_column(pg_enum(Sticker, "sticker"), index=True)
    last_inspection_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    created_at: Mapped[datetime] = created_at_column()
    updated_at: Mapped[datetime] = updated_at_column()

    inspections: Mapped[list["Inspection"]] = relationship(
        # passive_deletes="all": el ORM no toca las inspecciones al borrar; la FK RESTRICT
        # de la BD impide perder el historial (RN-02)
        back_populates="building",
        order_by="Inspection.inspected_at.desc()",
        passive_deletes="all",
    )
    # La BD borra las personas en cascada (ON DELETE CASCADE)
    people: Mapped[list["Person"]] = relationship(
        back_populates="building", cascade="all, delete-orphan", passive_deletes=True
    )


class Inspection(Base):
    """Inspección rápida de una edificación. Inmutable: el historial no se edita (RN-02)."""

    __tablename__ = "inspections"
    __table_args__ = (
        # RF-02-04 CA-2: no antes del sismo (10-ago-2026, hora de Colombia)
        CheckConstraint(
            "inspected_at >= TIMESTAMPTZ '2026-08-10 00:00:00-05'",
            name="ck_inspections_after_earthquake",
        ),
        Index("ix_inspections_building_id_inspected_at", "building_id", text("inspected_at DESC")),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    building_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("buildings.id", ondelete="RESTRICT"))
    # RN-04: el inspector es el usuario autenticado
    inspector_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id", ondelete="RESTRICT"))
    inspected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    sticker: Mapped[Sticker] = mapped_column(pg_enum(Sticker, "sticker"))
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = created_at_column()

    building: Mapped[Building] = relationship(back_populates="inspections")
    inspector: Mapped[Profile] = relationship()


class Person(Base):
    """Persona ocupante de una edificación (BRIEF §8.3). Edad y rango se calculan (RN-07)."""

    __tablename__ = "people"
    __table_args__ = (
        # RF-03-01 CA-2: "Sin documento" ⇔ sin número
        CheckConstraint(
            "(document_type = 'none') = (document_number IS NULL)",
            name="ck_people_document_number_matches_type",
        ),
        # RN-06: sin duplicados dentro de la edificación
        Index(
            "uq_people_building_document",
            "building_id",
            "document_type",
            "document_number",
            unique=True,
            postgresql_where=text("document_type <> 'none'"),
        ),
        Index(
            "uq_people_building_name_birth_date",
            "building_id",
            "normalized_name",
            "birth_date",
            unique=True,
            postgresql_where=text("document_type = 'none'"),
        ),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    building_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("buildings.id", ondelete="CASCADE"), index=True
    )
    first_names: Mapped[str] = mapped_column(Text)
    last_names: Mapped[str] = mapped_column(Text)
    # Minúsculas, sin tildes y con espacios colapsados; lo calcula services/people.py
    normalized_name: Mapped[str] = mapped_column(Text)
    document_type: Mapped[DocumentType] = mapped_column(pg_enum(DocumentType, "document_type"))
    document_number: Mapped[str | None] = mapped_column(Text)
    tenure: Mapped[Tenure] = mapped_column(pg_enum(Tenure, "tenure"))
    birth_date: Mapped[date] = mapped_column(Date, index=True)
    # Arreglo vacío = "Ninguna"
    special_conditions: Mapped[list[SpecialCondition]] = mapped_column(
        ARRAY(pg_enum(SpecialCondition, "special_condition")), server_default=text("'{}'")
    )
    population_type: Mapped[PopulationType] = mapped_column(
        pg_enum(PopulationType, "population_type"), server_default=text("'civilian'")
    )
    created_at: Mapped[datetime] = created_at_column()
    updated_at: Mapped[datetime] = updated_at_column()

    building: Mapped[Building] = relationship(back_populates="people")
