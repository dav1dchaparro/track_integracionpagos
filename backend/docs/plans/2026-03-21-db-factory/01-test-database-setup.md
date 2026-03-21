# Task 1: Create test database in Postgres

**Files:**
- Create: `initdb/01-create-test-db.sql`

---

## Step 1: Add SQL init script

The docker-compose postgres service mounts `./initdb` to `/docker-entrypoint-initdb.d/`. Add a script that creates the test database.

```sql
CREATE DATABASE postgres_test;
```

File: `initdb/01-create-test-db.sql`

## Step 2: Recreate the postgres volume

The init scripts only run on first startup (fresh volume). Need to destroy and recreate:

```bash
docker compose down -v
docker compose up -d
```

## Step 3: Verify the test database exists

```bash
docker compose exec postgres psql -U postgres -c "\l" | grep postgres_test
```

Expected: a line showing `postgres_test` database.
