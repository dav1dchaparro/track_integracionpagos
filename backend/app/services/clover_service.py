"""
Servicio para conectar con la API de Clover y llenar la DB con ventas.
Credenciales vienen de .env (no de la DB).
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_item import SaleItem


# ─────────────────────────────────────────────
#  Clover REST API
# ─────────────────────────────────────────────

def _headers() -> dict:
    return {"Authorization": f"Bearer {settings.clover_access_token}", "Content-Type": "application/json"}


def _base() -> str:
    return settings.clover_api_base_url


def _mid() -> str:
    return settings.clover_merchant_id


def fetch_clover_order(order_id: str) -> Optional[dict]:
    url = f"{_base()}/v3/merchants/{_mid()}/orders/{order_id}?expand=lineItems,payments"
    try:
        resp = httpx.get(url, headers=_headers(), timeout=10)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"[Clover] Error fetching order {order_id}: {e}")
        return None


def fetch_clover_orders(limit: int = 50) -> list[dict]:
    """Trae las órdenes más recientes del merchant."""
    url = f"{_base()}/v3/merchants/{_mid()}/orders?expand=lineItems,payments&limit={limit}&orderBy=createdTime+DESC"
    try:
        resp = httpx.get(url, headers=_headers(), timeout=15)
        resp.raise_for_status()
        return resp.json().get("elements", [])
    except Exception as e:
        print(f"[Clover] Error fetching orders: {e}")
        return []


# ─────────────────────────────────────────────
#  Mapeo Clover → Sale (modelos existentes)
# ─────────────────────────────────────────────

CARD_BRAND_MAP = {"VISA": "visa", "MC": "mastercard", "MASTERCARD": "mastercard", "AMEX": "amex"}
CARD_TYPE_MAP = {"CREDIT": "credit", "DEBIT": "debit"}


def _map_payment_info(order: dict) -> dict:
    payments = order.get("payments", {}).get("elements", [])
    if not payments:
        return {"payment_method": "qr", "card_type": None, "card_brand": None, "card_category": None}

    first = payments[0]
    card_tx = first.get("cardTransaction", {})
    if not card_tx:
        return {"payment_method": "qr", "card_type": None, "card_brand": None, "card_category": None}

    raw_type = (card_tx.get("type") or "").upper()
    raw_brand = (card_tx.get("cardType") or "").upper()

    return {
        "payment_method": "card",
        "card_type": CARD_TYPE_MAP.get(raw_type, "credit"),
        "card_brand": CARD_BRAND_MAP.get(raw_brand, "visa"),
        "card_category": None,
    }


def _map_clover_order(order: dict, user_id: uuid.UUID, db: Session) -> Sale | None:
    """Convierte una orden de Clover en un Sale con SaleItems."""
    line_items = order.get("lineItems", {}).get("elements", [])
    payment = _map_payment_info(order)

    total = 0.0
    sale_items = []

    for item in line_items:
        name = item.get("name", "Item Clover")
        price_cents = item.get("price", 0)
        qty = max((item.get("unitQty", 100) // 100), 1)
        price = price_cents / 100.0
        subtotal = price * qty
        total += subtotal

        # Buscar producto existente por nombre, o crearlo
        product = db.execute(
            select(Product).where(Product.user_id == user_id, Product.name == name)
        ).scalar_one_or_none()

        if not product:
            product = Product(user_id=user_id, name=name, price=price)
            db.add(product)
            db.flush()

        sale_items.append(SaleItem(product_id=product.id, quantity=qty, subtotal=subtotal))

    if not sale_items:
        return None

    created_time = order.get("createdTime", 0)
    sold_at = (
        datetime.fromtimestamp(created_time / 1000, tz=timezone.utc)
        if created_time else datetime.now(timezone.utc)
    )

    return Sale(
        user_id=user_id,
        invoice_number=f"CLV-{order.get('id', uuid.uuid4())}",
        payment_method=payment["payment_method"],
        card_type=payment["card_type"],
        card_brand=payment["card_brand"],
        card_category=payment["card_category"],
        total=total,
        sold_at=sold_at,
        clover_order_id=order.get("id"),
        items=sale_items,
    )


# ─────────────────────────────────────────────
#  Sync: pull de órdenes recientes
# ─────────────────────────────────────────────

def sync_clover_orders(user_id: uuid.UUID, db: Session, limit: int = 50) -> dict:
    """Trae órdenes de Clover y las inserta como Sales. Evita duplicados por clover_order_id."""
    orders = fetch_clover_orders(limit)
    saved = 0
    skipped = 0
    errors = 0

    for order_data in orders:
        clover_id = order_data.get("id")
        if not clover_id:
            errors += 1
            continue

        # Saltar si ya existe
        existing = db.execute(
            select(Sale).where(Sale.clover_order_id == clover_id)
        ).scalar_one_or_none()
        if existing:
            skipped += 1
            continue

        sale = _map_clover_order(order_data, user_id, db)
        if not sale:
            skipped += 1
            continue

        db.add(sale)
        saved += 1

    if saved > 0:
        db.commit()

    return {"saved": saved, "skipped": skipped, "errors": errors, "total_fetched": len(orders)}


# ─────────────────────────────────────────────
#  Webhook: Clover pushea un evento
# ─────────────────────────────────────────────

def process_clover_webhook(event_type: str, object_id: str, user_id: uuid.UUID, db: Session) -> dict:
    event_type = event_type.upper()
    print(f"[Clover] webhook: {event_type} | object={object_id}")

    if "ORDER" not in event_type:
        return {"status": "ignored", "type": event_type}

    # Saltar si ya existe
    existing = db.execute(
        select(Sale).where(Sale.clover_order_id == object_id)
    ).scalar_one_or_none()
    if existing:
        return {"status": "skipped", "reason": "already imported"}

    order = fetch_clover_order(object_id)
    if not order:
        return {"status": "error", "reason": "could not fetch order from Clover"}

    sale = _map_clover_order(order, user_id, db)
    if not sale:
        return {"status": "skipped", "reason": "empty order"}

    db.add(sale)
    db.commit()
    db.refresh(sale)
    return {"status": "saved", "sale_id": str(sale.id), "total": float(sale.total)}
