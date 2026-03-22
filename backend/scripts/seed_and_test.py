"""
Seed script — genera 8 semanas de ventas simuladas y prueba el modelo ML.

Uso:
    cd backend
    python scripts/seed_and_test.py

Requiere que el server esté corriendo en http://localhost:8000
"""

import random
from datetime import datetime, timedelta, timezone

import httpx

BASE_URL = "http://localhost:8000"
EMAIL = "test_ml@tienda.com"
PASSWORD = "password123"
STORE_NAME = "Tienda Demo ML"

PRODUCTS = [
    {"name": "Aceite girasol 1L",    "price": 2500, "stock": 8,  "demand": (30, 15)},
    {"name": "Arroz 1kg",            "price": 1200, "stock": 20, "demand": (50, 10)},
    {"name": "Harina 1kg",           "price": 900,  "stock": 5,  "demand": (40, 12)},
    {"name": "Azúcar 1kg",           "price": 800,  "stock": 15, "demand": (35, 8)},
    {"name": "Yerba 500g",           "price": 1800, "stock": 3,  "demand": (20, 6)},
    {"name": "Leche entera 1L",      "price": 700,  "stock": 10, "demand": (60, 20)},
    {"name": "Fideos spaghetti 500g","price": 600,  "stock": 0,  "demand": (45, 10)},
    {"name": "Sal fina 1kg",         "price": 400,  "stock": 12, "demand": (10, 3)},
]

CATEGORY_NAME = "Almacén"


def step(msg: str):
    print(f"\n{'─'*50}\n▶  {msg}")


def ok(msg: str):
    print(f"   ✓ {msg}")


def warn(msg: str):
    print(f"   ⚠  {msg}")


def register_or_login(client: httpx.Client) -> str:
    # Try register first
    r = client.post("/auth/register", json={
        "store_name": STORE_NAME,
        "email": EMAIL,
        "password": PASSWORD,
    })
    if r.status_code not in (200, 201):
        warn("Usuario ya existe, haciendo login...")

    r = client.post("/auth/login", json={"email": EMAIL, "password": PASSWORD})
    r.raise_for_status()
    token = r.json()["access_token"]
    ok(f"Autenticado como {EMAIL}")
    return token


def create_category(client: httpx.Client, headers: dict) -> str:
    r = client.post("/categories/", json={"name": CATEGORY_NAME}, headers=headers)
    if r.status_code in (200, 201):
        cat_id = r.json()["id"]
        ok(f"Categoría '{CATEGORY_NAME}' creada: {cat_id}")
    else:
        # Already exists — fetch it
        cats = client.get("/categories/", headers=headers).json()
        cat_id = next(c["id"] for c in cats if c["name"] == CATEGORY_NAME)
        ok(f"Categoría '{CATEGORY_NAME}' ya existía: {cat_id}")
    return cat_id


def create_products(client: httpx.Client, headers: dict, cat_id: str) -> list[dict]:
    step("Creando productos...")
    existing = {p["name"]: p for p in client.get("/products/", headers=headers).json()}
    created = []

    for p in PRODUCTS:
        if p["name"] in existing:
            prod = existing[p["name"]]
            ok(f"Ya existe: {prod['name']} ({prod['id']})")
        else:
            r = client.post("/products/", json={"name": p["name"], "price": p["price"]}, headers=headers)
            r.raise_for_status()
            prod = r.json()
            # Assign category
            client.put(f"/products/{prod['id']}/categories", json={"category_ids": [cat_id]}, headers=headers)
            ok(f"Creado: {prod['name']} ({prod['id']})")

        created.append({**p, "id": prod["id"]})

    return created


