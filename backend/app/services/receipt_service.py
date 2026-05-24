"""
Smart Receipt 2.0 — token generation, QR rendering and microsite payload.

The merchant gets a QR for each sale that points to a public 24h-TTL
microsite with: Google review CTA + next-visit suggestion based on the
merchant's peak hours.
"""

import base64
import io
import secrets
import uuid
from collections import Counter
from datetime import datetime, timedelta, timezone

import qrcode
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.receipt_token import ReceiptToken
from app.models.sale import Sale
from app.models.user import User


TOKEN_TTL_HOURS = 24
WEEKDAY_NAMES_ES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]


def _new_token() -> str:
    return secrets.token_urlsafe(24)


def create_receipt_token(
    db: Session, user_id: uuid.UUID, sale_id: uuid.UUID
) -> ReceiptToken:
    """Reuse a non-expired token for the sale, or create a new one."""
    now = datetime.now(timezone.utc)
    existing = db.execute(
        select(ReceiptToken).where(
            ReceiptToken.sale_id == sale_id,
            ReceiptToken.expires_at > now,
        )
    ).scalar_one_or_none()
    if existing is not None:
        return existing

    token = ReceiptToken(
        sale_id=sale_id,
        user_id=user_id,
        token=_new_token(),
        expires_at=now + timedelta(hours=TOKEN_TTL_HOURS),
    )
    db.add(token)
    db.commit()
    db.refresh(token)
    return token


def render_qr_png_base64(url: str) -> str:
    """Return a data: URI PNG ready to be set as <img src>."""
    img = qrcode.make(url, box_size=8, border=2)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def compute_next_visit_suggestion(db: Session, user_id: uuid.UUID) -> dict | None:
    """
    Pick the (weekday, hour) bucket with the most sales in the last 60 days
    and return a friendly 'come back on day X around H:00' suggestion.
    Returns None if there's not enough history.
    """
    since = datetime.now(timezone.utc) - timedelta(days=60)
    sales = db.execute(
        select(Sale.sold_at).where(Sale.user_id == user_id, Sale.sold_at >= since)
    ).scalars().all()

    if len(sales) < 10:
        return None

    buckets = Counter((s.weekday(), s.hour) for s in sales)
    (weekday, hour), _ = buckets.most_common(1)[0]
    return {
        "weekday": WEEKDAY_NAMES_ES[weekday],
        "hour": hour,
        "time_range": f"{hour:02d}:00–{(hour + 2) % 24:02d}:00",
    }


def build_microsite_payload(db: Session, token_row: ReceiptToken) -> dict:
    """Public payload (no auth) consumed by the /r/{token} microsite."""
    user = db.execute(
        select(User).where(User.id == token_row.user_id)
    ).scalar_one()

    sale = db.execute(
        select(Sale).where(Sale.id == token_row.sale_id)
    ).unique().scalar_one()

    return {
        "store_name": user.store_name,
        "sale_total": float(sale.total),
        "sale_date": sale.sold_at.isoformat(),
        "google_review_url": user.google_review_url,
        "next_visit": compute_next_visit_suggestion(db, user.id),
        "expires_at": token_row.expires_at.isoformat(),
    }
