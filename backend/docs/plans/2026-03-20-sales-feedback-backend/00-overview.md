# Sales Feedback Backend — Implementation Plan

> **For Claude:** Load individual task files as needed. Use superpowers:executing-plans workflow.

**Goal:** FastAPI backend where store owners register, define custom sale templates, submit sales validated against templates, and receive real-time sale notifications via SSE.

**Architecture:** Three-layer FastAPI app (routers → services → models) with async SQLAlchemy + PostgreSQL. JWT auth for multi-tenancy. SSE via asyncio queues per user connection. JSONB columns for flexible template fields and sale data. Dockerized with docker-compose.

**Tech Stack:** FastAPI, SQLAlchemy (async), PostgreSQL 16, asyncpg, python-jose (JWT), bcrypt, sse-starlette, Docker, pytest + httpx

---

## Tasks

| # | Task | File | Status |
|---|------|------|--------|
| 1 | Project setup, Docker, DB connection | [01-project-setup.md](01-project-setup.md) | Pending |
| 2 | User model + auth endpoints | [02-auth.md](02-auth.md) | Pending |
| 3 | SaleTemplate model + CRUD endpoints | [03-sale-templates.md](03-sale-templates.md) | Pending |
| 4 | Sale model + CRUD with validation | [04-sales.md](04-sales.md) | Pending |
| 5 | SSE streaming endpoint | [05-sse-stream.md](05-sse-stream.md) | Pending |
| 6 | Sales filtering by JSONB fields | [06-sales-filtering.md](06-sales-filtering.md) | Pending |

## Dependencies

- Task 2 depends on Task 1
- Task 3 depends on Task 2
- Task 4 depends on Task 3
- Task 5 depends on Task 4
- Task 6 depends on Task 4
