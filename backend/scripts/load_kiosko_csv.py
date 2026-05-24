"""
ETL completo: carga las 4 fuentes sintéticas generadas por gen_kiosko_v2.py.

Llena las siguientes tablas (todas para el user destino):
  - categories (categoria + subcategoria como rows planas)
  - products (price del CSV)
  - product_categories (N:M)
  - customers (email, name, phone, birthday) ← clientes.csv
  - sales (con customer_id + customer_email + card_category + clover_order_id)
  - sale_items
  - stock_purchases (qty, unit_cost, supplier) ← compras_proveedor.csv
  - product_stock (calculado: stock_inicial + Σ purchases - Σ sales) ← stock_inicial.csv

Uso desde la raíz del repo:
  docker compose exec api python -m scripts.load_kiosko_csv \\
      --sales /app/ventas_kiosko_demo.csv \\
      --customers /app/clientes.csv \\
      --purchases /app/compras_proveedor.csv \\
      --stock /app/stock_inicial.csv \\
      --email kiosko-demo@atlas.com --password demo123
"""
import argparse
import os
import sys
import uuid
from datetime import datetime, timezone

import bcrypt
import pandas as pd
from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import Session, sessionmaker

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models.category import Category
from app.models.customer import Customer
from app.models.product import Product, product_categories
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.stock_purchase import StockPurchase
from app.models.forecasting import ProductStock
from app.models.user import User


def ensure_enum_has_cash(session: Session) -> None:
    try:
        session.execute(text("ALTER TYPE payment_method_enum ADD VALUE IF NOT EXISTS 'cash'"))
        session.commit()
    except Exception:
        session.rollback()


def ensure_user(session: Session, email: str, password: str, store_name: str) -> User:
    user = session.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if user:
        print(f"✓ usuario {email} ya existe (id={user.id})")
        return user
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    user = User(store_name=store_name, email=email, password=hashed, monthly_goal=1500000.0)
    session.add(user)
    session.commit()
    session.refresh(user)
    print(f"✓ usuario {email} creado (id={user.id})")
    return user


def wipe_user_data(session: Session, user_id: uuid.UUID) -> None:
    """Borra todo lo del user respetando orden de FKs."""
    print("Limpiando data previa del usuario...")
    session.execute(text("DELETE FROM marketing_events WHERE user_id = :u"), {"u": user_id})
    session.execute(text("DELETE FROM clover_webhook_events WHERE user_id = :u"), {"u": user_id})
    session.execute(text("""
        DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE user_id = :u)
    """), {"u": user_id})
    session.execute(text("DELETE FROM sales WHERE user_id = :u"), {"u": user_id})
    session.execute(text("DELETE FROM stock_purchases WHERE user_id = :u"), {"u": user_id})
    session.execute(text("DELETE FROM demand_predictions WHERE user_id = :u"), {"u": user_id})
    session.execute(text("DELETE FROM product_stock WHERE user_id = :u"), {"u": user_id})
    session.execute(text("DELETE FROM customers WHERE user_id = :u"), {"u": user_id})
    session.execute(text("""
        DELETE FROM product_categories WHERE product_id IN (SELECT id FROM products WHERE user_id = :u)
    """), {"u": user_id})
    session.execute(text("DELETE FROM products WHERE user_id = :u"), {"u": user_id})
    session.execute(text("DELETE FROM categories WHERE user_id = :u"), {"u": user_id})
    session.commit()
    print("  ✓ data previa borrada")


