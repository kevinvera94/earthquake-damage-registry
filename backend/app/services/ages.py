"""Edad y rango etario calculados desde la fecha de nacimiento (RN-07, DATA-MODEL §4.2).

Lógica pura: reciben `today` como parámetro para poder probarlas (CODING-STANDARDS §1.2).
"""

from datetime import date, datetime, timedelta, timezone

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


# Colombia no tiene horario de verano: UTC−5 todo el año. Se usa un desfase fijo para no
# depender de la base de datos de zonas horarias del sistema (tzdata).
COLOMBIA_TZ = timezone(timedelta(hours=-5), "America/Bogota")


def today_colombia() -> date:
    """Fecha de hoy en Colombia. Es la "fecha actual" de RF-03-03 y de RF-03-01 CA-5."""
    return datetime.now(COLOMBIA_TZ).date()


def _years_before(today: date, years: int) -> date:
    """La misma fecha `years` años antes. Un 29 de febrero sin equivalente pasa a 28 de febrero,
    coherente con `age()`: quien nació el 1 de marzo aún no cumple ese día."""
    try:
        return today.replace(year=today.year - years)
    except ValueError:
        return today.replace(year=today.year - years, day=28)


def birth_date_bounds(range_: AgeRange, today: date) -> tuple[date | None, date | None]:
    """Intervalo de `birth_date` de un rango etario (DATA-MODEL §4.2), para filtrar con el índice.

    Devuelve `(after, on_or_before)`: la persona está en el rango si
    `birth_date > after` (cuando `after` no es `None`) y `birth_date <= on_or_before`
    (cuando `on_or_before` no es `None`).
    """
    if range_ is AgeRange.CHILD:
        return _years_before(today, 10), None
    if range_ is AgeRange.ADOLESCENT:
        return _years_before(today, 18), _years_before(today, 10)
    if range_ is AgeRange.ADULT:
        return _years_before(today, 60), _years_before(today, 18)
    return None, _years_before(today, 60)
