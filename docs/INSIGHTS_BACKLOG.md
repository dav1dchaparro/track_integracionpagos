# Insights Backlog — Atlas Nexus

> Catálogo vivo de **insights que queremos sumar al producto**.
> Sirve como fuente de verdad para priorizar qué construir en cada sprint.
> Si tenés una idea nueva, sumala al final con el template de la sección 6.
>
> **Última actualización:** 2026-05-24 · **Owner rotativo:** quien tome la idea.

---

## Cómo leer este documento

Cada insight tiene 5 campos consistentes:

| Campo | Para qué |
|---|---|
| **Qué hace** | Una frase que explica el valor para el merchant. |
| **Data necesaria** | Si los datos ya están en la DB o hay que sumar fuentes. |
| **Enfoque técnico** | Stack/algoritmo pensado. No es un diseño final. |
| **Esfuerzo** | Estimación gruesa en días-persona. |
| **ROI / por qué importa** | Qué número del merchant mueve. |

**Estados posibles** (símbolo al inicio de cada item):

- ✅ **En producto** — ya está construido. Listado para no proponer duplicados.
- 🟢 **Legacy-ready** — código heurístico ya escrito en `docs/legacy/ai_service_v0.py`. Adaptar y enchufar.
- 🟡 **Planificado** — figura en el `ROADMAP.md` o `PLAN_ORQUESTADOR.md`. Tiene owner tentativo.
- 🔵 **Idea abierta** — discutida pero sin owner. Cualquiera puede tomarla.
- ⚪ **Sin priorizar** — propuesta nueva, falta validar valor antes de construir.

---

## 0. Lo que ya está construido (no proponer duplicados)

| Insight | Endpoint / archivo | Notas |
|---|---|---|
| ✅ **Briefing diario con IA** | `GET /insights/briefing` | 2-3 oraciones con dato + insight + acción. Llama 3.3 vía Groq. |
| ✅ **Chat con la IA del negocio** | `POST /insights/chat` | Historial preservado, contexto real del comercio por período. |
| ✅ **Alerta: clientes en riesgo** | `GET /insights/alerts` | Detecta inactividad ≥14 días. Sugiere promo. |
| ✅ **Alerta: día sobre el promedio** | `GET /insights/alerts` | Hoy ≥120% del promedio diario de los últimos 7 días. |
| ✅ **Alerta: productos sin movimiento** | `GET /insights/alerts` | Vendidos en últimos 30d pero no en últimos 7d. |
| ✅ **Alerta: avance de meta mensual** | `GET /insights/alerts` | Avisa al 75% y al 100%+. |
| ✅ **KPIs con deltas vs período previo** | `GET /dashboard/summary` | Revenue, ventas, ticket promedio, retención. |
| ✅ **Top productos y top clientes** | `GET /dashboard/summary` | Por revenue y por unidades. |
| ✅ **Forecasting de demanda (XGBoost)** | `GET /forecasting/recommendations` | Predicción semanal por producto + lista de compras priorizada. |

---

## 1. Quick wins desde el legacy (🟢)

Los 8 analizadores heurísticos preservados en
[`docs/legacy/ai_service_v0.py`](legacy/ai_service_v0.py) ya están escritos.
Son **determinísticos, sin LLM, sin ML** — código Python puro corriendo sobre
las tablas que ya tenemos. Adaptar el modelo (cambiar `merchant_id` a `user_id`
/ `business_id` futuro) y enchufar al router de insights.

### 1.1. 🟢 Horas pico de venta

- **Qué hace:** Identifica las 3 franjas horarias con más facturación del comercio (ej: "tu hora pico es 12:00–14:00, concentrás el 38% del revenue ahí").
- **Data necesaria:** `sales.sold_at` — ya está.
- **Enfoque técnico:** group by `date_part('hour', sold_at)`, ranking por revenue. Código ya escrito en `_analyze_peak_hours` (líneas 78–163 del legacy).
- **Esfuerzo:** 0.5 día (adaptar + endpoint + UI).
- **ROI:** El merchant puede asignar mejor su personal y arrancar promos en horas valle. Insumo directo para la idea **1.8 (promo windows)**.

