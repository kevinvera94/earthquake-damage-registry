"""Edad y rango etario calculados desde la fecha de nacimiento (RN-07, DATA-MODEL §4.2).

Lógica pura: reciben `today` como parámetro para poder probarlas (CODING-STANDARDS §1.2).
"""

from datetime import date

from app.enums import AgeRange


def age(birth_date: date, today: date) -> int:
    """Años cumplidos a `today`. Quien nació un 29 de febrero cumple el 1 de marzo en años no
    bisiestos."""
    had_birthday = (today.month, today.day) >= (birth_date.month, birth_date.day)
    return today.year - birth_date.year - (0 if had_birthday else 1)


def age_range(birth_date: date, today: date) -> AgeRange:
    """Rango etario de BRIEF §8.3: 0–9, 10–17, 18–59 y 60 o más."""
    years = age(birth_date, today)
    if years < 10:
        return AgeRange.CHILD
    if years < 18:
        return AgeRange.ADOLESCENT
    if years < 60:
        return AgeRange.ADULT
    return AgeRange.SENIOR
