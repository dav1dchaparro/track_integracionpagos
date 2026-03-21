# SmartReceipt — Fiserv Aleph Hackathon

App para comerciantes Clover que analiza sus transacciones con IA y genera insights accionables: hora pico, productos más vendidos, ticket promedio, mejor día de la semana y métodos de pago preferidos.

---

## El problema

Los comerciantes tienen datos de ventas en Clover pero no saben cómo interpretarlos. No saben a qué hora venden más, qué producto les da más ganancia, ni qué día de la semana es el más flojo.

## La solución

SmartReceipt se conecta a Clover, lee las transacciones y las analiza automáticamente. El comerciante ve un dashboard claro con insights y recomendaciones concretas, sin necesidad de saber de análisis de datos.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Python + FastAPI |
| Base de datos | SQLite (dev) / PostgreSQL (prod) |
| ORM | SQLAlchemy |
| Validación | Pydantic v2 |
| Integración pagos | Clover REST API + Webhooks |
| Frontend web | HTML + CSS + JS (sin frameworks) |
| App Android | Java + Retrofit |

---

## Estructura del proyecto

```
smartreceipt/
├── backend/                         # API REST con FastAPI
│   ├── main.py                      # Punto de entrada
│   ├── requirements.txt             # Dependencias Python
│   ├── seed_demo.py                 # Genera 2000+ transacciones de demo
│   ├── ARCHITECTURE.md              # Arquitectura del backend
│   └── app/
│       ├── config.py                # Variables de entorno (Clover keys, DB)
│       ├── database.py              # Conexión SQLAlchemy
│       ├── models/                  # Tablas: merchant, transaction, insight
│       ├── schemas/                 # Validación Pydantic de entrada/salida
│       ├── routers/                 # Endpoints: merchants, transactions, insights, dashboard, clover
│       └── services/
│           ├── ai_service.py        # Motor de análisis con IA
│           └── clover_service.py    # Integración con la API de Clover
│
├── frontend/                        # Dashboard web
│   ├── index.html                   # App completa (HTML + CSS + JS)
│   └── ARCHITECTURE.md              # Arquitectura del frontend
│
└── android/                         # App Android (Java)
    ├── ARCHITECTURE.md              # Arquitectura del Android
    └── app/src/main/java/com/smartreceipt/track/
        ├── models/                  # Transaction, AIInsight, Dashboard
        ├── network/                 # Retrofit + SmartReceiptApi
        └── repositories/           # TransactionRepository, InsightRepository
```

---

## Cómo correr

### 1. Backend

```bash
cd backend

# Crear entorno virtual e instalar dependencias
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Clover

# Cargar datos de demo (2103 transacciones)
python seed_demo.py

# Arrancar el servidor
uvicorn main:app --reload
```

Backend disponible en `http://localhost:8000`.
Documentación interactiva en `http://localhost:8000/docs`.

### 2. Frontend web

```bash
cd frontend
python3 -m http.server 3000
# Abrir http://localhost:3000
```

Requiere que el backend esté corriendo primero.

### 3. App Android

Abrir la carpeta `android/` en Android Studio. El emulador se conecta al backend usando la IP `10.0.2.2:8000` (que apunta al `localhost` de la PC).

---

## API endpoints

### Dashboard
```
GET /api/dashboard/{merchant_id}?period_days=30
```
Devuelve revenue total, transacciones, ticket promedio, hora pico, top productos, métodos de pago y revenue diario.

### Insights de IA
```
POST /api/insights/{merchant_id}/generate?period_days=30
GET  /api/insights/{merchant_id}
```
Genera y devuelve 5 análisis automáticos:
- **peak_hours** — Hora del día con más ventas
- **top_products** — Productos que más revenue generan
- **average_ticket** — Ticket promedio y segmentación
- **best_day** — Día de la semana más rentable
- **payment_methods** — Distribución de métodos de pago

### Transacciones
```
POST /api/transactions/
GET  /api/transactions/{merchant_id}?limit=10&offset=0
```

### Comerciantes
```
POST /api/merchants/
GET  /api/merchants/{merchant_id}
```

### Webhooks Clover
```
POST /api/clover/webhook
```
Recibe eventos automáticos cuando se crea o actualiza una orden en el POS.

---

## Flujo de datos

```
Clover POS ──webhook──▶ POST /api/clover/webhook
                                  │
                        clover_service obtiene
                        detalle de la orden
                                  │
                        Guarda como Transaction
                                  │
              ◀── GET /api/dashboard ──── Frontend / Android
                                  │
                        ai_service analiza
                        las transacciones
                                  │
              ◀── GET /api/insights ───── Insights de IA
```

---

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | URL de la DB (`sqlite:///./smartreceipt.db` por defecto) |
| `CLOVER_APP_ID` | ID de la app en el Clover App Market |
| `CLOVER_APP_SECRET` | Secret para verificar webhooks |
| `CLOVER_API_BASE_URL` | `https://apisandbox.dev.clover.com` (dev) |
| `SECRET_KEY` | Clave secreta de la aplicación |
| `DEBUG` | `true` en desarrollo |

---

## Equipo

Proyecto desarrollado para el **Fiserv — Aleph Hackathon**.
