import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.category import CategoryResponse


class ProductCreate(BaseModel):
    name: str
    price: float
    category_ids: list[uuid.UUID]


class ProductUpdate(BaseModel):
    category_ids: list[uuid.UUID]


class ProductResponse(BaseModel):
    id: uuid.UUID
    name: str
    price: float
    categories: list[CategoryResponse]
    created_at: datetime

    model_config = {"from_attributes": True}
