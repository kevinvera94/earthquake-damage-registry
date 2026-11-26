"""Excepciones de dominio (CODING-STANDARDS §1.3).

Los servicios lanzan estas excepciones y nunca `HTTPException`. `main.py` las
traduce a la respuesta HTTP `{"detail": "<mensaje>"}`. El mensaje lo escribe
quien lanza la excepción, en español y pensado para el usuario final.
"""


class DomainError(Exception):
    """Base de las excepciones de dominio. Lleva el mensaje para el usuario."""

    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail


class NotFoundError(DomainError):
    """Recurso inexistente → 404."""


class ConflictError(DomainError):
    """Duplicado (RN-01, RN-06) → 409."""


class BusinessRuleError(DomainError):
    """Regla de negocio violada → 400."""


class PermissionDeniedError(DomainError):
    """Rol insuficiente o usuario desactivado → 403."""
