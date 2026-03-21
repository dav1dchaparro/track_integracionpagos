from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any, Dict


class InsightResponse(BaseModel):
    id: str
    merchant_id: str
    insight_type: str
    title: str
    description: str
    recommendation: Optional[str]
    value: Optional[float]
    change_percent: Optional[float]
    trend: Optional[str]
    data: Optional[Dict[str, Any]]
    period_start: Optional[datetime]
    period_end: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardResponse(BaseModel):
    merchant_id: str
    period: str
    total_revenue: float
    total_transactions: int
    average_ticket: float
    revenue_change_percent: float
    top_hour: int
    top_hour_revenue: float
    top_products: list
    payment_methods: Dict[str, float]
    daily_revenue: list
    insights: list
