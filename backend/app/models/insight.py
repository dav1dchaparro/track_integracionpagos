from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.database import Base


class Insight(Base):
    __tablename__ = "insights"

    id = Column(String, primary_key=True, index=True)
    merchant_id = Column(String, ForeignKey("merchants.id"), nullable=False, index=True)

    insight_type = Column(String, nullable=False)   # peak_hours, top_products, revenue_trend, etc.
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=True)

    value = Column(Float, nullable=True)             # Valor numérico principal del insight
    change_percent = Column(Float, nullable=True)    # % de cambio vs período anterior
    trend = Column(String, nullable=True)            # "up", "down", "stable"

    data = Column(JSON, nullable=True)               # Datos adicionales para graficar
    period_start = Column(DateTime, nullable=True)
    period_end = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    merchant = relationship("Merchant", back_populates="insights")
