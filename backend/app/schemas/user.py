import uuid
from datetime import datetime

from pydantic import BaseModel


class UserRegister(BaseModel):
    store_name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class BusinessResponse(BaseModel):
    id: uuid.UUID
    store_name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    id: uuid.UUID
    business_id: uuid.UUID
    email: str
    rol: str
    store_name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SellerCreate(BaseModel):
    name: str
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
