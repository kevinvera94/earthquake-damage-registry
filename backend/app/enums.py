"""Catálogos del sistema (DATA-MODEL §2).

Los valores son los códigos que se guardan en la BD (tipos ENUM de PostgreSQL) y viajan
por la API. Las etiquetas en español viven en el frontend (`lib/catalogs.js`) y en el PDF.
"""

from enum import StrEnum


class UserRole(StrEnum):
    ADMIN = "admin"
    INSPECTOR = "inspector"


class Sector(StrEnum):
    HOUSING = "housing"
    COMMERCIAL = "commercial"
    HEALTH = "health"
    EDUCATION = "education"
    INFRASTRUCTURE = "infrastructure"
    LOGISTICS = "logistics"
    ECONOMY = "economy"


class Sticker(StrEnum):
    GREEN = "green"
    YELLOW = "yellow"
    RED = "red"


class DocumentType(StrEnum):
    CC = "cc"
    TI = "ti"
    RC = "rc"
    CE = "ce"
    PASSPORT = "passport"
    NONE = "none"


class Tenure(StrEnum):
    OWNER = "owner"
    TENANT = "tenant"


class SpecialCondition(StrEnum):
    """ "Ninguna" no es un valor: es el arreglo vacío (RF-03-01 CA-3)."""

    DISABILITY = "disability"
    VULNERABLE = "vulnerable"
    SPECIAL_NEED = "special_need"


class PopulationType(StrEnum):
    CIVILIAN = "civilian"
    MILITARY = "military"
    PRISON = "prison"


class AgeRange(StrEnum):
    """Rango etario calculado, nunca guardado (RN-07, DATA-MODEL §4.2). No es tipo de la BD."""

    CHILD = "0-9"
    ADOLESCENT = "10-17"
    ADULT = "18-59"
    SENIOR = "60+"


# Comunas de Cali: 1..22; 0 = Rural (DATA-MODEL §2)
RURAL_COMUNA = 0
MAX_COMUNA = 22
