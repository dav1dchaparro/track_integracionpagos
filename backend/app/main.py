from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Database, init_db
from app.routers import auth, sales, stream, categories, products, dashboard, clover, insights


@asynccontextmanager
async def lifespan(app: FastAPI):
    database = Database.for_production(settings.database_url)
    init_db(database)
    yield
    database.cleanup()


app = FastAPI(title="Sales Feedback API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(sales.router)
app.include_router(stream.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(dashboard.router)
app.include_router(clover.router)
app.include_router(insights.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
