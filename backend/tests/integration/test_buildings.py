"""RF-02-01 a RF-02-03 y RF-04-03: API de edificaciones (RN-01, RN-03, RN-08)."""

import uuid
from collections.abc import Callable
from datetime import datetime, timezone
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.enums import Sector, Sticker, UserRole
from app.models import Building, Inspection, Profile


def building_payload(**overrides: Any) -> dict[str, Any]:
    """Cuerpo válido de `POST /api/buildings` (API §3.3); cada prueba cambia lo que le importa."""
    payload: dict[str, Any] = {
        "cadastral_code": "760010100000000010001000000000",
        "address": "Cra 1 # 2-3",
        "comuna": 3,
        "neighborhood": "San Antonio",
        "sector": "housing",
        "floors": 2,
    }
    payload.update(overrides)
    return payload


def count_buildings(db_session: Session) -> int:
    return db_session.scalar(select(func.count()).select_from(Building))


# ---------------------------------------------------------------------------
# POST /api/buildings — RF-02-02
# ---------------------------------------------------------------------------


def test_create_building_valid_data_returns_201_without_sticker(
    client: TestClient, as_user: Callable[..., Profile]
) -> None:
    """RF-02-02 CA-3 / RN-08: coberturas en "No" por defecto; RF-02-05 CA-2: sin inspeccionar."""
    as_user()

    response = client.post("/api/buildings", json=building_payload())

    assert response.status_code == 201
    body = response.json()
    assert body["cadastral_code"] == "760010100000000010001000000000"
    assert (body["is_insured"], body["has_mortgage"], body["has_leasing"]) == (False, False, False)
    assert body["current_sticker"] is None
    assert body["last_inspection_at"] is None
    uuid.UUID(body["id"])


def test_create_building_as_admin_returns_201(
    client: TestClient, as_user: Callable[..., Profile]
) -> None:
    as_user(UserRole.ADMIN)

    response = client.post("/api/buildings", json=building_payload())

    assert response.status_code == 201


@pytest.mark.parametrize(
    "coverage",
    [
        {"is_insured": True, "has_mortgage": False, "has_leasing": False},
        {"is_insured": False, "has_mortgage": True, "has_leasing": True},
        {"is_insured": True, "has_mortgage": True, "has_leasing": True},
    ],
)
def test_create_building_coverage_flags_are_independent(
    client: TestClient, as_user: Callable[..., Profile], coverage: dict[str, bool]
) -> None:
    """RN-08: asegurada, hipoteca y leasing se guardan cada una por su lado."""
    as_user()

    response = client.post("/api/buildings", json=building_payload(**coverage))

    assert response.status_code == 201
    assert {key: response.json()[key] for key in coverage} == coverage


def test_create_building_duplicate_cadastral_code_returns_409(
    client: TestClient,
    as_user: Callable[..., Profile],
    make_building: Callable[..., Building],
    db_session: Session,
) -> None:
    """RN-01: el código catastral es único; el duplicado no se crea."""
    as_user()
    make_building(cadastral_code="760010100000000010001000000000")

    response = client.post("/api/buildings", json=building_payload())

    assert response.status_code == 409
    assert response.json() == {"detail": "Ya existe una edificación con ese código catastral."}
    assert count_buildings(db_session) == 1


def test_create_building_duplicate_with_surrounding_spaces_returns_409(
    client: TestClient, as_user: Callable[..., Profile], make_building: Callable[..., Building]
) -> None:
    """RN-01: los espacios al inicio o al final no crean un código distinto."""
    as_user()
    make_building(cadastral_code="76001ABC")

    response = client.post("/api/buildings", json=building_payload(cadastral_code="  76001ABC "))

    assert response.status_code == 409


def test_create_building_session_usable_after_conflict(
    client: TestClient, as_user: Callable[..., Profile], make_building: Callable[..., Building]
) -> None:
    """Tras un 409 la sesión sigue sirviendo: el savepoint solo deshace el intento fallido."""
    as_user()
    make_building(cadastral_code="76001DUP")
    client.post("/api/buildings", json=building_payload(cadastral_code="76001DUP"))

    response = client.post("/api/buildings", json=building_payload(cadastral_code="76001NEW"))

    assert response.status_code == 201


