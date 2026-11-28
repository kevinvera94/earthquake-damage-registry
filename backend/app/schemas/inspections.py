"""Schemas: Inspecciones de una edificación (RF-02-04, RF-02-05)."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.enums import Sticker


class InspectorOut(BaseModel):
    """Usuario que registró la inspección (RN-04). Solo lo que muestra el historial."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    full_name: str


class InspectionOut(BaseModel):
    """RF-02-05 CA-3: inspección del historial con fecha, inspector, color y observaciones."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    building_id: uuid.UUID
    inspected_at: datetime
    sticker: Sticker
    notes: str | None
    inspector: InspectorOut
    created_at: datetime
