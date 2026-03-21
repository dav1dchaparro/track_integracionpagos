# Task 2: Rewrite `database.py` with factory

**Files:**
- Modify: `app/database.py`

---

## Step 1: Write `database.py`

Replace the entire file with:

```python
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


class Base(DeclarativeBase):
    pass


def create_db(url: str) -> tuple[AsyncEngine, async_sessionmaker[AsyncSession]]:
    """Factory: creates an engine + session maker from a URL. No side effects."""
    engine = create_async_engine(url)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    return engine, session_factory


def init_db(url: str) -> tuple[AsyncEngine, async_sessionmaker[AsyncSession]]:
    """Calls the factory and stores the result in module globals for get_db()."""
    global _engine, _session_factory
    _engine, _session_factory = create_db(url)
    return _engine, _session_factory


def get_engine() -> AsyncEngine:
    assert _engine is not None, "Call init_db() first"
    return _engine


async def get_db() -> AsyncSession:
    assert _session_factory is not None, "Call init_db() first"
    async with _session_factory() as session:
        yield session
```

Key changes from the original:
- No engine/session created at import time (fixes the event loop issue)
- `create_db(url)` is a pure factory — no globals, no side effects
- `init_db(url)` sets globals so `get_db()` keeps working as a FastAPI dependency
- All 4 routers + `dependencies.py` import `get_db` unchanged

## Step 2: Verify no import-time side effects

```bash
docker compose exec api python -c "from app.database import Base, create_db, init_db, get_db; print('OK')"
```

Expected: `OK` (no connection errors)
