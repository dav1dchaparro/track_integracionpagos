from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.user import User
from app.schemas.sale import SaleCreate, SaleResponse
from app.services.event_manager import event_manager

router = APIRouter(prefix="/sales", tags=["sales"])


@router.post("/", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
async def create_sale(
    data: SaleCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.payment_method == "card":
        if not data.card_type or not data.card_brand:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="card_type and card_brand are required for card payments",
            )

    if not data.items:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one item is required",
        )

    product_ids = [item.product_id for item in data.items]
    result = db.execute(
        select(Product).where(Product.id.in_(product_ids), Product.user_id == user.id)
    )
    products = {p.id: p for p in result.unique().scalars().all()}

    if len(products) != len(set(product_ids)):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or more products not found",
        )

    total = 0
    sale_items = []
    for item in data.items:
        product = products[item.product_id]
        subtotal = float(product.price) * item.quantity
        total += subtotal
        sale_items.append(SaleItem(
            product_id=item.product_id,
            quantity=item.quantity,
            subtotal=subtotal,
        ))

    sale = Sale(
        user_id=user.id,
        invoice_number=data.invoice_number,
        payment_method=data.payment_method.value,
        card_type=data.card_type.value if data.card_type else None,
        card_brand=data.card_brand.value if data.card_brand else None,
        card_category=data.card_category.value if data.card_category else None,
        total=total,
        sold_at=data.sold_at,
        items=sale_items,
    )
    db.add(sale)
    db.commit()
    db.refresh(sale)

    await event_manager.broadcast(str(user.id), {
        "id": str(sale.id),
        "invoice_number": sale.invoice_number,
        "total": float(sale.total),
        "sold_at": sale.sold_at.isoformat(),
    })

    return sale


@router.get("/", response_model=list[SaleResponse])
def list_sales(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    payment_method: str | None = Query(None),
    card_brand: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    query = select(Sale).where(Sale.user_id == user.id)

    if payment_method:
        query = query.where(Sale.payment_method == payment_method)
    if card_brand:
        query = query.where(Sale.card_brand == card_brand)

    query = query.order_by(Sale.sold_at.desc()).offset(skip).limit(limit)
    result = db.execute(query)
    return result.unique().scalars().all()
