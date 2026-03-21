import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class InsightResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    insight_type: str
    title: str
    description: str
    recommendation: str | None
    value: float | None
    change_percent: float | None
    trend: str | None
    data: dict[str, Any] | None
    period_start: datetime | None
    period_end: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class DashboardSummary(BaseModel):
    period: str
    kpis: dict
    payment_methods: dict
    card_brands: dict
    sales_timeline: list
    top_products: list
    category_breakdown: list
    peak_hour: dict | None = None
    revenue_change_percent: float = 0.0
