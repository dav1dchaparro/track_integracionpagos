# Task 1: Project Setup, Docker, DB Connection

**Files:**
- Create: `requirements.txt`
- Create: `.env.example`
- Create: `.env`
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `app/__init__.py`
- Create: `app/main.py`
- Create: `app/config.py`
- Create: `app/database.py`
- Create: `app/models/__init__.py`

---

## Step 1: Create requirements.txt

```txt
fastapi==0.115.6
uvicorn[standard]==0.34.0
sqlalchemy[asyncio]==2.0.36
asyncpg==0.30.0
pydantic-settings==2.7.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
sse-starlette==2.2.1
alembic==1.14.1
httpx==0.28.1
pytest==8.3.4
pytest-asyncio==0.25.0
```

## Step 2: Create .env.example and .env

`.env.example` and `.env`:
```env
POSTGRES_USER=app_user
POSTGRES_PASSWORD=secret
POSTGRES_DB=sales_db
DATABASE_URL=postgresql+asyncpg://app_user:secret@db:5432/sales_db
JWT_SECRET=change-me-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

## Step 3: Create Dockerfile

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

## Step 4: Create docker-compose.yml

```yaml
services:
  db:
    image: postgres:16
    env_file: .env
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  api:
    build: .
    env_file: .env
    ports:
      - "8000:8000"
    volumes:
      - .:/app
    depends_on:
      - db

volumes:
  pgdata:
```

## Step 5: Create app/config.py

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    class Config:
        env_file = ".env"


settings = Settings()
```

## Step 6: Create app/database.py

```python
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

engine = create_async_engine(settings.database_url)
async_session = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session
```

## Step 7: Create app/main.py

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import text

from app.database import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.execute(text("SELECT 1"))
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(title="Sales Feedback API", lifespan=lifespan)


@app.get("/health")
async def health():
    return {"status": "ok"}
```

## Step 8: Create app/models/__init__.py

```python
# Models will be imported here as they are created
```

## Step 9: Verify with docker-compose

Run: `docker compose up --build`
Expected: API starts on port 8000, `/health` returns `{"status": "ok"}`

## Step 10: Commit

```bash
git init
git add .
git commit -m "feat: project setup with Docker, FastAPI, and DB connection"
```
