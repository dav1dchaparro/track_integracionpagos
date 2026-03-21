from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.sale import Sale
from app.models.sale_template import SaleTemplate
from app.models.user import User
from app.schemas.sale import SaleCreate, SaleResponse
from app.services.sale_validator import validate_sale_data
from app.services.event_manager import event_manager

router = APIRouter(prefix="/sales", tags=["sales"])


@router.post("/", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
async def create_sale(
    data: SaleCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SaleTemplate).where(
            SaleTemplate.id == data.template_id,
            SaleTemplate.user_id == user.id,
        )
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

    validate_sale_data(data.data, template.fields)

    sale = Sale(
        user_id=user.id,
        template_id=data.template_id,
        data=data.data,
        sold_at=data.sold_at,
    )
    db.add(sale)
    await db.commit()
    await db.refresh(sale)

    await event_manager.broadcast(str(user.id), {
        "id": str(sale.id),
        "template_id": str(sale.template_id),
        "data": sale.data,
        "sold_at": sale.sold_at.isoformat(),
        "created_at": sale.created_at.isoformat(),
    })

    return sale


@router.get("/", response_model=list[SaleResponse])
async def list_sales(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    template_id: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    query = select(Sale).where(Sale.user_id == user.id)

    if template_id:
        query = query.where(Sale.template_id == template_id)

    # Dynamic JSONB filtering via query params prefixed with "filter_"
    # e.g. ?filter_product=Coffee&filter_quantity=2
    for key, value in request.query_params.items():
        if key.startswith("filter_"):
            field_name = key[7:]  # Remove "filter_" prefix
            query = query.where(
                Sale.data[field_name].astext == value
            )

    query = query.order_by(Sale.sold_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()
