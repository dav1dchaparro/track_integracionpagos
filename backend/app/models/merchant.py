from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.database import Base


class Merchant(Base):
    __tablename__ = "merchants"

    id = Column(String, primary_key=True, index=True)  # Clover merchant ID
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    currency = Column(String, default="USD")
    timezone = Column(String, default="America/Argentina/Buenos_Aires")
    is_active = Column(Boolean, default=True)
    clover_access_token = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    transactions = relationship("Transaction", back_populates="merchant")
    insights = relationship("Insight", back_populates="merchant")