def load(sales_csv: str, customers_csv: str, purchases_csv: str, stock_csv: str,
         email: str, password: str, store_name: str, chunk_size: int) -> None:

    db_url = os.environ.get("DATABASE_URL", "postgresql+psycopg2://postgres:postgres@postgres:5432/postgres")
    engine = create_engine(db_url)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()

    ensure_enum_has_cash(session)
    user = ensure_user(session, email, password, store_name)
    wipe_user_data(session, user.id)

    # ───────────────────────────────────────────────────────────
    # 1) CLIENTES
    # ───────────────────────────────────────────────────────────
    print(f"\n[1/5] Clientes: {customers_csv}")
    cust_df = pd.read_csv(customers_csv)
    customer_id_by_email: dict[str, uuid.UUID] = {}
    cust_rows = []
    now = datetime.now(timezone.utc)
    for _, r in cust_df.iterrows():
        cid = uuid.uuid4()
        customer_id_by_email[r["email"]] = cid
        cust_rows.append({
            "id": cid, "user_id": user.id,
            "email": r["email"],
            "name": r["name"] if pd.notna(r["name"]) else None,
            "phone": r["phone"] if pd.notna(r["phone"]) else None,
            "birthday": r["birthday"] if pd.notna(r["birthday"]) else None,
            "first_seen_at": now, "last_seen_at": now, "created_at": now,
        })
    session.execute(Customer.__table__.insert(), cust_rows)
    session.commit()
    print(f"  ✓ {len(cust_rows)} clientes cargados")

    # ───────────────────────────────────────────────────────────
    # 2) CATÁLOGO (categorías + productos + product_categories)
    # ───────────────────────────────────────────────────────────
    print(f"\n[2/5] Ventas (preparando catálogo): {sales_csv}")
    df = pd.read_csv(sales_csv)
    df["fecha"] = pd.to_datetime(df["fecha"] + " " + df["hora"], utc=True)
    print(f"  {len(df):,} líneas · {df['invoice_number'].nunique():,} ventas únicas")

    cat_names = pd.unique(pd.concat([df["categoria"], df["subcategoria"]]).dropna())
    cat_id_by_name: dict[str, uuid.UUID] = {}
    for name in cat_names:
        c = Category(user_id=user.id, name=str(name))
        session.add(c)
        session.flush()
        cat_id_by_name[str(name)] = c.id
    session.commit()
    print(f"  ✓ {len(cat_id_by_name)} categorías + subcategorías")

    prod_df = df.groupby("producto").agg(
        price=("precio_unitario", "first"),
        cat=("categoria", "first"),
        subcat=("subcategoria", "first"),
    ).reset_index()
    prod_id_by_name: dict[str, uuid.UUID] = {}
    pc_rows = []
    for _, row in prod_df.iterrows():
        pid = uuid.uuid4()
        session.add(Product(id=pid, user_id=user.id, name=row["producto"], price=float(row["price"])))
        prod_id_by_name[row["producto"]] = pid
        if row["cat"] in cat_id_by_name:
            pc_rows.append({"product_id": pid, "category_id": cat_id_by_name[row["cat"]]})
        if row["subcat"] in cat_id_by_name and row["subcat"] != row["cat"]:
            pc_rows.append({"product_id": pid, "category_id": cat_id_by_name[row["subcat"]]})
    session.commit()
    if pc_rows:
        session.execute(product_categories.insert(), pc_rows)
        session.commit()
    print(f"  ✓ {len(prod_id_by_name)} productos · {len(pc_rows)} links a categorías")

    # ───────────────────────────────────────────────────────────
    # 3) SALES + SALE_ITEMS
    # ───────────────────────────────────────────────────────────
    print("\n[3/5] Cargando ventas + items...")
    sales_buf, items_buf = [], []
    total_inserted = 0

    def flush():
        nonlocal sales_buf, items_buf, total_inserted
        if not sales_buf:
            return
        session.execute(Sale.__table__.insert(), sales_buf)
        session.execute(SaleItem.__table__.insert(), items_buf)
        session.commit()
        total_inserted += len(sales_buf)
        if total_inserted % 10000 == 0 or total_inserted == 0:
            print(f"  · {total_inserted:,} ventas")
        sales_buf, items_buf = [], []

    for invoice, group in df.groupby("invoice_number", sort=False):
        first = group.iloc[0]
        sold_at = first["fecha"].to_pydatetime()
        pm = first["metodo_pago"]
        ct = first["card_type"] if pd.notna(first["card_type"]) and first["card_type"] else None
        cb = first["card_brand"] if pd.notna(first["card_brand"]) and first["card_brand"] else None
        cc = first["card_category"] if pd.notna(first["card_category"]) and first["card_category"] else None
        clv = first["clover_order_id"] if pd.notna(first["clover_order_id"]) and first["clover_order_id"] else None
        email_ = first["customer_email"] if pd.notna(first["customer_email"]) and first["customer_email"] else None
        customer_id = customer_id_by_email.get(email_) if email_ else None
        total = float((group["precio_unitario"] * group["cantidad"]).sum())

        sale_id = uuid.uuid4()
        sales_buf.append({
            "id": sale_id, "user_id": user.id,
            "invoice_number": str(invoice),
            "payment_method": pm, "card_type": ct, "card_brand": cb, "card_category": cc,
            "customer_email": email_, "customer_id": customer_id,
            "clover_order_id": clv,
            "total": total, "sold_at": sold_at,
        })
        for _, r in group.iterrows():
            items_buf.append({
                "id": uuid.uuid4(), "sale_id": sale_id,
                "product_id": prod_id_by_name[r["producto"]],
                "quantity": int(r["cantidad"]),
                "subtotal": float(r["precio_unitario"]) * int(r["cantidad"]),
            })
        if len(sales_buf) >= chunk_size:
            flush()
    flush()
    print(f"  ✓ {total_inserted:,} ventas cargadas")

    # ───────────────────────────────────────────────────────────
    # 4) STOCK PURCHASES
    # ───────────────────────────────────────────────────────────
    print(f"\n[4/5] Compras al proveedor: {purchases_csv}")
    pur_df = pd.read_csv(purchases_csv)
    pur_df["purchased_at"] = pd.to_datetime(pur_df["fecha"] + " " + pur_df["hora"], utc=True)
    pur_rows = []
    for _, r in pur_df.iterrows():
        pid = prod_id_by_name.get(r["producto"])
        if not pid:
            continue
        pur_rows.append({
            "id": uuid.uuid4(), "user_id": user.id, "product_id": pid,
            "quantity": int(r["cantidad"]),
            "unit_cost": float(r["costo_unitario"]),
            "purchased_at": r["purchased_at"].to_pydatetime(),
            "supplier": r["supplier"] if pd.notna(r["supplier"]) else None,
            "notes": r["notes"] if pd.notna(r["notes"]) else None,
        })
    if pur_rows:
        # Chunked insert for big datasets
        for i in range(0, len(pur_rows), chunk_size):
            session.execute(StockPurchase.__table__.insert(), pur_rows[i:i+chunk_size])
            session.commit()
    print(f"  ✓ {len(pur_rows)} compras al proveedor cargadas")

    # ───────────────────────────────────────────────────────────
    # 5) PRODUCT STOCK (calculado)
    #    final = stock_inicial + Σ purchases - Σ sales
    # ───────────────────────────────────────────────────────────
    print(f"\n[5/5] Stock final calculado: stock_inicial + compras - ventas")
    stock_df = pd.read_csv(stock_csv)
    initial_by_prod = dict(zip(stock_df["producto"], stock_df["stock_inicial"]))

    purchased_by_prod: dict[str, int] = {}
    for _, r in pur_df.iterrows():
        purchased_by_prod[r["producto"]] = purchased_by_prod.get(r["producto"], 0) + int(r["cantidad"])

    sold_by_prod: dict[str, int] = {}
    for _, r in df.iterrows():
        sold_by_prod[r["producto"]] = sold_by_prod.get(r["producto"], 0) + int(r["cantidad"])

    stock_rows = []
    for prod_name, pid in prod_id_by_name.items():
        initial = int(initial_by_prod.get(prod_name, 0))
        purchased = purchased_by_prod.get(prod_name, 0)
        sold = sold_by_prod.get(prod_name, 0)
        current = initial + purchased - sold
        stock_rows.append({
            "id": uuid.uuid4(), "user_id": user.id, "product_id": pid,
            "current_stock": current, "updated_at": datetime.now(timezone.utc),
        })
    session.execute(ProductStock.__table__.insert(), stock_rows)
    session.commit()
    print(f"  ✓ {len(stock_rows)} filas en product_stock")

    # Reporte rápido
    pos = sum(1 for r in stock_rows if r["current_stock"] >= 0)
    neg = sum(1 for r in stock_rows if r["current_stock"] < 0)
    print(f"    Stock positivo: {pos} · Stock cero o negativo (señal de stockout): {neg}")
    print(f"\n✓ FIN — todo cargado bajo {email}")
    session.close()


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--sales",     default="/app/ventas_kiosko_demo.csv")
    p.add_argument("--customers", default="/app/clientes.csv")
    p.add_argument("--purchases", default="/app/compras_proveedor.csv")
    p.add_argument("--stock",     default="/app/stock_inicial.csv")
    p.add_argument("--email", default="kiosko-demo@atlas.com")
    p.add_argument("--password", default="demo123")
    p.add_argument("--store-name", default="Kiosko Demo")
    p.add_argument("--chunk-size", type=int, default=2000)
    args = p.parse_args()
    load(args.sales, args.customers, args.purchases, args.stock,
         args.email, args.password, args.store_name, args.chunk_size)
