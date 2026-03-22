from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.category import Category
from app.models.product import Product
from app.models.user import User
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter(prefix="/products", tags=["products"])


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    data: ProductCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    categories = db.execute(
        select(Category).where(
            Category.id.in_(data.category_ids),
            Category.business_id == user.business_id,
        )
    ).scalars().all()

    if len(categories) != len(data.category_ids):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or more categories not found")

    product = Product(
        business_id=user.business_id,
        name=data.name,
        price=data.price,
        categories=categories,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/{product_id}/categories", response_model=ProductResponse)
def update_product_categories(
    product_id: str,
    data: ProductUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = db.execute(
        select(Product).where(Product.id == product_id, Product.business_id == user.business_id)
    ).unique().scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    categories = db.execute(
        select(Category).where(
            Category.id.in_(data.category_ids),
            Category.business_id == user.business_id,
        )
    ).scalars().all()

    if len(categories) != len(data.category_ids):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or more categories not found")

    product.categories = categories
    db.commit()
    db.refresh(product)
    return product


@router.get("/", response_model=list[ProductResponse])
def list_products(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = db.execute(select(Product).where(Product.business_id == user.business_id))
    return result.unique().scalars().all()
