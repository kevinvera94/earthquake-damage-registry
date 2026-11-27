"""RF-04-04 / RN-11: PDF de la ficha de una edificación (TESTING §2.5, `test_pdf`)."""

import base64
import re
import uuid
import zlib
from collections.abc import Callable
from datetime import date, datetime, timezone

import pytest
from fastapi.testclient import TestClient

from app.enums import DocumentType, SpecialCondition, Sticker, UserRole
from app.models import Building, Inspection, Person, Profile
from app.pdf import pdf_filename, render_building_pdf


def _pdf_text(content: bytes) -> str:
    """Texto aproximado del PDF: decodifica los *streams* (ReportLab usa ASCII85 + Flate) y une
    sus cadenas `( ... )`. Basta para buscar frases sin agregar una librería de lectura de PDF."""
    chunks: list[str] = []
    for raw in re.findall(rb"stream\r?\n(.*?)~>\s*endstream", content, re.S):
        try:
            data = zlib.decompress(base64.a85decode(raw))
        except (ValueError, zlib.error):
            continue
        chunks += [s.decode("latin-1") for s in re.findall(rb"\((.*?)(?<!\\)\)", data, re.S)]
    return " ".join(chunks)


@pytest.fixture
def inspector(as_user: Callable[..., Profile]) -> Profile:
    return as_user(full_name="Inspectora Ficticia Uno")


def test_pdf_returns_pdf_attachment_with_rf_04_04_filename(
    client: TestClient, inspector: Profile, make_building: Callable[..., Building]
) -> None:
    """RF-04-04 CA-3: `edificacion-<codigo-catastral>-<AAAAMMDD>.pdf`."""
    building = make_building(cadastral_code="760010100000000010001000000000")

    response = client.get(f"/api/buildings/{building.id}/pdf")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")
    assert re.fullmatch(
        r'attachment; filename="edificacion-760010100000000010001000000000-\d{8}\.pdf"',
        response.headers["content-disposition"],
    )


def test_pdf_without_inspections_or_people_says_no_records(
    client: TestClient, inspector: Profile, make_building: Callable[..., Building]
) -> None:
    """RF-04-04 CA-4: secciones vacías con "Sin registros"."""
    response = client.get(f"/api/buildings/{make_building().id}/pdf")

    text = _pdf_text(response.content)
    assert text.count("Sin registros") == 2
    assert "Sin inspeccionar" in text


def test_pdf_includes_generation_user_and_demo_notice(
    client: TestClient, inspector: Profile, make_building: Callable[..., Building]
) -> None:
    """RF-04-04 CA-2 / RN-11: fecha-hora de generación, usuario y aviso de datos ficticios."""
    response = client.get(f"/api/buildings/{make_building().id}/pdf")

    text = _pdf_text(response.content)
    assert "Datos ficticios con fines acad" in text
    assert "Inspectora Ficticia Uno" in text
    assert re.search(r"Generado el \d{2}/\d{2}/\d{4} \d{2}:\d{2}", text)


def test_pdf_includes_history_and_people(
    client: TestClient,
    inspector: Profile,
    make_building: Callable[..., Building],
    make_inspection: Callable[..., Inspection],
    make_person: Callable[..., Person],
    make_profile: Callable[..., Profile],
) -> None:
    """BRIEF §11.3: historial de inspecciones y personas ocupantes."""
    building = make_building()
    make_inspection(
        building=building,
        inspector=make_profile(full_name="Inspector Historial"),
        sticker=Sticker.YELLOW,
        notes="Grietas en fachada",
        inspected_at=datetime(2026, 9, 1, 15, 0, tzinfo=timezone.utc),
    )
    make_person(
        building=building,
        first_names="Persona",
        last_names="Del Reporte",
        document_type=DocumentType.CC,
        document_number="1000000077",
        special_conditions=[SpecialCondition.DISABILITY],
    )

    response = client.get(f"/api/buildings/{building.id}/pdf")

    text = _pdf_text(response.content)
    assert "Sin registros" not in text
    for expected in (
        "Inspector Historial",
        "Amarillo",
        "Grietas en fachada",
        "01/09/2026 10:00",
        "Persona Del Reporte",
        "CC 1000000077",
        "Discapacidad",
    ):
        assert expected in text, expected


