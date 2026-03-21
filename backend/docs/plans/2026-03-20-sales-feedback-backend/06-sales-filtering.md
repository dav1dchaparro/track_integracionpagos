# Task 6: Sales Filtering by JSONB Fields

**Files:**
- Modify: `app/routers/sales.py`
- Create: `tests/test_sales_filtering.py`

---

## Step 1: Add JSONB filtering to list sales endpoint

Update `app/routers/sales.py` — modify the `list_sales` endpoint to accept dynamic filters via query params:

```python
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select, cast, String
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.sale import Sale
from app.models.sale_template import SaleTemplate
from app.models.user import User
from app.schemas.sale import SaleCreate, SaleResponse
from app.services.sale_validator import validate_sale_data
from app.services.event_manager import event_manager

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

    await event_manager.broadcast(str(user.id), {
        "id": str(sale.id),
        "template_id": str(sale.template_id),
        "data": sale.data,
        "sold_at": sale.sold_at.isoformat(),
        "created_at": sale.created_at.isoformat(),
    })

    return sale


@router.get("/", response_model=list[SaleResponse])
async def list_sales(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    template_id: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    query = select(Sale).where(Sale.user_id == user.id)

    if template_id:
        query = query.where(Sale.template_id == template_id)

    # Dynamic JSONB filtering via query params prefixed with "filter_"
    # e.g. ?filter_product=Coffee&filter_quantity=2
    for key, value in request.query_params.items():
        if key.startswith("filter_"):
            field_name = key[7:]  # Remove "filter_" prefix
            query = query.where(
                Sale.data[field_name].astext == value
            )

    query = query.order_by(Sale.sold_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()
```

## Step 2: Add GIN index migration

Add index to the Sale model in `app/models/sale.py`:

```python
from sqlalchemy import Index

# Add after class definition:
Index("idx_sales_data_gin", Sale.data, postgresql_using="gin")
```

## Step 3: Write tests

`tests/test_sales_filtering.py`:
```python
import pytest
from datetime import datetime, timezone

pytestmark = pytest.mark.asyncio(loop_scope="session")


async def _setup(client, email="filter@example.com"):
    await client.post("/auth/register", json={
        "store_name": "Filter Store",
        "email": email,
        "password": "secret123",
    })
    resp = await client.post("/auth/login", json={"email": email, "password": "secret123"})
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.post("/templates/", json={
        "name": "Products",
        "fields": [
            {"name": "product", "type": "string", "required": True},
            {"name": "quantity", "type": "integer", "required": True},
            {"name": "price", "type": "float", "required": True},
            {"name": "category", "type": "string", "required": False},
        ],
    }, headers=headers)
    template_id = resp.json()["id"]

    # Insert test data
    sales_data = [
        {"product": "Coffee", "quantity": 2, "price": 4.5, "category": "drinks"},
        {"product": "Tea", "quantity": 1, "price": 3.0, "category": "drinks"},
        {"product": "Sandwich", "quantity": 3, "price": 7.0, "category": "food"},
        {"product": "Coffee", "quantity": 5, "price": 4.5, "category": "drinks"},
    ]
    for d in sales_data:
        await client.post("/sales/", json={
            "template_id": template_id,
            "data": d,
            "sold_at": datetime.now(timezone.utc).isoformat(),
        }, headers=headers)

    return headers, template_id


async def test_filter_by_product(client):
    headers, _ = await _setup(client, "filt1@example.com")
    resp = await client.get("/sales/?filter_product=Coffee", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    assert all(s["data"]["product"] == "Coffee" for s in data)


async def test_filter_by_category(client):
    headers, _ = await _setup(client, "filt2@example.com")
    resp = await client.get("/sales/?filter_category=drinks", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 3


async def test_filter_by_multiple_fields(client):
    headers, _ = await _setup(client, "filt3@example.com")
    resp = await client.get("/sales/?filter_product=Coffee&filter_quantity=5", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1


async def test_filter_no_match(client):
    headers, _ = await _setup(client, "filt4@example.com")
    resp = await client.get("/sales/?filter_product=Pizza", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 0
```

## Step 4: Run tests

Run: `docker compose exec api pytest tests/test_sales_filtering.py -v`
Expected: All 4 tests pass

## Step 5: Commit

```bash
git add app/routers/sales.py app/models/sale.py tests/test_sales_filtering.py
git commit -m "feat: JSONB filtering for sales via query params"
```
