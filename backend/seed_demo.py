"""
Seed script: genera datos demo realistas para "Café Don Pedro"
Ejecutar: docker compose exec api python seed_demo.py
"""
import random
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
from sqlalchemy import create_engine, text

# ── Config ──
DB_URL = "postgresql://postgres:postgres@postgres:5432/postgres"
engine = create_engine(DB_URL)

STORE_NAME = "Café Don Pedro"
EMAIL = "pedro@demo.com"
PASSWORD = "demo123"
MONTHLY_GOAL = 15000.00

NOW = datetime.now(timezone.utc)

# ── Catálogo realista de cafetería ──
CATEGORIES = {
    "Bebidas Calientes": [
        ("Americano", 3.50),
        ("Latte", 4.50),
        ("Cappuccino", 4.50),
        ("Mocha", 5.00),
        ("Espresso Doble", 3.00),
        ("Chocolate Caliente", 4.00),
        ("Té Chai Latte", 4.50),
    ],
    "Bebidas Frías": [
        ("Frappé Mocha", 5.50),
        ("Limonada", 3.50),
        ("Smoothie Fresa", 5.00),
        ("Cold Brew", 4.50),
        ("Iced Latte", 5.00),
    ],
    "Panadería": [
        ("Croissant", 3.00),
        ("Muffin Arándano", 3.50),
        ("Pan de Banana", 3.00),
        ("Galleta Chocolate", 2.50),
        ("Rol de Canela", 4.00),
    ],
    "Comida": [
        ("Sandwich Club", 7.50),
        ("Wrap Pollo", 7.00),
        ("Ensalada César", 8.00),
        ("Tostada Aguacate", 6.50),
        ("Bagel con Queso Crema", 4.50),
    ],
}

# Clientes recurrentes (para métricas de retención)
CUSTOMERS = [
    "maria.lopez@gmail.com",
    "carlos.ruiz@hotmail.com",
    "ana.garcia@gmail.com",
    "luis.martinez@yahoo.com",
    "sofia.hernandez@gmail.com",
    "pedro.sanchez@outlook.com",
    "valentina.diaz@gmail.com",
    "diego.morales@hotmail.com",
    None, None, None, None, None,  # ~45% sin email
]

# Pesos de popularidad por categoría
CATEGORY_WEIGHTS = {
    "Bebidas Calientes": 0.40,
    "Bebidas Frías": 0.20,
    "Panadería": 0.22,
    "Comida": 0.18,
}

# Patrones de venta por hora (distribución realista de cafetería)
HOUR_WEIGHTS = {
    7: 8, 8: 15, 9: 12, 10: 8, 11: 6,
    12: 10, 13: 12, 14: 8, 15: 5, 16: 6,
    17: 5, 18: 3, 19: 2,
}

# Variación por día de la semana (lun=0 a dom=6)
DAY_MULTIPLIER = [1.0, 0.9, 1.0, 1.1, 1.3, 1.5, 1.2]


def gen_uuid():
    return str(uuid.uuid4())


def hash_pw(pw):
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def pick_hour():
    hours = list(HOUR_WEIGHTS.keys())
    weights = list(HOUR_WEIGHTS.values())
    return random.choices(hours, weights=weights, k=1)[0]


def pick_products(product_list):
    """Elige 1-4 items para una orden, con peso por categoría."""
    n_items = random.choices([1, 2, 3, 4], weights=[30, 40, 20, 10], k=1)[0]
    chosen = []
    for _ in range(n_items):
        # Elegir categoría por peso
        cat = random.choices(
            list(CATEGORY_WEIGHTS.keys()),
            weights=list(CATEGORY_WEIGHTS.values()),
            k=1
        )[0]
        cat_products = [p for p in product_list if p["category"] == cat]
        chosen.append(random.choice(cat_products))
    return chosen


def pick_payment():
    method = random.choices(["card", "qr"], weights=[75, 25], k=1)[0]
    if method == "qr":
        return method, None, None, None
    card_type = random.choices(["credit", "debit"], weights=[60, 40], k=1)[0]
    card_brand = random.choices(
        ["visa", "mastercard", "amex"], weights=[50, 35, 15], k=1
    )[0]
    categories = {
        "visa": ["classic", "gold", "platinum", "signature", "infinite"],
        "mastercard": ["classic", "gold", "platinum", "world", "world_elite"],
        "amex": ["gold", "platinum", "centurion"],
    }
    card_cat = random.choice(categories[card_brand])
    return method, card_type, card_brand, card_cat


