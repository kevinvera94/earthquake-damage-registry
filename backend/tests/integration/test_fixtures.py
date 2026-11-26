"""Comprueba las fixtures de `conftest.py` (T-01b): si fallan, fallan todas las demás pruebas."""

from collections.abc import Callable
from datetime import datetime, timezone

import jwt
from cryptography.hazmat.primitives.asymmetric import ec

from app.auth import get_current_user
from app.enums import Sticker, UserRole
from app.main import app
from app.models import Building, Inspection, Person, Profile


def test_factories_defaults_create_valid_rows(
    make_building: Callable[..., Building],
    make_person: Callable[..., Person],
    make_inspection: Callable[..., Inspection],
) -> None:
    building = make_building()
    person = make_person(building=building)
    inspection = make_inspection(building=building)

    assert person.building_id == building.id
    assert inspection.inspector.role == UserRole.INSPECTOR
    assert building.current_sticker == inspection.sticker


def test_make_inspection_older_date_keeps_current_sticker(
    make_building: Callable[..., Building], make_inspection: Callable[..., Inspection]
) -> None:
    """RN-02: el sticker vigente es el de la inspección más reciente."""
    building = make_building()
    make_inspection(
        building=building,
        sticker=Sticker.RED,
        inspected_at=datetime(2026, 10, 1, tzinfo=timezone.utc),
    )
    make_inspection(
        building=building,
        sticker=Sticker.GREEN,
        inspected_at=datetime(2026, 9, 1, tzinfo=timezone.utc),
    )

    assert building.current_sticker == Sticker.RED


def test_as_user_overrides_current_user_with_saved_profile(
    as_user: Callable[..., Profile],
) -> None:
    profile = as_user(UserRole.ADMIN)

    assert app.dependency_overrides[get_current_user]() is profile
    assert profile.role == UserRole.ADMIN


def test_make_token_signs_es256_with_supabase_claims(
    make_profile: Callable[..., Profile],
    make_token: Callable[..., str],
    jwt_private_key: ec.EllipticCurvePrivateKey,
) -> None:
    profile = make_profile()

    claims = jwt.decode(
        make_token(profile.id),
        jwt_private_key.public_key(),
        algorithms=["ES256"],
        audience="authenticated",
    )

    assert claims["sub"] == str(profile.id)
    assert claims["iss"].endswith("/auth/v1")
