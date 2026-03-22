import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class PaymentMethod(str, Enum):
    card = "card"
    qr = "qr"


class CardType(str, Enum):
    credit = "credit"
    debit = "debit"


class CardBrand(str, Enum):
    visa = "visa"
    mastercard = "mastercard"
    amex = "amex"


class CardCategory(str, Enum):
    classic = "classic"
    gold = "gold"
    platinum = "platinum"
    black = "black"
    signature = "signature"
    infinite = "infinite"
    world = "world"
    world_elite = "world_elite"
    centurion = "centurion"


class SaleItemCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int


class SaleItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    subtotal: float

    model_config = {"from_attributes": True}


class SaleCreate(BaseModel):
    invoice_number: str
    payment_method: PaymentMethod
    card_type: CardType | None = None
    card_brand: CardBrand | None = None
    card_category: CardCategory | None = None
    customer_email: str | None = None
    items: list[SaleItemCreate]
    sold_at: datetime | None = None


class SaleResponse(BaseModel):
    id: uuid.UUID
    invoice_number: str
    payment_method: PaymentMethod
    card_type: CardType | None
    card_brand: CardBrand | None
    card_category: CardCategory | None
    customer_email: str | None
    total: float
    items: list[SaleItemResponse]
    sold_at: datetime

    model_config = {"from_attributes": True}
