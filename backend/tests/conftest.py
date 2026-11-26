"""Fixtures compartidas de las pruebas (TESTING §2.2).

Archivo compartido (CODING-STANDARDS §3): se agregan fixtures **al final**, avisando al grupo.

Base de datos: `TEST_DATABASE_URL` (PostgreSQL 16 local o el servicio de CI). Nunca Supabase.
Sin ella se usa la de TESTING §4:
    docker run -d -p 5433:5432 -e POSTGRES_PASSWORD=test postgres:16
Las pruebas unitarias (`pytest tests/unit`) no se conectan a la BD.
"""

import os

from sqlalchemy.engine import make_url

DEFAULT_TEST_DATABASE_URL = "postgresql+psycopg://postgres:test@localhost:5433/postgres"
TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", DEFAULT_TEST_DATABASE_URL)
TEST_SUPABASE_URL = "https://edr-test.supabase.invalid"

# Guardia (TESTING §4): jamás correr pruebas contra Supabase
_test_host = make_url(TEST_DATABASE_URL).host or ""
if _test_host.endswith(("supabase.co", "supabase.com")):
    raise RuntimeError(
        f"TEST_DATABASE_URL apunta a Supabase ({_test_host}). Las pruebas solo corren contra "
        "PostgreSQL local o de CI."
    )

# Antes de importar la app: las variables de entorno ganan sobre backend/.env, que puede
# tener credenciales reales. Así la app de pruebas nunca toca producción.
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ["SUPABASE_URL"] = TEST_SUPABASE_URL
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "test-service-role-key"
os.environ["SUPABASE_JWT_SECRET"] = ""
os.environ["FRONTEND_ORIGIN"] = "http://localhost:5173"

import itertools  # noqa: E402
import uuid  # noqa: E402
from collections.abc import Callable, Iterator  # noqa: E402
from dataclasses import dataclass, field  # noqa: E402
from datetime import date, datetime, timedelta, timezone  # noqa: E402
from pathlib import Path  # noqa: E402
from typing import Any  # noqa: E402

import jwt  # noqa: E402
import pytest  # noqa: E402
from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from cryptography.hazmat.primitives.asymmetric import ec  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import Engine, create_engine  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from app.auth import get_current_user  # noqa: E402
from app.db import get_db  # noqa: E402
from app.enums import (  # noqa: E402
    DocumentType,
    PopulationType,
    Sector,
    Sticker,
    Tenure,
    UserRole,
)
from app.main import app  # noqa: E402
from app.models import Building, Inspection, Person, Profile  # noqa: E402

BACKEND_DIR = Path(__file__).resolve().parent.parent
_sequence = itertools.count(1)


# ---------------------------------------------------------------------------
# Base de datos y cliente HTTP
# ---------------------------------------------------------------------------


@pytest.fixture(scope="session")
def db_engine() -> Iterator[Engine]:
    """Conecta a `TEST_DATABASE_URL` y aplica `alembic upgrade head` una vez por sesión."""
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    config.set_main_option("sqlalchemy.url", TEST_DATABASE_URL.replace("%", "%%"))
    command.upgrade(config, "head")
    engine = create_engine(TEST_DATABASE_URL)
    yield engine
    engine.dispose()


@pytest.fixture
def db_session(db_engine: Engine) -> Iterator[Session]:
    """Sesión dentro de una transacción que se revierte al terminar: cada prueba empieza con la
    BD vacía. Los `commit()` de los servicios solo liberan un *savepoint*."""
    connection = db_engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture(autouse=True)
def _reset_dependency_overrides() -> Iterator[None]:
    """Ninguna sobrescritura de dependencias pasa de una prueba a otra."""
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def client(db_session: Session) -> TestClient:
    """`TestClient` cuya dependencia `get_db` usa la sesión de la prueba."""
    app.dependency_overrides[get_db] = lambda: db_session
    return TestClient(app)


# ---------------------------------------------------------------------------
# Fábricas: valores válidos por defecto; cada prueba cambia solo lo que le importa
# ---------------------------------------------------------------------------


@pytest.fixture
def make_profile(db_session: Session) -> Callable[..., Profile]:
    def _make(**overrides: Any) -> Profile:
        n = next(_sequence)
        values: dict[str, Any] = {
            "id": uuid.uuid4(),
            "full_name": f"Usuario Ficticio {n}",
            "email": f"usuario{n}@example.com",
            "role": UserRole.INSPECTOR,
            "is_active": True,
        }
        values.update(overrides)
        profile = Profile(**values)
        db_session.add(profile)
        db_session.flush()
        return profile

    return _make


@pytest.fixture
def make_building(db_session: Session) -> Callable[..., Building]:
    def _make(**overrides: Any) -> Building:
        n = next(_sequence)
        values: dict[str, Any] = {
            "cadastral_code": f"76001TEST{n:06d}",
            "address": f"Calle {n} # 1-23",
            "comuna": 3,
            "neighborhood": "San Antonio",
            "sector": Sector.HOUSING,
            "floors": 2,
        }
        values.update(overrides)
        building = Building(**values)
        db_session.add(building)
        db_session.flush()
        return building

    return _make


