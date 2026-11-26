"""Prueba rota a propósito para comprobar que CI bloquea la fusión (T-04c). NO FUSIONAR."""


def test_ci_must_block_merge() -> None:
    assert 1 == 2
