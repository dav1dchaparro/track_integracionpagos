from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import SellerCreate, UserResponse
from app.services.auth import hash_password

router = APIRouter(prefix="/users", tags=["users"])


def _user_response(user: User) -> dict:
    return {
        "id": user.id,
        "business_id": user.business_id,
        "email": user.email,
        "rol": user.rol,
        "store_name": user.business.store_name,
        "created_at": user.created_at,
    }


@router.get("/", response_model=list[UserResponse])
def list_team(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.rol != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can list team members")

    result = db.execute(
        select(User).where(User.business_id == user.business_id, User.rol == "seller")
    )
    return [_user_response(u) for u in result.unique().scalars().all()]


@router.post("/sellers", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_seller(
    data: SellerCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.rol != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can create sellers")

    existing = db.execute(select(User).where(User.email == data.email)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    seller = User(
        business_id=user.business_id,
        email=data.email,
        password=hash_password(data.password),
        rol="seller",
    )
    db.add(seller)
    db.commit()
    db.refresh(seller)
    return _user_response(seller)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_seller(
    user_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.rol != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can remove sellers")

    target = db.execute(
        select(User).where(User.id == user_id, User.business_id == user.business_id)
    ).scalar_one_or_none()

    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if target.rol == "admin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot remove an admin")

    db.delete(target)
    db.commit()
