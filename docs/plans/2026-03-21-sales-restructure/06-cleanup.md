# Task 6: Remove old code

**Files:**
- Delete: `app/models/sale_template.py`
- Delete: `app/schemas/sale_template.py`
- Delete: `app/services/sale_validator.py`
- Delete: `app/routers/templates.py`
- Delete: `tests/test_templates.py`
- Delete: `tests/test_sales_filtering.py`
- Modify: `app/main.py` (remove templates router)
- Modify: `app/routers/__init__.py` (if needed)
- Modify: `tests/conftest.py` (remove templates router from test_app)

---

## Step 1: Delete old files

```bash
rm app/models/sale_template.py
rm app/schemas/sale_template.py
rm app/services/sale_validator.py
rm app/routers/templates.py
rm tests/test_templates.py
rm tests/test_sales_filtering.py
```

## Step 2: Update `app/main.py`

Remove `from app.routers import templates` and `app.include_router(templates.router)`.

## Step 3: Update `tests/conftest.py`

Remove `from app.routers import templates` and `test_app.include_router(templates.router)`.

## Step 4: Verify no broken imports

```bash
docker compose exec api python -c "from app.main import app; print('OK')"
```

Expected: `OK`
