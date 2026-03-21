"""
Clover REST API client.
Fetches orders, line items, and payments from Clover POS.
Processes webhooks and maps Clover data → Sale model.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models.sale import Sale
from app.models.user import User


# ─── Clover API helpers ────────────────────────────────────────

def _headers(access_token: str) -> dict:
    return {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}


def _base() -> str:
    return settings.clover_api_base.rstrip("/")


async def fetch_order(merchant_id: str, order_id: str, access_token: str) -> Optional[dict]:
    url = f"{_base()}/v3/merchants/{merchant_id}/orders/{order_id}"
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            resp = await client.get(url, headers=_headers(access_token))
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            print(f"[clover] Error fetching order {order_id}: {e}")
            return None


async def fetch_line_items(merchant_id: str, order_id: str, access_token: str) -> list[dict]:
    url = f"{_base()}/v3/merchants/{merchant_id}/orders/{order_id}/line_items"
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            resp = await client.get(url, headers=_headers(access_token))
            resp.raise_for_status()
            return resp.json().get("elements", [])
        except Exception as e:
            print(f"[clover] Error fetching line items for {order_id}: {e}")
            return []


async def fetch_payment(merchant_id: str, payment_id: str, access_token: str) -> Optional[dict]:
    url = f"{_base()}/v3/merchants/{merchant_id}/payments/{payment_id}"
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            resp = await client.get(url, headers=_headers(access_token))
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            print(f"[clover] Error fetching payment {payment_id}: {e}")
            return None


async def fetch_items_catalog(merchant_id: str, access_token: str) -> list[dict]:
    """Fetch all items (products) from a Clover merchant."""
    url = f"{_base()}/v3/merchants/{merchant_id}/items?expand=categories"
    items = []
    offset = 0
    async with httpx.AsyncClient(timeout=15) as client:
        while True:
            try:
                resp = await client.get(url, headers=_headers(access_token), params={"limit": 100, "offset": offset})
                resp.raise_for_status()
                elements = resp.json().get("elements", [])
                if not elements:
                    break
                items.extend(elements)
                if len(elements) < 100:
                    break
                offset += 100
            except Exception as e:
                print(f"[clover] Error fetching items catalog: {e}")
                break
    return items


async def fetch_categories_catalog(merchant_id: str, access_token: str) -> list[dict]:
    """Fetch all categories from a Clover merchant."""
    url = f"{_base()}/v3/merchants/{merchant_id}/categories"
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            resp = await client.get(url, headers=_headers(access_token), params={"limit": 200})
            resp.raise_for_status()
            return resp.json().get("elements", [])
        except Exception as e:
            print(f"[clover] Error fetching categories: {e}")
            return []


async def fetch_orders_bulk(merchant_id: str, access_token: str, since_ms: int | None = None) -> list[dict]:
    """Fetch recent orders with line items and payments expanded."""
    path = f"{_base()}/v3/merchants/{merchant_id}/orders?expand=lineItems,payments&orderBy=createdTime+DESC&limit=100"
    if since_ms:
        path += f"&filter=createdTime>={since_ms}"
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            resp = await client.get(path, headers=_headers(access_token))
            resp.raise_for_status()
            return resp.json().get("elements", [])
        except Exception as e:
            print(f"[clover] Error fetching orders bulk: {e}")
            return []


# ─── Data mapping ──────────────────────────────────────────────

def map_order_to_sale(order: dict, user_id: uuid.UUID) -> dict:
    """Convert a Clover order dict into kwargs for Sale model."""
    amount_cents = order.get("total", 0)
    tip_cents = order.get("tipAmount", 0)
    tax_cents = order.get("taxAmount", 0)

    # Payment method + card brand
    payment_method = "card"
    card_brand = None
    card_type = None
    payments = order.get("payments", {}).get("elements", [])
    if payments:
        tender = payments[0].get("tender", {})
        label = tender.get("label", "").upper()
        if "CASH" in label:
            payment_method = "cash"
        elif "CREDIT" in label:
            payment_method = "credit"
        elif "DEBIT" in label:
            payment_method = "debit"
        else:
            payment_method = "card"

        card_data = payments[0].get("cardTransaction", {})
        raw_brand = card_data.get("cardType", "")
        if raw_brand:
            brand_lower = raw_brand.lower()
            if "visa" in brand_lower:
                card_brand = "visa"
            elif "master" in brand_lower:
                card_brand = "mastercard"
            elif "amex" in brand_lower or "american" in brand_lower:
                card_brand = "amex"

        raw_type = card_data.get("type", "")
        if raw_type:
            type_lower = raw_type.lower()
            if "credit" in type_lower:
                card_type = "credit"
            elif "debit" in type_lower:
                card_type = "debit"

    created_time = order.get("createdTime", 0)
    sold_at = datetime.fromtimestamp(created_time / 1000, tz=timezone.utc) if created_time else datetime.now(timezone.utc)

    return {
        "user_id": user_id,
        "invoice_number": order.get("id", str(uuid.uuid4())),
        "payment_method": payment_method,
        "card_type": card_type,
        "card_brand": card_brand,
        "total": amount_cents / 100,
        "tip": tip_cents / 100,
        "tax": tax_cents / 100,
        "sold_at": sold_at,
        "clover_order_id": order.get("id"),
        "raw_clover_data": order,
    }


# ─── Webhook processing ───────────────────────────────────────

async def process_webhook(merchant_id: str, event_type: str, object_id: str, db: Session) -> dict:
    """Process a Clover webhook event."""
    user = db.execute(
        select(User).where(User.clover_merchant_id == merchant_id)
    ).scalar_one_or_none()

    if not user or not user.clover_access_token:
        return {"status": "skipped", "reason": "merchant not found or no access token"}

    if "ORDER" in event_type.upper():
        return await _handle_order(user, object_id, db)

    if "PAYMENT" in event_type.upper():
        return {"status": "logged", "payment_id": object_id}

    return {"status": "ignored", "type": event_type}


async def _handle_order(user: User, order_id: str, db: Session) -> dict:
    """Fetch an order from Clover and save as a Sale."""
    # Skip if already imported
    existing = db.execute(
        select(Sale).where(Sale.clover_order_id == order_id)
    ).scalar_one_or_none()
    if existing:
        return {"status": "skipped", "reason": "already exists"}

    order = await fetch_order(user.clover_merchant_id, order_id, user.clover_access_token)
    if not order:
        return {"status": "error", "reason": "could not fetch order"}

    sale_data = map_order_to_sale(order, user.id)
    sale = Sale(**sale_data)
    db.add(sale)
    db.commit()

    return {"status": "saved", "sale_id": str(sale.id)}


async def sync_orders(user: User, db: Session, since_ms: int | None = None) -> dict:
    """Bulk sync orders from Clover for a user. Returns count of new sales."""
    if not user.clover_merchant_id or not user.clover_access_token:
        return {"status": "error", "reason": "no clover credentials"}

    orders = await fetch_orders_bulk(user.clover_merchant_id, user.clover_access_token, since_ms)
    created = 0
    skipped = 0

    for order in orders:
        clover_id = order.get("id")
        existing = db.execute(
            select(Sale).where(Sale.clover_order_id == clover_id)
        ).scalar_one_or_none()
        if existing:
            skipped += 1
            continue

        sale_data = map_order_to_sale(order, user.id)
        db.add(Sale(**sale_data))
        created += 1

    if created:
        db.commit()

    return {"status": "ok", "created": created, "skipped": skipped, "total_fetched": len(orders)}
