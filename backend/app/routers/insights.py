from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.insight import Insight
from app.models.user import User
from app.schemas.insight import InsightResponse
from app.services.ai_service import generate_insights

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("/", response_model=list[InsightResponse])
def list_insights(
    user: User = Depends(get_current_user),
    insight_type: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """Get existing insights for the current user."""
    query = select(Insight).where(Insight.user_id == user.id)
    if insight_type:
        query = query.where(Insight.insight_type == insight_type)
    query = query.order_by(Insight.created_at.desc()).limit(20)
    return db.execute(query).scalars().all()


@router.post("/generate", response_model=list[InsightResponse])
def generate(
    user: User = Depends(get_current_user),
    period_days: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db),
):
    """Generate fresh AI insights from the user's sales data."""
    insights = generate_insights(user.id, period_days, db)
    return insights
