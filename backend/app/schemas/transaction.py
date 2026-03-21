from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Any, Dict


class TransactionItem(BaseModel):
    name: str
    quantity: int = 1
    price: float
    category: Optional[str] = None


class TransactionCreate(BaseModel):
    id: str
    merchant_id: str
    amount: float
    tip: float = 0.0
    tax: float = 0.0
    currency: str = "USD"
    payment_method: Optional[str] = None
    card_type: Optional[str] = None
    status: str = "completed"
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    items: Optional[List[TransactionItem]] = None
    transaction_at: datetime
    clover_order_id: Optional[str] = None
    raw_data: Optional[Dict[str, Any]] = None


class TransactionResponse(BaseModel):
    id: str
    merchant_id: str
    amount: float
    tip: float
    tax: float
    currency: str
    payment_method: Optional[str]
    card_type: Optional[str]
    status: str
    customer_name: Optional[str]
    items: Optional[List[Any]]
    item_count: int
    transaction_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class CloverWebhookPayload(BaseModel):
    merchantId: str
    type: str                 # "CREATE", "UPDATE", "DELETE"
    objectId: str             # ID del objeto modificado
    data: Optional[Dict[str, Any]] = None
