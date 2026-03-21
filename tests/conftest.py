import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.config import settings
from app.database import Base

# Ensure asyncpg driver
db_url = settings.database_url
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

test_engine = create_async_engine(db_url)
test_session_factory = async_sessionmaker(test_engine, expire_on_commit=False)


async def get_test_db():
    async with test_session_factory() as session:
        yield session


# Build a test app without lifespan
test_app = FastAPI()

from app.database import get_db  # noqa: E402
from app.routers import auth, templates, sales, stream  # noqa: E402

test_app.include_router(auth.router)
test_app.include_router(templates.router)
test_app.include_router(sales.router)
test_app.include_router(stream.router)
test_app.dependency_overrides[get_db] = get_test_db


@pytest.fixture(scope="session", autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


@pytest.fixture(scope="session")
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=test_app), base_url="http://test"
    ) as c:
        yield c
