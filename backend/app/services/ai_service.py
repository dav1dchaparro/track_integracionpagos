"""
Servicio de IA para generar insights de negocio a partir de transacciones.
Usa análisis estadístico + reglas de negocio. Extensible a LLMs (Claude/GPT).
"""
import uuid
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any

from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.models.insight import Insight


# ─────────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────────

def _fetch_transactions(merchant_id: str, period_days: int, db: Session) -> List[Transaction]:
    since = datetime.now(timezone.utc) - timedelta(days=period_days)
    return (
        db.query(Transaction)
        .filter(
            Transaction.merchant_id == merchant_id,
            Transaction.transaction_at >= since,
            Transaction.status == "completed",
        )
        .all()
    )


def _save_insight(merchant_id: str, insight_type: str, title: str, description: str,
                  recommendation: str, value: float, change_percent: float,
                  trend: str, data: Dict[str, Any],
                  period_start: datetime, period_end: datetime,
                  db: Session) -> Insight:
    # Borra el insight anterior del mismo tipo para este merchant
    db.query(Insight).filter(
        Insight.merchant_id == merchant_id,
        Insight.insight_type == insight_type,
    ).delete()

    insight = Insight(
        id=str(uuid.uuid4()),
        merchant_id=merchant_id,
        insight_type=insight_type,
        title=title,
        description=description,
        recommendation=recommendation,
        value=round(value, 2),
        change_percent=round(change_percent, 2),
        trend=trend,
        data=data,
        period_start=period_start,
        period_end=period_end,
    )
    db.add(insight)
    return insight


# ─────────────────────────────────────────────
#  Análisis: Hora pico
# ─────────────────────────────────────────────

def _analyze_peak_hours(transactions: List[Transaction], merchant_id: str,
                         period_start: datetime, period_end: datetime,
                         db: Session) -> Insight:
    hour_data: Dict[int, Dict] = defaultdict(lambda: {"revenue": 0, "count": 0})

    for tx in transactions:
        h = tx.transaction_at.hour
        hour_data[h]["revenue"] += tx.amount
        hour_data[h]["count"] += 1

    if not hour_data:
        return None

    top_hour = max(hour_data, key=lambda h: hour_data[h]["revenue"])
    top_revenue = hour_data[top_hour]["revenue"]
    top_count = hour_data[top_hour]["count"]

    hours_list = [
        {"hour": h, "revenue": round(v["revenue"], 2), "count": v["count"]}
        for h, v in sorted(hour_data.items())
    ]

    if top_hour < 12:
        time_label = f"{top_hour}:00 AM"
    elif top_hour == 12:
        time_label = "12:00 PM"
    else:
        time_label = f"{top_hour - 12}:00 PM"

    return _save_insight(
        merchant_id=merchant_id,
        insight_type="peak_hours",
        title=f"Tu hora pico es las {time_label}",
        description=f"Entre las {time_label} generás ${top_revenue:.2f} con {top_count} transacciones.",
        recommendation=f"Asegurate de tener más personal disponible a las {time_label} para no perder ventas.",
        value=top_revenue,
        change_percent=0,
        trend="stable",
        data={"hours": hours_list, "top_hour": top_hour},
        period_start=period_start,
        period_end=period_end,
        db=db,
    )


# ─────────────────────────────────────────────
#  Análisis: Productos más vendidos
# ─────────────────────────────────────────────

def _analyze_top_products(transactions: List[Transaction], merchant_id: str,
                           period_start: datetime, period_end: datetime,
                           db: Session) -> Insight:
    product_data: Dict[str, Dict] = defaultdict(lambda: {"revenue": 0, "quantity": 0})

    for tx in transactions:
        if tx.items:
            for item in tx.items:
                name = item.get("name", "Desconocido")
                qty = item.get("quantity", 1)
                price = item.get("price", 0)
                product_data[name]["revenue"] += price * qty
                product_data[name]["quantity"] += qty

    if not product_data:
        return None

    sorted_products = sorted(product_data.items(), key=lambda x: x[1]["revenue"], reverse=True)
    top_name, top_stats = sorted_products[0]
    top_revenue = top_stats["revenue"]
    top_quantity = top_stats["quantity"]

    products_list = [
        {"name": name, "revenue": round(stats["revenue"], 2), "quantity": stats["quantity"]}
        for name, stats in sorted_products[:10]
    ]

    return _save_insight(
        merchant_id=merchant_id,
        insight_type="top_products",
        title=f'"{top_name}" es tu producto estrella',
        description=f'"{top_name}" generó ${top_revenue:.2f} con {top_quantity} unidades vendidas en el período.',
        recommendation=f'Asegurate de tener siempre stock de "{top_name}". Considerá crear combos o promociones con este producto.',
        value=top_revenue,
        change_percent=0,
        trend="up",
        data={"products": products_list},
        period_start=period_start,
        period_end=period_end,
        db=db,
    )


# ─────────────────────────────────────────────
#  Análisis: Ticket promedio
# ─────────────────────────────────────────────

