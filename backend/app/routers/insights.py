from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from groq import Groq
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.user import User

router = APIRouter(prefix="/insights", tags=["insights"])

PERIOD_DAYS = {"today": 0, "week": 7, "month": 30, "year": 365}


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    question: str
    period: str = "month"
    history: list[ChatMessage] = []


@router.post("/chat")
async def chat(
    req: ChatRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    days = PERIOD_DAYS.get(req.period, 30)
    now = datetime.now(timezone.utc)
    since = (
        now.replace(hour=0, minute=0, second=0, microsecond=0)
        if days == 0
        else now - timedelta(days=days)
    )

    sales = db.execute(
        select(Sale).where(Sale.user_id == user.id, Sale.sold_at >= since)
    ).unique().scalars().all()

    total_revenue = sum(float(s.total) for s in sales)
    total_orders = len(sales)
    avg_ticket = total_revenue / total_orders if total_orders else 0

    payment_methods: dict = defaultdict(lambda: {"count": 0, "total": 0.0})
    for s in sales:
        payment_methods[s.payment_method]["count"] += 1
        payment_methods[s.payment_method]["total"] += float(s.total)

    top_items = db.execute(
        select(SaleItem.product_id, func.sum(SaleItem.subtotal).label("revenue"))
        .join(Sale, Sale.id == SaleItem.sale_id)
        .where(Sale.user_id == user.id, Sale.sold_at >= since)
        .group_by(SaleItem.product_id)
        .order_by(func.sum(SaleItem.subtotal).desc())
        .limit(5)
    ).all()

    products_map: dict = {}
    if top_items:
        prods = db.execute(
            select(Product).where(Product.id.in_([r.product_id for r in top_items]))
        ).unique().scalars().all()
        products_map = {p.id: p.name for p in prods}

    top_products_str = ", ".join(
        f"{products_map.get(r.product_id, 'Desconocido')} (${float(r.revenue):.2f})"
        for r in top_items
    ) or "sin datos"

    pm_str = ", ".join(
        f"{k}: {v['count']} ventas (${v['total']:.2f})"
        for k, v in payment_methods.items()
    ) or "sin datos"

    # Customer analytics
    emails = [s.customer_email for s in sales if s.customer_email]
    unique_customers = len(set(emails))
    email_counts: dict = defaultdict(int)
    for e in emails:
        email_counts[e] += 1
    returning_customers = sum(1 for c in email_counts.values() if c > 1)
    return_rate = round(returning_customers / unique_customers * 100, 1) if unique_customers else 0
    top_customers_str = ", ".join(
        f"{e} ({email_counts[e]} compras)"
        for e in sorted(set(emails), key=lambda x: -email_counts[x])[:3]
    ) or "sin datos"

    period_label = {
        "today": "hoy", "week": "esta semana", "month": "este mes", "year": "este año"
    }.get(req.period, req.period)

    system_prompt = f"""Sos un asesor de comercio que habla simple, como un amigo que entiende de negocios chicos.
Datos del comercio "{user.store_name}" ({period_label}):
- Total vendido: ${total_revenue:.2f}
- Cantidad de ventas: {total_orders}
- Lo que gasta en promedio cada cliente: ${avg_ticket:.2f}
- Cómo le pagaron: {pm_str}
- Lo que más se vendió: {top_products_str}
- Clientes distintos que compraron: {unique_customers}
- Cuántos volvieron a comprar: {return_rate}%
- Los que más vuelven: {top_customers_str}

Reglas de lenguaje:
- Nada de jerga: prohibido decir "revenue", "ticket promedio", "KPI", "churn", "engagement", "performance", "insight", "merchant", "retention", "forecast".
- Hablá rioplatense simple, como hablarías en un kiosco o un café de barrio.
- "Ventas" en vez de "revenue", "lo que gasta cada cliente" en vez de "ticket promedio", "clientes que vuelven" en vez de "retention".
- Cuando sugieras algo, decí "probá hacer X" o "te conviene Y", no "implementá una estrategia".
- Respuestas cortas y al pie: máximo 3 párrafos chiquitos."""

    client = Groq(api_key=settings.groq_api_key)
    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            *[{"role": msg.role, "content": msg.content} for msg in req.history],
            {"role": "user", "content": req.question},
        ],
        max_tokens=500,
    )

    return {"answer": completion.choices[0].message.content}


