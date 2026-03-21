"""
Clover webhook receiver + manual sync endpoints.
"""
import hashlib
import hmac
from typing import Optional

from fastapi import APIRouter, Depends, Request, HTTPException, Header, Query
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.clover_service import process_webhook, sync_orders

router = APIRouter(prefix="/clover", tags=["clover"])


def _verify_signature(body: bytes, signature: Optional[str]) -> bool:
    """Verify webhook comes from Clover using HMAC-SHA256."""
    if not signature or not settings.clover_app_secret:
        return True  # Skip in dev when no secret configured
    expected = hmac.new(
        settings.clover_app_secret.encode(),
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
    Receive Clover webhook events.
    Types: ORDER_CREATE, ORDER_UPDATE, PAYMENT_CREATE
    """
    body = await request.body()
    if not _verify_signature(body, x_clover_signature):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    try:
        import json
        payload = json.loads(body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid payload")

    merchant_id = payload.get("merchantId", "")
    event_type = payload.get("type", "")
    object_id = payload.get("objectId", "")

    result = await process_webhook(merchant_id, event_type, object_id, db)
    return {"status": "processed", "result": result}


@router.post("/sync")
async def sync_clover_orders(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    since_days: int = Query(30, ge=1, le=365),
):
    """
    Manually trigger a sync of orders from Clover.
    Requires the user to have clover_merchant_id and clover_access_token set.
    """
    from datetime import datetime, timedelta, timezone
    since_ms = int((datetime.now(timezone.utc) - timedelta(days=since_days)).timestamp() * 1000)
    result = await sync_orders(user, db, since_ms)
    return result


@router.put("/connect")
def connect_clover(
    merchant_id: str,
    access_token: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Save Clover credentials for the current user.
    Call this after Clover OAuth or with sandbox test token.
    """
    user.clover_merchant_id = merchant_id
    user.clover_access_token = access_token
    db.commit()
    return {"status": "connected", "merchant_id": merchant_id}
