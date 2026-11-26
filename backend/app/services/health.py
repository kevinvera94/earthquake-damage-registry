"""Servicio: verificación de salud del backend y de la base de datos (INFRA §6)."""

from sqlalchemy import text
from sqlalchemy.orm import Session


def check_database(db: Session) -> None:
    """Ejecuta `SELECT 1`: confirma la conexión y mantiene activo Supabase."""
    db.execute(text("SELECT 1"))
