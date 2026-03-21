# Task 6: Verify all tests pass in docker

**Files:** None (verification only)

---

## Step 1: Run all tests

```bash
docker compose exec api python -m pytest -v
```

Expected: All tests pass.

## Step 2: Verify test DB is clean after run

```bash
docker compose exec postgres psql -U postgres -d postgres_test -c "\dt"
```

Expected: "Did not find any relations." (tables were dropped after tests).

## Step 3: Verify production DB is untouched

```bash
docker compose exec postgres psql -U postgres -d postgres -c "\dt"
```

Expected: Production tables still exist.
