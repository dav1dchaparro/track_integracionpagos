from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionResponse

router = APIRouter()


@router.post("/", response_model=TransactionResponse, status_code=201)
def create_transaction(payload: TransactionCreate, db: Session = Depends(get_db)):
    existing = db.query(Transaction).filter(Transaction.id == payload.id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Transaction already exists")

    data = payload.model_dump()
    items = data.get("items")
    if items:
        data["item_count"] = sum(item.get("quantity", 1) for item in items)
        data["items"] = items
    else:
        data["item_count"] = 0

    transaction = Transaction(**data)
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.get("/{merchant_id}", response_model=List[TransactionResponse])
def get_transactions(
    merchant_id: str,
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Transaction).filter(Transaction.merchant_id == merchant_id)

    if from_date:
        query = query.filter(Transaction.transaction_at >= from_date)
    if to_date:
        query = query.filter(Transaction.transaction_at <= to_date)

    transactions = (
        query.order_by(Transaction.transaction_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return transactions


@router.get("/{merchant_id}/count")
def get_transaction_count(merchant_id: str, db: Session = Depends(get_db)):
    count = db.query(Transaction).filter(Transaction.merchant_id == merchant_id).count()
    return {"merchant_id": merchant_id, "count": count}
