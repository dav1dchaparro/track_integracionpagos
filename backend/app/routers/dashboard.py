from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.category import Category
from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

PERIOD_DAYS = {
    "today": 0,
    "week": 7,
    "month": 30,
    "year": 365,
}


@router.get("/summary")
def summary(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    period: str = Query("month", enum=list(PERIOD_DAYS.keys())),
):
    now = datetime.now(timezone.utc)
    days = PERIOD_DAYS[period]
    if days == 0:
        since = now.replace(hour=0, minute=0, second=0, microsecond=0)
    else:
        since = now - timedelta(days=days)

    # KPIs
    sales_query = select(Sale).where(Sale.user_id == user.id, Sale.sold_at >= since)
    sales = db.execute(sales_query).unique().scalars().all()

    total_revenue = sum(float(s.total) for s in sales)
    total_orders = len(sales)
    avg_ticket = total_revenue / total_orders if total_orders else 0

    # Previous period KPIs
    if days == 0:
        prev_since = since - timedelta(days=1)
    else:
        prev_since = since - timedelta(days=days)

    prev_sales = db.execute(
        select(Sale).where(
            Sale.user_id == user.id,
            Sale.sold_at >= prev_since,
            Sale.sold_at < since,
        )
    ).unique().scalars().all()

    prev_revenue = sum(float(s.total) for s in prev_sales)
    prev_orders = len(prev_sales)
    prev_avg_ticket = prev_revenue / prev_orders if prev_orders else 0

    def pct_change(curr: float, prev: float):
        if prev == 0:
            return None
        return round((curr - prev) / prev * 100, 1)

    kpi_changes = {
        "total_revenue": pct_change(total_revenue, prev_revenue),
        "total_orders": pct_change(total_orders, prev_orders),
        "avg_ticket": pct_change(avg_ticket, prev_avg_ticket),
    }

    # Payment method breakdown
    payment_methods = defaultdict(lambda: {"count": 0, "total": 0})
    for s in sales:
        payment_methods[s.payment_method]["count"] += 1
        payment_methods[s.payment_method]["total"] += float(s.total)

    # Card brand breakdown
    card_brands = defaultdict(lambda: {"count": 0, "total": 0})
    for s in sales:
        if s.card_brand:
            card_brands[s.card_brand]["count"] += 1
            card_brands[s.card_brand]["total"] += float(s.total)

    # Sales over time (by date)
    sales_by_date = defaultdict(lambda: {"count": 0, "total": 0})
    for s in sales:
        date_key = s.sold_at.strftime("%Y-%m-%d")
        sales_by_date[date_key]["count"] += 1
        sales_by_date[date_key]["total"] += float(s.total)

    sales_timeline = [
        {"date": k, "count": v["count"], "total": round(v["total"], 2)}
        for k, v in sorted(sales_by_date.items())
    ]

    # Top products by revenue
    item_query = (
        select(
            SaleItem.product_id,
            func.sum(SaleItem.subtotal).label("revenue"),
            func.sum(SaleItem.quantity).label("units"),
        )
        .join(Sale, Sale.id == SaleItem.sale_id)
        .where(Sale.user_id == user.id, Sale.sold_at >= since)
        .group_by(SaleItem.product_id)
        .order_by(func.sum(SaleItem.subtotal).desc())
        .limit(10)
    )
    top_items = db.execute(item_query).all()

    product_ids = [row.product_id for row in top_items]
    products_map = {}
    if product_ids:
        prods = db.execute(select(Product).where(Product.id.in_(product_ids))).unique().scalars().all()
        products_map = {p.id: p for p in prods}

    top_products = []
    for row in top_items:
        prod = products_map.get(row.product_id)
        top_products.append({
            "id": str(row.product_id),
            "name": prod.name if prod else "Desconocido",
            "revenue": round(float(row.revenue), 2),
            "units": int(row.units),
            "categories": [c.name for c in prod.categories] if prod else [],
        })

    # Category breakdown (from sale items)
    cat_revenue = defaultdict(float)
    for row in top_items:
        prod = products_map.get(row.product_id)
        if prod:
            for cat in prod.categories:
                cat_revenue[cat.name] += float(row.revenue)

    category_breakdown = [
        {"name": k, "revenue": round(v, 2)}
        for k, v in sorted(cat_revenue.items(), key=lambda x: -x[1])
    ]

    # Counts
    total_products = db.execute(
        select(func.count()).select_from(Product).where(Product.user_id == user.id)
    ).scalar()
    total_categories = db.execute(
        select(func.count()).select_from(Category).where(Category.user_id == user.id)
    ).scalar()

    # Customer metrics
    emails = [s.customer_email for s in sales if s.customer_email]
    unique_customers = len(set(emails))
    email_counts: dict = defaultdict(int)
    for e in emails:
        email_counts[e] += 1
    returning_customers = sum(1 for c in email_counts.values() if c > 1)
    return_rate = round(returning_customers / unique_customers * 100, 1) if unique_customers else 0

    top_customers = sorted(
        [
            {
                "email": e,
                "orders": email_counts[e],
                "total": round(sum(float(s.total) for s in sales if s.customer_email == e), 2),
            }
            for e in set(emails)
        ],
        key=lambda x: -x["total"],
    )[:5]

    return {
        "period": period,
        "kpis": {
            "total_revenue": round(total_revenue, 2),
            "total_orders": total_orders,
            "avg_ticket": round(avg_ticket, 2),
            "total_products": total_products,
            "total_categories": total_categories,
            "unique_customers": unique_customers,
            "return_rate": return_rate,
        },
        "kpi_changes": kpi_changes,
        "payment_methods": {
            k: {"count": v["count"], "total": round(v["total"], 2)}
            for k, v in payment_methods.items()
        },
        "card_brands": {
            k: {"count": v["count"], "total": round(v["total"], 2)}
            for k, v in card_brands.items()
        },
        "sales_timeline": sales_timeline,
        "top_products": top_products,
        "category_breakdown": category_breakdown,
        "top_customers": top_customers,
    }
