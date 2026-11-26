"""Schemas compartidos entre recursos."""

from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    """Respuesta paginada (API §1): `{items, total, page, page_size}`."""

    items: list[T]
    total: int
    page: int
    page_size: int
