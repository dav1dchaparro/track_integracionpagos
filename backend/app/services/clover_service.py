"""
Servicio para procesar webhooks y llamadas a la API de Clover.
Clover envía eventos cuando se crean/actualizan órdenes y pagos.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.models.transaction import Transaction
from app.schemas.transaction import CloverWebhookPayload


# ─────────────────────────────────────────────
#  Clover REST API
# ─────────────────────────────────────────────

def get_clover_headers(access_token: str) -> dict:
    return {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }


def fetch_clover_order(merchant_id: str, order_id: str, access_token: str) -> Optional[dict]:
    """Obtiene los detalles de una orden de Clover."""
    url = f"{settings.CLOVER_API_BASE_URL}/v3/merchants/{merchant_id}/orders/{order_id}"
    try:
        response = httpx.get(url, headers=get_clover_headers(access_token), timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching Clover order {order_id}: {e}")
        return None


def fetch_clover_order_line_items(merchant_id: str, order_id: str, access_token: str) -> list:
    """Obtiene los items de una orden de Clover."""
    url = f"{settings.CLOVER_API_BASE_URL}/v3/merchants/{merchant_id}/orders/{order_id}/line_items"
    try:
        response = httpx.get(url, headers=get_clover_headers(access_token), timeout=10)
        response.raise_for_status()
        data = response.json()
        return data.get("elements", [])
    except Exception as e:
        print(f"Error fetching line items for order {order_id}: {e}")
        return []


def fetch_clover_payment(merchant_id: str, payment_id: str, access_token: str) -> Optional[dict]:
    """Obtiene los detalles de un pago de Clover."""
    url = f"{settings.CLOVER_API_BASE_URL}/v3/merchants/{merchant_id}/payments/{payment_id}"
    try:
        response = httpx.get(url, headers=get_clover_headers(access_token), timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching Clover payment {payment_id}: {e}")
        return None


# ─────────────────────────────────────────────
#  Mapeo de datos Clover → modelo interno
# ─────────────────────────────────────────────

def map_clover_order_to_transaction(order: dict, line_items: list, merchant_id: str) -> dict:
    """Convierte una orden de Clover a nuestro modelo de Transaction."""
    amount_cents = order.get("total", 0)
    tax_cents = order.get("taxAmount", 0)

    items = []
    for item in line_items:
        items.append({
            "name": item.get("name", "Item"),
            "quantity": item.get("unitQty", 100) // 100,  # Clover usa centésimos
            "price": item.get("price", 0) / 100,
            "category": item.get("alternateName", None),
        })

    # Determinar método de pago del primer pago
    payment_method = None
    card_type = None
    payments = order.get("payments", {}).get("elements", [])
    if payments:
        first_payment = payments[0]
        tender = first_payment.get("tender", {})
        payment_method = tender.get("label", "UNKNOWN").upper()
        card_data = first_payment.get("cardTransaction", {})
        card_type = card_data.get("cardType", None)

    created_time = order.get("createdTime", 0)
    transaction_at = datetime.fromtimestamp(created_time / 1000, tz=timezone.utc) if created_time else datetime.now(timezone.utc)

    return {
        "id": str(uuid.uuid4()),
        "merchant_id": merchant_id,
        "amount": amount_cents / 100,
        "tip": order.get("tipAmount", 0) / 100,
        "tax": tax_cents / 100,
        "currency": "USD",
        "payment_method": payment_method,
        "card_type": card_type,
        "status": "completed" if order.get("state") == "locked" else order.get("state", "completed"),
        "customer_id": order.get("customers", {}).get("elements", [{}])[0].get("id") if order.get("customers") else None,
        "customer_name": None,
        "items": items,
        "item_count": len(items),
        "transaction_at": transaction_at,
        "clover_order_id": order.get("id"),
        "raw_data": order,
    }


# ─────────────────────────────────────────────
#  Procesamiento de Webhooks
# ─────────────────────────────────────────────

def process_clover_webhook(payload: CloverWebhookPayload, db: Session) -> dict:
    """
    Procesa un webhook de Clover.
    Tipos relevantes: ORDER_CREATE, ORDER_UPDATE, PAYMENT_CREATE
    """
    merchant_id = payload.merchantId
    event_type = payload.type
    object_id = payload.objectId

    print(f"Clover webhook: {event_type} | merchant={merchant_id} | object={object_id}")

    # Buscar el merchant y su access token
    from app.models.merchant import Merchant
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant or not merchant.clover_access_token:
        return {"status": "skipped", "reason": "merchant not found or no access token"}

    if event_type in ("CREATE", "UPDATE") and "ORDER" in event_type.upper():
        return _handle_order_event(merchant_id, object_id, merchant.clover_access_token, db)

    if event_type == "CREATE" and "PAYMENT" in event_type.upper():
        return _handle_payment_event(merchant_id, object_id, merchant.clover_access_token, db)

    return {"status": "ignored", "type": event_type}


def _handle_order_event(merchant_id: str, order_id: str, access_token: str, db: Session) -> dict:
    order = fetch_clover_order(merchant_id, order_id, access_token)
    if not order:
        return {"status": "error", "reason": "could not fetch order"}

    line_items = fetch_clover_order_line_items(merchant_id, order_id, access_token)
    tx_data = map_clover_order_to_transaction(order, line_items, merchant_id)

    # Upsert: si ya existe por clover_order_id, no duplicar
    existing = db.query(Transaction).filter(Transaction.clover_order_id == order_id).first()
    if existing:
        return {"status": "skipped", "reason": "already exists"}

    transaction = Transaction(**tx_data)
    db.add(transaction)
    db.commit()
    return {"status": "saved", "transaction_id": tx_data["id"]}


def _handle_payment_event(merchant_id: str, payment_id: str, access_token: str, db: Session) -> dict:
    payment = fetch_clover_payment(merchant_id, payment_id, access_token)
    if not payment:
        return {"status": "error", "reason": "could not fetch payment"}
    # Por ahora solo logueamos — el procesamiento completo viene del order
    print(f"Payment received: {payment_id} | amount: {payment.get('amount', 0) / 100}")
    return {"status": "logged", "payment_id": payment_id}
