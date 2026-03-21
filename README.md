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
| Frontend | Android (Java) |

---

## Estructura del proyecto

```
backend/
├── main.py                          # Punto de entrada de la API
├── requirements.txt                 # Dependencias Python
├── .env.example                     # Variables de entorno (copiar como .env)
├── seed_demo.py                     # Genera datos de demo para el hackathon
└── app/
    ├── config.py                    # Configuración (Clover keys, DB URL)
    ├── database.py                  # Conexión a la base de datos
    ├── models/                      # Tablas de la base de datos
    │   ├── merchant.py              # Comerciantes
    │   ├── transaction.py           # Transacciones/ventas
    │   └── insight.py               # Insights generados por IA
    ├── schemas/                     # Validación de datos de entrada/salida
    ├── routers/                     # Endpoints de la API
    │   ├── merchants.py             # CRUD comerciantes
    │   ├── transactions.py          # Recibir y listar ventas
    │   ├── insights.py              # Ver y generar insights
    │   ├── dashboard.py             # Resumen completo para el app
    │   └── clover.py                # Webhooks de Clover
    └── services/
        ├── ai_service.py            # Motor de análisis con IA
        └── clover_service.py        # Integración con la API de Clover
```

---

## Cómo correr el backend

```bash
cd backend

# 1. Instalar dependencias
pip install -r requirements.txt

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Clover

# 3. Cargar datos de demo (opcional, para el hackathon)
python seed_demo.py

# 4. Arrancar el servidor
uvicorn main:app --reload
```

El servidor queda disponible en `http://localhost:8000`.
Documentación automática en `http://localhost:8000/docs`.

---

## API endpoints

### Dashboard
```
GET /api/dashboard/{merchant_id}?period_days=30
```
Devuelve el resumen completo: revenue total, transacciones, ticket promedio, hora pico, top productos, métodos de pago y revenue diario.

### Insights de IA
```
POST /api/insights/{merchant_id}/generate?period_days=30
GET  /api/insights/{merchant_id}
```
Genera y devuelve los 5 análisis automáticos:
- **peak_hours** — Hora del día con más ventas
- **top_products** — Productos que más revenue generan
- **average_ticket** — Ticket promedio y segmentación de clientes
- **best_day** — Día de la semana más rentable
- **payment_methods** — Distribución de métodos de pago

### Transacciones
```
POST /api/transactions/
GET  /api/transactions/{merchant_id}
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
Recibe eventos automáticos de Clover cuando se crea o actualiza una orden.

---

## Flujo de datos

```
App Android  ──POST /api/transactions──▶  Backend
                                              │
                                         Guarda en DB
                                              │
             ──POST /api/insights/generate──▶ ai_service
                                              │
                                    Analiza transacciones
                                              │
             ◀──GET /api/dashboard────────── Devuelve insights
```

### Integración con Clover (producción)
```
Clover POS  ──webhook──▶  POST /api/clover/webhook
                                    │
                          clover_service llama a la API
                          y obtiene detalles de la orden
                                    │
                          Guarda como Transaction en DB
```

---

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | URL de conexión a la DB (SQLite o PostgreSQL) |
| `CLOVER_APP_ID` | ID de la app en el Clover App Market |
| `CLOVER_APP_SECRET` | Secret para verificar webhooks |
| `CLOVER_API_BASE_URL` | `https://apisandbox.dev.clover.com` (dev) o `https://api.clover.com` (prod) |
| `SECRET_KEY` | Clave secreta de la aplicación |
| `DEBUG` | `true` en desarrollo, `false` en producción |

---

## Equipo

Proyecto desarrollado para el **Fiserv — Aleph Hackathon**.