### 1.2. 🟢 Mejor día de la semana

- **Qué hace:** "Tu mejor día es el sábado con $X promedio, el peor el martes con $Y."
- **Data:** `sales.sold_at` — ya está.
- **Técnica:** group by `extract(dow from sold_at)`. Código en `_analyze_best_day` (309–366).
- **Esfuerzo:** 0.5 día.
- **ROI:** Decide qué día abrir más temprano / cerrar más tarde, cuándo hacer promos.

### 1.3. 🟢 Análisis de ticket promedio extendido

- **Qué hace:** Hoy mostramos el AVG actual. Sumar **evolución** (mes vs mes anterior), **dispersión** (mediana, p25, p75) y outliers (ventas anormalmente altas/bajas).
- **Data:** `sales.total` — ya está.
- **Técnica:** Percentiles SQL. Código en `_analyze_average_ticket` (259–304).
- **Esfuerzo:** 1 día.
- **ROI:** Detectar si el ticket está bajando antes de que sea tarde.

### 1.4. 🟢 Distribución de medios de pago extendido

- **Qué hace:** Más allá del % (que ya mostramos): tendencia mensual (¿se está moviendo a QR?), comparación de ticket promedio por medio.
- **Data:** `sales.payment_method`, `card_brand`, `card_type` — ya está.
- **Técnica:** Series temporales por medio. Código en `_analyze_payment_methods` (371–412).
- **Esfuerzo:** 0.5 día.
- **ROI:** Negociar mejor con procesadores de pago según volumen real por canal.

### 1.5. 🟢 Top productos extendido (revenue + qty + margen)

- **Qué hace:** Hoy ranking por revenue. Sumar: ranking por **unidades**, ranking por **margen** (cuando carguemos costo por producto), y "estrellas en ascenso" (productos que crecieron mes vs mes).
- **Data:** Falta `cost` en `products`. Si no se agrega, hacer solo revenue + qty.
- **Técnica:** Código en `_analyze_top_products` (168–254).
- **Esfuerzo:** 1 día (sin costo), 2 días (con costo + migración).
- **ROI:** Identifica los productos donde poner foco vs los que solo hacen ruido.

### 1.6. 🟢 Market Basket Analysis con lift score

- **Qué hace:** "Los clientes que compran café también compran medialuna el 78% de las veces (lift 2.3x)" — descubre combos naturales.
- **Data:** `sale_items` con sale_id compartido — ya está.
- **Técnica:** Cálculo de support, confidence y lift con SQL + pandas. Código en `_analyze_cross_sell` (417–511). Alternativa con librería: **`mlxtend.frequent_patterns.apriori`** para descubrir reglas más complejas.
- **Esfuerzo:** 1 día (heurístico) o 2 días (Apriori formal).
- **ROI:** **El más alto del backlog.** Habilita combos sugeridos, sube ticket promedio entre 10–25% según industria. Es el insight estrella para la presentación a Clover.

### 1.7. 🟢 Velocity por producto (fast/slow movers)

- **Qué hace:** Calcula unidades vendidas por día por producto y los categoriza. "Tu producto X tiene velocity 12.4 u/día (top 10%). Tu producto Y tiene 0.3 u/día (riesgo de obsolescencia)."
- **Data:** `sale_items` + `products` — ya está.
- **Técnica:** Pandas. Código en `_analyze_restock_strategy` (516–605).
- **Esfuerzo:** 1 día.
- **ROI:** Decisión de qué dejar de comprar y qué comprar más. Complementa el forecasting.

### 1.8. 🟢 Ventanas óptimas para promos

- **Qué hace:** Cruza día de la semana × franja horaria y devuelve los slots **débiles** (donde una promo no canibaliza el peak). "Lunes 15:00–17:00 es tu valle: probá un 2x1 ahí."
- **Data:** `sales.sold_at`, `sales.total` — ya está.
- **Técnica:** Matriz weekday × hour. Código en `_analyze_promo_windows` (610–717).
- **Esfuerzo:** 1 día.
- **ROI:** Genera revenue incremental sin sacrificar ventas naturales.

---

## 2. ML avanzado — Fase 3.5 del Roadmap (🟡)

