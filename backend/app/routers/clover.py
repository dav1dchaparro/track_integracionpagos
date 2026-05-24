import uuid
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.clover_webhook_event import CloverWebhookEvent
from app.models.product import Product
from app.models.sale import Sale
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
    """Recibe un evento de Clover, lo audita en clover_webhook_events y lo procesa."""
    event = CloverWebhookEvent(
        user_id=user.id,
        event_type=payload.type,
        object_id=payload.objectId,
        payload=payload.model_dump(),
        signature_valid=True,  # HMAC verification still pending — ver Inventory/Integrations plan
        received_at=datetime.now(timezone.utc),
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    try:
        result = process_clover_webhook(payload.type, payload.objectId, user.id, db)
        event.processed_at = datetime.now(timezone.utc)
        if isinstance(result, dict) and "sale_id" in result:
            try:
                event.sale_id = uuid.UUID(str(result["sale_id"]))
            except (ValueError, TypeError):
                pass
        db.commit()
        return result
    except Exception as e:
        event.error = str(e)[:1000]
        db.commit()
        raise


@router.post("/sync")
def clover_sync(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
):
    """Pull manual: trae las últimas órdenes de Clover y las inserta como ventas."""
    result = sync_clover_orders(user.id, db, limit)
    return result


class CartSuggestionRequest(BaseModel):
    product_ids: list[uuid.UUID]
    limit: int = 3
    lookback_days: int = 90


class CartSuggestion(BaseModel):
    product_id: uuid.UUID
    product_name: str
    price: float
    confidence: float  # P(suggested | cart) — "78 de cada 100 que llevan X, llevan Y"
    lift: float        # lift > 1 = más frecuente de lo esperado por azar
    co_occurrences: int
    reason: str


class CartSuggestionResponse(BaseModel):
    suggestions: list[CartSuggestion]
    cart_size: int
    based_on_sales: int


@router.post("/cart-suggestions", response_model=CartSuggestionResponse)
def cart_suggestions(
    req: CartSuggestionRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Market basket en vivo. Dado el carrito actual del terminal Clover, devuelve
    productos que históricamente se compraron junto a los que ya están en el carrito.

    Pensado para llamarse desde la app del terminal en el momento del checkout.
    """
    cart_ids = set(req.product_ids)
    if not cart_ids:
        return CartSuggestionResponse(suggestions=[], cart_size=0, based_on_sales=0)

    since = datetime.now(timezone.utc) - timedelta(days=req.lookback_days)

    sales = db.execute(
        select(Sale).where(Sale.user_id == user.id, Sale.sold_at >= since)
    ).unique().scalars().all()

    product_freq: dict[uuid.UUID, int] = defaultdict(int)
    pair_freq: dict[tuple[uuid.UUID, uuid.UUID], int] = defaultdict(int)
    total_tx = 0

    for sale in sales:
        pids = {item.product_id for item in sale.items}
        if len(pids) < 2:
            continue
        total_tx += 1
        for pid in pids:
            product_freq[pid] += 1
        for cart_pid in cart_ids:
            if cart_pid not in pids:
                continue
            for other in pids - cart_ids:
                pair_freq[(cart_pid, other)] += 1

    if not pair_freq or total_tx == 0:
        return CartSuggestionResponse(suggestions=[], cart_size=len(cart_ids), based_on_sales=total_tx)

    scores: dict[uuid.UUID, dict] = {}
    for (cart_pid, other), co in pair_freq.items():
        cart_count = product_freq[cart_pid]
        other_count = product_freq[other]
        if cart_count == 0 or other_count == 0:
            continue
        confidence = co / cart_count
        p_other = other_count / total_tx
        lift = confidence / p_other if p_other > 0 else 0
        existing = scores.get(other)
        if existing is None or confidence > existing["confidence"]:
            scores[other] = {
                "product_id": other,
                "confidence": confidence,
                "lift": lift,
                "co_occurrences": co,
                "anchor_id": cart_pid,
            }

    ranked = sorted(scores.values(), key=lambda s: (s["confidence"], s["lift"]), reverse=True)[: req.limit]
    if not ranked:
        return CartSuggestionResponse(suggestions=[], cart_size=len(cart_ids), based_on_sales=total_tx)

    needed_ids = {s["product_id"] for s in ranked} | {s["anchor_id"] for s in ranked}
    products = db.execute(
        select(Product).where(Product.user_id == user.id, Product.id.in_(needed_ids))
    ).unique().scalars().all()
    pmap = {p.id: p for p in products}

    suggestions: list[CartSuggestion] = []
    for s in ranked:
        prod = pmap.get(s["product_id"])
        anchor = pmap.get(s["anchor_id"])
        if not prod or not anchor:
            continue
        out_of_10 = max(1, min(10, int(round(s["confidence"] * 10))))
        reason = (
            f"De cada 10 que se llevan {anchor.name}, {out_of_10} también piden {prod.name}. "
            f"Se vendieron juntos {s['co_occurrences']} veces."
        )
        suggestions.append(
            CartSuggestion(
                product_id=prod.id,
                product_name=prod.name,
                price=float(prod.price),
                confidence=round(s["confidence"], 3),
                lift=round(s["lift"], 2),
                co_occurrences=s["co_occurrences"],
                reason=reason,
            )
        )

    return CartSuggestionResponse(
        suggestions=suggestions,
        cart_size=len(cart_ids),
        based_on_sales=total_tx,
    )
