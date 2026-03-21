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
