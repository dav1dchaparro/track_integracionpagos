from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.forecasting import ProductStock
from app.models.product import Product
from app.models.user import User
from app.schemas.forecasting import ForecastResponse, StockResponse, StockUpdate
from app.services.ml_forecasting import run_forecast

router = APIRouter(prefix="/forecasting", tags=["forecasting"])


@router.get("/recommendations", response_model=ForecastResponse)
def get_recommendations(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Trains the demand forecasting model on the user's sales history and
    returns a prioritized list of purchase recommendations.

    - Uses XGBoost when >= 4 weeks of data are available.
    - Falls back to rolling average for cold-start scenarios.
    - Results are sorted by urgency (highest recommended_purchase first).
    """
    result = run_forecast(db, user.id)
    return ForecastResponse(**result)


@router.get("/stock", response_model=list[StockResponse])
def list_stock(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns current stock levels for all products of the authenticated user."""
    rows = db.execute(
        select(ProductStock).where(ProductStock.user_id == user.id)
    ).scalars().all()

    product_ids = [r.product_id for r in rows]
    products = {}
    if product_ids:
        prods = db.execute(
            select(Product).where(Product.id.in_(product_ids))
        ).unique().scalars().all()
        products = {p.id: p for p in prods}

    return [
        StockResponse(
            product_id=str(row.product_id),
            product_name=products[row.product_id].name if row.product_id in products else "Desconocido",
            current_stock=row.current_stock,
            updated_at=row.updated_at,
        )
        for row in rows
    ]


@router.put("/stock/{product_id}", response_model=StockResponse)
def update_stock(
    product_id: str,
    payload: StockUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Creates or updates the current stock level for a product.
    The product must belong to the authenticated user.
    """
    import uuid as _uuid

    try:
        pid = _uuid.UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid product_id")

    product = db.execute(
        select(Product).where(Product.id == pid, Product.user_id == user.id)
    ).unique().scalar_one_or_none()

    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    stock = db.execute(
        select(ProductStock).where(
            ProductStock.user_id == user.id,
            ProductStock.product_id == pid,
        )
    ).scalar_one_or_none()

    if stock is None:
        stock = ProductStock(
            user_id=user.id,
            product_id=pid,
            current_stock=payload.current_stock,
        )
        db.add(stock)
    else:
        stock.current_stock = payload.current_stock
        stock.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(stock)

    return StockResponse(
        product_id=str(stock.product_id),
        product_name=product.name,
        current_stock=stock.current_stock,
        updated_at=stock.updated_at,
    )
