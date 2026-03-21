# Task 5: SSE Streaming Endpoint

**Files:**
- Create: `app/services/event_manager.py`
- Create: `app/routers/stream.py`
- Modify: `app/routers/sales.py` (broadcast on new sale)
- Modify: `app/main.py`
- Create: `tests/test_stream.py`

---

## Step 1: Create EventManager

`app/services/event_manager.py`:
```python
import asyncio
import json
from collections import defaultdict


class EventManager:
    def __init__(self):
        self._queues: dict[str, list[asyncio.Queue]] = defaultdict(list)

    async def subscribe(self, user_id: str) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue()
        self._queues[user_id].append(queue)
        return queue

    def unsubscribe(self, user_id: str, queue: asyncio.Queue):
        self._queues[user_id].remove(queue)
        if not self._queues[user_id]:
            del self._queues[user_id]

    async def broadcast(self, user_id: str, data: dict):
        message = json.dumps(data)
        for queue in self._queues.get(user_id, []):
            await queue.put(message)


event_manager = EventManager()
```

## Step 2: Create SSE stream router

`app/routers/stream.py`:
```python
import asyncio

from fastapi import APIRouter, Depends, Query, HTTPException, status
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.database import get_db
from app.models.user import User
from app.services.auth import decode_access_token
from app.services.event_manager import event_manager

router = APIRouter(prefix="/stream", tags=["stream"])


async def _get_user_from_token(token: str, db: AsyncSession) -> User:
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


@router.get("/sales")
async def stream_sales(
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    user = await _get_user_from_token(token, db)
    user_id = str(user.id)

    async def event_generator():
        queue = await event_manager.subscribe(user_id)
        try:
            while True:
                data = await queue.get()
                yield {"event": "new_sale", "data": data}
        except asyncio.CancelledError:
            event_manager.unsubscribe(user_id, queue)
            raise

    return EventSourceResponse(event_generator())
```

## Step 3: Update sales router to broadcast events

Add to `app/routers/sales.py`, in `create_sale` after `await db.refresh(sale)`:

```python
from app.services.event_manager import event_manager

# After db.refresh(sale), before return:
await event_manager.broadcast(str(user.id), {
    "id": str(sale.id),
    "template_id": str(sale.template_id),
    "data": sale.data,
    "sold_at": sale.sold_at.isoformat(),
    "created_at": sale.created_at.isoformat(),
})
```

## Step 4: Register router in main.py

Add to `app/main.py`:
```python
from app.routers import auth, templates, sales, stream

app.include_router(stream.router)
```

## Step 5: Write tests

`tests/test_stream.py`:
```python
import asyncio
import pytest
from datetime import datetime, timezone

pytestmark = pytest.mark.asyncio(loop_scope="session")


async def _setup(client, email="stream@example.com"):
    await client.post("/auth/register", json={
        "store_name": "Stream Store",
        "email": email,
        "password": "secret123",
    })
    resp = await client.post("/auth/login", json={"email": email, "password": "secret123"})
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.post("/templates/", json={
        "name": "Stream Template",
        "fields": [{"name": "item", "type": "string", "required": True}],
    }, headers=headers)
    template_id = resp.json()["id"]
    return token, headers, template_id


async def test_sse_receives_new_sale(client):
    token, headers, template_id = await _setup(client, "sse1@example.com")

    received = []

    async def listen():
        async with client.stream("GET", f"/stream/sales?token={token}") as resp:
            async for line in resp.aiter_lines():
                if line.startswith("data:"):
                    received.append(line)
                    break

    listener = asyncio.create_task(listen())
    await asyncio.sleep(0.2)

    await client.post("/sales/", json={
        "template_id": template_id,
        "data": {"item": "Test Item"},
        "sold_at": datetime.now(timezone.utc).isoformat(),
    }, headers=headers)

    await asyncio.wait_for(listener, timeout=5.0)
    assert len(received) == 1
    assert "Test Item" in received[0]


async def test_sse_invalid_token(client):
    resp = await client.get("/stream/sales?token=invalid")
    assert resp.status_code == 401
```

## Step 6: Run tests

Run: `docker compose exec api pytest tests/test_stream.py -v`
Expected: All 2 tests pass

## Step 7: Commit

```bash
git add app/services/event_manager.py app/routers/stream.py app/routers/sales.py app/main.py tests/test_stream.py
git commit -m "feat: SSE streaming for real-time sale notifications"
```
