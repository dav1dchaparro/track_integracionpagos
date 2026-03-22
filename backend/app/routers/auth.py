from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel as PydanticBase
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.business import Business
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, UserResponse, TokenResponse
from app.services.auth import hash_password, verify_password, create_access_token, decode_expired_token

router = APIRouter(prefix="/auth", tags=["auth"])
_bearer = HTTPBearer(auto_error=False)


def _user_response(user: User) -> dict:
    return {
        "id": user.id,
        "business_id": user.business_id,
        "email": user.email,
        "rol": user.rol,
        "store_name": user.business.store_name,
        "created_at": user.created_at,
    }


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(data: UserRegister, db: Session = Depends(get_db)):
    result = db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    business = Business(store_name=data.store_name)
    db.add(business)
    db.flush()

    user = User(business_id=business.id, email=data.email, password=hash_password(data.password), rol="admin")
    db.add(user)
    db.commit()
    db.refresh(user)
    return _user_response(user)


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    result = db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token)


@router.post("/refresh", response_model=TokenResponse)
def refresh(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
):
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token required")

    payload = decode_expired_token(credentials.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    result = db.execute(select(User).where(User.id == payload["sub"]))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    token = create_access_token(payload["sub"])
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    return user


class GoalUpdate(PydanticBase):
    monthly_goal: float

@router.put("/me/goal")
def update_goal(
    data: GoalUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user.monthly_goal = data.monthly_goal
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"monthly_goal": float(user.monthly_goal)}
