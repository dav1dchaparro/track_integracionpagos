# Task 5: Fix `conftest.py` — use factory with test DB

**Files:**
- Modify: `tests/conftest.py`

---

## Step 1: Rewrite conftest.py

```python
import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.config import settings
from app.database import Base, init_db
from app.routers import auth, templates, sales, stream

# Build a test app without lifespan
test_app = FastAPI()
test_app.include_router(auth.router)
test_app.include_router(templates.router)
test_app.include_router(sales.router)
test_app.include_router(stream.router)


@pytest.fixture(scope="session", autouse=True)
async def setup_db():
    """Init DB inside the event loop, create tables, wipe everything after."""
    engine, _ = init_db(settings.test_database_url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture(scope="session")
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=test_app), base_url="http://test"
    ) as c:
        yield c
```

Key changes:
- `init_db(settings.test_database_url)` called inside fixture (inside event loop) — fixes the loop mismatch
- Uses `test_database_url` pointing to `postgres_test` database
- `drop_all` at end wipes all test data
- No dependency override needed — `init_db` sets the globals that `get_db()` reads
- Removed the old `Databese` class and sync engine code

## Step 2: Verify

```bash
docker compose exec api python -m pytest tests/test_auth.py::test_register -v
```

Expected: PASS
