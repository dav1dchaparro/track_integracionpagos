from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.insight import Insight
from app.schemas.insight import InsightResponse
from app.services.ai_service import generate_insights_for_merchant

router = APIRouter()


@router.get("/{merchant_id}", response_model=List[InsightResponse])
def get_insights(
    merchant_id: str,
    insight_type: Optional[str] = None,
    limit: int = Query(20, le=50),
    db: Session = Depends(get_db),
):
    query = db.query(Insight).filter(Insight.merchant_id == merchant_id)
    if insight_type:
        query = query.filter(Insight.insight_type == insight_type)
    return query.order_by(Insight.created_at.desc()).limit(limit).all()


@router.post("/{merchant_id}/generate", response_model=List[InsightResponse])
def generate_insights(
    merchant_id: str,
    period_days: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db),
):
    """Genera nuevos insights de IA para el merchant basado en sus transacciones."""
    insights = generate_insights_for_merchant(merchant_id, period_days, db)
    return insights
