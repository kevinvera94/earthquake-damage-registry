"""Aplicación FastAPI: CORS, manejadores de errores de dominio y routers."""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.errors import (
    BusinessRuleError,
    ConflictError,
    DomainError,
    NotFoundError,
    PermissionDeniedError,
)
from app.routers import buildings, health, inspections, me, people, public, users

app = FastAPI(
    title="Registro de daños por sismo — Cali",
    description="API del registro de inspecciones de edificaciones. Datos ficticios con fines "
    "académicos.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],
    # El frontend lee el nombre del archivo del PDF (RF-04-04)
    expose_headers=["Content-Disposition"],
)


def _register_error_handler(exc_class: type[DomainError], status_code: int) -> None:
    """Registra un manejador que traduce `exc_class` a `{"detail": ...}` con `status_code`."""

    def handler(request: Request, exc: DomainError) -> JSONResponse:
        return JSONResponse(status_code=status_code, content={"detail": exc.detail})

    app.add_exception_handler(exc_class, handler)


_register_error_handler(NotFoundError, status.HTTP_404_NOT_FOUND)
_register_error_handler(ConflictError, status.HTTP_409_CONFLICT)
_register_error_handler(BusinessRuleError, status.HTTP_400_BAD_REQUEST)
_register_error_handler(PermissionDeniedError, status.HTTP_403_FORBIDDEN)

for module in (health, public, me, users, buildings, inspections, people):
    app.include_router(module.router)
