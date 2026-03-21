# Task 4: Update `config.py` with test URL

**Files:**
- Modify: `app/config.py`
- Modify: `.env`

---

## Step 1: Add `test_database_url` to Settings

```python
from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    test_database_url: str = ""
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    model_config = ConfigDict(env_file=".env", extra="ignore")


settings = Settings()
```

Changes:
- Added `test_database_url` with empty default (only needed in test/dev)
- Replaced deprecated `class Config` with `model_config = ConfigDict(...)`
- Replaced deprecated `Extra.ignore` with string literal `"ignore"`

## Step 2: Add test URL to `.env`

Add this line to `.env`:

```
TEST_DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/postgres_test
```

The production `DATABASE_URL` stays unchanged.
