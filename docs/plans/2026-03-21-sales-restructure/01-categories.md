# Task 1: Category model + schema + router

**Files:**
- Create: `app/models/category.py`
- Create: `app/schemas/category.py`
- Create: `app/routers/categories.py`
- Modify: `app/models/__init__.py`
- Modify: `app/main.py`
- Test: `tests/test_categories.py`

---

## Step 1: Create Category model

File: `app/models/category.py`

```python
import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
```

## Step 2: Create Category schemas

File: `app/schemas/category.py`

```python
import uuid
from datetime import datetime

from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str


class CategoryResponse(BaseModel):
    id: uuid.UUID
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}
```

## Step 3: Create Category router

File: `app/routers/categories.py`

```python
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.category import Category
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryResponse

router = APIRouter(prefix="/categories", tags=["categories"])


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    data: CategoryCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    category = Category(user_id=user.id, name=data.name)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.get("/", response_model=list[CategoryResponse])
def list_categories(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = db.execute(select(Category).where(Category.user_id == user.id))
    return result.scalars().all()
```

## Step 4: Register in `app/models/__init__.py` and `app/main.py`

Add `from app.models.category import Category` to `__init__.py`.

Add `from app.routers import categories` and `app.include_router(categories.router)` to `main.py`.

## Step 5: Write tests

File: `tests/test_categories.py`

```python
def _login(client, email="cat@example.com"):
    client.post("/auth/register", json={
        "store_name": "Cat Store", "email": email, "password": "secret123",
    })
    resp = client.post("/auth/login", json={"email": email, "password": "secret123"})
    return resp.json()["access_token"]


def test_create_category(client):
    token = _login(client, "cat1@example.com")
    resp = client.post("/categories/", json={"name": "Drinks"},
                       headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 201
    assert resp.json()["name"] == "Drinks"


def test_list_categories(client):
    token = _login(client, "cat2@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    client.post("/categories/", json={"name": "Food"}, headers=headers)
    client.post("/categories/", json={"name": "Drinks"}, headers=headers)
    resp = client.get("/categories/", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2
```

## Step 6: Run tests

```bash
docker compose exec api python -m pytest tests/test_categories.py -v
```

Expected: PASS
