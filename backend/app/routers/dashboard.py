from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
from typing import Dict, Any

from app.database import get_db
from app.models.transaction import Transaction
from app.schemas.insight import DashboardResponse

router = APIRouter()


@router.get("/{merchant_id}", response_model=DashboardResponse)
def get_dashboard(
    merchant_id: str,
    period_days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    period_start = now - timedelta(days=period_days)
    prev_period_start = period_start - timedelta(days=period_days)

    # Transacciones del período actual
    current_txs = (
        db.query(Transaction)
        .filter(
            Transaction.merchant_id == merchant_id,
            Transaction.transaction_at >= period_start,
            Transaction.status == "completed",
        )
        .all()
    )

    # Transacciones del período anterior (para comparar)
    prev_txs = (
        db.query(Transaction)
        .filter(
            Transaction.merchant_id == merchant_id,
            Transaction.transaction_at >= prev_period_start,
            Transaction.transaction_at < period_start,
            Transaction.status == "completed",
        )
        .all()
    )

    total_revenue = sum(tx.amount for tx in current_txs)
    prev_revenue = sum(tx.amount for tx in prev_txs)
    total_transactions = len(current_txs)
    average_ticket = total_revenue / total_transactions if total_transactions > 0 else 0

    revenue_change = 0.0
    if prev_revenue > 0:
        revenue_change = ((total_revenue - prev_revenue) / prev_revenue) * 100

    # Hora pico
    hour_revenue: Dict[int, float] = {}
    for tx in current_txs:
        h = tx.transaction_at.hour
        hour_revenue[h] = hour_revenue.get(h, 0) + tx.amount
    top_hour = max(hour_revenue, key=hour_revenue.get) if hour_revenue else 0
    top_hour_revenue = hour_revenue.get(top_hour, 0)

    # Productos más vendidos
    product_sales: Dict[str, Dict[str, Any]] = {}
    for tx in current_txs:
        if tx.items:
            for item in tx.items:
                name = item.get("name", "Unknown")
                if name not in product_sales:
                    product_sales[name] = {"name": name, "quantity": 0, "revenue": 0}
                product_sales[name]["quantity"] += item.get("quantity", 1)
                product_sales[name]["revenue"] += item.get("price", 0) * item.get("quantity", 1)

    top_products = sorted(product_sales.values(), key=lambda x: x["revenue"], reverse=True)[:5]

    # Métodos de pago
    payment_methods: Dict[str, float] = {}
    for tx in current_txs:
        method = tx.payment_method or "UNKNOWN"
        payment_methods[method] = payment_methods.get(method, 0) + tx.amount

    # Revenue diario (últimos N días)
    daily_revenue: Dict[str, float] = {}
    for tx in current_txs:
        day = tx.transaction_at.strftime("%Y-%m-%d")
        daily_revenue[day] = daily_revenue.get(day, 0) + tx.amount
    daily_revenue_list = [
        {"date": k, "revenue": v} for k, v in sorted(daily_revenue.items())
    ]

    return DashboardResponse(
        merchant_id=merchant_id,
        period=f"last_{period_days}_days",
        total_revenue=round(total_revenue, 2),
        total_transactions=total_transactions,
        average_ticket=round(average_ticket, 2),
        revenue_change_percent=round(revenue_change, 2),
        top_hour=top_hour,
        top_hour_revenue=round(top_hour_revenue, 2),
        top_products=top_products,
        payment_methods=payment_methods,
        daily_revenue=daily_revenue_list,
        insights=[],
    )
