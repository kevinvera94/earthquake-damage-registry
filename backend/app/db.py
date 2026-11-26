"""Motor y sesión de SQLAlchemy (síncronos, CODING-STANDARDS §1.1)."""

from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

# Pool pequeño: el plan gratuito de Supabase limita las conexiones (INFRA §4)
engine = create_engine(
    settings.database_url,
    pool_size=5,
    max_overflow=0,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False)


class Base(DeclarativeBase):
    """Base declarativa de todos los modelos de `app/models.py`."""


def get_db() -> Iterator[Session]:
    """Dependencia de FastAPI: abre una sesión por petición y la cierra al terminar."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
