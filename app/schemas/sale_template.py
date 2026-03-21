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
