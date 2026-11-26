"""Esquema inicial: enums, tablas, restricciones, índices y RLS (DATA-MODEL, T-03).

Revision ID: 0001
Revises:
Create Date: 2026-11-26 09:37:15.651431

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# Tablas de la aplicación + la de Alembic: todas con RLS y sin políticas (ARCHITECTURE P-2)
RLS_TABLES = ("profiles", "buildings", "inspections", "people", "alembic_version")

ENUM_TYPES = (
    "user_role",
    "sector",
    "sticker",
    "document_type",
    "tenure",
    "special_condition",
    "population_type",
)

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Crea el esquema completo."""
    op.create_table(
        "buildings",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("cadastral_code", sa.Text(), nullable=False),
        sa.Column("address", sa.Text(), nullable=False),
        sa.Column("comuna", sa.SmallInteger(), nullable=False),
        sa.Column("neighborhood", sa.Text(), nullable=False),
        sa.Column(
            "sector",
            sa.Enum(
                "housing",
                "commercial",
                "health",
                "education",
                "infrastructure",
                "logistics",
                "economy",
                name="sector",
            ),
            nullable=False,
        ),
        sa.Column("floors", sa.SmallInteger(), nullable=False),
        sa.Column("is_insured", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("has_mortgage", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("has_leasing", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column(
            "current_sticker", sa.Enum("green", "yellow", "red", name="sticker"), nullable=True
        ),
        sa.Column("last_inspection_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint("comuna BETWEEN 0 AND 22", name="ck_buildings_comuna_range"),
        sa.CheckConstraint("floors >= 1", name="ck_buildings_floors_positive"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("cadastral_code"),
    )
    op.create_index(op.f("ix_buildings_comuna"), "buildings", ["comuna"], unique=False)
    op.create_index(
        op.f("ix_buildings_current_sticker"), "buildings", ["current_sticker"], unique=False
    )
    op.create_index(
        op.f("ix_buildings_last_inspection_at"), "buildings", ["last_inspection_at"], unique=False
    )
    op.create_index(op.f("ix_buildings_sector"), "buildings", ["sector"], unique=False)
    op.create_table(
        "profiles",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("full_name", sa.Text(), nullable=False),
        sa.Column("email", sa.Text(), nullable=False),
        sa.Column("role", sa.Enum("admin", "inspector", name="user_role"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_table(
        "inspections",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("building_id", sa.UUID(), nullable=False),
        sa.Column("inspector_id", sa.UUID(), nullable=False),
        sa.Column("inspected_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("sticker", sa.Enum("green", "yellow", "red", name="sticker"), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "inspected_at >= TIMESTAMPTZ '2026-08-10 00:00:00-05'",
            name="ck_inspections_after_earthquake",
        ),
        sa.ForeignKeyConstraint(["building_id"], ["buildings.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["inspector_id"], ["profiles.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_inspections_building_id_inspected_at",
        "inspections",
        ["building_id", sa.literal_column("inspected_at DESC")],
        unique=False,
    )
    op.create_table(
        "people",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("building_id", sa.UUID(), nullable=False),
        sa.Column("first_names", sa.Text(), nullable=False),
        sa.Column("last_names", sa.Text(), nullable=False),
        sa.Column("normalized_name", sa.Text(), nullable=False),
        sa.Column(
            "document_type",
            sa.Enum("cc", "ti", "rc", "ce", "passport", "none", name="document_type"),
            nullable=False,
        ),
        sa.Column("document_number", sa.Text(), nullable=True),
        sa.Column("tenure", sa.Enum("owner", "tenant", name="tenure"), nullable=False),
        sa.Column("birth_date", sa.Date(), nullable=False),
        sa.Column(
            "special_conditions",
            postgresql.ARRAY(
                sa.Enum("disability", "vulnerable", "special_need", name="special_condition")
            ),
            server_default=sa.text("'{}'"),
            nullable=False,
        ),
        sa.Column(
            "population_type",
            sa.Enum("civilian", "military", "prison", name="population_type"),
            server_default=sa.text("'civilian'"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "(document_type = 'none') = (document_number IS NULL)",
            name="ck_people_document_number_matches_type",
        ),
        sa.ForeignKeyConstraint(["building_id"], ["buildings.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_people_birth_date"), "people", ["birth_date"], unique=False)
    op.create_index(op.f("ix_people_building_id"), "people", ["building_id"], unique=False)
    op.create_index(
        "uq_people_building_document",
        "people",
        ["building_id", "document_type", "document_number"],
        unique=True,
        postgresql_where=sa.text("document_type <> 'none'"),
    )
    op.create_index(
        "uq_people_building_name_birth_date",
        "people",
        ["building_id", "normalized_name", "birth_date"],
        unique=True,
        postgresql_where=sa.text("document_type = 'none'"),
    )

    # profiles.id = auth.users.id (AUTH §1). El esquema `auth` solo existe en Supabase: en
    # PostgreSQL local y en CI la FK se omite para poder crear perfiles de prueba.
    op.execute("""
        DO $$
        BEGIN
            IF to_regclass('auth.users') IS NOT NULL THEN
                ALTER TABLE profiles
                    ADD CONSTRAINT fk_profiles_auth_users
                    FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE;
            END IF;
        END
        $$;
        """)

    for table in RLS_TABLES:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")


def downgrade() -> None:
    """Elimina el esquema completo (solo para desarrollo local)."""
    op.execute("ALTER TABLE alembic_version DISABLE ROW LEVEL SECURITY")
    op.drop_index(
        "uq_people_building_name_birth_date",
        table_name="people",
        postgresql_where=sa.text("document_type = 'none'"),
    )
    op.drop_index(
        "uq_people_building_document",
        table_name="people",
        postgresql_where=sa.text("document_type <> 'none'"),
    )
    op.drop_index(op.f("ix_people_building_id"), table_name="people")
    op.drop_index(op.f("ix_people_birth_date"), table_name="people")
    op.drop_table("people")
    op.drop_index("ix_inspections_building_id_inspected_at", table_name="inspections")
    op.drop_table("inspections")
    op.drop_table("profiles")
    op.drop_index(op.f("ix_buildings_sector"), table_name="buildings")
    op.drop_index(op.f("ix_buildings_last_inspection_at"), table_name="buildings")
    op.drop_index(op.f("ix_buildings_current_sticker"), table_name="buildings")
    op.drop_index(op.f("ix_buildings_comuna"), table_name="buildings")
    op.drop_table("buildings")
    for enum_type in ENUM_TYPES:
        op.execute(f"DROP TYPE IF EXISTS {enum_type}")
