"""
Smart Receipt 2.0 — endpoints to generate the QR for a sale and serve
the public microsite that the customer lands on when they scan it.
"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.receipt_token import ReceiptToken
from app.models.sale import Sale
from app.models.user import User
from app.services.receipt_service import (
    build_microsite_payload,
    create_receipt_token,
    render_qr_png_base64,
)

router = APIRouter(tags=["receipts"])


# Public base URL used inside the QR. Configurable via the request itself
# in dev so a single backend can serve QR for both localhost and a tunnel.
def _microsite_url(token: str, public_host: str | None) -> str:
    base = public_host or "http://localhost:3000"
    base = base.rstrip("/")
    return f"{base}/r/{token}"


@router.get("/receipts/{sale_id}/qr")
def get_receipt_qr(
    sale_id: str,
    public_host: str | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Authenticated. Creates (or reuses) a 24h receipt token for the sale
    and returns the QR (as data URI) + the microsite URL.
    """
    try:
        sid = uuid.UUID(sale_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid sale_id")

    sale = db.execute(
        select(Sale).where(Sale.id == sid, Sale.user_id == user.id)
    ).unique().scalar_one_or_none()
    if sale is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sale not found")

    token = create_receipt_token(db, user.id, sid)
    url = _microsite_url(token.token, public_host)

    return {
        "token": token.token,
        "microsite_url": url,
        "qr_data_uri": render_qr_png_base64(url),
        "expires_at": token.expires_at.isoformat(),
    }


@router.get("/r/{token}")
def get_microsite(token: str, db: Session = Depends(get_db)):
    """Public, no-auth. Renders the receipt microsite payload."""
    row = db.execute(
        select(ReceiptToken).where(ReceiptToken.token == token)
    ).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Token not found")

    if row.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Token expired")

    row.click_count = (row.click_count or 0) + 1
    db.commit()

    return build_microsite_payload(db, row)
