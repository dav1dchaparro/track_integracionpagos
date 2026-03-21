from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import create_tables
from app.routers import transactions, insights, dashboard, merchants, clover


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    yield


app = FastAPI(
    title="SmartReceipt API",
    description="Backend de análisis de transacciones con IA para comerciantes Clover",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(merchants.router, prefix="/api/merchants", tags=["Merchants"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(insights.router, prefix="/api/insights", tags=["Insights"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(clover.router, prefix="/api/clover", tags=["Clover Webhooks"])


@app.get("/")
def root():
    return {"status": "ok", "app": "SmartReceipt API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}
