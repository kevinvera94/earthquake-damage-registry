"""PDF de la ficha de una edificación con ReportLab (RF-04-04, BRIEF §11.3, DEC-007).

`build_building_pdf` carga los datos y `render_building_pdf` dibuja el reporte. La segunda es
lógica pura: recibe `now` como parámetro para poder probarla (CODING-STANDARDS §1.2).
Los textos van en español; los valores de los enums se traducen con las etiquetas de
DATA-MODEL §2.
"""

import io
import logging
import re
import uuid
from collections.abc import Sequence
from datetime import datetime
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Table, TableStyle
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.enums import (
    AgeRange,
    DocumentType,
    PopulationType,
    Sector,
    SpecialCondition,
    Sticker,
    Tenure,
)
from app.errors import NotFoundError
from app.models import Building, Inspection, Person, Profile
from app.services.ages import COLOMBIA_TZ, age, age_range

logger = logging.getLogger(__name__)

DEMO_NOTICE = "Datos ficticios con fines académicos — no es una fuente oficial."
NO_RECORDS = "Sin registros"

SECTOR_LABELS = {
    Sector.HOUSING: "Vivienda",
    Sector.COMMERCIAL: "Comercial",
    Sector.HEALTH: "Salud",
    Sector.EDUCATION: "Educación",
    Sector.INFRASTRUCTURE: "Infraestructura",
    Sector.LOGISTICS: "Logística y suministros",
    Sector.ECONOMY: "Economía",
}
STICKER_LABELS = {Sticker.GREEN: "Verde", Sticker.YELLOW: "Amarillo", Sticker.RED: "Rojo"}
DOCUMENT_LABELS = {
    DocumentType.CC: "CC",
    DocumentType.TI: "TI",
    DocumentType.RC: "RC",
    DocumentType.CE: "CE",
    DocumentType.PASSPORT: "Pasaporte",
    DocumentType.NONE: "Sin documento",
}
TENURE_LABELS = {Tenure.OWNER: "Propietario", Tenure.TENANT: "Arrendatario"}
CONDITION_LABELS = {
    SpecialCondition.DISABILITY: "Discapacidad",
    SpecialCondition.VULNERABLE: "Persona vulnerable",
    SpecialCondition.SPECIAL_NEED: "Necesidad especial",
}
POPULATION_LABELS = {
    PopulationType.CIVILIAN: "Civil",
    PopulationType.MILITARY: "Militar",
    PopulationType.PRISON: "Carcelaria",
}
AGE_RANGE_LABELS = {
    AgeRange.CHILD: "Niños menores de 10",
    AgeRange.ADOLESCENT: "Niños y adolescentes",
    AgeRange.ADULT: "Adultos",
    AgeRange.SENIOR: "Adultos mayores",
}
STICKER_COLORS = {
    Sticker.GREEN: colors.HexColor("#1b7f3b"),
    Sticker.YELLOW: colors.HexColor("#b58a00"),
    Sticker.RED: colors.HexColor("#b3261e"),
}

_styles = getSampleStyleSheet()
_TITLE = ParagraphStyle("EdrTitle", parent=_styles["Title"], fontSize=16, spaceAfter=4)
_HEADING = ParagraphStyle("EdrHeading", parent=_styles["Heading2"], fontSize=12, spaceBefore=10)
_BODY = ParagraphStyle("EdrBody", parent=_styles["BodyText"], fontSize=9, leading=12)
_CELL = ParagraphStyle("EdrCell", parent=_BODY, fontSize=8, leading=10)
_NOTICE = ParagraphStyle(
    "EdrNotice",
    parent=_BODY,
    textColor=colors.HexColor("#7a4a00"),
    backColor=colors.HexColor("#fff4d6"),
    borderPadding=4,
    spaceAfter=8,
)


def _local(moment: datetime) -> datetime:
    return moment.astimezone(COLOMBIA_TZ)


def _format_datetime(moment: datetime) -> str:
    return _local(moment).strftime("%d/%m/%Y %H:%M")


def _yes_no(value: bool) -> str:
    return "Sí" if value else "No"


def _comuna_label(comuna: int) -> str:
    return "Rural" if comuna == 0 else f"Comuna {comuna}"


def _p(text: str, style: ParagraphStyle = _BODY) -> Paragraph:
    """Párrafo con el texto escapado: las observaciones y los nombres los escribe el usuario y
    pueden traer `<` o `&`, que ReportLab interpretaría como marcado."""
    return Paragraph(escape(text), style)


def _table(header: list[str], rows: list[list[str]], widths: list[float]) -> Table:
    data = [[_p(cell, _CELL) for cell in header]]
    data += [[_p(cell, _CELL) for cell in row] for row in rows]
    table = Table(data, colWidths=widths, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e8edf3")),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#b8c2cc")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return table