@pytest.mark.parametrize("floors", [0, -1, 1.5, "dos", 40000])
def test_create_building_invalid_floors_returns_422(
    client: TestClient, as_user: Callable[..., Profile], floors: Any
) -> None:
    """RF-02-02 CA-4: número de pisos entero ≥ 1."""
    as_user()

    response = client.post("/api/buildings", json=building_payload(floors=floors))

    assert response.status_code == 422


def test_create_building_one_floor_returns_201(
    client: TestClient, as_user: Callable[..., Profile]
) -> None:
    """RF-02-02 CA-4: el límite inferior (1) es válido."""
    as_user()

    response = client.post("/api/buildings", json=building_payload(floors=1))

    assert response.status_code == 201


@pytest.mark.parametrize("comuna", [0, 1, 22])
def test_create_building_valid_comuna_limits_returns_201(
    client: TestClient, as_user: Callable[..., Profile], comuna: int
) -> None:
    """DATA-MODEL §2: comunas 1..22 y 0 = Rural."""
    as_user()

    response = client.post("/api/buildings", json=building_payload(comuna=comuna))

    assert response.status_code == 201


@pytest.mark.parametrize("comuna", [-1, 23])
def test_create_building_comuna_out_of_range_returns_422(
    client: TestClient, as_user: Callable[..., Profile], comuna: int
) -> None:
    as_user()

    response = client.post("/api/buildings", json=building_payload(comuna=comuna))

    assert response.status_code == 422


@pytest.mark.parametrize(
    "field", ["cadastral_code", "address", "comuna", "neighborhood", "sector", "floors"]
)
def test_create_building_missing_required_field_returns_422(
    client: TestClient, as_user: Callable[..., Profile], field: str
) -> None:
    """RF-02-02 CA-1: todos los campos obligatorios se validan en el backend."""
    as_user()
    payload = building_payload()
    del payload[field]

    response = client.post("/api/buildings", json=payload)

    assert response.status_code == 422


@pytest.mark.parametrize("field", ["cadastral_code", "address", "neighborhood"])
def test_create_building_blank_text_returns_422(
    client: TestClient, as_user: Callable[..., Profile], field: str
) -> None:
    """RF-02-02 CA-1: un texto de solo espacios no cuenta como diligenciado."""
    as_user()

    response = client.post("/api/buildings", json=building_payload(**{field: "   "}))

    assert response.status_code == 422


def test_create_building_unknown_sector_returns_422(
    client: TestClient, as_user: Callable[..., Profile]
) -> None:
    as_user()

    response = client.post("/api/buildings", json=building_payload(sector="industrial"))

    assert response.status_code == 422


def test_create_building_with_sticker_returns_422(
    client: TestClient, as_user: Callable[..., Profile], db_session: Session
) -> None:
    """RN-03: el sticker solo se asigna registrando una inspección."""
    as_user()

    response = client.post("/api/buildings", json=building_payload(current_sticker="red"))

    assert response.status_code == 422
    assert count_buildings(db_session) == 0


@pytest.mark.xfail(
    strict=True,
    reason="Pendiente de T-05: hoy get_current_user responde 403 a toda petición sin override",
)
def test_create_building_without_token_returns_401(client: TestClient) -> None:
    """RN-10 / API §1: sin token → 401. Al fusionar T-05 esta prueba pasa y se quita el xfail."""
    response = client.post("/api/buildings", json=building_payload())

    assert response.status_code == 401


def test_create_building_without_user_is_rejected(client: TestClient, db_session: Session) -> None:
    """RN-10: sin usuario autenticado no se crea nada (el código exacto lo fija T-05)."""
    response = client.post("/api/buildings", json=building_payload())

    assert response.status_code in (401, 403)
    assert count_buildings(db_session) == 0


# ---------------------------------------------------------------------------
# GET /api/buildings/lookup — RF-02-01
# ---------------------------------------------------------------------------


def test_lookup_building_existing_code_returns_building(
    client: TestClient, as_user: Callable[..., Profile], make_building: Callable[..., Building]
) -> None:
    """RF-02-01 CA-1: si el código existe, devuelve la edificación."""
    as_user()
    building = make_building(cadastral_code="76001LOOKUP")

    response = client.get("/api/buildings/lookup", params={"cadastral_code": "76001LOOKUP"})

    assert response.status_code == 200
    assert response.json()["id"] == str(building.id)


