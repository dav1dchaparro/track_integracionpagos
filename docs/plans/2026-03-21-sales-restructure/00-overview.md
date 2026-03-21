# Sales Restructure Implementation Plan

> **For Claude:** Load individual task files as needed. Use superpowers:executing-plans workflow.

**Goal:** Replace JSONB-based sale_templates/sales with proper relational tables: categories, products (N:M), sales with payment info, and sale_items with subtotals.

**Architecture:**
- Drop `sale_templates` table and `sale_validator` service
- Add `categories`, `products`, `product_categories` (join), `sale_items` tables
- Rewrite `sales` table with payment fields (method, card_type, card_brand, card_category, invoice_number, total)
- `sale_items` links to product with quantity + subtotal
- Products belong to a user and can have multiple categories (N:M)

**Tech Stack:** SQLAlchemy 2.x sync, FastAPI, pytest, PostgreSQL

---

## New DB Schema

```
users
├── categories (1:N)
│   └── product_categories (N:M join)
│       └── products (1:N from user)
│
└── sales (1:N)
    ├── invoice_number
    ├── payment_method (card | qr)
    ├── card_type (credit | debit | null)
    ├── card_brand (visa | mastercard | amex | null)
    ├── card_category (classic | gold | platinum | black | signature | infinite | world | world_elite | centurion | null)
    ├── total
    ├── sold_at
    └── sale_items (1:N)
        ├── product_id (FK)
        ├── quantity
        └── subtotal
```

## Tasks

| # | Task | File | Status |
|---|------|------|--------|
| 1 | Category model + schema + router | [01-categories.md](01-categories.md) | Pending |
| 2 | Product model + schema + router | [02-products.md](02-products.md) | Pending |
| 3 | Rewrite Sale model + SaleItem model | [03-sale-models.md](03-sale-models.md) | Pending |
| 4 | Sale + SaleItem schemas | [04-sale-schemas.md](04-sale-schemas.md) | Pending |
| 5 | Rewrite sales router | [05-sales-router.md](05-sales-router.md) | Pending |
| 6 | Remove old code (sale_templates, sale_validator, JSONB filtering) | [06-cleanup.md](06-cleanup.md) | Pending |
| 7 | Rewrite tests | [07-tests.md](07-tests.md) | Pending |
| 8 | Verify all tests in docker | [08-verify.md](08-verify.md) | Pending |

## Dependencies

- Tasks 1 and 2 can run in parallel (but 2 needs categories for N:M)
- Task 3 depends on 1 and 2
- Task 4 depends on 3
- Task 5 depends on 3 and 4
- Task 6 depends on 5
- Task 7 depends on 5 and 6
- Task 8 depends on all
