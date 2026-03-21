from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import settings
from app.database import Database, init_db
from app.routers import auth, templates, sales, stream


@asynccontextmanager
async def lifespan(app: FastAPI):
    database = Database.for_production(settings.database_url)
    init_db(database)
    yield
    database.cleanup()


app = FastAPI(title="Sales Feedback API", lifespan=lifespan)

app.include_router(auth.router)
app.include_router(templates.router)
app.include_router(sales.router)
app.include_router(stream.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
