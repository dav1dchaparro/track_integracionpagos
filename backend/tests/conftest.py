import pytest
from starlette.testclient import TestClient

from app.config import settings
from app.database import Database, init_db
from app.routers import auth, sales, stream, categories, products

from fastapi import FastAPI

# Build a test app without lifespan
test_app = FastAPI()
test_app.include_router(auth.router)
test_app.include_router(sales.router)
test_app.include_router(stream.router)
test_app.include_router(categories.router)
test_app.include_router(products.router)


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    database = Database.for_testing(settings.database_url)
    init_db(database)
    yield
    database.cleanup()


@pytest.fixture(scope="session")
def client():
    with TestClient(test_app) as c:
        yield c
