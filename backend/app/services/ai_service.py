"""
AI insight engine — generates business insights from sales data.
5 analyzers: peak hours, top products, average ticket, best day, payment methods.
"""
import uuid
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.product import Product
from app.models.insight import Insight


# ─── Helpers ───────────────────────────────────────────────────

def _fetch_sales(user_id: uuid.UUID, period_days: int, db: Session) -> list[Sale]:
    since = datetime.now(timezone.utc) - timedelta(days=period_days)
    result = db.execute(
        select(Sale).where(Sale.user_id == user_id, Sale.sold_at >= since)
    )
    return result.unique().scalars().all()


def _save(user_id, insight_type, title, description, recommendation,
          value, change_percent, trend, data, period_start, period_end, db) -> Insight:
    # Remove previous insight of same type for this user
    old = db.execute(
        select(Insight).where(Insight.user_id == user_id, Insight.insight_type == insight_type)
    ).scalars().all()
    for o in old:
        db.delete(o)

    insight = Insight(
        user_id=user_id,
        insight_type=insight_type,
        title=title,
        description=description,
        recommendation=recommendation,
        value=round(value, 2) if value else None,
        change_percent=round(change_percent, 2) if change_percent else None,
        trend=trend,
        data=data,
        period_start=period_start,
        period_end=period_end,
    )
    db.add(insight)
    return insight


# ─── Peak Hours ────────────────────────────────────────────────

def _analyze_peak_hours(sales, user_id, period_start, period_end, db):
    hour_data = defaultdict(lambda: {"revenue": 0, "count": 0})
    for s in sales:
        h = s.sold_at.hour
        hour_data[h]["revenue"] += float(s.total)
        hour_data[h]["count"] += 1

    if not hour_data:
        return None

    top_hour = max(hour_data, key=lambda h: hour_data[h]["revenue"])
    top_rev = hour_data[top_hour]["revenue"]
    top_count = hour_data[top_hour]["count"]

    hours_list = [{"hour": h, "revenue": round(v["revenue"], 2), "count": v["count"]}
                  for h, v in sorted(hour_data.items())]

    label = f"{top_hour}:00" if top_hour < 12 else f"{top_hour}:00"

    return _save(
        user_id, "peak_hours",
        f"Tu hora pico es las {label}",
        f"A las {label} generás ${top_rev:.2f} con {top_count} ventas.",
        f"Asegurate de tener más personal a las {label} para no perder ventas.",
        top_rev, 0, "stable",
        {"hours": hours_list, "top_hour": top_hour},
        period_start, period_end, db,
    )


# ─── Top Products ─────────────────────────────────────────────

def _analyze_top_products(sales, user_id, period_start, period_end, db):
    product_data = defaultdict(lambda: {"revenue": 0, "quantity": 0})

    # Aggregate from SaleItems
    for s in sales:
        for item in (s.items or []):
            prod = item.product
            name = prod.name if prod else "Desconocido"
            product_data[name]["revenue"] += float(item.subtotal)
            product_data[name]["quantity"] += item.quantity

    if not product_data:
        return None

    sorted_prods = sorted(product_data.items(), key=lambda x: x[1]["revenue"], reverse=True)
    top_name, top_stats = sorted_prods[0]

    products_list = [{"name": n, "revenue": round(s["revenue"], 2), "quantity": s["quantity"]}
                     for n, s in sorted_prods[:10]]

    return _save(
        user_id, "top_products",
        f'"{top_name}" es tu producto estrella',
        f'"{top_name}" generó ${top_stats["revenue"]:.2f} con {top_stats["quantity"]} unidades.',
        f'Asegurate de tener stock de "{top_name}". Considerá crear combos con este producto.',
        top_stats["revenue"], 0, "up",
        {"products": products_list},
        period_start, period_end, db,
    )


# ─── Average Ticket ───────────────────────────────────────────

