# Arquitectura del Backend — SmartReceipt

Explicación en palabras simples de cómo funciona cada parte del backend.

---

## La analogía del restaurante

Pensá el backend como un restaurante:

- **FastAPI** es el mozo — recibe los pedidos (requests) y los lleva a quien corresponde
- **La base de datos** es la cocina — donde se guarda y procesa todo
- **Los routers** son los departamentos (caja, cocina, barra)
- **Los schemas** son los formularios que hay que llenar bien para hacer un pedido
- **Los services** son los especialistas que hacen el trabajo pesado

---

## Flujo completo

```
App Android
    │
    ▼
POST /api/transactions      ← manda una venta nueva
    │
    ▼
router/transactions.py      ← recibe el request
    │
    ▼
schemas/transaction.py      ← valida que los datos estén bien
    │
    ▼
models/transaction.py       ← guarda en la base de datos
    │
    ▼
POST /api/insights/generate ← pedís que analice
    │
    ▼
services/ai_service.py      ← analiza todas las transacciones
    │
    ▼
GET /api/dashboard          ← el app pide el resumen
    │
    ▼
router/dashboard.py         ← arma el JSON con todo
    │
    ▼
App Android muestra el dashboard
```

---

## Archivo por archivo

### `main.py` — La puerta de entrada
Es donde arranca todo. Le dice a FastAPI qué rutas existen y activa
la base de datos cuando el servidor inicia.

```python
app.include_router(transactions.router, prefix="/api/transactions")
app.include_router(insights.router,     prefix="/api/insights")
app.include_router(dashboard.router,    prefix="/api/dashboard")
# etc...
```

---

### `app/config.py` — El cuaderno de configuración
Guarda las credenciales y configuraciones sensibles.
Las lee desde el archivo `.env` para no escribirlas directo en el código.

```
CLOVER_APP_ID=xxx
CLOVER_APP_SECRET=xxx
DATABASE_URL=sqlite:///./smartreceipt.db
```

---

### `app/database.py` — La cocina
Maneja la conexión con la base de datos.
Cada vez que un router necesita leer o guardar datos, le pide una "sesión",
la usa, y la cierra. Como abrir y cerrar la heladera.

---

### `app/models/` — Los formularios de la base de datos

Definen la **estructura de las tablas**. Son 3 tablas:

#### `merchant.py`
Un comerciante registrado en el sistema.
```
id         → ID de Clover (ej: "ABC123XYZ")
name       → "Café El Ángel"
email      → "hola@cafe.com"
currency   → "USD"
clover_access_token → para llamar a la API de Clover
```

#### `transaction.py`
Una venta individual.
```
id              → ID único
merchant_id     → a qué comercio pertenece
amount          → total cobrado (ej: 12.50)
tip             → propina
tax             → impuesto
payment_method  → CARD / CASH / CREDIT / DEBIT
items           → lista de productos vendidos (en JSON)
transaction_at  → cuándo ocurrió
```

#### `insight.py`
Un análisis generado por la IA.
```
insight_type   → "peak_hours" / "top_products" / etc.
title          → "Tu hora pico es las 9:00 AM"
description    → explicación detallada
recommendation → qué hacer con esa info
value          → número principal del insight
trend          → "up" / "down" / "stable"
data           → datos extra para graficar (JSON)
```

---

### `app/schemas/` — Los filtros de datos

Los schemas validan que los datos que llegan o salen estén bien formados.
Si el Android manda una transacción sin monto, el schema la rechaza
antes de tocar la base de datos.

Cada schema tiene hasta 3 variantes:

#### `merchant.py`
| Schema | Cuándo se usa |
|--------|---------------|
| `MerchantCreate` | Cuando el Android registra un comercio nuevo — define qué campos son obligatorios |
| `MerchantUpdate` | Cuando se edita un comercio — todos los campos son opcionales |
| `MerchantResponse` | Lo que devuelve la API al Android — nunca devuelve el token de Clover |

#### `transaction.py`
| Schema | Cuándo se usa |
|--------|---------------|
| `TransactionItem` | Un producto dentro de una venta (nombre, precio, cantidad) |
| `TransactionCreate` | Cuando llega una venta nueva — valida monto, método de pago, items, fecha |
| `TransactionResponse` | Lo que devuelve la API — incluye item_count calculado |
| `CloverWebhookPayload` | Estructura exacta del evento que manda Clover (merchantId, type, objectId) |

#### `insight.py`
| Schema | Cuándo se usa |
|--------|---------------|
| `InsightResponse` | Un insight individual con título, descripción y recomendación |
| `DashboardResponse` | El resumen completo del dashboard: revenue total, ticket promedio, hora pico, top productos, métodos de pago, revenue diario |

---

### `app/routers/` — Los departamentos

Cada archivo agrupa los endpoints de un tema:

| Router | Qué hace |
|--------|----------|
| `merchants.py` | Crear, ver y editar comerciantes |
| `transactions.py` | Recibir ventas del Android y listarlas por fecha |
| `insights.py` | Ver insights guardados o pedir que se generen nuevos |
| `dashboard.py` | Arma el resumen completo calculando todo en el momento |
| `clover.py` | Recibe webhooks de Clover cuando hay una venta nueva en el POS |

---

### `app/services/ai_service.py` — El analista de negocio

Toma todas las transacciones de un período y genera 5 análisis:

| Análisis | Qué calcula | Recomendación que da |
|----------|-------------|----------------------|
| `peak_hours` | A qué hora del día hay más ventas | Tener más personal a esa hora |
| `top_products` | Qué producto genera más dinero | Mantener stock, crear combos |
| `average_ticket` | Cuánto gasta cada cliente en promedio | Crear combos si el ticket es bajo |
| `best_day` | Qué día de la semana es el más rentable | Lanzar promos los días flojos |
| `payment_methods` | Con qué pagan más (tarjeta, efectivo) | Incentivar pagos digitales si hay mucho efectivo |

Para cada análisis guarda en la DB: título, descripción, recomendación y datos para graficar.

---

### `app/services/clover_service.py` — El traductor de Clover

Clover habla su propio idioma:
- Los montos vienen en **centavos** (1250 = $12.50)
- Las fechas vienen en **milisegundos** (Unix timestamp × 1000)
- Los items vienen anidados dentro de la orden

Este servicio llama a la API de Clover, trae los detalles de una orden,
y la convierte al formato que usamos internamente.

---

### `seed_demo.py` — El generador de datos falsos

Para el hackathon no vas a tener un Clover real con ventas reales.
Este script genera 90 días de ventas ficticias de un café
(con productos, horarios realistas y métodos de pago variados)
para que el dashboard se vea completo cuando lo presentes a los jueces.

```bash
python seed_demo.py
# → genera ~2000 transacciones de demo
```

---

## Por qué separamos models de schemas

| | `models/` | `schemas/` |
|--|-----------|------------|
| Propósito | Estructura de la base de datos | Validación de datos de entrada/salida |
| Framework | SQLAlchemy | Pydantic |
| Ejemplo | La tabla `transactions` con todas sus columnas | Solo los campos que el Android necesita mandar |

Un model puede tener 20 columnas, pero el schema de respuesta solo devuelve 10.
Esto evita exponer datos internos (como tokens o datos raw de Clover).