def test_pdf_unknown_building_returns_404(client: TestClient, inspector: Profile) -> None:
    response = client.get(f"/api/buildings/{uuid.uuid4()}/pdf")

    assert response.status_code == 404


def test_pdf_without_user_is_rejected(
    client: TestClient, make_building: Callable[..., Building]
) -> None:
    """RN-11: sin sesión no se genera. Hasta T-05, `get_current_user` responde 403; con la auth
    real, una petición sin token responderá 401 (`test_auth`)."""
    response = client.get(f"/api/buildings/{make_building().id}/pdf")

    assert response.status_code in (401, 403)
    assert not response.content.startswith(b"%PDF")


def test_pdf_as_admin_returns_200(
    client: TestClient, as_user: Callable[..., Profile], make_building: Callable[..., Building]
) -> None:
    """API §2: inspector y admin."""
    as_user(UserRole.ADMIN)

    response = client.get(f"/api/buildings/{make_building().id}/pdf")

    assert response.status_code == 200


# ---------------------------------------------------------------------------
# Lógica pura de app/pdf.py
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("now", "expected"),
    [
        (datetime(2026, 11, 27, 15, 0, tzinfo=timezone.utc), "edificacion-ABC-123-20261127.pdf"),
        # 02:00 UTC del 28-nov = 21:00 del 27-nov en Colombia
        (datetime(2026, 11, 28, 2, 0, tzinfo=timezone.utc), "edificacion-ABC-123-20261127.pdf"),
    ],
)
def test_pdf_filename_uses_colombia_date(now: datetime, expected: str) -> None:
    assert pdf_filename("ABC-123", now) == expected


def test_pdf_filename_removes_unsafe_characters() -> None:
    """El nombre va en la cabecera `Content-Disposition`: sin comillas, barras ni espacios."""
    now = datetime(2026, 11, 27, 15, 0, tzinfo=timezone.utc)

    assert pdf_filename('7600 1"/../x', now) == "edificacion-76001x-20261127.pdf"


def test_render_pdf_escapes_user_text(
    make_building: Callable[..., Building],
    make_profile: Callable[..., Profile],
    make_inspection: Callable[..., Inspection],
) -> None:
    """Las observaciones con `<` o `&` no rompen el PDF (ReportLab las tomaría como marcado)."""
    building = make_building()
    inspection = make_inspection(building=building, notes="Muro <b>caído & fisurado")

    content = render_building_pdf(
        building,
        [inspection],
        [],
        make_profile(),
        datetime(2026, 11, 27, 15, 0, tzinfo=timezone.utc),
    )

    assert "fisurado" in _pdf_text(content)


def test_render_pdf_age_is_computed_at_generation_date(
    make_building: Callable[..., Building],
    make_person: Callable[..., Person],
    make_profile: Callable[..., Profile],
) -> None:
    """RN-07: la edad del PDF se calcula a la fecha de generación (hora de Colombia)."""
    building = make_building()
    person = make_person(building=building, birth_date=date(2016, 11, 28))
    generated = datetime(2026, 11, 28, 4, 0, tzinfo=timezone.utc)  # 27-nov 23:00 en Colombia

    text = _pdf_text(render_building_pdf(building, [], [person], make_profile(), generated))

    # Cumple 10 el 28-nov: en Colombia aún es 27-nov, así que tiene 9 (la "ñ" de "Niños" va
    # escapada en el PDF, por eso se busca el resto de la etiqueta)
    assert "menores de 10" in text
    assert "y adolescentes" not in text