def _analyze_average_ticket(sales, user_id, period_start, period_end, db):
    if not sales:
        return None

    amounts = [float(s.total) for s in sales]
    avg = sum(amounts) / len(amounts)
    max_ticket = max(amounts)
    min_ticket = min(amounts)

    low = sum(1 for a in amounts if a < avg * 0.5)
    mid = sum(1 for a in amounts if avg * 0.5 <= a <= avg * 1.5)
    high = sum(1 for a in amounts if a > avg * 1.5)

    trend = "stable"
    rec = f"Tu ticket promedio es ${avg:.2f}. "
    if high > len(amounts) * 0.3:
        trend = "up"
        rec += "Muchos clientes gastan más del promedio — considerá un programa de fidelidad VIP."
    elif low > len(amounts) * 0.5:
        trend = "down"
        rec += "Más del 50% de tus tickets son bajos — probá crear combos para subir el ticket."

    return _save(
        user_id, "average_ticket",
        f"Ticket promedio: ${avg:.2f}",
        f"Tus clientes gastan en promedio ${avg:.2f}. Máximo: ${max_ticket:.2f}.",
        rec, avg, 0, trend,
        {"average": round(avg, 2), "max": round(max_ticket, 2), "min": round(min_ticket, 2),
         "segments": {"low": low, "mid": mid, "high": high}},
        period_start, period_end, db,
    )


# ─── Best Day ─────────────────────────────────────────────────

def _analyze_best_day(sales, user_id, period_start, period_end, db):
    day_names = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    day_data = defaultdict(lambda: {"revenue": 0, "count": 0})

    for s in sales:
        d = s.sold_at.weekday()
        day_data[d]["revenue"] += float(s.total)
        day_data[d]["count"] += 1

    if not day_data:
        return None

    top_day = max(day_data, key=lambda d: day_data[d]["revenue"])
    top_name = day_names[top_day]
    top_rev = day_data[top_day]["revenue"]
    top_count = day_data[top_day]["count"]

    days_list = [{"day": day_names[d], "revenue": round(v["revenue"], 2), "count": v["count"]}
                 for d, v in sorted(day_data.items())]

    return _save(
        user_id, "best_day",
        f"Tu mejor día es el {top_name}",
        f"El {top_name} generás ${top_rev:.2f} con {top_count} ventas.",
        "Lanzá promociones los días más flojos para distribuir mejor el tráfico.",
        top_rev, 0, "stable",
        {"days": days_list, "top_day": top_name},
        period_start, period_end, db,
    )


# ─── Payment Methods ──────────────────────────────────────────

def _analyze_payment_methods(sales, user_id, period_start, period_end, db):
    method_data = defaultdict(float)
    for s in sales:
        method_data[s.payment_method] += float(s.total)

    if not method_data:
        return None

    total = sum(method_data.values())
    top_method = max(method_data, key=method_data.get)
    top_pct = (method_data[top_method] / total * 100) if total > 0 else 0

    methods_list = [{"method": m, "revenue": round(v, 2), "percentage": round(v / total * 100, 1)}
                    for m, v in sorted(method_data.items(), key=lambda x: x[1], reverse=True)]

    rec = f"El {top_pct:.0f}% de tus ventas son con {top_method}."
    if top_method == "cash" and top_pct > 60:
        rec += " Considerá incentivos para pagos digitales."
    elif top_method in ("card", "credit") and top_pct > 80:
        rec += " Tus clientes prefieren tarjeta — asegurate de tener el terminal disponible."

    return _save(
        user_id, "payment_methods",
        f"{top_method.upper()} domina con {top_pct:.0f}% de tus ventas",
        f"El método más usado es {top_method} ({top_pct:.0f}% del revenue).",
        rec, top_pct, 0, "stable",
        {"methods": methods_list},
        period_start, period_end, db,
    )


# ─── Main entry point ─────────────────────────────────────────

def generate_insights(user_id: uuid.UUID, period_days: int, db: Session) -> list[Insight]:
    """Generate all 5 insight types for a user based on their sales."""
    now = datetime.now(timezone.utc)
    period_start = now - timedelta(days=period_days)

    sales = _fetch_sales(user_id, period_days, db)

    analyzers = [
        _analyze_peak_hours,
        _analyze_top_products,
        _analyze_average_ticket,
        _analyze_best_day,
        _analyze_payment_methods,
    ]

    generated = []
    for analyzer in analyzers:
        result = analyzer(sales, user_id, period_start, now, db)
        if result:
            generated.append(result)

    db.commit()
    for insight in generated:
        db.refresh(insight)

    return generated
