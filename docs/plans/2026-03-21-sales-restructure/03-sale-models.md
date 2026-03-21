# Task 3: Rewrite Sale model + SaleItem model

**Files:**
- Modify: `app/models/sale.py` (full rewrite)
- Create: `app/models/sale_item.py`
- Modify: `app/models/__init__.py`

---

## Step 1: Rewrite Sale model

File: `app/models/sale.py` (replace entirely)

```python
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
    total: Mapped[float] = mapped_column(Numeric(12, 2))
    sold_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    items = relationship("SaleItem", back_populates="sale", lazy="joined")
```

## Step 2: Create SaleItem model

File: `app/models/sale_item.py`

```python
import uuid

from sqlalchemy import ForeignKey, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SaleItem(Base):
    __tablename__ = "sale_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sale_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sales.id"))
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"))
    quantity: Mapped[int] = mapped_column(Integer)
    subtotal: Mapped[float] = mapped_column(Numeric(12, 2))

    sale = relationship("Sale", back_populates="items")
    product = relationship("Product", lazy="joined")
```

## Step 3: Update `app/models/__init__.py`

```python
from app.models.user import User
from app.models.category import Category
from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_item import SaleItem
```