Insights con modelos formales sobre la data transaccional. Owner tentativo:
**David** (Tech Lead, foco ML).

### 2.1. 🟡 Segmentación RFM + KMeans

- **Qué hace:** Agrupa a los clientes en buckets accionables: **VIP**, **Frecuentes**, **Ocasionales**, **Dormidos**, **Nuevos**.
- **Data:** `sales.customer_email`, `total`, `sold_at` — ya está.
- **Técnica:**
  - **Recency** = días desde última compra.
  - **Frequency** = cantidad de compras en N días.
  - **Monetary** = revenue total.
  - Score cuartiles (1–4) por dimensión → tag combinado RFM.
  - Opcional: KMeans (k=5) sobre las 3 dimensiones normalizadas para clusters dinámicos.
- **Esfuerzo:** 1.5–2 días.
- **ROI:** Habilita marketing dirigido. Combinable con **WhatsApp Business** (fase 5) para promos por segmento. Reemplaza la regla actual de "clientes en riesgo".

### 2.2. 🟡 Churn predictivo

- **Qué hace:** Reemplaza la regla actual (">14 días sin comprar") por un modelo que predice **probabilidad de que un cliente no vuelva** en los próximos 30 días.
- **Data:** `sales` por cliente. Etiquetado del histórico requerido.
- **Técnica:** Clasificación binaria con XGBoost o Logistic Regression. Features: recency, frequency, monetary, ticket promedio, diversidad de productos, tiempo entre compras, varianza temporal.
- **Esfuerzo:** 3–4 días (incluye etiquetado del histórico, feature engineering, validación).
- **ROI:** Permite intervenir a los clientes con probabilidad alta de churn **antes** de que se vayan. Subir retención del 5–15%.

### 2.3. 🟡 Detección de anomalías en ventas

- **Qué hace:** Detecta ventas raras automáticamente: "Esta venta de $50.000 a las 3am es atípica" o "vendiste 30 cafés en 5 minutos, algo raro pasa".
- **Data:** `sales` — ya está.
- **Técnica:** **Isolation Forest** sobre features (monto, hora, cantidad de items, día de la semana). Threshold ajustable.
- **Esfuerzo:** 1–2 días.
- **ROI:** Operacional — detecta posibles fraudes, errores de carga o anomalías de inventario.

---

## 3. IA avanzada — Fase 4 del Roadmap (🟡)

### 3.1. 🟡 IA proactiva (push de insights sin que pregunten)

- **Qué hace:** En vez de esperar a que el merchant abra la app, el sistema le **manda** un insight (email / push) cuando detecta algo relevante: "Hoy vas a vender 30% menos por la lluvia", "El producto X está en racha, considerá subir su exposición".
- **Data:** Sales + datos externos opcionales (clima, calendario de feriados).
- **Técnica:** Cron job + reglas + LLM para naturalizar el texto. Push vía FCM / email.
- **Esfuerzo:** 4–5 días (incluye notificación push en Android, plantilla email, throttling).
- **ROI:** Engagement diario sube. Marca el producto como "asesor", no como herramienta.

### 3.2. 🟡 Sugerencias de precios dinámicas

- **Qué hace:** "Tu café cuesta $850. Productos con velocity similar en el sector se venden a $920. Probá subirlo $50."
- **Data:** Sales + benchmarks externos (futuro, ver fase 5).
- **Técnica:** Elasticidad por producto (cambio histórico de precio × cambio de qty). Si nunca cambió, usar variación percentil del histórico.
- **Esfuerzo:** 5–7 días (requiere histórico de cambios de precio).
- **ROI:** Margen +3–8% por producto bien tuneado. **Asusta al comerciante chico**, hay que envolverlo con UX cuidada.

### 3.3. 🟡 Detección de fraude en ventas

- **Qué hace:** Similar a anomalías (2.3) pero supervisado: flaggear patrones tipo cancelaciones repetidas por mismo vendedor, refunds sospechosos, ventas fuera de horario, etc.
- **Data:** Necesita `employees` (Clover Fase 3) y `refunds/voids` (webhook fase 3).
- **Técnica:** Reglas + clasificación supervisada cuando haya etiquetas.
- **Esfuerzo:** Bloqueado por sincronización de empleados con Clover.

