# Task 2: Product model + schema + router

**Files:**
- Create: `app/models/product.py`
- Create: `app/schemas/product.py`
- Create: `app/routers/products.py`
- Modify: `app/models/__init__.py`
- Modify: `app/main.py`
- Test: `tests/test_products.py`

---

## Step 1: Create Product model + join table

File: `app/models/product.py`

```python
import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey, Numeric, Table, Column
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

product_categories = Table(
    "product_categories",
    Base.metadata,
    Column("product_id", UUID(as_uuid=True), ForeignKey("products.id"), primary_key=True),
    Column("category_id", UUID(as_uuid=True), ForeignKey("categories.id"), primary_key=True),
)


class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String(255))
    price: Mapped[float] = mapped_column(Numeric(10, 2))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    categories = relationship("Category", secondary=product_categories, lazy="joined")
```

## Step 2: Add relationship to Category model

Add to `app/models/category.py`:

```python
from sqlalchemy.orm import relationship

# Add to Category class:
products = relationship("Product", secondary="product_categories", lazy="joined", back_populates="categories")
```

And update Product's relationship to add `back_populates="products"`.

## Step 3: Create Product schemas

File: `app/schemas/product.py`

```python
import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.category import CategoryResponse


class ProductCreate(BaseModel):
    name: str
    price: float
    category_ids: list[uuid.UUID]


class ProductResponse(BaseModel):
    id: uuid.UUID
    name: str
    price: float
    categories: list[CategoryResponse]
    created_at: datetime

    model_config = {"from_attributes": True}
```

## Step 4: Create Product router

File: `app/routers/products.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.category import Category
from app.models.product import Product
from app.models.user import User
from app.schemas.product import ProductCreate, ProductResponse

router = APIRouter(prefix="/products", tags=["products"])


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    data: ProductCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    categories = db.execute(
        select(Category).where(
            Category.id.in_(data.category_ids),
            Category.user_id == user.id,
        )
    ).scalars().all()

    if len(categories) != len(data.category_ids):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or more categories not found")

    product = Product(
        user_id=user.id,
        name=data.name,
        price=data.price,
        categories=categories,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/", response_model=list[ProductResponse])
def list_products(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = db.execute(select(Product).where(Product.user_id == user.id))
    return result.unique().scalars().all()
```

## Step 5: Register in `app/models/__init__.py` and `app/main.py`

Add `from app.models.product import Product` to `__init__.py`.

Add `from app.routers import products` and `app.include_router(products.router)` to `main.py`.

## Step 6: Write tests

File: `tests/test_products.py`

```python
def _setup(client, email="prod@example.com"):
    client.post("/auth/register", json={
        "store_name": "Prod Store", "email": email, "password": "secret123",
    })
    resp = client.post("/auth/login", json={"email": email, "password": "secret123"})
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post("/categories/", json={"name": "Drinks"}, headers=headers)
    cat_id = resp.json()["id"]
    return headers, cat_id


def test_create_product(client):
    headers, cat_id = _setup(client, "prod1@example.com")
    resp = client.post("/products/", json={
        "name": "Coffee", "price": 4.50, "category_ids": [cat_id],
    }, headers=headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Coffee"
    assert data["price"] == 4.50
    assert len(data["categories"]) == 1


def test_create_product_multiple_categories(client):
    headers, cat_id1 = _setup(client, "prod2@example.com")
    resp = client.post("/categories/", json={"name": "Hot"}, headers=headers)
    cat_id2 = resp.json()["id"]
    resp = client.post("/products/", json={
        "name": "Latte", "price": 5.00, "category_ids": [cat_id1, cat_id2],
    }, headers=headers)
    assert resp.status_code == 201
    assert len(resp.json()["categories"]) == 2


def test_create_product_invalid_category(client):
    headers, _ = _setup(client, "prod3@example.com")
    resp = client.post("/products/", json={
        "name": "Ghost", "price": 1.00,
        "category_ids": ["00000000-0000-0000-0000-000000000000"],
    }, headers=headers)
    assert resp.status_code == 404


def test_list_products(client):
    headers, cat_id = _setup(client, "prod4@example.com")
    client.post("/products/", json={
        "name": "Tea", "price": 3.00, "category_ids": [cat_id],
    }, headers=headers)
    client.post("/products/", json={
        "name": "Juice", "price": 5.00, "category_ids": [cat_id],
    }, headers=headers)
    resp = client.get("/products/", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2
```

## Step 7: Run tests

```bash
docker compose exec api python -m pytest tests/test_products.py -v
```

Expected: PASS
