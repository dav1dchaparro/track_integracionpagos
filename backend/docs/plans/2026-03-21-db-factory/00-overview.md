# Database Factory Implementation Plan

> **For Claude:** Load individual task files as needed. Use superpowers:executing-plans workflow.

**Goal:** A `create_db(url)` factory that produces two configurations: production DB and a separate test DB (`_test` suffix) that gets fully wiped after tests finish.

**Architecture:**
- `create_db(url)` returns `(engine, sessionmaker)` — pure factory, no globals
- `init_db(url)` calls the factory and sets module globals so `get_db()` works as a FastAPI dependency
- Tests call `init_db()` with the test DB URL inside a session-scoped fixture (inside the event loop), fixing the async loop mismatch
- `conftest.py` drops all tables after the test session ends
- Docker-compose creates the test database via an init script

**Tech Stack:** SQLAlchemy 2.x async, FastAPI, pytest-asyncio, PostgreSQL

---

## Tasks

| # | Task | File | Status |
|---|------|------|--------|
| 1 | Create test database in Postgres | [01-test-database-setup.md](01-test-database-setup.md) | Pending |
| 2 | Rewrite `database.py` with factory | [02-database-factory.md](02-database-factory.md) | Pending |
| 3 | Update `main.py` lifespan | [03-update-main.md](03-update-main.md) | Pending |
| 4 | Update `config.py` with test URL | [04-update-config.md](04-update-config.md) | Pending |
| 5 | Fix `conftest.py` — use factory with test DB | [05-fix-conftest.md](05-fix-conftest.md) | Pending |
| 6 | Verify all tests pass in docker | [06-verify-tests.md](06-verify-tests.md) | Pending |

## Dependencies

- Task 2 depends on nothing
- Task 1, 3, 4 can run in parallel after Task 2
- Task 5 depends on Tasks 1, 2, 4
- Task 6 depends on all previous tasks
