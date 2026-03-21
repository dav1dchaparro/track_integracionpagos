# Task 8: Verify all tests in docker

**Files:** None (verification only)

---

## Step 1: Rebuild containers

```bash
docker compose down && docker compose up -d --build
```

## Step 2: Run all tests

```bash
docker compose exec api python -m pytest -v --ignore=tests/test_stream.py
```

Expected: All tests pass.

## Step 3: Test the API manually

```bash
# Health check
curl http://localhost:8000/health

# Register
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"store_name":"My Store","email":"test@test.com","password":"secret123"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"secret123"}'
```

Expected: All endpoints respond correctly.
