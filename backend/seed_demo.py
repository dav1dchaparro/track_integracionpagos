"""
Script para cargar datos de demo en la DB.
Ejecutar: python seed_demo.py
Útil para mostrar el dashboard en el hackathon sin tener un Clover real.
"""
import uuid
import random
from datetime import datetime, timedelta, timezone

from app.database import SessionLocal, create_tables
from app.models.merchant import Merchant
from app.models.transaction import Transaction

MERCHANT_ID = "demo_merchant_001"

PRODUCTS = [
    {"name": "Café Americano", "price": 3.50, "category": "Bebidas"},
    {"name": "Cappuccino", "price": 4.50, "category": "Bebidas"},
    {"name": "Medialunas x3", "price": 2.80, "category": "Panadería"},
    {"name": "Tostado Jamón/Queso", "price": 5.50, "category": "Sandwiches"},
    {"name": "Jugo de Naranja", "price": 3.20, "category": "Bebidas"},
    {"name": "Agua Mineral", "price": 1.50, "category": "Bebidas"},
    {"name": "Torta de Chocolate", "price": 4.00, "category": "Repostería"},
    {"name": "Scone", "price": 2.50, "category": "Panadería"},
]

PAYMENT_METHODS = ["CARD", "CASH", "CREDIT", "DEBIT"]
CARD_TYPES = ["VISA", "MASTERCARD", "AMEX", None]


def random_transaction(merchant_id: str, days_ago: int) -> dict:
    # Horas más realistas: pico a las 8-10am y 12-14pm
    weights = [1, 1, 1, 1, 1, 2, 3, 5, 8, 7, 5, 4, 8, 7, 4, 3, 3, 4, 5, 4, 3, 2, 1, 1]
    hour = random.choices(range(24), weights=weights)[0]
    minute = random.randint(0, 59)

    date = datetime.now(timezone.utc) - timedelta(days=days_ago)
    date = date.replace(hour=hour, minute=minute, second=random.randint(0, 59))

    # 1-3 items por transacción
    num_items = random.choices([1, 2, 3], weights=[50, 35, 15])[0]
    items = []
    for _ in range(num_items):
        product = random.choice(PRODUCTS)
        qty = random.choices([1, 2], weights=[80, 20])[0]
        items.append({
            "name": product["name"],
            "price": product["price"],
            "quantity": qty,
            "category": product["category"],
        })

    amount = sum(i["price"] * i["quantity"] for i in items)
    tip = round(amount * random.choice([0, 0, 0.1, 0.15]), 2)
    tax = round(amount * 0.105, 2)  # IVA Argentina 10.5%

    payment_method = random.choice(PAYMENT_METHODS)
    card_type = random.choice(CARD_TYPES) if payment_method in ("CARD", "CREDIT", "DEBIT") else None

    return {
        "id": str(uuid.uuid4()),
        "merchant_id": merchant_id,
        "amount": round(amount + tip + tax, 2),
        "tip": tip,
        "tax": tax,
        "currency": "USD",
        "payment_method": payment_method,
        "card_type": card_type,
        "status": "completed",
        "customer_id": None,
        "customer_name": None,
        "items": items,
        "item_count": sum(i["quantity"] for i in items),
        "transaction_at": date,
        "clover_order_id": str(uuid.uuid4()),
        "raw_data": None,
    }


def seed():
    create_tables()
    db = SessionLocal()

    # Merchant demo
    existing = db.query(Merchant).filter(Merchant.id == MERCHANT_ID).first()
    if not existing:
        merchant = Merchant(
            id=MERCHANT_ID,
            name="Café El Ángel",
            email="contacto@cafelangel.com",
            phone="+54 11 4567-8901",
            address="Av. Corrientes 1234, Buenos Aires",
            currency="USD",
            timezone="America/Argentina/Buenos_Aires",
        )
        db.add(merchant)
        db.commit()
        print(f"Merchant creado: {MERCHANT_ID}")

    # Generar 90 días de transacciones (15-30 por día)
    count = 0
    for days_ago in range(90, 0, -1):
        num_txs = random.randint(15, 30)
        for _ in range(num_txs):
            tx_data = random_transaction(MERCHANT_ID, days_ago)
            tx = Transaction(**tx_data)
            db.add(tx)
            count += 1

    db.commit()
    db.close()
    print(f"✅ {count} transacciones de demo creadas para '{MERCHANT_ID}'")
    print(f"   Ahora podés llamar: POST /api/insights/{MERCHANT_ID}/generate")


if __name__ == "__main__":
    seed()
