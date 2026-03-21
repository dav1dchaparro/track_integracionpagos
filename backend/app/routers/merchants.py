from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.merchant import Merchant
from app.schemas.merchant import MerchantCreate, MerchantUpdate, MerchantResponse

router = APIRouter()


@router.post("/", response_model=MerchantResponse, status_code=201)
def create_merchant(payload: MerchantCreate, db: Session = Depends(get_db)):
    existing = db.query(Merchant).filter(Merchant.id == payload.id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Merchant already exists")
    merchant = Merchant(**payload.model_dump())
    db.add(merchant)
    db.commit()
    db.refresh(merchant)
    return merchant


@router.get("/{merchant_id}", response_model=MerchantResponse)
def get_merchant(merchant_id: str, db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    return merchant


@router.put("/{merchant_id}", response_model=MerchantResponse)
def update_merchant(merchant_id: str, payload: MerchantUpdate, db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(merchant, field, value)
    db.commit()
    db.refresh(merchant)
    return merchant