def test_lookup_building_strips_spaces(
    client: TestClient, as_user: Callable[..., Profile], make_building: Callable[..., Building]
) -> None:
    as_user()
    building = make_building(cadastral_code="76001LOOKUP")

    response = client.get("/api/buildings/lookup", params={"cadastral_code": " 76001LOOKUP "})

    assert response.json()["id"] == str(building.id)


def test_lookup_building_partial_code_returns_404(
    client: TestClient, as_user: Callable[..., Profile], make_building: Callable[..., Building]
) -> None:
    """RF-02-01 / API §2: coincidencia exacta, no parcial."""
    as_user()
    make_building(cadastral_code="76001LOOKUP")

    response = client.get("/api/buildings/lookup", params={"cadastral_code": "76001"})

    assert response.status_code == 404


def test_lookup_building_unknown_code_returns_404(
    client: TestClient, as_user: Callable[..., Profile]
) -> None:
    """RF-02-01 CA-2: si no existe, 404 (la interfaz ofrece crearla)."""
    as_user()

    response = client.get("/api/buildings/lookup", params={"cadastral_code": "NO-EXISTE"})

    assert response.status_code == 404
    assert response.json() == {"detail": "No existe una edificación con ese código catastral."}


def test_lookup_building_without_code_returns_422(
    client: TestClient, as_user: Callable[..., Profile]
) -> None:
    as_user()

    response = client.get("/api/buildings/lookup")

    assert response.status_code == 422


# ---------------------------------------------------------------------------
# GET /api/buildings/{id} — RF-04-03 (ficha)
# ---------------------------------------------------------------------------


def test_get_building_without_inspections_returns_empty_history(
    client: TestClient, as_user: Callable[..., Profile], make_building: Callable[..., Building]
) -> None:
    """RF-02-05 CA-2: sin inspecciones, sticker vigente nulo e historial vacío."""
    as_user()
    building = make_building()

    response = client.get(f"/api/buildings/{building.id}")

    assert response.status_code == 200
    body = response.json()
    assert body["cadastral_code"] == building.cadastral_code
    assert body["current_sticker"] is None
    assert body["inspections"] == []


def test_get_building_history_is_newest_first_with_inspector(
    client: TestClient,
    as_user: Callable[..., Profile],
    make_building: Callable[..., Building],
    make_profile: Callable[..., Profile],
    make_inspection: Callable[..., Inspection],
) -> None:
    """RF-02-05 CA-1 y CA-3: historial descendente con fecha, inspector, color y observaciones."""
    as_user()
    building = make_building()
    inspector = make_profile(full_name="Inspectora Ficticia")
    make_inspection(
        building=building,
        inspector=inspector,
        sticker=Sticker.RED,
        inspected_at=datetime(2026, 9, 1, tzinfo=timezone.utc),
        notes="Grietas en fachada",
    )
    make_inspection(
        building=building,
        inspector=inspector,
        sticker=Sticker.YELLOW,
        inspected_at=datetime(2026, 10, 1, tzinfo=timezone.utc),
    )
    make_inspection(
        building=building,
        inspector=inspector,
        sticker=Sticker.GREEN,
        inspected_at=datetime(2026, 8, 20, tzinfo=timezone.utc),
    )

    response = client.get(f"/api/buildings/{building.id}")

    body = response.json()
    assert body["current_sticker"] == "yellow"
    assert [i["sticker"] for i in body["inspections"]] == ["yellow", "red", "green"]
    oldest_red = body["inspections"][1]
    assert oldest_red["notes"] == "Grietas en fachada"
    assert oldest_red["inspector"] == {"id": str(inspector.id), "full_name": "Inspectora Ficticia"}


def test_get_building_unknown_id_returns_404(
    client: TestClient, as_user: Callable[..., Profile]
) -> None:
    as_user()

    response = client.get(f"/api/buildings/{uuid.uuid4()}")

    assert response.status_code == 404
    assert response.json() == {"detail": "La edificación no existe."}


