"""RN-07: edad y rango etario calculados (TESTING §2.5)."""

from datetime import date, datetime, timedelta, timezone

import pytest

from app.enums import AgeRange
from app.services.ages import (
    COLOMBIA_TZ,
    age,
    age_range,
    birth_date_bounds,
    today_colombia,
)

TODAY = date(2026, 11, 26)


@pytest.mark.parametrize(
    ("birth_date", "expected"),
    [
        (date(2016, 11, 26), 10),  # cumple hoy
        (date(2016, 11, 27), 9),  # cumple mañana
        (date(2016, 11, 25), 10),  # cumplió ayer
        (TODAY, 0),
    ],
)
def test_age_birthday_boundaries_returns_completed_years(birth_date: date, expected: int) -> None:
    """RN-07: la edad son años cumplidos, no la resta de años."""
    assert age(birth_date, TODAY) == expected


@pytest.mark.parametrize(
    ("today", "expected"),
    [(date(2027, 2, 28), 2), (date(2027, 3, 1), 3), (date(2028, 2, 29), 4)],
)
def test_age_born_on_february_29_birthday_is_march_1_in_common_years(
    today: date, expected: int
) -> None:
    assert age(date(2024, 2, 29), today) == expected


@pytest.mark.parametrize(
    ("years", "expected"),
    [
        (0, AgeRange.CHILD),
        (9, AgeRange.CHILD),
        (10, AgeRange.ADOLESCENT),
        (17, AgeRange.ADOLESCENT),
        (18, AgeRange.ADULT),
        (59, AgeRange.ADULT),
        (60, AgeRange.SENIOR),
        (95, AgeRange.SENIOR),
    ],
)
def test_age_range_limits_returns_brief_range(years: int, expected: AgeRange) -> None:
    """RN-07 / BRIEF §8.3: límites 9/10, 17/18 y 59/60."""
    birth_date = date(TODAY.year - years, TODAY.month, TODAY.day)
    assert age_range(birth_date, TODAY) == expected


def test_age_range_day_before_tenth_birthday_is_still_child() -> None:
    assert age_range(date(2016, 11, 27), TODAY) == AgeRange.CHILD


def _in_bounds(birth_date: date, bounds: tuple[date | None, date | None]) -> bool:
    after, on_or_before = bounds
    return (after is None or birth_date > after) and (
        on_or_before is None or birth_date <= on_or_before
    )


@pytest.mark.parametrize(
    "today", [TODAY, date(2028, 2, 29), date(2027, 2, 28), date(2027, 3, 1), date(2026, 1, 1)]
)
def test_birth_date_bounds_agree_with_age_range_for_every_birth_date(today: date) -> None:
    """RN-07 / DATA-MODEL §4.2: el intervalo de `birth_date` que usa el filtro clasifica igual
    que `age_range`, incluidos los 29 de febrero. Recorre ~75 años de fechas de nacimiento."""
    birth_date = date(today.year - 75, 1, 1)
    while birth_date <= today:
        expected = age_range(birth_date, today)
        matching = [r for r in AgeRange if _in_bounds(birth_date, birth_date_bounds(r, today))]
        assert matching == [expected], birth_date
        birth_date += timedelta(days=1)


@pytest.mark.parametrize(
    ("range_", "expected"),
    [
        (AgeRange.CHILD, (date(2016, 11, 26), None)),
        (AgeRange.ADOLESCENT, (date(2008, 11, 26), date(2016, 11, 26))),
        (AgeRange.ADULT, (date(1966, 11, 26), date(2008, 11, 26))),
        (AgeRange.SENIOR, (None, date(1966, 11, 26))),
    ],
)
def test_birth_date_bounds_returns_data_model_intervals(
    range_: AgeRange, expected: tuple[date | None, date | None]
) -> None:
    """DATA-MODEL §4.2: 0–9 → `> t−10`; 10–17 → `(t−18, t−10]`; 18–59 → `(t−60, t−18]`;
    60+ → `<= t−60`."""
    assert birth_date_bounds(range_, TODAY) == expected


def test_today_colombia_uses_utc_minus_5() -> None:
    """A las 02:00 UTC del 27-nov todavía es 26-nov en Colombia."""
    now_utc = datetime(2026, 11, 27, 2, 0, tzinfo=timezone.utc)
    assert now_utc.astimezone(COLOMBIA_TZ).date() == date(2026, 11, 26)
    assert today_colombia() == datetime.now(COLOMBIA_TZ).date()
