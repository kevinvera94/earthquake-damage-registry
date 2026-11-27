"""MOD-03: API de personas ocupantes (RF-03-01 a RF-03-04, RN-05 a RN-07)."""

import uuid
from collections.abc import Callable
from datetime import date, timedelta
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.enums import DocumentType, UserRole
from app.models import Building, Person, Profile
from app.services.ages import today_colombia
from app.services.people import normalize_name


def _payload(**overrides: Any) -> dict[str, Any]:
    values: dict[str, Any] = {
        "first_names": "Ana María",
        "last_names": "Pérez Gómez",
        "document_type": "cc",
        "document_number": "1000000001",
        "tenure": "tenant",
        "birth_date": "1958-03-14",
        "special_conditions": ["disability"],
        "population_type": "civilian",
    }
    values.update(overrides)
    return values


def _years_ago(years: int) -> str:
    today = today_colombia()
    return today.replace(year=today.year - years, day=min(today.day, 28)).isoformat()


@pytest.fixture
def inspector(as_user: Callable[..., Profile]) -> Profile:
    return as_user()


# ---------------------------------------------------------------------------
# POST /api/buildings/{id}/people
# ---------------------------------------------------------------------------


def test_create_person_valid_returns_201_with_age_and_range(
    client: TestClient, inspector: Profile, make_building: Callable[..., Building]
) -> None:
    """RF-03-01 y RN-07: la respuesta trae `age` y `age_range` calculados."""
    building = make_building()

    response = client.post(f"/api/buildings/{building.id}/people", json=_payload())

    assert response.status_code == 201
    body = response.json()
    assert body["building_id"] == str(building.id)
    assert body["first_names"] == "Ana María"
    assert body["special_conditions"] == ["disability"]
    birth = date(1958, 3, 14)
    today = today_colombia()
    expected_age = today.year - 1958 - ((today.month, today.day) < (birth.month, birth.day))
    assert body["age"] == expected_age
    assert body["age_range"] == "60+"
    assert "normalized_name" not in body


def test_create_person_stores_normalized_name(
    client: TestClient,
    inspector: Profile,
    make_building: Callable[..., Building],
    db_session: Session,
) -> None:
    """RN-06: el backend calcula `normalized_name` (DATA-MODEL §3)."""
    building = make_building()

    response = client.post(f"/api/buildings/{building.id}/people", json=_payload())

    person = db_session.get(Person, uuid.UUID(response.json()["id"]))
    assert person is not None
    assert person.normalized_name == "ana maria perez gomez"


def test_create_person_defaults_civilian_and_no_conditions(
    client: TestClient, inspector: Profile, make_building: Callable[..., Building]
) -> None:
    """RF-03-01 CA-3 y CA-4: "Ninguna" es la lista vacía y la población por defecto es Civil."""
    payload = _payload()
    del payload["special_conditions"], payload["population_type"]

    response = client.post(f"/api/buildings/{make_building().id}/people", json=payload)

    assert response.status_code == 201
    assert response.json()["special_conditions"] == []
    assert response.json()["population_type"] == "civilian"


def test_create_person_repeated_conditions_are_stored_once(
    client: TestClient, inspector: Profile, make_building: Callable[..., Building]
) -> None:
    payload = _payload(special_conditions=["vulnerable", "disability", "vulnerable"])

    response = client.post(f"/api/buildings/{make_building().id}/people", json=payload)

    assert response.json()["special_conditions"] == ["vulnerable", "disability"]


@pytest.mark.parametrize(
    ("years", "expected_range"),
    [(9, "0-9"), (10, "10-17"), (17, "10-17"), (18, "18-59"), (59, "18-59"), (60, "60+")],
)
def test_create_person_age_limits_return_expected_range(
    client: TestClient,
    inspector: Profile,
    make_building: Callable[..., Building],
    years: int,
    expected_range: str,
) -> None:
    """RN-07 / RF-03-03 CA-3: límites 9, 10, 17, 18, 59 y 60 años."""
    payload = _payload(birth_date=_years_ago(years))

    response = client.post(f"/api/buildings/{make_building().id}/people", json=payload)

    assert response.status_code == 201
    assert response.json()["age"] == years
    assert response.json()["age_range"] == expected_range


