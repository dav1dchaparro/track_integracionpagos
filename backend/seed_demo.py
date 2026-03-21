"""
Demo data seeder — creates a test user with products, categories, and 60 days of sales.
Run: python seed_demo.py
"""
import random
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.config import settings
from app.database import Database, init_db, get_db
from app.models.user import User
from app.models.category import Category
from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.services.auth import hash_password

# ── Config ────────────────────────────────────────────────────
DEMO_EMAIL = "demo@smartreceipt.com"
DEMO_PASSWORD = "demo1234"
DEMO_STORE = "Cafetería Demo"
NUM_DAYS = 60
SALES_PER_DAY = (5, 25)

CATEGORIES = ["Bebidas", "Comidas", "Postres", "Snacks"]

PRODUCTS = [
    ("Café Americano", "Bebidas", 3.50),
    ("Latte", "Bebidas", 4.50),
    ("Cappuccino", "Bebidas", 4.00),
    ("Jugo Natural", "Bebidas", 5.00),
    ("Agua Mineral", "Bebidas", 2.00),
    ("Sandwich de Pollo", "Comidas", 8.50),
    ("Ensalada César", "Comidas", 9.00),
    ("Wrap Vegetariano", "Comidas", 7.50),
    ("Hamburguesa Clásica", "Comidas", 10.00),
    ("Tostado Mixto", "Comidas", 6.00),
    ("Cheesecake", "Postres", 6.50),
    ("Brownie", "Postres", 4.50),
    ("Tiramisú", "Postres", 7.00),
    ("Medialunas (x3)", "Snacks", 3.00),
    ("Muffin de Arándanos", "Snacks", 3.50),
    ("Cookies (x2)", "Snacks", 2.50),
]

PAYMENT_METHODS = ["card", "cash", "qr", "credit", "debit"]
PAYMENT_WEIGHTS = [0.40, 0.25, 0.15, 0.10, 0.10]
CARD_BRANDS = ["visa", "mastercard", "amex"]
CARD_TYPES = ["credit", "debit"]
CARD_CATEGORIES = ["classic", "gold", "platinum", "black"]


def seed():
    database = Database.for_production(settings.database_url)
    init_db(database)
    db = next(get_db())

    # Check if demo user already exists
    existing = db.execute(select(User).where(User.email == DEMO_EMAIL)).scalar_one_or_none()
    if existing:
        print(f"Demo user already exists: {existing.email} (id={existing.id})")
        print("Delete it first if you want to re-seed.")
        return

    # Create user
    user = User(
        store_name=DEMO_STORE,
        email=DEMO_EMAIL,
        password=hash_password(DEMO_PASSWORD),
    )
    db.add(user)
    db.flush()
    print(f"Created user: {user.email} / {DEMO_PASSWORD}")

    # Create categories
    cat_map = {}
    for name in CATEGORIES:
        cat = Category(user_id=user.id, name=name)
        db.add(cat)
        db.flush()
        cat_map[name] = cat
    print(f"Created {len(cat_map)} categories")

    # Create products
    prod_list = []
    for name, cat_name, price in PRODUCTS:
        prod = Product(user_id=user.id, name=name, price=price)
        prod.categories.append(cat_map[cat_name])
        db.add(prod)
        db.flush()
        prod_list.append(prod)
    print(f"Created {len(prod_list)} products")

    # Generate sales over NUM_DAYS
    now = datetime.now(timezone.utc)
    total_sales = 0

    for day_offset in range(NUM_DAYS, 0, -1):
        day = now - timedelta(days=day_offset)
        n_sales = random.randint(*SALES_PER_DAY)

        # Weekend boost
        if day.weekday() >= 5:
            n_sales = int(n_sales * 1.4)

        for _ in range(n_sales):
            hour = random.choices(
                range(7, 22),
                weights=[2, 5, 8, 10, 8, 12, 10, 8, 6, 5, 4, 3, 2, 1, 1],
            )[0]
            minute = random.randint(0, 59)
            sold_at = day.replace(hour=hour, minute=minute, second=random.randint(0, 59))

            payment = random.choices(PAYMENT_METHODS, weights=PAYMENT_WEIGHTS)[0]
            card_brand = None
            card_type = None
            card_category = None
            if payment in ("card", "credit", "debit"):
                card_brand = random.choice(CARD_BRANDS)
                card_type = random.choice(CARD_TYPES) if payment == "card" else payment
                card_category = random.choices(
                    CARD_CATEGORIES, weights=[0.4, 0.3, 0.2, 0.1]
                )[0]

            # Pick 1-4 items
            n_items = random.choices([1, 2, 3, 4], weights=[0.3, 0.4, 0.2, 0.1])[0]
            chosen = random.sample(prod_list, min(n_items, len(prod_list)))

            sale_total = 0
            sale_items = []
            for prod in chosen:
                qty = random.choices([1, 2, 3], weights=[0.6, 0.3, 0.1])[0]
                subtotal = float(prod.price) * qty
                sale_total += subtotal
                sale_items.append((prod.id, qty, subtotal))

            tip = round(sale_total * random.choice([0, 0, 0, 0.05, 0.10, 0.15]), 2)
            tax = round(sale_total * 0.07, 2)

            sale = Sale(
                user_id=user.id,
                invoice_number=f"INV-{uuid.uuid4().hex[:8].upper()}",
                payment_method=payment,
                card_type=card_type,
                card_brand=card_brand,
                card_category=card_category,
                total=round(sale_total + tax, 2),
                tip=tip,
                tax=tax,
                sold_at=sold_at,
            )
            db.add(sale)
            db.flush()

            for prod_id, qty, subtotal in sale_items:
                si = SaleItem(
                    sale_id=sale.id,
                    product_id=prod_id,
                    quantity=qty,
                    subtotal=round(subtotal, 2),
                )
                db.add(si)

            total_sales += 1

    db.commit()
    print(f"Created {total_sales} sales across {NUM_DAYS} days")
    print(f"\nLogin: {DEMO_EMAIL} / {DEMO_PASSWORD}")


if __name__ == "__main__":
    seed()