### 3.4. 🟡 IA por voz

- **Qué hace:** El comerciante le habla al celular: "che, ¿cómo vendí hoy?", y le responde por audio.
- **Data:** La misma del chat actual.
- **Técnica:** Whisper (transcripción) → chat backend → TTS (text-to-speech). Idealmente con SDK móvil.
- **Esfuerzo:** 1 semana en Android + 2 días en backend.
- **ROI:** Diferenciación fuerte para perfil de comerciante no-técnico. Hay que evaluar costo de inferencia.

### 3.5. 🟡 Generador de promos con IA

- **Qué hace:** "Mandale un 15% off por WhatsApp a tus 12 clientes en riesgo con un texto personalizado para cada uno."
- **Data:** Segmentación RFM (2.1) + plantilla LLM.
- **Técnica:** Llama 3.3 con prompt parametrizado por cliente. Integración WhatsApp Business (fase 5).
- **Esfuerzo:** 3–4 días backend + integración WhatsApp.
- **ROI:** Cierra el ciclo "detección → acción". El insight se convierte en venta.

---

## 4. Insights nuevos — ideas abiertas (🔵)

### 4.1. 🔵 Estacionalidad y feriados

- **Qué hace:** Detecta si hay días con picos recurrentes (cumpleaños del local, día de la madre, fin de mes, días de cobro). Avisa con anticipación.
- **Data:** `sales.sold_at` + calendario externo (feriados nacionales/regionales).
- **Técnica:** Descomposición STL o Prophet de Meta. Para feriados, regresores externos.
- **Esfuerzo:** 2–3 días.
- **ROI:** Permite preparar stock e itinerarios con días de anticipación.

### 4.2. 🔵 Correlación clima ↔ ventas

- **Qué hace:** "Cuando llueve vendés 22% menos. El miércoles llueve, considerá ajustar stock perecedero."
- **Data:** `sales` + API de clima histórico (OpenWeather, Visual Crossing).
- **Técnica:** Correlación + regresión simple.
- **Esfuerzo:** 3 días (incluye integración API + backfill histórico).
- **ROI:** Útil para cafeterías, heladerías, food truck. Variable según vertical.

### 4.3. 🔵 Cohortes de retención

- **Qué hace:** "De los clientes que vinieron en enero, el 38% volvió en febrero. De los de febrero, el 51% volvió en marzo." Tabla clásica de cohortes.
- **Data:** `sales.customer_email`, `sold_at` — ya está.
- **Técnica:** Pivot mes-cohorte vs mes-actividad. Heatmap.
- **Esfuerzo:** 2 días.
- **ROI:** Mide si las campañas de retención funcionan. Esencial para Pro+.

### 4.4. 🔵 Comparación vs negocios similares (benchmarking)

- **Qué hace:** "Tu ticket promedio de $1.200 está en el percentil 60 entre cafeterías de tu zona." Foso defensivo del producto.
- **Data:** Requiere data agregada anónima entre comercios → solo viable **post multi-tenant**.
- **Técnica:** Agregaciones globales con filtros (vertical, zona, tamaño).
- **Esfuerzo:** 1 semana (requiere taxonomía de verticales).
- **ROI:** **Altísimo** — es lo que diferencia un dashboard de un "asesor". Es difícil de copiar.

### 4.5. 🔵 Time-to-second-purchase

- **Qué hace:** Mediana de días entre primera y segunda compra por cliente. Sirve como **proxy de engagement temprano**.
- **Data:** `sales.customer_email` + `sold_at` — ya está.
- **Técnica:** SQL puro, ventana por cliente.
- **Esfuerzo:** 0.5 día.
- **ROI:** Detecta si hay un cuello de botella entre primera y segunda compra (señal de que el producto no enganchó).

### 4.6. 🔵 Diversidad de la canasta por cliente

- **Qué hace:** "Tus clientes VIP compran 8 productos distintos en promedio, los Ocasionales solo 2." Mide profundidad de la relación.
- **Data:** `sale_items` agrupados por cliente.
- **Técnica:** Conteo distinct + correlación con LTV.
- **Esfuerzo:** 1 día.
- **ROI:** Identifica clientes con potencial de cross-sell.