def seed_sales(client: httpx.Client, headers: dict, products: list[dict]):
    step("Generando 8 semanas de ventas simuladas...")
    now = datetime.now(timezone.utc)
    count = 0

    for weeks_ago in range(8, 0, -1):
        week_start = now - timedelta(weeks=weeks_ago)

        # 3-5 sales per day, Mon-Sat
        for day_offset in range(6):
            day = week_start + timedelta(days=day_offset)
            n_sales = random.randint(3, 5)

            for _ in range(n_sales):
                # Pick 1-3 random products for this sale
                sale_products = random.sample(products, k=random.randint(1, 3))
                items = []
                for sp in sale_products:
                    mean, std = sp["demand"]
                    # Daily quantity = weekly demand / 6 days
                    qty = max(1, round(random.gauss(mean / 6, std / 6)))
                    items.append({"product_id": sp["id"], "quantity": qty})

                sold_at = (day + timedelta(hours=random.randint(8, 20))).isoformat()

                r = client.post("/sales/", json={
                    "invoice_number": f"INV-{count:05d}",
                    "payment_method": random.choice(["card", "qr"]),
                    "card_type": random.choice(["credit", "debit", None]),
                    "card_brand": random.choice(["visa", "mastercard", None]),
                    "sold_at": sold_at,
                    "items": items,
                }, headers=headers)

                if r.status_code in (200, 201):
                    count += 1

    ok(f"{count} ventas creadas en 8 semanas")


def update_stock(client: httpx.Client, headers: dict, products: list[dict]):
    step("Cargando stock actual...")
    for p in products:
        r = client.put(
            f"/forecasting/stock/{p['id']}",
            json={"current_stock": p["stock"]},
            headers=headers,
        )
        if r.status_code in (200, 201):
            ok(f"{p['name']}: stock = {p['stock']} unidades")


def run_forecast(client: httpx.Client, headers: dict):
    step("Corriendo modelo ML → GET /forecasting/recommendations")
    r = client.get("/forecasting/recommendations", headers=headers, timeout=60)
    r.raise_for_status()
    data = r.json()

    print(f"\n   Modelo: {'XGBoost ✓' if any(x['model_type'] == 'xgboost' for x in data['recommendations']) else 'Promedio (pocos datos)'}")
    print(f"   Semanas de datos: {data['data_weeks_available']}")
    print(f"   Productos analizados: {data['total_products_analyzed']}")
    print(f"\n{'═'*60}")
    print(f"  {'PRODUCTO':<28} {'STOCK':>6} {'PRED':>6} {'COMPRAR':>8} {'ALERTA'}")
    print(f"{'─'*60}")

    for rec in data["recommendations"]:
        alert_icon = {"critico": "🔴", "moderado": "🟡", "ok": "🟢"}.get(rec["alert"], "")
        print(
            f"  {rec['product_name']:<28}"
            f"  {rec['current_stock']:>4}"
            f"  {rec['predicted_demand_7d']:>6}"
            f"  {rec['recommended_purchase']:>7}"
            f"   {alert_icon} {rec['alert']}"
        )

    print(f"{'═'*60}")
    print(f"\n  Período: {data['recommendations'][0]['period_start']} → {data['recommendations'][0]['period_end']}" if data["recommendations"] else "")


def main():
    print("\n🚀  SmartStock — Seed & Test ML")
    print(f"    Server: {BASE_URL}\n")

    with httpx.Client(base_url=BASE_URL, timeout=30) as client:
        # Health check
        try:
            client.get("/health").raise_for_status()
            ok("Server OK")
        except Exception:
            print("\n❌ No se puede conectar al server. ¿Está corriendo en localhost:8000?\n")
            return

        step("Autenticación")
        token = register_or_login(client)
        headers = {"Authorization": f"Bearer {token}"}

        step("Creando categoría")
        cat_id = create_category(client, headers)

        products = create_products(client, headers, cat_id)
        seed_sales(client, headers, products)
        update_stock(client, headers, products)
        run_forecast(client, headers)

    print("\n✅  Listo. Podés ver más detalles en http://localhost:8000/docs\n")


if __name__ == "__main__":
    main()
