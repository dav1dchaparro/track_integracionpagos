# Cómo correr la demo de punta a punta

Levanta la app con un dataset sintético rico de un kiosko argentino (1 año de ventas, 350 clientes con perfil completo, 967 compras al proveedor con inflación y patrones estacionales).

## Prerequisitos

- Docker + Docker Compose
- Python 3.10+ (solo para el generador, fuera del container)
- Puertos libres: **3000** (frontend), **8000** (API)

## Flujo (5 pasos, ~3 minutos)

### 1. Levantar la stack

```bash
docker compose up -d
```

Esto arranca `postgres`, `api` (FastAPI con uvicorn) y `frontend` (Vite/React). La primera vez tarda más por el build; las siguientes son segundos.

Verificar que arrancó:

```bash
curl -s http://localhost:8000/docs   # API
curl -s http://localhost:3000        # Frontend
```

### 2. Generar el dataset sintético

Desde la raíz del repo, con Python local:

```bash
python3 gen_kiosko_v2.py
```

Sale 4 archivos:

| Archivo | Contenido |
|---|---|
| `ventas_kiosko_demo.csv` | ~44.000 ventas con 71.000 líneas, todos los campos (card_category, customer_email, clover_order_id) |
| `clientes.csv` | 350 perfiles (email, name, phone, birthday) |
| `compras_proveedor.csv` | ~970 compras al proveedor con inflación, cadencias diferenciadas y anomalías |
| `stock_inicial.csv` | Stock de arranque por producto |

La validación al final del script confirma: distribución cash/card/qr, top productos, inflación de Coca-Cola (~+48%), stockouts sembrados, panic restocks.

### 3. Mover los CSVs al volumen del backend

El container `api` monta `./backend:/app`, así que los CSVs tienen que vivir dentro de `backend/`:

```bash
mv ventas_kiosko_demo.csv clientes.csv compras_proveedor.csv stock_inicial.csv backend/
```

### 4. Resetear la DB y correr el loader

Para una demo limpia (recomendado), borrar todo lo previo:

```bash
docker compose exec postgres psql -U postgres -d postgres -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker compose restart api
# Esperar 5s a que la API recree las 12 tablas vía init_db
sleep 5
```

Y cargar todo:

```bash
docker compose exec api python -m scripts.load_kiosko_csv
```

El loader llena las 12 tablas en orden FK-correcto y recalcula `product_stock` como `stock_inicial + Σ compras − Σ ventas`. Tarda ~2 minutos para 44k ventas.

### 5. Entrar a la app

http://localhost:3000

| Campo | Valor |
|---|---|
| Email | `kiosko-demo@atlas.com` |
| Password | `demo123` |

> **Tip**: el dashboard arranca filtrando "mes" por defecto. Para ver volumen completo cambiá el selector a "año".

---

## Qué vas a ver en cada pantalla

| Pantalla | Data que muestra |
|---|---|
| **Dashboard** | KPIs (revenue, ticket, return rate), top productos, breakdown cash/card/qr, marcas tarjeta, timeline. ~3.700 ventas/mes, $2.4M facturados. |
| **Insights Briefing** | Resumen del día generado por Groq en español rioplatense (sin jargon: dice "ventas" no "revenue", "clientes que vuelven" no "retention"). |
| **Insights Alertas** | Clientes que hace rato no vuelven, productos sin moverse, meta del mes, día por encima del promedio. |
| **Insights Forecasting** | Predicción XGBoost para 52 productos con stock real. Recomendaciones de compra coherentes (Brahma: 26 unidades, Pancho: 15, etc.). |
| **Productos / Categorías** | Catálogo del kiosko: 52 SKUs, 26 categorías (8 padres + 18 subcategorías). |
| **App Clover (Android)** | Pantalla **Asistente de Checkout**: arma un carrito con productos del catálogo y recibe sugerencias de cross-sell en vivo desde `/clover/cart-suggestions`. |

---

## Diferenciales sembrados en la data (para que la demo "muestre cosas")

