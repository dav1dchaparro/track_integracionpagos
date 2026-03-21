# Task 4: Sale Model + CRUD with Template Validation

**Files:**
- Create: `app/models/sale.py`
- Create: `app/schemas/sale.py`
- Create: `app/services/sale_validator.py`
- Create: `app/routers/sales.py`
- Modify: `app/models/__init__.py`
- Modify: `app/main.py`
- Create: `tests/test_sales.py`

---

## Step 1: Create Sale model

`app/models/sale.py`:
```python
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Sale(Base):
    __tablename__ = "sales"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    template_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sale_templates.id"))
    data: Mapped[dict] = mapped_column(JSONB)
    sold_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
```

## Step 2: Update app/models/__init__.py

```python
from app.models.user import User
from app.models.sale_template import SaleTemplate
from app.models.sale import Sale
```

## Step 3: Create sale validator service

`app/services/sale_validator.py`:
```python
from datetime import datetime

from fastapi import HTTPException, status

TYPE_MAP = {
    "string": str,
    "integer": int,
    "float": (int, float),
    "boolean": bool,
    "datetime": str,
}


def validate_sale_data(data: dict, template_fields: list[dict]) -> dict:
    errors = []

    for field in template_fields:
        name = field["name"]
        field_type = field["type"]
        required = field.get("required", True)

        if name not in data:
            if required:
                errors.append(f"Missing required field: '{name}'")
            continue

        value = data[name]
        expected = TYPE_MAP.get(field_type)

        if field_type == "datetime":
            try:
                datetime.fromisoformat(value)
            except (ValueError, TypeError):
                errors.append(f"Field '{name}' must be a valid ISO datetime string")
        elif field_type == "float":
            if not isinstance(value, (int, float)):
                errors.append(f"Field '{name}' must be a number")
        elif expected and not isinstance(value, expected):
            errors.append(f"Field '{name}' must be of type '{field_type}'")

    allowed_names = {f["name"] for f in template_fields}
    extra = set(data.keys()) - allowed_names
    if extra:
        errors.append(f"Unknown fields: {', '.join(extra)}")

    if errors:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=errors)

    return data
```

## Step 4: Create Sale schemas

`app/schemas/sale.py`:
```python
import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class SaleCreate(BaseModel):
    template_id: uuid.UUID
    data: dict[str, Any]
    sold_at: datetime


class SaleResponse(BaseModel):
    id: uuid.UUID
    template_id: uuid.UUID
    data: dict[str, Any]
    sold_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}
```

## Step 5: Create sales router

`app/routers/sales.py`:
```python
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.sale import Sale
from app.models.sale_template import SaleTemplate
from app.models.user import User
from app.schemas.sale import SaleCreate, SaleResponse
from app.services.sale_validator import validate_sale_data

router = APIRouter(prefix="/sales", tags=["sales"])


@router.post("/", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
async def create_sale(
    data: SaleCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SaleTemplate).where(
            SaleTemplate.id == data.template_id,
            SaleTemplate.user_id == user.id,
        )
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

    validate_sale_data(data.data, template.fields)

    sale = Sale(
        user_id=user.id,
        template_id=data.template_id,
        data=data.data,
        sold_at=data.sold_at,
    )
    db.add(sale)
    await db.commit()
    await db.refresh(sale)
    return sale


@router.get("/", response_model=list[SaleResponse])
async def list_sales(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    template_id: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    query = select(Sale).where(Sale.user_id == user.id)
    if template_id:
        query = query.where(Sale.template_id == template_id)
    query = query.order_by(Sale.sold_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()
```

## Step 6: Register router in main.py

Add to `app/main.py`:
```python
from app.routers import auth, templates, sales

app.include_router(sales.router)
```

## Step 7: Write tests

`tests/test_sales.py`:
```python
import pytest
from datetime import datetime, timezone

pytestmark = pytest.mark.asyncio(loop_scope="session")


async def _setup(client, email="sales@example.com"):
    await client.post("/auth/register", json={
        "store_name": "Sales Store",
        "email": email,
        "password": "secret123",
    })
    resp = await client.post("/auth/login", json={"email": email, "password": "secret123"})
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.post("/templates/", json={
        "name": "Product Sale",
        "fields": [
            {"name": "product", "type": "string", "required": True},
            {"name": "quantity", "type": "integer", "required": True},
            {"name": "price", "type": "float", "required": True},
            {"name": "notes", "type": "string", "required": False},
        ],
    }, headers=headers)
    template_id = resp.json()["id"]
    return headers, template_id


async def test_create_sale(client):
    headers, template_id = await _setup(client, "sale1@example.com")
    resp = await client.post("/sales/", json={
        "template_id": template_id,
        "data": {"product": "Coffee", "quantity": 2, "price": 4.50},
        "sold_at": datetime.now(timezone.utc).isoformat(),
    }, headers=headers)
    assert resp.status_code == 201
    assert resp.json()["data"]["product"] == "Coffee"


async def test_create_sale_missing_required(client):
    headers, template_id = await _setup(client, "sale2@example.com")
    resp = await client.post("/sales/", json={
        "template_id": template_id,
        "data": {"product": "Coffee"},
        "sold_at": datetime.now(timezone.utc).isoformat(),
    }, headers=headers)
    assert resp.status_code == 422


async def test_create_sale_wrong_type(client):
    headers, template_id = await _setup(client, "sale3@example.com")
    resp = await client.post("/sales/", json={
        "template_id": template_id,
        "data": {"product": "Coffee", "quantity": "not_a_number", "price": 4.50},
        "sold_at": datetime.now(timezone.utc).isoformat(),
    }, headers=headers)
    assert resp.status_code == 422


async def test_create_sale_extra_field(client):
    headers, template_id = await _setup(client, "sale4@example.com")
    resp = await client.post("/sales/", json={
        "template_id": template_id,
        "data": {"product": "Coffee", "quantity": 1, "price": 3.0, "unknown": "x"},
        "sold_at": datetime.now(timezone.utc).isoformat(),
    }, headers=headers)
    assert resp.status_code == 422


async def test_list_sales(client):
    headers, template_id = await _setup(client, "sale5@example.com")
    for i in range(3):
        await client.post("/sales/", json={
            "template_id": template_id,
            "data": {"product": f"Item {i}", "quantity": 1, "price": 1.0},
            "sold_at": datetime.now(timezone.utc).isoformat(),
        }, headers=headers)
    resp = await client.get("/sales/", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 3
```

## Step 8: Run tests

Run: `docker compose exec api pytest tests/test_sales.py -v`
Expected: All 5 tests pass

## Step 9: Commit

```bash
git add app/models/sale.py app/schemas/sale.py app/services/sale_validator.py app/routers/sales.py app/models/__init__.py app/main.py tests/test_sales.py
git commit -m "feat: sale model with template-based validation"
```