def main():
    with engine.connect() as conn:
        # ── Limpiar datos previos del demo ──
        existing = conn.execute(
            text("SELECT id FROM users WHERE email = :e"), {"e": EMAIL}
        ).fetchone()

        if existing:
            uid = str(existing[0])
            print(f"Limpiando datos existentes del usuario {EMAIL}...")
            conn.execute(text("DELETE FROM demand_predictions WHERE user_id = :uid"), {"uid": uid})
            conn.execute(text("DELETE FROM product_stock WHERE user_id = :uid"), {"uid": uid})
            conn.execute(text(
                "DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE user_id = :uid)"
            ), {"uid": uid})
            conn.execute(text("DELETE FROM sales WHERE user_id = :uid"), {"uid": uid})
            conn.execute(text(
                "DELETE FROM product_categories WHERE product_id IN (SELECT id FROM products WHERE user_id = :uid)"
            ), {"uid": uid})
            conn.execute(text("DELETE FROM products WHERE user_id = :uid"), {"uid": uid})
            conn.execute(text("DELETE FROM categories WHERE user_id = :uid"), {"uid": uid})
            conn.execute(text("DELETE FROM users WHERE id = :uid"), {"uid": uid})
            conn.commit()

        # ── Crear usuario ──
        user_id = gen_uuid()
        conn.execute(text("""
            INSERT INTO users (id, store_name, email, password, monthly_goal, created_at)
            VALUES (:id, :store, :email, :pw, :goal, :created)
        """), {
            "id": user_id, "store": STORE_NAME, "email": EMAIL,
            "pw": hash_pw(PASSWORD), "goal": MONTHLY_GOAL, "created": NOW,
        })
        print(f"Usuario creado: {EMAIL} / {PASSWORD}")

        # ── Crear categorías ──
        cat_ids = {}
        for cat_name in CATEGORIES:
            cid = gen_uuid()
            cat_ids[cat_name] = cid
            conn.execute(text("""
                INSERT INTO categories (id, user_id, name, created_at)
                VALUES (:id, :uid, :name, :created)
            """), {"id": cid, "uid": user_id, "name": cat_name, "created": NOW})
        print(f"Categorías creadas: {len(cat_ids)}")

        # ── Crear productos ──
        product_list = []
        for cat_name, items in CATEGORIES.items():
            for prod_name, price in items:
                pid = gen_uuid()
                conn.execute(text("""
                    INSERT INTO products (id, user_id, name, price, created_at)
                    VALUES (:id, :uid, :name, :price, :created)
                """), {"id": pid, "uid": user_id, "name": prod_name, "price": price, "created": NOW})
                conn.execute(text("""
                    INSERT INTO product_categories (product_id, category_id)
                    VALUES (:pid, :cid)
                """), {"pid": pid, "cid": cat_ids[cat_name]})
                product_list.append({"id": pid, "name": prod_name, "price": price, "category": cat_name})
        print(f"Productos creados: {len(product_list)}")

        # ── Generar ventas de los últimos 45 días ──
        sales_count = 0
        items_count = 0
        total_revenue = 0.0

        for days_ago in range(45, -1, -1):
            date = NOW - timedelta(days=days_ago)
            weekday = date.weekday()
            multiplier = DAY_MULTIPLIER[weekday]

            # Más ventas conforme pasan los días (negocio creciendo)
            growth = 1.0 + (45 - days_ago) * 0.008
            base_orders = int(random.gauss(18, 4) * multiplier * growth)
            base_orders = max(5, min(base_orders, 40))

            for _ in range(base_orders):
                hour = pick_hour()
                minute = random.randint(0, 59)
                sold_at = date.replace(hour=hour, minute=minute, second=random.randint(0, 59))

                items = pick_products(product_list)
                payment_method, card_type, card_brand, card_category = pick_payment()
                customer = random.choice(CUSTOMERS)

                sale_total = 0.0
                sale_id = gen_uuid()
                sale_items_data = []

                for item in items:
                    qty = random.choices([1, 2, 3], weights=[75, 20, 5], k=1)[0]
                    subtotal = round(item["price"] * qty, 2)
                    sale_total += subtotal
                    sale_items_data.append({
                        "id": gen_uuid(), "sale_id": sale_id,
                        "product_id": item["id"], "quantity": qty, "subtotal": subtotal,
                    })

                sale_total = round(sale_total, 2)
                total_revenue += sale_total
                inv = f"INV-{(45 - days_ago) * 100 + sales_count:05d}"

                conn.execute(text("""
                    INSERT INTO sales (id, user_id, invoice_number, payment_method,
                        card_type, card_brand, card_category, customer_email, total, sold_at)
                    VALUES (:id, :uid, :inv, :pm, :ct, :cb, :cc, :ce, :total, :sold)
                """), {
                    "id": sale_id, "uid": user_id, "inv": inv, "pm": payment_method,
                    "ct": card_type, "cb": card_brand, "cc": card_category,
                    "ce": customer, "total": sale_total, "sold": sold_at,
                })

                for si in sale_items_data:
                    conn.execute(text("""
                        INSERT INTO sale_items (id, sale_id, product_id, quantity, subtotal)
                        VALUES (:id, :sale_id, :product_id, :quantity, :subtotal)
                    """), si)
                    items_count += 1

                sales_count += 1

        # ── Insertar stock/inventario por producto ──
        # Beverages tend to have higher stock (supplies/syrup servings);
        # food & bakery items are perishable, so lower stock.
        STOCK_RANGES = {
            "Bebidas Calientes": (35, 80),
            "Bebidas Frías": (30, 65),
            "Panadería": (8, 25),
            "Comida": (5, 18),
        }
        stock_count = 0
        for prod in product_list:
            low, high = STOCK_RANGES[prod["category"]]
            current_stock = random.randint(low, high)
            conn.execute(text("""
                INSERT INTO product_stock (id, user_id, product_id, current_stock, updated_at)
                VALUES (:id, :uid, :pid, :stock, :updated)
            """), {
                "id": gen_uuid(),
                "uid": user_id,
                "pid": prod["id"],
                "stock": current_stock,
                "updated": NOW,
            })
            stock_count += 1
        print(f"Stock insertado: {stock_count} productos")

        conn.commit()

        print(f"\n{'='*50}")
        print(f"  SEED COMPLETADO - {STORE_NAME}")
        print(f"{'='*50}")
        print(f"  Ventas generadas:  {sales_count}")
        print(f"  Items totales:     {items_count}")
        print(f"  Revenue total:     ${total_revenue:,.2f}")
        print(f"  Stock registrado:  {stock_count} productos")
        print(f"  Período:           últimos 45 días")
        print(f"  Meta mensual:      ${MONTHLY_GOAL:,.2f}")
        print(f"{'='*50}")
        print(f"\n  Login: {EMAIL} / {PASSWORD}")
        print(f"{'='*50}")


if __name__ == "__main__":
    main()
