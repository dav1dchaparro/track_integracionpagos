from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class MerchantCreate(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    currency: str = "USD"
    timezone: str = "America/Argentina/Buenos_Aires"
    clover_access_token: Optional[str] = None


class MerchantUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    clover_access_token: Optional[str] = None


class MerchantResponse(BaseModel):
    id: str
    name: str
    email: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    currency: str
    timezone: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