def pdf_filename(cadastral_code: str, now: datetime) -> str:
    """RF-04-04 CA-3: `edificacion-<codigo-catastral>-<AAAAMMDD>.pdf`, con la fecha de Colombia.
    Del código solo se conservan letras, dígitos y guiones, para que el nombre sea seguro en la
    cabecera `Content-Disposition`."""
    safe_code = re.sub(r"[^A-Za-z0-9-]", "", cadastral_code)
    return f"edificacion-{safe_code}-{_local(now):%Y%m%d}.pdf"


def render_building_pdf(
    building: Building,
    inspections: Sequence[Inspection],
    people: Sequence[Person],
    generated_by: Profile,
    now: datetime,
) -> bytes:
    """Dibuja el reporte de BRIEF §11.3. `inspections` va de la más reciente a la más antigua."""
    today = _local(now).date()
    story: list = [
        _p(f"Ficha de edificación {building.cadastral_code}", _TITLE),
        _p(DEMO_NOTICE, _NOTICE),
        _p(
            f"Generado el {_format_datetime(now)} (hora de Colombia) por "
            f"{generated_by.full_name}."
        ),
        _p("Edificación", _HEADING),
        _table(
            ["Dato", "Valor"],
            [
                ["Código catastral", building.cadastral_code],
                ["Dirección", building.address],
                ["Comuna", _comuna_label(building.comuna)],
                ["Barrio", building.neighborhood],
                ["Sector", SECTOR_LABELS[building.sector]],
                ["Pisos", str(building.floors)],
                ["Asegurada", _yes_no(building.is_insured)],
                ["Hipoteca", _yes_no(building.has_mortgage)],
                ["Leasing", _yes_no(building.has_leasing)],
            ],
            [5 * cm, 12 * cm],
        ),
        _p("Sticker vigente", _HEADING),
    ]

    if building.current_sticker is None:
        story.append(_p("Sin inspeccionar"))
    else:
        sticker = building.current_sticker
        last = building.last_inspection_at
        suffix = f" (inspección del {_format_datetime(last)})" if last else ""
        story.append(
            Paragraph(
                f'<font color="{STICKER_COLORS[sticker].hexval()}"><b>'
                f"{STICKER_LABELS[sticker]}</b></font>{escape(suffix)}",
                _BODY,
            )
        )

    story.append(_p("Historial de inspecciones", _HEADING))
    if inspections:
        story.append(
            _table(
                ["Fecha", "Inspector", "Sticker", "Observaciones"],
                [
                    [
                        _format_datetime(inspection.inspected_at),
                        inspection.inspector.full_name,
                        STICKER_LABELS[inspection.sticker],
                        inspection.notes or "—",
                    ]
                    for inspection in inspections
                ],
                [3 * cm, 4 * cm, 2 * cm, 8 * cm],
            )
        )
    else:
        story.append(_p(NO_RECORDS))

    story.append(_p("Personas ocupantes", _HEADING))
    if people:
        story.append(
            _table(
                ["Nombre", "Documento", "Vínculo", "Edad", "Rango", "Condición", "Población"],
                [
                    [
                        f"{person.first_names} {person.last_names}",
                        DOCUMENT_LABELS[person.document_type]
                        + (f" {person.document_number}" if person.document_number else ""),
                        TENURE_LABELS[person.tenure],
                        str(age(person.birth_date, today)),
                        AGE_RANGE_LABELS[age_range(person.birth_date, today)],
                        ", ".join(CONDITION_LABELS[c] for c in person.special_conditions)
                        or "Ninguna",
                        POPULATION_LABELS[person.population_type],
                    ]
                    for person in people
                ],
                [3.4 * cm, 2.8 * cm, 2 * cm, 1.2 * cm, 2.4 * cm, 3 * cm, 2.2 * cm],
            )
        )
    else:
        story.append(_p(NO_RECORDS))

    buffer = io.BytesIO()
    document = SimpleDocTemplate(
        buffer,
        pagesize=LETTER,
        title=f"Ficha de edificación {building.cadastral_code}",
        author="Registro de daños por sismo — datos ficticios",
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )
    document.build(story)
    return buffer.getvalue()


def build_building_pdf(
    db: Session, building_id: uuid.UUID, user: Profile, now: datetime
) -> tuple[str, bytes]:
    """RF-04-04: devuelve `(nombre_de_archivo, contenido)` del PDF de la edificación."""
    building = db.scalars(
        select(Building)
        .where(Building.id == building_id)
        .options(
            selectinload(Building.inspections).selectinload(Inspection.inspector),
            selectinload(Building.people),
        )
    ).one_or_none()
    if building is None:
        raise NotFoundError("La edificación no existe.")

    people = sorted(
        building.people, key=lambda p: (p.last_names.casefold(), p.first_names.casefold())
    )
    content = render_building_pdf(building, building.inspections, people, user, now)
    # RN-11: queda constancia de quién lo generó (solo identificadores, sin datos personales)
    logger.info("PDF generado: building_id=%s user_id=%s", building.id, user.id)
    return pdf_filename(building.cadastral_code, now), content
