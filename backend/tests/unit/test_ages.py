"""RN-07: edad y rango etario calculados (TESTING §2.5)."""

from datetime import date

import pytest

from app.enums import AgeRange
from app.services.ages import age, age_range

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