def test_create_person_duplicate_document_returns_409(
    client: TestClient,
    inspector: Profile,
    make_building: Callable[..., Building],
    make_person: Callable[..., Person],
) -> None:
    """RN-06 / RF-03-02 CA-1: mismo tipo y número en la misma edificación."""
    building = make_building()
    make_person(building=building, document_type=DocumentType.CC, document_number="1000000001")

    response = client.post(
        f"/api/buildings/{building.id}/people",
        json=_payload(first_names="Otro", last_names="Nombre"),
    )

    assert response.status_code == 409
    assert "documento" in response.json()["detail"]


def test_create_person_without_document_duplicate_name_ignoring_case_and_accents_returns_409(
    client: TestClient, inspector: Profile, make_building: Callable[..., Building]
) -> None:
    """RN-06 / RF-03-02 CA-2: sin documento se compara nombre normalizado + fecha de
    nacimiento."""
    building = make_building()
    first = _payload(document_type="none", document_number=None)
    client.post(f"/api/buildings/{building.id}/people", json=first)

    response = client.post(
        f"/api/buildings/{building.id}/people",
        json=_payload(
            first_names="  ANA   MARIA ",
            last_names="perez gomez",
            document_type="none",
            document_number=None,
        ),
    )

    assert response.status_code == 409
    assert "sin documento" in response.json()["detail"]


def test_create_person_without_document_same_name_other_birth_date_returns_201(
    client: TestClient, inspector: Profile, make_building: Callable[..., Building]
) -> None:
    building = make_building()
    no_doc = {"document_type": "none", "document_number": None}
    client.post(f"/api/buildings/{building.id}/people", json=_payload(**no_doc))

    response = client.post(
        f"/api/buildings/{building.id}/people",
        json=_payload(birth_date="1990-01-01", **no_doc),
    )

    assert response.status_code == 201


def test_create_person_same_document_other_building_returns_201(
    client: TestClient,
    inspector: Profile,
    make_building: Callable[..., Building],
    make_person: Callable[..., Person],
) -> None:
    """RN-06 / RF-03-02 CA-3: la misma persona puede estar en edificaciones distintas."""
    make_person(document_type=DocumentType.CC, document_number="1000000001")

    response = client.post(f"/api/buildings/{make_building().id}/people", json=_payload())

    assert response.status_code == 201


def test_create_person_same_number_other_document_type_returns_201(
    client: TestClient,
    inspector: Profile,
    make_building: Callable[..., Building],
    make_person: Callable[..., Person],
) -> None:
    """RN-06 compara tipo **y** número."""
    building = make_building()
    make_person(building=building, document_type=DocumentType.CC, document_number="1000000001")

    response = client.post(
        f"/api/buildings/{building.id}/people", json=_payload(document_type="ti")
    )

    assert response.status_code == 201


def test_create_person_conflict_keeps_other_pending_data(
    client: TestClient,
    inspector: Profile,
    make_building: Callable[..., Building],
    make_person: Callable[..., Person],
    db_session: Session,
) -> None:
    """El 409 solo deshace el intento fallido (savepoint), no la persona ya guardada."""
    building = make_building()
    existing = make_person(building=building, document_number="1000000001")

    client.post(f"/api/buildings/{building.id}/people", json=_payload())

    assert db_session.get(Person, existing.id) is not None


