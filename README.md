# Atlas Nexus

Intelligent accelerator for emerging businesses integrated with Clover POS.

## Prerequisites

- Docker & Docker Compose
- A Groq API key (free at [console.groq.com](https://console.groq.com)) for AI features
- (Optional) Clover merchant credentials for POS sync

## Setup

1. **Clone and configure environment**

```bash
git clone https://github.com/dav1dchaparro/track_integracionpagos.git
cd track_integracionpagos
```

2. **Edit `backend/.env`**

```env
DATABASE_URL=postgresql+psycopg2://postgres:postgres@postgres:5432/postgres
JWT_SECRET=change-me-in-production
GROQ_API_KEY=your-groq-api-key-here

# Optional — Clover POS integration
CLOVER_MERCHANT_ID=
CLOVER_ACCESS_TOKEN=
CLOVER_API_BASE_URL=https://api.clover.com
```

3. **Start the project**

```bash
docker compose up --build -d
```

This launches three containers:

| Service | URL | Description |
|---------|-----|-------------|
| frontend | http://localhost:3000 | React dashboard |
| api | http://localhost:8000 | FastAPI backend |
| postgres | localhost:5432 | PostgreSQL 15 |

The database tables are created automatically on first startup.

4. **Load demo data**

```bash
docker compose exec -T api python seed_demo.py
```

This populates the database with realistic data for a demo coffee shop:

- 1 user account
- 4 categories, 22 products
- ~1,100 sales across the last 45 days
- Stock/inventory levels per product
- Recurring customer emails for retention metrics

5. **Login**

Open http://localhost:3000 and use:

```
Email:    pedro@demo.com
Password: demo123
```

## Useful commands

```bash
# View logs
docker compose logs -f

# Restart after code changes
docker compose restart api

# Stop everything
docker compose down

# Reset and rebuild
docker compose down && docker compose up --build -d

# Re-run seed (clears previous demo data first)
docker compose exec -T api python seed_demo.py
```
