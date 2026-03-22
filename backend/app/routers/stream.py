import asyncio

from fastapi import APIRouter, Depends, Query, HTTPException, status
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.orm import Session
from sse_starlette.sse import EventSourceResponse

from app.database import get_db
from app.models.user import User
from app.services.auth import decode_access_token
from app.services.event_manager import event_manager

router = APIRouter(prefix="/stream", tags=["stream"])


def _get_user_from_token(token: str, db: Session) -> User:
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    result = db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


@router.get("/sales")
async def stream_sales(
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    user = _get_user_from_token(token, db)
    business_id = str(user.business_id)

    async def event_generator():
        queue = await event_manager.subscribe(business_id)
        try:
            while True:
                data = await queue.get()
                yield {"event": "new_sale", "data": data}
        except asyncio.CancelledError:
            event_manager.unsubscribe(business_id, queue)
            raise

    return EventSourceResponse(event_generator())
