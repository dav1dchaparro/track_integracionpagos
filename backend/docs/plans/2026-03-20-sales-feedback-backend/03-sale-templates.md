# Task 3: SaleTemplate Model + CRUD Endpoints

**Files:**
- Create: `app/models/sale_template.py`
- Create: `app/schemas/sale_template.py`
- Create: `app/routers/templates.py`
- Modify: `app/models/__init__.py`
- Modify: `app/main.py`
- Create: `tests/test_templates.py`

---

## Step 1: Create SaleTemplate model

`app/models/sale_template.py`:
```python
import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SaleTemplate(Base):
    __tablename__ = "sale_templates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String(255))
    fields: Mapped[dict] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
```

## Step 2: Update app/models/__init__.py

```python
from app.models.user import User
from app.models.sale_template import SaleTemplate
```

## Step 3: Create SaleTemplate schemas

`app/schemas/sale_template.py`:
```python
import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class FieldType(str, Enum):
    string = "string"
    integer = "integer"
    float_ = "float"
    boolean = "boolean"
    datetime_ = "datetime"


class TemplateField(BaseModel):
    name: str
    type: FieldType
    required: bool = True


class TemplateCreate(BaseModel):
    name: str
    fields: list[TemplateField]


class TemplateResponse(BaseModel):
    id: uuid.UUID
    name: str
    fields: list[TemplateField]
    created_at: datetime

    model_config = {"from_attributes": True}
```

## Step 4: Create templates router

`app/routers/templates.py`:
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.sale_template import SaleTemplate
from app.models.user import User
from app.schemas.sale_template import TemplateCreate, TemplateResponse

router = APIRouter(prefix="/templates", tags=["templates"])


@router.post("/", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    data: TemplateCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    template = SaleTemplate(
        user_id=user.id,
        name=data.name,
        fields=[f.model_dump() for f in data.fields],
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template


@router.get("/", response_model=list[TemplateResponse])
async def list_templates(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SaleTemplate).where(SaleTemplate.user_id == user.id)
    )
    return result.scalars().all()
```

## Step 5: Register router in main.py

Add to `app/main.py`:
```python
from app.routers import auth, templates

app.include_router(templates.router)
```

## Step 6: Write tests

`tests/test_templates.py`:
```python
import pytest

pytestmark = pytest.mark.asyncio(loop_scope="session")


async def _register_and_login(client, email="tmpl@example.com"):
    await client.post("/auth/register", json={
        "store_name": "Template Store",
        "email": email,
        "password": "secret123",
    })
    resp = await client.post("/auth/login", json={"email": email, "password": "secret123"})
    return resp.json()["access_token"]


async def test_create_template(client):
    token = await _register_and_login(client, "tmpl1@example.com")
    resp = await client.post("/templates/", json={
        "name": "Coffee Sale",
        "fields": [
            {"name": "product", "type": "string", "required": True},
            {"name": "quantity", "type": "integer", "required": True},
            {"name": "price", "type": "float", "required": True},
        ],
    }, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Coffee Sale"
    assert len(data["fields"]) == 3


async def test_list_templates(client):
    token = await _register_and_login(client, "tmpl2@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    await client.post("/templates/", json={
        "name": "T1",
        "fields": [{"name": "x", "type": "string", "required": True}],
    }, headers=headers)
    await client.post("/templates/", json={
        "name": "T2",
        "fields": [{"name": "y", "type": "integer", "required": False}],
    }, headers=headers)
    resp = await client.get("/templates/", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2


async def test_create_template_unauthorized(client):
    resp = await client.post("/templates/", json={
        "name": "Nope",
        "fields": [],
    })
    assert resp.status_code == 403
```

## Step 7: Run tests

Run: `docker compose exec api pytest tests/test_templates.py -v`
Expected: All 3 tests pass

## Step 8: Commit

```bash
git add app/models/sale_template.py app/schemas/sale_template.py app/routers/templates.py app/models/__init__.py app/main.py tests/test_templates.py
git commit -m "feat: sale template model and CRUD endpoints"
```
