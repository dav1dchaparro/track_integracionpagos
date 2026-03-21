import pytest
from starlette.testclient import TestClient

from app.config import settings
from app.database import Database, init_db
from app.routers import auth, sales, stream, categories, products, dashboard

from fastapi import FastAPI

# Build a test app without lifespan
test_app = FastAPI()
test_app.include_router(auth.router)
test_app.include_router(sales.router)
test_app.include_router(stream.router)
test_app.include_router(categories.router)
test_app.include_router(products.router)
test_app.include_router(dashboard.router)


TEST_DATABASE_URL = settings.database_url.rsplit("/", 1)[0] + "/test_db"


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    # Create test_db if it doesn't exist
    from sqlalchemy import create_engine, text
    base_url = settings.database_url.rsplit("/", 1)[0] + "/postgres"
    eng = create_engine(base_url, isolation_level="AUTOCOMMIT")
    with eng.connect() as conn:
        exists = conn.execute(text("SELECT 1 FROM pg_database WHERE datname='test_db'")).scalar()
        if not exists:
            conn.execute(text("CREATE DATABASE test_db"))
    eng.dispose()

    database = Database.for_testing(TEST_DATABASE_URL)
    init_db(database)
    yield
    database.cleanup()


@pytest.fixture(scope="session")
def client():
    with TestClient(test_app) as c:
        yield c
