from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.clover_service import process_clover_webhook, sync_clover_orders

router = APIRouter(prefix="/clover", tags=["clover"])


class WebhookPayload(BaseModel):
    type: str
    objectId: str


@router.post("/webhook")
def clover_webhook(
    payload: WebhookPayload,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Recibe un evento de Clover y lo procesa."""
    result = process_clover_webhook(payload.type, payload.objectId, user.id, db)
    return result


@router.post("/sync")
def clover_sync(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
):
    """Pull manual: trae las últimas órdenes de Clover y las inserta como ventas."""
    result = sync_clover_orders(user.id, db, limit)
    return result