@pytest.fixture
def make_inspection(
    db_session: Session,
    make_building: Callable[..., Building],
    make_profile: Callable[..., Profile],
) -> Callable[..., Inspection]:
    """Inserta una inspección y, como exige RN-02 (DEC-005), actualiza el sticker vigente de la
    edificación si es la más reciente. No reemplaza al servicio de inspecciones: es un atajo
    para preparar datos."""

    def _make(**overrides: Any) -> Inspection:
        values: dict[str, Any] = {
            "inspected_at": datetime(2026, 9, 1, 15, 0, tzinfo=timezone.utc),
            "sticker": Sticker.GREEN,
            "notes": None,
        }
        values.update(overrides)
        if "building" not in values and "building_id" not in values:
            values["building"] = make_building()
        if "inspector" not in values and "inspector_id" not in values:
            values["inspector"] = make_profile()
        inspection = Inspection(**values)
        db_session.add(inspection)
        db_session.flush()

        building = inspection.building
        if (
            building.last_inspection_at is None
            or inspection.inspected_at >= building.last_inspection_at
        ):
            building.current_sticker = inspection.sticker
            building.last_inspection_at = inspection.inspected_at
            db_session.flush()
        return inspection

    return _make


@pytest.fixture
def make_person(
    db_session: Session, make_building: Callable[..., Building]
) -> Callable[..., Person]:
    """`normalized_name` se arma de forma simple (minúsculas); las pruebas de normalización
    real usan el servicio de personas."""

    def _make(**overrides: Any) -> Person:
        n = next(_sequence)
        values: dict[str, Any] = {
            "first_names": "Persona",
            "last_names": f"Ficticia {n}",
            "document_type": DocumentType.CC,
            "document_number": f"1000{n:06d}",
            "tenure": Tenure.OWNER,
            "birth_date": date(1985, 6, 15),
            "special_conditions": [],
            "population_type": PopulationType.CIVILIAN,
        }
        values.update(overrides)
        values.setdefault(
            "normalized_name", f"{values['first_names']} {values['last_names']}".lower()
        )
        if "building" not in values and "building_id" not in values:
            values["building"] = make_building()
        person = Person(**values)
        db_session.add(person)
        db_session.flush()
        return person

    return _make


# ---------------------------------------------------------------------------
# Autenticación
# ---------------------------------------------------------------------------


@pytest.fixture
def as_user(make_profile: Callable[..., Profile]) -> Callable[..., Profile]:
    """Sobrescribe `get_current_user` con un perfil de prueba guardado en la BD (para que sirva
    como `inspector_id`). Permite probar cualquier módulo sin la auth real de T-05.

    Uso: `profile = as_user(UserRole.ADMIN)`; por defecto, inspector.
    """

    def _as(role: UserRole = UserRole.INSPECTOR, **overrides: Any) -> Profile:
        profile = make_profile(role=role, **overrides)
        app.dependency_overrides[get_current_user] = lambda: profile
        return profile

    return _as


@pytest.fixture(scope="session")
def jwt_private_key() -> ec.EllipticCurvePrivateKey:
    """Llave de prueba ECC P-256, el mismo tipo con que firma Supabase en producción (ES256).
    T-05 hace que `auth.py` verifique con su llave pública en lugar del JWKS real."""
    return ec.generate_private_key(ec.SECP256R1())


@pytest.fixture
def make_token(jwt_private_key: ec.EllipticCurvePrivateKey) -> Callable[..., str]:
    """JWT con los claims que emite Supabase Auth (AUTH §2). `overrides` cambia o agrega claims,
    p. ej. `exp` en el pasado para probar un token vencido."""

    def _make(subject: uuid.UUID, **overrides: Any) -> str:
        now = datetime.now(timezone.utc)
        claims: dict[str, Any] = {
            "sub": str(subject),
            "aud": "authenticated",
            "iss": f"{TEST_SUPABASE_URL}/auth/v1",
            "role": "authenticated",
            "iat": now,
            "exp": now + timedelta(hours=1),
        }
        claims.update(overrides)
        return jwt.encode(claims, jwt_private_key, algorithm="ES256", headers={"kid": "test-key"})

    return _make


@pytest.fixture
def admin_token(make_profile: Callable[..., Profile], make_token: Callable[..., str]) -> str:
    return make_token(make_profile(role=UserRole.ADMIN).id)


@pytest.fixture
def inspector_token(make_profile: Callable[..., Profile], make_token: Callable[..., str]) -> str:
    return make_token(make_profile(role=UserRole.INSPECTOR).id)


@pytest.fixture
def inactive_token(make_profile: Callable[..., Profile], make_token: Callable[..., str]) -> str:
    return make_token(make_profile(role=UserRole.INSPECTOR, is_active=False).id)


@dataclass
class FakeSupabaseAdmin:
    """Doble en memoria de la Admin API de Supabase (AUTH §3). Sin red.

    `fail_next_create` simula un error de Supabase para probar la compensación (RF-01-04)."""

    users: dict[uuid.UUID, dict[str, Any]] = field(default_factory=dict)
    fail_next_create: bool = False

    def create_user(self, email: str, password: str) -> uuid.UUID:
        if self.fail_next_create:
            self.fail_next_create = False
            raise RuntimeError("Fallo simulado de la Admin API")
        user_id = uuid.uuid4()
        self.users[user_id] = {"email": email, "banned": False}
        return user_id

    def set_banned(self, user_id: uuid.UUID, banned: bool) -> None:
        self.users[user_id]["banned"] = banned

    def delete_user(self, user_id: uuid.UUID) -> None:
        self.users.pop(user_id, None)


@pytest.fixture
def fake_supabase_admin() -> FakeSupabaseAdmin:
    """Instancia nueva por prueba. T-13a la conecta en lugar del cliente real de la Admin API."""
    return FakeSupabaseAdmin()


# ---------------------------------------------------------------------------
# Fixtures agregadas por otras tareas: van debajo de esta línea
# ---------------------------------------------------------------------------