def _analyze_average_ticket(transactions: List[Transaction], merchant_id: str,
                              period_start: datetime, period_end: datetime,
                              db: Session) -> Insight:
    if not transactions:
        return None

    amounts = [tx.amount for tx in transactions]
    avg = sum(amounts) / len(amounts)
    max_ticket = max(amounts)
    min_ticket = min(amounts)

    # Segmentación: tickets bajos, medios, altos
    low = sum(1 for a in amounts if a < avg * 0.5)
    mid = sum(1 for a in amounts if avg * 0.5 <= a <= avg * 1.5)
    high = sum(1 for a in amounts if a > avg * 1.5)

    trend = "stable"
    recommendation = f"Tu ticket promedio es ${avg:.2f}. "
    if high > len(amounts) * 0.3:
        trend = "up"
        recommendation += "Muchos clientes gastan más del promedio — considerá un programa de fidelidad VIP."
    elif low > len(amounts) * 0.5:
        trend = "down"
        recommendation += "Más del 50% de tus tickets son bajos — probá crear combos para aumentar el ticket promedio."

    return _save_insight(
        merchant_id=merchant_id,
        insight_type="average_ticket",
        title=f"Ticket promedio: ${avg:.2f}",
        description=f"Tus clientes gastan en promedio ${avg:.2f} por visita. El máximo fue ${max_ticket:.2f}.",
        recommendation=recommendation,
        value=avg,
        change_percent=0,
        trend=trend,
        data={
            "average": round(avg, 2),
            "max": round(max_ticket, 2),
            "min": round(min_ticket, 2),
            "segments": {"low": low, "mid": mid, "high": high},
        },
        period_start=period_start,
        period_end=period_end,
        db=db,
    )


# ─────────────────────────────────────────────
#  Análisis: Día de la semana
# ─────────────────────────────────────────────

def _analyze_best_day(transactions: List[Transaction], merchant_id: str,
                       period_start: datetime, period_end: datetime,
                       db: Session) -> Insight:
    day_names = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    day_data: Dict[int, Dict] = defaultdict(lambda: {"revenue": 0, "count": 0})

    for tx in transactions:
        d = tx.transaction_at.weekday()  # 0=Monday
        day_data[d]["revenue"] += tx.amount
        day_data[d]["count"] += 1

    if not day_data:
        return None

    top_day_num = max(day_data, key=lambda d: day_data[d]["revenue"])
    top_day_name = day_names[top_day_num]
    top_revenue = day_data[top_day_num]["revenue"]
    top_count = day_data[top_day_num]["count"]

    days_list = [
        {"day": day_names[d], "revenue": round(v["revenue"], 2), "count": v["count"]}
        for d, v in sorted(day_data.items())
    ]

    return _save_insight(
        merchant_id=merchant_id,
        insight_type="best_day",
        title=f"Tu mejor día es el {top_day_name}",
        description=f"El {top_day_name} generás ${top_revenue:.2f} con {top_count} transacciones en promedio.",
        recommendation=f"Lanzá promociones los días más flojos para distribuir mejor el tráfico durante la semana.",
        value=top_revenue,
        change_percent=0,
        trend="stable",
        data={"days": days_list, "top_day": top_day_name},
        period_start=period_start,
        period_end=period_end,
        db=db,
    )


# ─────────────────────────────────────────────
#  Análisis: Métodos de pago
# ─────────────────────────────────────────────

def _analyze_payment_methods(transactions: List[Transaction], merchant_id: str,
                               period_start: datetime, period_end: datetime,
                               db: Session) -> Insight:
    method_data: Dict[str, float] = defaultdict(float)
    for tx in transactions:
        method = tx.payment_method or "UNKNOWN"
        method_data[method] += tx.amount

    if not method_data:
        return None

    total = sum(method_data.values())
    top_method = max(method_data, key=method_data.get)
    top_pct = (method_data[top_method] / total * 100) if total > 0 else 0

    methods_list = [
        {"method": m, "revenue": round(v, 2), "percentage": round(v / total * 100, 1)}
        for m, v in sorted(method_data.items(), key=lambda x: x[1], reverse=True)
    ]

    recommendation = f"El {top_pct:.0f}% de tus ventas son con {top_method}."
    if top_method == "CASH" and top_pct > 60:
        recommendation += " Considerá incentivos para pagos digitales — reducen errores y aceleran el cobro."
    elif top_method in ("CREDIT", "CARD") and top_pct > 80:
        recommendation += " Tus clientes prefieren tarjeta — asegurate de tener el terminal siempre disponible."

    return _save_insight(
        merchant_id=merchant_id,
        insight_type="payment_methods",
        title=f"{top_method} domina con {top_pct:.0f}% de tus ventas",
        description=f"El método de pago más usado es {top_method} ({top_pct:.0f}% del revenue total).",
        recommendation=recommendation,
        value=top_pct,
        change_percent=0,
        trend="stable",
        data={"methods": methods_list},
        period_start=period_start,
        period_end=period_end,
        db=db,
    )


# ─────────────────────────────────────────────
#  Función principal
# ─────────────────────────────────────────────

def generate_insights_for_merchant(merchant_id: str, period_days: int, db: Session) -> List[Insight]:
    now = datetime.now(timezone.utc)
    period_start = now - timedelta(days=period_days)

    transactions = _fetch_transactions(merchant_id, period_days, db)

    analyzers = [
        _analyze_peak_hours,
        _analyze_top_products,
        _analyze_average_ticket,
        _analyze_best_day,
        _analyze_payment_methods,
    ]

    generated = []
    for analyzer in analyzers:
        result = analyzer(transactions, merchant_id, period_start, now, db)
        if result:
            generated.append(result)

    db.commit()
    for insight in generated:
        db.refresh(insight)

    return generated
