from fastapi import APIRouter, Depends, Request, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
import hmac
import hashlib

from app.database import get_db
from app.config import settings
from app.schemas.transaction import CloverWebhookPayload
from app.services.clover_service import process_clover_webhook

router = APIRouter()


def verify_clover_signature(body: bytes, signature: Optional[str]) -> bool:
    """Verifica que el webhook viene realmente de Clover."""
    if not signature or not settings.CLOVER_APP_SECRET:
        return True  # En dev, skip verificación
    expected = hmac.new(
        settings.CLOVER_APP_SECRET.encode(),
        body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


@router.post("/webhook")
async def clover_webhook(
    request: Request,
    x_clover_signature: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Recibe eventos de Clover via webhook.
    Tipos de evento: ORDER_CREATE, ORDER_UPDATE, PAYMENT_CREATE, etc.
    """
    body = await request.body()
    if not verify_clover_signature(body, x_clover_signature):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    try:
        payload = CloverWebhookPayload.model_validate_json(body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook payload")

    result = process_clover_webhook(payload, db)
    return {"status": "processed", "result": result}
