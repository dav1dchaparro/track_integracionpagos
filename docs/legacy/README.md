# Legacy code — referencia, no producción

Archivos preservados de ramas que fueron eliminadas. **No se importan desde el código vivo**. Sirven como referencia cuando re-implementemos las features en el roadmap actual.

## `ai_service_v0.py` (749 líneas)

**Origen:** `origin/frontend-web` (último commit `a492c33`, 2026-03-21).

**Por qué se preserva:** contiene 8 analizadores heurísticos (sin LLM, determinísticos, baratos) que NO están en el `insights.py` actual de `main`. Cuando llegue Fase 3.5 / Fase 4 del ROADMAP (Market Basket Analysis, segmentación, etc.) hay implementación ya pensada para adaptar.

### Analizadores incluidos

| Función | Líneas aprox. | Qué hace |
|---|---|---|
| `_analyze_peak_hours` | 78–163 | Detecta horas pico de venta |
| `_analyze_top_products` | 168–254 | Productos más vendidos por revenue/qty |
| `_analyze_average_ticket` | 259–304 | Ticket promedio + evolución |
| `_analyze_best_day` | 309–366 | Mejor día de la semana |
| `_analyze_payment_methods` | 371–412 | Distribución de medios de pago |
| `_analyze_cross_sell` | 417–511 | **Market Basket Analysis con lift score** — qué productos se compran juntos |
| `_analyze_restock_strategy` | 516–605 | Velocity (unidades/día) por producto — fast/slow movers |
| `_analyze_promo_windows` | 610–717 | Cruza weekday × time-slot para encontrar ventanas débiles donde correr promos sin canibalizar peak hours |

### Qué hay que adaptar para usarlo

El código original usa modelos viejos que ya no existen así:

| Original (legacy) | Equivalente actual |
|---|---|
| `merchant_id: str` | `user_id: uuid.UUID` (o `business_id` post-Fase 2) |
| `Transaction` | [`Sale`](../../backend/app/models/sale.py) |
| `Insight` model | No existe en main — habría que crearlo o reemplazar con respuesta directa |

### Cuándo re-usar

Está en el roadmap como **Fase 3.5 — Modelos de ML sobre la data transaccional** ([ROADMAP.md](../../ROADMAP.md)) y como **Fase 4 — Track B IA Avanzada** ([PLAN_ORQUESTADOR.md](../../PLAN_ORQUESTADOR.md)).
