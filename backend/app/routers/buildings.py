"""Router: Edificaciones: búsqueda, registro, edición, consulta y PDF (MOD-02, MOD-04)."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app import pdf
from app.auth import get_current_user
from app.db import get_db
from app.models import Profile

router = APIRouter(prefix="/api/buildings", tags=["buildings"])


# ---------------------------------------------------------------------------
# RF-04-04: PDF de la ficha (T-18, David Calambas). Va al final del archivo para no
# chocar con los endpoints de T-07 (Valentina Sepúlveda)
# ---------------------------------------------------------------------------


@router.get(
    "/{building_id}/pdf",
    response_class=Response,
    status_code=status.HTTP_200_OK,
    responses={200: {"content": {"application/pdf": {}}, "description": "PDF de la ficha"}},
)
def export_building_pdf(
    building_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: Profile = Depends(get_current_user),
) -> Response:
    """RF-04-04: descarga el PDF de la ficha de la edificación (RN-11)."""
    filename, content = pdf.build_building_pdf(db, building_id, user, datetime.now(timezone.utc))
    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