@router.get("/briefing")
async def briefing(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not settings.groq_api_key:
        return {"briefing": "Configura tu GROQ_API_KEY para activar el briefing diario."}

    now = datetime.now(timezone.utc)
    today_since = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_since = now - timedelta(days=30)

    today_sales = db.execute(
        select(Sale).where(Sale.user_id == user.id, Sale.sold_at >= today_since)
    ).unique().scalars().all()
    today_revenue = sum(float(s.total) for s in today_sales)
    today_orders = len(today_sales)

    month_sales = db.execute(
        select(Sale).where(Sale.user_id == user.id, Sale.sold_at >= month_since)
    ).unique().scalars().all()
    month_revenue = sum(float(s.total) for s in month_sales)

    # At-risk customers
    customer_sales = db.execute(
        select(Sale).where(Sale.user_id == user.id, Sale.customer_email.isnot(None))
    ).unique().scalars().all()
    customer_last: dict = {}
    for s in customer_sales:
        if s.customer_email:
            if s.customer_email not in customer_last or s.sold_at > customer_last[s.customer_email]:
                customer_last[s.customer_email] = s.sold_at
    fourteen_days_ago = now - timedelta(days=14)
    at_risk = sum(1 for d in customer_last.values() if d < fourteen_days_ago)

    goal_context = (
        f"Meta del mes: ${float(user.monthly_goal):.2f}. Lleva vendido este mes: ${month_revenue:.2f} ({month_revenue / float(user.monthly_goal) * 100:.0f}% de la meta)."
        if user.monthly_goal else ""
    )

    system_prompt = f"""Sos un asesor de negocios que habla simple, como un amigo que entiende de comercio.
Le escribís al dueño de "{user.store_name}" un resumen del día en 2-3 oraciones cortas.
Estructura: 1 dato concreto del día, 1 oportunidad o algo a tener en cuenta, 1 acción concreta que puede hacer HOY.
{goal_context}
Reglas de lenguaje:
- Nada de jerga técnica: prohibido decir "insight", "KPI", "churn", "engagement", "performance", "revenue", "lift", "uplift", "baseline", "forecast", "win-back".
- Hablá en español rioplatense, simple, como en un kiosco o un café de barrio.
- Decí "ventas" en vez de "revenue", "clientes que no vuelven" en vez de "churn", "lo que más se está vendiendo" en vez de "top performer", "probá hacer X" en vez de "implementá una estrategia".
- Directo, sin floreo. Cero palabras en inglés salvo que sea el nombre de un producto."""

    user_msg = f"Ventas de hoy: ${today_revenue:.2f} | Cantidad de ventas hoy: {today_orders} | Clientes que no vuelven hace 14+ días: {at_risk} | Total vendido este mes: ${month_revenue:.2f}"

    client = Groq(api_key=settings.groq_api_key)
    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_msg},
        ],
        max_tokens=200,
    )
    return {"briefing": completion.choices[0].message.content}