def test_get_building_invalid_id_returns_422(
    client: TestClient, as_user: Callable[..., Profile]
) -> None:
    as_user()

    response = client.get("/api/buildings/no-es-un-uuid")

    assert response.status_code == 422


# ---------------------------------------------------------------------------
# PATCH /api/buildings/{id} — RF-02-03
# ---------------------------------------------------------------------------


def test_update_building_changes_only_sent_fields(
    client: TestClient, as_user: Callable[..., Profile], make_building: Callable[..., Building]
) -> None:
    """RF-02-03 CA-1: se editan los campos enviados; el resto se conserva."""
    as_user()
    building = make_building(address="Calle Vieja", floors=2, sector=Sector.HOUSING)

    response = client.patch(
        f"/api/buildings/{building.id}",
        json={"address": "Calle Nueva # 4-5", "floors": 5, "sector": "health"},
    )

    assert response.status_code == 200
    body = response.json()
    assert (body["address"], body["floors"], body["sector"]) == ("Calle Nueva # 4-5", 5, "health")
    assert body["neighborhood"] == building.neighborhood
    assert body["cadastral_code"] == building.cadastral_code


def test_update_building_coverage_flags_are_independent(
    client: TestClient, as_user: Callable[..., Profile], make_building: Callable[..., Building]
) -> None:
    """RN-08: cambiar una cobertura no toca las otras."""
    as_user()
    building = make_building(is_insured=True, has_mortgage=False, has_leasing=True)

    response = client.patch(f"/api/buildings/{building.id}", json={"has_mortgage": True})

    body = response.json()
    assert (body["is_insured"], body["has_mortgage"], body["has_leasing"]) == (True, True, True)


def test_update_building_cadastral_code_returns_422_and_keeps_code(
    client: TestClient,
    as_user: Callable[..., Profile],
    make_building: Callable[..., Building],
    db_session: Session,
) -> None:
    """RF-02-03 CA-1: el código catastral no es editable."""
    as_user()
    building = make_building(cadastral_code="76001ORIGINAL")

    response = client.patch(f"/api/buildings/{building.id}", json={"cadastral_code": "76001OTRO"})

    assert response.status_code == 422
    db_session.refresh(building)
    assert building.cadastral_code == "76001ORIGINAL"


@pytest.mark.parametrize("field", ["current_sticker", "last_inspection_at"])
def test_update_building_sticker_fields_return_422(
    client: TestClient,
    as_user: Callable[..., Profile],
    make_building: Callable[..., Building],
    field: str,
) -> None:
    """RF-02-03 CA-2 / RN-03: el sticker no se edita desde la edificación."""
    as_user()
    building = make_building()
    value = "red" if field == "current_sticker" else "2026-10-01T00:00:00Z"

    response = client.patch(f"/api/buildings/{building.id}", json={field: value})

    assert response.status_code == 422


@pytest.mark.parametrize(
    "changes", [{"floors": 0}, {"comuna": 23}, {"address": "  "}, {"sector": "industrial"}]
)
def test_update_building_invalid_value_returns_422(
    client: TestClient,
    as_user: Callable[..., Profile],
    make_building: Callable[..., Building],
    changes: dict[str, Any],
) -> None:
    """RF-02-03: al editar se aplican las mismas validaciones que al crear."""
    as_user()
    building = make_building()

    response = client.patch(f"/api/buildings/{building.id}", json=changes)

    assert response.status_code == 422


@pytest.mark.parametrize("field", ["address", "floors", "is_insured"])
def test_update_building_null_field_returns_422(
    client: TestClient,
    as_user: Callable[..., Profile],
    make_building: Callable[..., Building],
    field: str,
) -> None:
    """Un campo obligatorio puede omitirse en el PATCH, pero no enviarse en `null`."""
    as_user()
    building = make_building()

    response = client.patch(f"/api/buildings/{building.id}", json={field: None})

    assert response.status_code == 422


def test_update_building_unknown_id_returns_404(
    client: TestClient, as_user: Callable[..., Profile]
) -> None:
    as_user()

    response = client.patch(f"/api/buildings/{uuid.uuid4()}", json={"floors": 3})

    assert response.status_code == 404
