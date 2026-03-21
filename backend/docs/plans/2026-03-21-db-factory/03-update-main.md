# Task 3: Update `main.py` lifespan

**Files:**
- Modify: `app/main.py`

---

## Step 1: Update lifespan to use `init_db`

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import text

from app.config import settings
from app.database import Base, init_db
from app.routers import auth, templates, sales, stream


@asynccontextmanager
async def lifespan(app: FastAPI):
    engine, _ = init_db(settings.database_url)
    async with engine.begin() as conn:
        await conn.execute(text("SELECT 1"))
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(title="Sales Feedback API", lifespan=lifespan)

app.include_router(auth.router)
app.include_router(templates.router)
app.include_router(sales.router)
app.include_router(stream.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
```

Changes:
- Import `init_db` instead of `import app.database as db`
- Call `init_db(settings.database_url)` inside lifespan (inside the event loop)
- Use returned `engine` directly

## Step 2: Verify app starts

```bash
docker compose exec api python -c "from app.main import app; print(app.title)"
```

Expected: `Sales Feedback API`