@router.get("/alerts")
def alerts(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    result = []

    # 1. At-risk customers
    customer_sales = db.execute(
        select(Sale).where(Sale.user_id == user.id, Sale.customer_email.isnot(None))
    ).unique().scalars().all()
    customer_last: dict = {}
    for s in customer_sales:
        if s.customer_email:
            if s.customer_email not in customer_last or s.sold_at > customer_last[s.customer_email]:
                customer_last[s.customer_email] = s.sold_at
    fourteen_days_ago = now - timedelta(days=14)
    at_risk_count = sum(1 for d in customer_last.values() if d < fourteen_days_ago)
    if at_risk_count > 0:
        result.append({
            "type": "at_risk_customers",
            "level": "warning",
            "title": f"{at_risk_count} cliente{'s' if at_risk_count > 1 else ''} hace rato que no vuelve{'n' if at_risk_count > 1 else ''}",
            "message": f"Hace más de 14 días que no {'compran' if at_risk_count > 1 else 'compra'}. Mandales una promo para que se acuerden de vos.",
        })

    # 2. Daily milestone: today revenue > 120% of daily avg last 7 days
    today_since = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_since = now - timedelta(days=7)

    today_sales = db.execute(
        select(Sale).where(Sale.user_id == user.id, Sale.sold_at >= today_since)
    ).unique().scalars().all()
    today_revenue = sum(float(s.total) for s in today_sales)

    week_sales = db.execute(
        select(Sale).where(Sale.user_id == user.id, Sale.sold_at >= week_since, Sale.sold_at < today_since)
    ).unique().scalars().all()
    week_avg = sum(float(s.total) for s in week_sales) / 7

    if week_avg > 0 and today_revenue >= week_avg * 1.2:
        pct = int((today_revenue / week_avg - 1) * 100)
        result.append({
            "type": "daily_milestone",
            "level": "success",
            "title": "Buen día de ventas",
            "message": f"Llevás vendido ${today_revenue:.0f}. Es un {pct}% más que un día normal de la semana pasada.",
        })

    # 3. Slow products: sold in last 30d but not last 7d
    thirty_since = now - timedelta(days=30)
    seven_since = now - timedelta(days=7)

    sold_30 = db.execute(
        select(SaleItem.product_id)
        .join(Sale, Sale.id == SaleItem.sale_id)
        .where(Sale.user_id == user.id, Sale.sold_at >= thirty_since)
        .distinct()
    ).scalars().all()

    sold_7 = set(db.execute(
        select(SaleItem.product_id)
        .join(Sale, Sale.id == SaleItem.sale_id)
        .where(Sale.user_id == user.id, Sale.sold_at >= seven_since)
        .distinct()
    ).scalars().all())

    slow = [pid for pid in sold_30 if pid not in sold_7]
    if slow:
        prods = db.execute(
            select(Product).where(Product.id.in_(slow[:2]))
        ).unique().scalars().all()
        names = [p.name for p in prods]
        extra = f" y {len(slow) - 2} más" if len(slow) > 2 else ""
        result.append({
            "type": "slow_product",
            "level": "info",
            "title": f"{len(slow)} producto{'s' if len(slow) > 1 else ''} sin moverse hace una semana",
            "message": f'"{", ".join(names)}"{extra} no se {"vendieron" if len(slow) > 1 else "vendió"} en los últimos 7 días. Probá ponerlos a la vista o hacer una promo.',
        })

    # 4. Goal progress alerts
    if user.monthly_goal:
        month_since = now - timedelta(days=30)
        month_sales = db.execute(
            select(Sale).where(Sale.user_id == user.id, Sale.sold_at >= month_since)
        ).unique().scalars().all()
        month_revenue = sum(float(s.total) for s in month_sales)
        pct = month_revenue / float(user.monthly_goal) * 100
        if pct >= 100:
            result.append({
                "type": "goal_achieved",
                "level": "success",
                "title": "¡Le pegaste a la meta del mes!",
                "message": f"Vas {pct:.0f}% de tu meta de ${user.monthly_goal:.0f}. El mes que viene poné una un poco más alta.",
            })
        elif pct >= 75:
            result.append({
                "type": "goal_near",
                "level": "info",
                "title": "Estás cerca de la meta del mes",
                "message": f"Vas {pct:.0f}% de tu meta de ${user.monthly_goal:.0f}. Falta poquito.",
            })

    return {"alerts": result}