| Patrón | Donde se nota |
|---|---|
| **Cadencias de reabastecimiento** | Coca-Cola se compra cada ~10 días; Curitas cada ~57 días. Útil para mostrar valor del módulo de inventario. |
| **Inflación de costos** | El `unit_cost` de Coca-Cola pasa de $131 → $194 en el año (+48%). Habilita análisis de márgenes en el tiempo. |
| **Stockouts** | Milka, Red Bull, Fanta tienen períodos de 5-10 días sin reposición. ML puede detectar "compra llegó tarde". |
| **Panic restocks** | Sprite, Lays, Pepsi reciben 3x cantidad antes de fiestas (~20-dic). |
| **Clientes recurrentes** | 30 VIPs concentrados en cervezas/cigarrillos, 100 frecuentes, 220 ocasionales. RFM tiene grupos diferenciables. |
| **`card_category`** | Cada venta con tarjeta tiene tier (classic 55%, gold 25%, platinum 10%, black 5%, signature 3%, world 1%). |
| **`clover_order_id`** | ~50% de las ventas con tarjeta simulan provenir del POS Clover. |
| **Curva diaria/semanal** | Picos a las 12-14 (almuerzo), 20-23 (noche). Viernes/sábado +40-50%. Verano: cerveza +60%, chocolates -30%. |

---

## Troubleshooting

| Síntoma | Causa probable | Fix |
|---|---|---|
| Dashboard vacío en filtro "mes" | Los datos son del año móvil; el filtro mira últimos 30 días. | Cambia a "año" o regenera el CSV (que usa el año actual). |
| `/forecasting/recommendations` tarda mucho | Cache vacía (primera vez después de reset). | Esperá ~2s la primera carga; las siguientes son instantáneas (TTL 10min). |
| Error `enum payment_method_enum doesn't have 'cash'` | DB vieja sin migración. | El loader hace `ALTER TYPE ADD VALUE IF NOT EXISTS` al arrancar. Si falla, reset completo del paso 4. |
| Postgres `No space left on device` | Disco lleno con imágenes Docker viejas. | `docker system prune -a -f` libera ~5-10 GB seguros. |

---

## ¿Por qué el loader no está en `docker-compose.yml` como servicio?

Lo pensé: agregar un servicio `loader` que corra al levantarse, dejaría una demo "turnkey" (clonar + `docker compose up` y listo). **No lo hice por dos razones:**

1. **El loader necesita los 4 CSVs ya generados** (`gen_kiosko_v2.py` se corre fuera del container porque tiene aleatoriedad controlada por seed). Atarlo a `docker compose up` significaría meter el generador adentro o pre-commitear CSVs de 6 MB.
2. **El loader es destructivo** (borra data del user kiosko-demo antes de cargar). No querés que se ejecute cada `docker compose restart` y wipee lo que hayas editado a mano desde la UI.

Si querés que sea turnkey de verdad, una opción liviana es agregar un `Makefile`:

```makefile
demo:
	python3 gen_kiosko_v2.py
	mv -f ventas_kiosko_demo.csv clientes.csv compras_proveedor.csv stock_inicial.csv backend/
	docker compose exec postgres psql -U postgres -d postgres -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	docker compose restart api
	sleep 5
	docker compose exec api python -m scripts.load_kiosko_csv
```

Entonces `make demo` deja todo listo. Si querés que lo agregue, avisame.

---

## Estructura de las 12 tablas

Para entender el modelo completo, ver el doc del schema (`.claude/plans/`):

- `inventory.md` — diseño de `stock_purchases` + product_stock derivado
- `customers.md` — diseño de `customers` + `marketing_events`
- `integrations.md` — diseño de `clover_webhook_events`

Resumen:
```
users (1)
├── categories (26)
├── products (52) ←─ N:M ─→ categories (vía product_categories)
├── customers (350) ←──── sales.customer_id
├── sales (44.482) ──→ sale_items (71.178) ──→ products
├── stock_purchases (967) → products (la pieza simétrica de sale_items)
├── product_stock (52) = stock_inicial + Σ purchases − Σ sales
├── demand_predictions (52) — caché del forecast XGBoost
├── marketing_events (0) — listo para producción
└── clover_webhook_events (1+) — audit de webhooks Clover
```
