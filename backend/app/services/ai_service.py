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

def _hour_label(h: int) -> str:
    """Convierte una hora (0-23) a formato legible: '8:00 AM', '12:00 PM', '3:00 PM'."""
    if h == 0:
        return "12:00 AM"
    elif h < 12:
        return f"{h}:00 AM"
    elif h == 12:
        return "12:00 PM"
    else:
        return f"{h - 12}:00 PM"


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

    # Ordenar horas por revenue para identificar picos y valles
    sorted_hours = sorted(hour_data.items(), key=lambda x: x[1]["revenue"], reverse=True)
    top_hour, top_stats = sorted_hours[0]
    top_revenue = top_stats["revenue"]
    top_count = top_stats["count"]
    top_label = _hour_label(top_hour)

    # Segundo pico (si existe y tiene al menos 50% del revenue del primero)
    second_peak_label = None
    if len(sorted_hours) >= 2:
        second_hour, second_stats = sorted_hours[1]
        if second_stats["revenue"] >= top_revenue * 0.5:
            second_peak_label = _hour_label(second_hour)
            second_revenue = second_stats["revenue"]

    # Ventana de preparación: 1 hora antes del pico principal
    prep_hour = (top_hour - 1) % 24
    prep_label = _hour_label(prep_hour)

    # Horas muertas: revenue < 5% del pico principal
    dead_hours = [
        _hour_label(h) for h, v in hour_data.items()
        if v["revenue"] < top_revenue * 0.05
    ]

    hours_list = [
        {"hour": h, "revenue": round(v["revenue"], 2), "count": v["count"]}
        for h, v in sorted(hour_data.items())
    ]

    # Armar recomendación específica y accionable
    if second_peak_label:
        description = (
            f"Tenés dos picos de venta: {top_label} (${top_revenue:.2f}, {top_count} tx) "
            f"y {second_peak_label} (${second_revenue:.2f})."
        )
        recommendation = (
            f"Preparate antes de cada pico: tené todo listo a las {prep_label} para recibir "
            f"el rush de las {top_label}. También reforzá personal a las {second_peak_label}. "
        )
    else:
        description = (
            f"Tu hora pico es las {top_label}: generás ${top_revenue:.2f} "
            f"con {top_count} transacciones."
        )
        recommendation = (
            f"Tené el equipo completo y el stock preparado desde las {prep_label} "
            f"para no perder ventas en tu hora pico ({top_label}). "
        )

    if dead_hours:
        dead_str = ", ".join(dead_hours[:3])
        recommendation += (
            f"Las horas {dead_str} tienen muy pocas ventas — podés reducir personal "
            f"o usarlas para preparación y limpieza."
        )

    return _save_insight(
        merchant_id=merchant_id,
        insight_type="peak_hours",
        title=f"Tu hora pico es las {top_label}",
        description=description,
        recommendation=recommendation,
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
    # Precio unitario promedio del producto estrella
    top_unit_price = top_revenue / top_quantity if top_quantity > 0 else 0

    products_list = [
        {
            "name": name,
            "revenue": round(stats["revenue"], 2),
            "quantity": stats["quantity"],
            "unit_price": round(stats["revenue"] / stats["quantity"], 2) if stats["quantity"] > 0 else 0,
        }
        for name, stats in sorted_products[:10]
    ]

    # Segundo producto más vendido para sugerir combo específico
    combo_recommendation = ""
    if len(sorted_products) >= 2:
        second_name, second_stats = sorted_products[1]
        second_revenue = second_stats["revenue"]
        second_unit_price = second_stats["revenue"] / second_stats["quantity"] if second_stats["quantity"] > 0 else 0
        combo_price = round(top_unit_price + second_unit_price, 2)
        # Descuento del 10% para que el combo sea atractivo
        discounted_combo = round(combo_price * 0.90, 2)
        revenue_gap_pct = ((top_revenue - second_revenue) / second_revenue * 100) if second_revenue > 0 else 0

        combo_recommendation = (
            f' Creá un combo "{top_name} + {second_name}" a ${discounted_combo:.2f} '
            f"(10% off sobre el precio individual de ${combo_price:.2f}) — "
            f"aumenta el ticket y empuja las ventas de tu segundo producto más rentable."
        )

        if revenue_gap_pct > 50:
            combo_recommendation += (
                f' "{top_name}" genera {revenue_gap_pct:.0f}% más que "{second_name}" — '
                f"considerá promover más {second_name} con un descuento puntual para equilibrar el mix."
            )

    # Sugerencia de pricing si el precio unitario es muy bajo
    pricing_tip = ""
    if top_unit_price < 5:
        pricing_tip = (
            f' "{top_name}" tiene un precio unitario de ${top_unit_price:.2f} — '
            f"subir $0.50 por unidad agregaría ${top_quantity * 0.50:.2f} de revenue extra al período."
        )

    recommendation = (
        f'Asegurate de tener siempre stock de "{top_name}" — es tu mayor fuente de ingresos '
        f"con ${top_revenue:.2f} en {top_quantity} unidades."
        f"{combo_recommendation}{pricing_tip}"
    )

    return _save_insight(
        merchant_id=merchant_id,
        insight_type="top_products",
        title=f'"{top_name}" es tu producto estrella',
        description=f'"{top_name}" generó ${top_revenue:.2f} con {top_quantity} unidades vendidas en el período.',
        recommendation=recommendation,
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

    # Día más flojo
    worst_day_num = min(day_data, key=lambda d: day_data[d]["revenue"])
    worst_day_name = day_names[worst_day_num]
    worst_revenue = day_data[worst_day_num]["revenue"]
    revenue_gap = top_revenue - worst_revenue
    gap_pct = (revenue_gap / worst_revenue * 100) if worst_revenue > 0 else 0

    days_list = [
        {"day": day_names[d], "revenue": round(v["revenue"], 2), "count": v["count"]}
        for d, v in sorted(day_data.items())
    ]

    # En español, Lunes/Martes/Miércoles/Jueves/Viernes no cambian en plural
    invariable_days = {"Lunes", "Martes", "Miércoles", "Jueves", "Viernes"}
    top_day_plural = top_day_name if top_day_name in invariable_days else f"{top_day_name}s"

    recommendation = (
        f"Reforzá stock y personal los {top_day_plural} — es tu día más rentable (${top_revenue:.2f}). "
        f"El {worst_day_name} es tu día más flojo (${worst_revenue:.2f}, "
        f"{gap_pct:.0f}% menos que el {top_day_name}): "
        f"lanzá una promoción exclusiva ese día para atraer más clientes."
    )

    return _save_insight(
        merchant_id=merchant_id,
        insight_type="best_day",
        title=f"Tu mejor día es el {top_day_name}",
        description=f"El {top_day_name} generás ${top_revenue:.2f} con {top_count} transacciones. El más flojo es el {worst_day_name} (${worst_revenue:.2f}).",
        recommendation=recommendation,
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
