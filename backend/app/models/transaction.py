from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, index=True)  # Clover order/payment ID
    merchant_id = Column(String, ForeignKey("merchants.id"), nullable=False, index=True)

    # Datos del pago
    amount = Column(Float, nullable=False)           # Total en centavos -> convertir a pesos/dólares
    tip = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    currency = Column(String, default="USD")
    payment_method = Column(String, nullable=True)   # CARD, CASH, CREDIT, DEBIT
    card_type = Column(String, nullable=True)        # VISA, MASTERCARD, AMEX, etc.
    status = Column(String, default="completed")     # completed, refunded, voided

    # Datos del cliente (anonimizados)
    customer_id = Column(String, nullable=True)
    customer_name = Column(String, nullable=True)

    # Items del pedido
    items = Column(JSON, nullable=True)              # Lista de productos vendidos
    item_count = Column(Integer, default=1)

    # Tiempo
    transaction_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Clover raw data (para referencia)
    clover_order_id = Column(String, nullable=True)
    raw_data = Column(JSON, nullable=True)

    merchant = relationship("Merchant", back_populates="transactions")
