import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey, Numeric, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Sale(Base):
    __tablename__ = "sales"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    invoice_number: Mapped[str] = mapped_column(String(100))
    payment_method: Mapped[str] = mapped_column(SAEnum("card", "qr", name="payment_method_enum"))
    card_type: Mapped[str | None] = mapped_column(SAEnum("credit", "debit", name="card_type_enum"), nullable=True)
    card_brand: Mapped[str | None] = mapped_column(SAEnum("visa", "mastercard", "amex", name="card_brand_enum"), nullable=True)
    card_category: Mapped[str | None] = mapped_column(SAEnum(
        "classic", "gold", "platinum", "black", "signature",
        "infinite", "world", "world_elite", "centurion",
        name="card_category_enum",
    ), nullable=True)
    customer_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    clover_order_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    total: Mapped[float] = mapped_column(Numeric(12, 2))
    sold_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    items = relationship("SaleItem", back_populates="sale", lazy="joined")
