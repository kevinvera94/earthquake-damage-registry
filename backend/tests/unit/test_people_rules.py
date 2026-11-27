"""RN-06: normalización del nombre para detectar duplicados sin documento (TESTING §2.5)."""

import pytest

from app.services.people import normalize_name


@pytest.mark.parametrize(
    ("first_names", "last_names"),
    [
        ("Ana María", "Pérez Gómez"),
        ("ANA MARIA", "PEREZ GOMEZ"),
        ("ana maría", "pérez gómez"),
        ("  Ana   María ", "\tPérez  Gómez  "),
        ("ÁNA MARÍA", "PÉREZ GÓMEZ"),
    ],
)
def test_normalize_name_ignores_case_accents_and_spaces(first_names: str, last_names: str) -> None:
    """RN-06: mayúsculas, tildes y espacios no distinguen a dos personas."""
    assert normalize_name(first_names, last_names) == "ana maria perez gomez"


@pytest.mark.parametrize(
    ("first_names", "last_names", "expected"),
    [
        ("Iñaki", "Muñoz", "inaki munoz"),
        ("Güido", "Agüero", "guido aguero"),
    ],
)
def test_normalize_name_removes_tilde_of_enie_and_dieresis(
    first_names: str, last_names: str, expected: str
) -> None:
    assert normalize_name(first_names, last_names) == expected


def test_normalize_name_keeps_different_names_different() -> None:
    assert normalize_name("Ana", "Pérez") != normalize_name("Ana", "Peña")
