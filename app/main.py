from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import text

import app.database as db
from app.routers import auth, templates, sales, stream


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with db.engine.begin() as conn:
        await conn.execute(text("SELECT 1"))
        await conn.run_sync(db.Base.metadata.create_all)
    yield
    await db.engine.dispose()


app = FastAPI(title="Sales Feedback API", lifespan=lifespan)

app.include_router(auth.router)
app.include_router(templates.router)
app.include_router(sales.router)
app.include_router(stream.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