@pytest.mark.parametrize(
    "overrides",
    [
        {"document_type": "none", "document_number": "123"},
        {"document_type": "cc", "document_number": None},
        {"document_type": "cc", "document_number": "   "},
    ],
    ids=["sin-documento-con-numero", "cc-sin-numero", "cc-numero-en-blanco"],
)
def test_create_person_document_number_mismatch_returns_422(
    client: TestClient,
    inspector: Profile,
    make_building: Callable[..., Building],
    overrides: dict[str, Any],
) -> None:
    """RF-03-01 CA-2: "Sin documento" no lleva número; los demás tipos lo exigen."""
    response = client.post(
        f"/api/buildings/{make_building().id}/people", json=_payload(**overrides)
    )

    assert response.status_code == 422


def test_create_person_future_birth_date_returns_422(
    client: TestClient, inspector: Profile, make_building: Callable[..., Building]
) -> None:
    """RF-03-01 CA-5: la fecha de nacimiento no puede ser futura."""
    tomorrow = (today_colombia() + timedelta(days=1)).isoformat()

    response = client.post(
        f"/api/buildings/{make_building().id}/people", json=_payload(birth_date=tomorrow)
    )

    assert response.status_code == 422


def test_create_person_born_today_returns_201(
    client: TestClient, inspector: Profile, make_building: Callable[..., Building]
) -> None:
    response = client.post(
        f"/api/buildings/{make_building().id}/people",
        json=_payload(birth_date=today_colombia().isoformat()),
    )

    assert response.status_code == 201
    assert response.json()["age"] == 0


def test_create_person_blank_name_returns_422(
    client: TestClient, inspector: Profile, make_building: Callable[..., Building]
) -> None:
    response = client.post(
        f"/api/buildings/{make_building().id}/people", json=_payload(first_names="   ")
    )

    assert response.status_code == 422


def test_create_person_unknown_building_returns_404(client: TestClient, inspector: Profile) -> None:
    response = client.post(f"/api/buildings/{uuid.uuid4()}/people", json=_payload())

    assert response.status_code == 404


def test_create_person_without_user_returns_403(
    client: TestClient, make_building: Callable[..., Building]
) -> None:
    """RN-10: sin usuario autenticado no se registra nada (hasta T-05, `get_current_user`
    rechaza toda petición)."""
    response = client.post(f"/api/buildings/{make_building().id}/people", json=_payload())

    assert response.status_code == 403


def test_create_person_as_admin_returns_201(
    client: TestClient, as_user: Callable[..., Profile], make_building: Callable[..., Building]
) -> None:
    """API §2: inspector y admin pueden registrar personas."""
    as_user(UserRole.ADMIN)

    response = client.post(f"/api/buildings/{make_building().id}/people", json=_payload())

    assert response.status_code == 201


# ---------------------------------------------------------------------------
# PATCH /api/people/{id}
# ---------------------------------------------------------------------------


def test_update_person_partial_changes_only_sent_fields(
    client: TestClient, inspector: Profile, make_person: Callable[..., Person]
) -> None:
    """RF-03-04 CA-1."""
    person = make_person(tenure="owner", birth_date=date(1985, 6, 15))

    response = client.patch(f"/api/people/{person.id}", json={"tenure": "tenant"})

    assert response.status_code == 200
    assert response.json()["tenure"] == "tenant"
    assert response.json()["birth_date"] == "1985-06-15"


def test_update_person_name_recomputes_normalized_name(
    client: TestClient,
    inspector: Profile,
    make_person: Callable[..., Person],
    db_session: Session,
) -> None:
    person = make_person()

    client.patch(f"/api/people/{person.id}", json={"first_names": "José", "last_names": "Ñuñez"})

    db_session.refresh(person)
    assert person.normalized_name == normalize_name("Jose", "Nunez")


def test_update_person_into_duplicate_returns_409(
    client: TestClient,
    inspector: Profile,
    make_building: Callable[..., Building],
    make_person: Callable[..., Person],
    db_session: Session,
) -> None:
    """RN-06 también al editar; la persona editada queda como estaba."""
    building = make_building()
    make_person(building=building, document_number="111")
    other = make_person(building=building, document_number="222")

    response = client.patch(f"/api/people/{other.id}", json={"document_number": "111"})

    assert response.status_code == 409
    db_session.refresh(other)
    assert other.document_number == "222"


