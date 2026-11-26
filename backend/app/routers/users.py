"""Router: Gestión de usuarios, solo Administrador (RF-01-04, RF-01-05)."""

from fastapi import APIRouter

router = APIRouter(prefix="/api/users", tags=["users"])
