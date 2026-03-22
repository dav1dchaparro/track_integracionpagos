from datetime import date, datetime
from pydantic import BaseModel, Field


class StockUpdate(BaseModel):
    current_stock: int = Field(..., ge=0, description="Cantidad actual en stock")


class StockResponse(BaseModel):
    product_id: str
    product_name: str
    current_stock: int
    updated_at: datetime


class ProductRecommendation(BaseModel):
    product_id: str
    product_name: str
    categories: list[str]
    current_stock: int
    predicted_demand_7d: int
    recommended_purchase: int
    confidence: float
    model_type: str
    period_start: date
    period_end: date
    alert: str  # "ok" | "moderado" | "critico"


class ForecastResponse(BaseModel):
    recommendations: list[ProductRecommendation]
    total_products_analyzed: int
    data_weeks_available: int
    generated_at: datetime