def test_update_person_to_without_document_clears_number(
    client: TestClient, inspector: Profile, make_person: Callable[..., Person]
) -> None:
    """RF-03-01 CA-2: al pasar a "Sin documento" el número se borra."""
    person = make_person(document_number="1000000001")

    response = client.patch(f"/api/people/{person.id}", json={"document_type": "none"})

    assert response.status_code == 200
    assert response.json()["document_number"] is None


@pytest.mark.parametrize(
    "changes",
    [{"document_type": "none", "document_number": "123"}],
    ids=["sin-documento-con-numero"],
)
def test_update_person_document_mismatch_returns_400(
    client: TestClient,
    inspector: Profile,
    make_person: Callable[..., Person],
    changes: dict[str, Any],
) -> None:
    """RF-03-01 CA-2 sobre el resultado de la edición."""
    person = make_person()

    response = client.patch(f"/api/people/{person.id}", json=changes)

    assert response.status_code == 400


def test_update_person_without_document_to_cc_without_number_returns_400(
    client: TestClient, inspector: Profile, make_person: Callable[..., Person]
) -> None:
    person = make_person(document_type=DocumentType.NONE, document_number=None)

    response = client.patch(f"/api/people/{person.id}", json={"document_type": "cc"})

    assert response.status_code == 400


@pytest.mark.parametrize("field", ["first_names", "tenure", "birth_date", "special_conditions"])
def test_update_person_null_required_field_returns_422(
    client: TestClient, inspector: Profile, make_person: Callable[..., Person], field: str
) -> None:
    person = make_person()

    response = client.patch(f"/api/people/{person.id}", json={field: None})

    assert response.status_code == 422


def test_update_person_future_birth_date_returns_422(
    client: TestClient, inspector: Profile, make_person: Callable[..., Person]
) -> None:
    """RF-03-01 CA-5 también al editar (RF-03-04 CA-1)."""
    tomorrow = (today_colombia() + timedelta(days=1)).isoformat()

    response = client.patch(f"/api/people/{make_person().id}", json={"birth_date": tomorrow})

    assert response.status_code == 422


def test_update_person_unknown_returns_404(client: TestClient, inspector: Profile) -> None:
    response = client.patch(f"/api/people/{uuid.uuid4()}", json={"tenure": "owner"})

    assert response.status_code == 404


# ---------------------------------------------------------------------------
# DELETE /api/people/{id}
# ---------------------------------------------------------------------------


def test_delete_person_returns_204_and_removes_it(
    client: TestClient,
    inspector: Profile,
    make_person: Callable[..., Person],
    db_session: Session,
) -> None:
    """RF-03-04 CA-2."""
    person = make_person()
    person_id = person.id

    response = client.delete(f"/api/people/{person_id}")

    assert response.status_code == 204
    assert response.content == b""
    db_session.expire_all()
    assert db_session.get(Person, person_id) is None


def test_delete_person_unknown_returns_404(client: TestClient, inspector: Profile) -> None:
    response = client.delete(f"/api/people/{uuid.uuid4()}")

    assert response.status_code == 404


def test_create_person_building_deleted_meanwhile_returns_404(
    client: TestClient,
    inspector: Profile,
    make_building: Callable[..., Building],
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Si la edificación desaparece entre la comprobación y la inserción, la FK responde 404,
    no 500."""
    from app.services import people as people_service

    building = make_building()
    real_get = db_session.get

    def _get_and_delete(entity: Any, ident: Any) -> Any:
        found = real_get(entity, ident)
        if entity is Building:
            db_session.delete(found)
            db_session.flush()
        return found

    monkeypatch.setattr(people_service.Session, "get", lambda self, e, i: _get_and_delete(e, i))

    response = client.post(f"/api/buildings/{building.id}/people", json=_payload())

    assert response.status_code == 404