### 4.7. 🔵 Predicción de no-show (para reservas / pedidos)

- **Qué hace:** Si en el futuro Atlas soporta reservas o pedidos, predecir qué clientes son propensos a no presentarse.
- **Data:** Sin la feature de reservas, no aplica todavía.
- **Estado:** Sin priorizar hasta que exista la feature base.

### 4.8. 🔵 Análisis de mix por categoría a lo largo del tiempo

- **Qué hace:** "Bebidas pasó de ser el 45% del revenue al 38% en 3 meses. Comidas creció del 30% al 42%." Detecta shifts en el negocio.
- **Data:** `sale_items` + `product_categories` — ya está.
- **Técnica:** Series temporales apiladas por categoría.
- **Esfuerzo:** 1 día.
- **ROI:** Visibilidad estratégica para el dueño que sigue solo el día a día.

---

## 5. Insights operacionales (⚪)

Más útiles cuando lleguen multi-tenant + Clover OAuth completo.

### 5.1. ⚪ Performance por vendedor

- **Qué hace:** Ranking de empleados por revenue, ticket promedio, conversión.
- **Bloqueado por:** Sincronización de `employees` desde Clover (fase 3).

### 5.2. ⚪ Tiempo medio entre venta y siguiente

- **Qué hace:** Cuánto tarda un cliente promedio entre compras. Útil para timing de promos.
- **Esfuerzo:** 1 día.

### 5.3. ⚪ Velocidad de adopción de productos nuevos

- **Qué hace:** Días desde que se carga un producto hasta que llega a X% del revenue. Identifica "estrellas tempranas" vs "lentos".
- **Esfuerzo:** 1.5 días.

### 5.4. ⚪ Análisis de mermas / cancelaciones

- **Qué hace:** % de órdenes que terminan en void o refund. Razones más frecuentes.
- **Bloqueado por:** Sincronización de refunds/voids (fase 3).

### 5.5. ⚪ LTV predicho por cliente

- **Qué hace:** Predicción del valor total que va a generar un cliente en los próximos 12 meses. Combina con churn (2.2) para identificar "VIPs en riesgo".
- **Técnica:** Modelo BG/NBD + Gamma-Gamma (estándar para LTV en retail). Librería `lifetimes`.
- **Esfuerzo:** 4–5 días.

---

## 6. Cómo proponer un insight nuevo

Copiar este template al final de la sección que corresponda. Si no encaja en
ninguna, agregar a la sección 4 (Ideas abiertas).

```markdown
### X.Y. ⚪ Nombre corto del insight

- **Qué hace:** Una frase que explique el valor para el merchant.
- **Data necesaria:** Tablas/columnas que se usan. Si falta data, decirlo.
- **Enfoque técnico:** SQL / pandas / ML / LLM. Algoritmo si aplica.
- **Esfuerzo:** Estimación en días-persona.
- **ROI / por qué importa:** Qué número del merchant mueve.
```

---

## 7. Priorización sugerida para el próximo sprint

Esta es **una opinión**, no una decisión cerrada. Discutirla en el próximo
weekly sync.

| Prioridad | Insight | Por qué |
|---|---|---|
| **P0** | 1.6 — Market Basket con lift | Mayor ROI, código legacy ya escrito, halo para pitch Clover. |
| **P0** | 2.1 — Segmentación RFM | Habilita marketing dirigido y reemplaza la regla heurística actual. |
| **P1** | 1.1 + 1.2 + 1.8 — Pack temporal | Hora pico, día pico y ventanas de promo se construyen juntos (mismo dataset). |
| **P1** | 4.3 — Cohortes de retención | Métrica core para mostrar valor del Pro tier. |
| **P2** | 2.2 — Churn predictivo | Alto valor, pero requiere 3-4 días y etiquetado de histórico. |
| **P2** | 1.7 — Velocity de productos | Complementa el forecasting, esfuerzo bajo. |
| **P3** | 2.3 — Detección de anomalías | Operacional, valor depende del comercio. |

---

*Documento vivo. Editar con PR, no con mensajes de Slack.*
