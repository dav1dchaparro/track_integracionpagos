# Plan Orquestador — Atlas Nexus

> **Documento maestro de coordinación, arquitectura y estrategia.**
> Fuente de verdad del proyecto. Si algo cambia, se edita acá vía PR — no en Slack, no en Notion paralelo.
>
> **Última actualización:** 2026-05-23 · **Owners:** Tech Lead + PM rotativo · **Próxima revisión:** 2026-06-01

---

## Tabla de contenidos

1. [TL;DR](#1-tldr)
2. [Contexto de mercado y panorama competitivo](#2-contexto-de-mercado-y-panorama-competitivo)
3. [Diagnóstico del proyecto hoy](#3-diagnóstico-del-proyecto-hoy)
4. [Visión a 6 meses y KPIs](#4-visión-a-6-meses-y-kpis)
5. [Equipo, roles y rituales](#5-equipo-roles-y-rituales)
6. [Fase 1 — Endurecer el MVP (jun 2026)](#6-fase-1--endurecer-el-mvp)
7. [Fase 2 — Multi-tenant + OAuth de Clover (jul–ago 2026)](#7-fase-2--multi-tenant--oauth-de-clover)
8. [Fase 3 — Publicación en Clover App Market (sept 2026)](#8-fase-3--publicación-en-clover-app-market)
9. [Fase 4 — Expansión funcional e inteligencia (oct–nov 2026)](#9-fase-4--expansión-funcional-e-inteligencia)
10. [Fase 5 — Foso defensivo: benchmarking y multi-POS (dic 2026+)](#10-fase-5--foso-defensivo)
11. [Decisiones técnicas fundamentadas](#11-decisiones-técnicas-fundamentadas)
12. [Matriz de riesgos](#12-matriz-de-riesgos)
13. [Reglas de trabajo del equipo](#13-reglas-de-trabajo-del-equipo)
14. [Arquitectura objetivo](#14-arquitectura-objetivo)
15. [Glosario](#15-glosario)
16. [Bibliografía y fuentes](#16-bibliografía-y-fuentes)

---

## 1. TL;DR

Atlas Nexus es hoy un **MVP single-tenant funcional**: dashboard React + backend FastAPI + IA con Groq, conectado a **un solo merchant Clover** vía credenciales en `.env`. Para convertirlo en un SaaS comercializable hay que ejecutar **tres movimientos estratégicos en orden**:

| # | Movimiento | Por qué | Cuándo |
|---|---|---|---|
| 1 | Endurecer el MVP (seguridad, tests, CI, observabilidad) | Sin esto, cualquier cliente real expone deuda crítica (CORS abierto, webhook sin verificación, sin tests de integración) | Junio 2026 |
| 2 | Multi-tenant + OAuth v2 de Clover | Hoy hay 1 cuenta = 1 token en `.env`. Imposible vender. | Julio–Agosto 2026 |
| 3 | Publicación en Clover App Market | Distribución a la base instalada de Clover, billing automático con split 70/30 | Septiembre 2026 |

Las fases 4 y 5 (expansión funcional, benchmarking, multi-POS) crean el **foso defensivo** y permiten subir el ARPU.

**Objetivo de negocio a 6 meses:** 10 comercios pagos activos, NPS > 40, onboarding < 5 min.

---

## 2. Contexto de mercado y panorama competitivo

### 2.1. Por qué importa el mercado de POS para SMBs

El mercado de POS para pymes está dominado por **Clover, Square, Toast y Lightspeed**, cada uno con un nicho diferente y una estrategia distinta sobre analytics.

| Plataforma | Dueño | Foco | Fortaleza | Debilidad relevante para nosotros |
|---|---|---|---|---|
| **Clover** | Fiserv | SMB generalista (retail, food, services) | Hardware + App Market abierto a devs (70/30 split) | Analytics built-in es básico → **oportunidad para apps de terceros** |
| **Square** | Block Inc. | SMB starter + e-commerce | Free tier real, analytics decente built-in | Mercado más saturado de apps externas |
| **Toast** | Toast Inc. | Restaurantes full-service | Reportes muy completos para gastronomía | Cerrado a un solo vertical |
| **Lightspeed** | Lightspeed | Retail mediano + chains | Inventory management top | Apuntan a clientes más grandes que nuestro target |

### 2.2. Por qué Clover (y no Square)

1. **App Market maduro y abierto**: Clover monetiza el ecosistema dev con un split 70/30 transparente. Square no tiene un marketplace comparable para apps SaaS analíticas.
2. **Analytics built-in débil**: Clover ofrece "dashboard real-time" y plantillas customizables, pero **no tiene IA conversacional ni recomendaciones accionables**. Ahí entra Atlas Nexus.
3. **Distribución pre-instalada**: cada Clover Flex/Mini/Station tiene el App Market accesible desde el aparato. El comercio descubre apps **sin marketing externo**.
4. **Pricing transparente para devs**: trials de 14/30/60/90 días configurables, prorrateo automático, billing manejado por Clover.

### 2.3. Donde estamos diferenciados

Los competidores directos en el App Market de Clover suelen ser:
- Apps de **loyalty** (Square Loyalty, etc.)
- Apps de **inventario** (Stocky, etc.)
- Apps de **reportes** que son básicamente exports a Excel.

**Lo que nadie está haciendo bien:** IA conversacional + insights accionables + predicciones (churn, demanda, combos). Ese es el espacio en blanco.

### 2.4. Oportunidad cuantificable

- Clover tiene cientos de miles de merchants activos solo en EE.UU. + LATAM creciendo.
- App Market promedio: 1–5% de penetración para apps con valor real.
- Si capturamos **0.1% en 12 meses** = miles de comercios potenciales.
- ARPU objetivo $29–$99/mes según tier.

---

## 3. Diagnóstico del proyecto hoy

### 3.1. Lo que funciona

| Componente | Estado | Archivos clave |
|---|---|---|
| Backend FastAPI con routers modulares | ✅ | [backend/app/main.py](backend/app/main.py) |
| Auth JWT + modelo User/Business separado | ✅ | [backend/app/routers/auth.py](backend/app/routers/auth.py), [backend/app/models/user.py](backend/app/models/user.py), [backend/app/models/business.py](backend/app/models/business.py) |
| Roles dueño/vendedor | ✅ básico | [backend/app/routers/users.py](backend/app/routers/users.py) |
| Dashboard React con StatCards + Charts | ✅ | [frontend/src/pages/Dashboard.jsx](frontend/src/pages/Dashboard.jsx), [frontend/src/components/StatCard.jsx](frontend/src/components/StatCard.jsx) |
| Cliente Clover REST (pull + webhook) | ✅ single-tenant | [backend/app/services/clover_service.py](backend/app/services/clover_service.py), [backend/app/routers/clover.py](backend/app/routers/clover.py) |
| Mapeo orden Clover → Sale + SaleItem | ✅ | [clover_service.py:87-135](backend/app/services/clover_service.py#L87-L135) |
| IA insights con Groq | ✅ | [backend/app/routers/insights.py](backend/app/routers/insights.py) |
| Forecasting ML básico | ✅ | [backend/app/services/ml_forecasting.py](backend/app/services/ml_forecasting.py), [backend/app/routers/forecasting.py](backend/app/routers/forecasting.py) |
| Módulo Marketing | ✅ | [frontend/src/pages/Insights.jsx](frontend/src/pages/Insights.jsx) |
| SSE / streaming | ✅ | [backend/app/routers/stream.py](backend/app/routers/stream.py), [backend/app/services/event_manager.py](backend/app/services/event_manager.py) |
| App Android | 🟡 parcial (login + dashboard) | [CloverIAMarketing/app/](CloverIAMarketing/app/) |
| Docker Compose dev | ✅ | [docker-compose.yml](docker-compose.yml) |
| Seed de demo coffee shop | ✅ | [backend/seed_demo.py](backend/seed_demo.py) |

### 3.2. Deuda técnica crítica (bloquea producción)

| Issue | Severidad | Archivo | Por qué bloquea |
|---|---|---|---|
| `CLOVER_ACCESS_TOKEN` único en `.env` | 🔴 P0 | [config.py:14](backend/app/config.py#L14) | Imposible servir > 1 cliente |
| Webhook sin verificación HMAC | 🔴 P0 | [clover.py:18-26](backend/app/routers/clover.py#L18-L26) | Cualquiera puede inyectar ventas falsas con la URL |
| CORS `allow_origins=["*"]` | 🔴 P0 | [main.py:23](backend/app/main.py#L23) | CSRF + leak de tokens |
| `JWT_SECRET=change-me-in-production` por default | 🔴 P0 | [README.md:24](README.md#L24) | Fácil de olvidar al deploy |
| DDL al startup (no Alembic) | 🟠 P1 | [main.py:12-16](backend/app/main.py#L12-L16) | No hay forma de hacer rollback de schema |
| Sin tests de integración Clover | 🟠 P1 | `backend/tests/` | Cualquier cambio puede romper la sincronización silenciosamente |
| Sin observabilidad (logs/métricas/Sentry) | 🟠 P1 | global | En producción no sabremos qué se rompe |
| Sin recuperación de password ni verificación email | 🟠 P1 | [auth.py](backend/app/routers/auth.py) | UX bloqueante para self-service |
| Sin paginación en endpoints de lista | 🟡 P2 | [sales.py](backend/app/routers/sales.py), [products.py](backend/app/routers/products.py) | Dashboard se traba con mucho historial |
| Sin caché en dashboard | 🟡 P2 | [dashboard.py](backend/app/routers/dashboard.py) | Recalcula KPIs en cada request |
| Sin CI/CD | 🟠 P1 | repo | Bug en main = abajo todos |
| Android incompleto (solo login+dashboard) | 🟡 P2 | [CloverIAMarketing/](CloverIAMarketing/) | Web first es OK, pero perdemos terminales Clover Android |

### 3.3. Métricas del repo

- **Contribuyentes activos:** 4 (juan, dav1dchaparro, Esteban, gabosawn)
- **Commits totales:** ~55
- **Branches relevantes:** `main` (producción local)
- **Coverage de tests:** desconocido — hay `pytest.ini` pero no se reporta

---

## 4. Visión a 6 meses y KPIs

### 4.1. Visión

> **"Cualquier comerciante con Clover puede instalar Atlas Nexus desde su terminal en menos de 2 clicks, completar un onboarding guiado, y al día siguiente recibir insights accionables generados por IA sobre sus ventas, clientes e inventario — sin que el equipo de Atlas Nexus toque una sola variable de configuración."**

### 4.2. KPIs de producto (target Septiembre 2026)

| KPI | Baseline hoy | Target Sept 2026 | Cómo se mide |
|---|---|---|---|
| Comercios pagos activos | 0 | ≥ 10 | Clover billing dashboard |
| Tiempo de onboarding | N/A (manual) | < 5 min | Telemetría: `signup → first_insight` |
| Latencia webhook p95 | N/A | < 2s | Sentry / OpenTelemetry |
| Uptime backend | N/A | ≥ 99.5% | UptimeRobot / Better Stack |
| NPS | N/A | ≥ 40 | Encuesta in-app post 30 días |
| % comercios con > 1 sesión/semana en mes 2 | N/A | ≥ 60% | Mixpanel / PostHog |
| Trial → paid conversion | N/A | ≥ 15% | Clover billing |

### 4.3. KPIs de equipo

| KPI | Target |
|---|---|
| PRs mergeados por semana | ≥ 5 (todo el equipo) |
| PR review time p50 | < 24h |
| Tiempo entre commit y deploy a staging | < 30 min |
| Bugs P0 abiertos en main | 0 |

---

## 5. Equipo, roles y rituales

### 5.1. Ownership por área

Roles asignados según lo que cada uno viene tocando en `git log`. **No son cárceles** — son la persona "primer responsable" del área. Cualquiera puede contribuir a cualquier área vía PR.

| Persona | Área primaria | Área secundaria | Foco específico |
|---|---|---|---|
| **dav1dchaparro** (David) | 🧠 Tech Lead / Backend & ML | Integración Clover | Arquitectura, decisiones técnicas, code review final, modelos ML (forecasting, churn, market basket) |
| **Esteban** | 🏗️ Backend Architect | Datos | Modelos de datos, refactors, migraciones Alembic, aislamiento multi-tenant |
| **juan** | 📱 Mobile & Integrations | Clover OAuth | App Android completa, OAuth v2 Clover, webhook signing, refresh tokens |
| **gabosawn** (Gabo) | 🎨 Frontend & DevOps | UX | Dashboard React, componentes, Docker, CI/CD, releases, observabilidad |

### 5.2. RACI por fase

| Fase | Responsible (hace) | Accountable (firma) | Consulted | Informed |
|---|---|---|---|---|
| Fase 1 — Hardening | Todos | dav1dchaparro | — | Equipo |
| Fase 2 — Multi-tenant | juan + Esteban | dav1dchaparro | gabosawn | Equipo |
| Fase 3 — App Market | dav1dchaparro + gabosawn | dav1dchaparro | Todos | Equipo |
| Fase 4 — Expansión | Tracks paralelos | dav1dchaparro | Cross-team | Equipo |

### 5.3. Rituales

- **Daily async** (Slack/Discord, antes de las 11hs): 3 líneas — qué hice ayer / qué hago hoy / blockers. Sin meeting.
- **Weekly sync** (lunes 10hs, 30 min): revisar el board, decidir prioridades de la semana, levantar blockers no resueltos.
- **Demo Friday** (viernes 17hs, 20 min): cada uno muestra lo que terminó. Si no hay nada, no hay demo (no se llena de relleno).
- **Retro quincenal** (viernes alternos, 30 min): qué funcionó, qué no, qué cambiar. Output: 1–3 acciones concretas.
- **Architecture review** (on-demand, antes de cambios estructurales): cualquier cambio que afecte > 3 módulos requiere doc en `docs/architecture/` + review síncrona.

---

## 6. Fase 1 — Endurecer el MVP

> **Duración:** 4 semanas (junio 2026)
> **Objetivo:** dejar el código actual *production-ready* antes de meter más features. La deuda técnica de hoy va a doler 10x cuando entren clientes reales.

### 6.1. Por qué esta fase primero

> *"Premature scaling is the #1 cause of startup death"* — Si abrimos a más clientes sin esto, un solo bug nos puede tirar a todos, y los webhooks falsos pueden contaminar la DB silenciosamente.

### 6.2. Tareas

#### Bloque A — Seguridad (P0, semana 1)

##### 1.1 — Verificar firma HMAC del webhook de Clover

**Owner:** juan · **Estimación:** 1 día · **Archivos:** [clover.py](backend/app/routers/clover.py), [clover_service.py](backend/app/services/clover_service.py)

**Spec técnica:**
- Clover firma cada webhook con HMAC-SHA256, header `clover-signature`.
- El payload firmado es `{timestamp}.{raw_request_body}`.
- Hay que:
  1. Leer el header `clover-signature`.
  2. Leer header `clover-signature-timestamp` (o equivalente).
  3. Reconstruir el string `{timestamp}.{body}` y calcular HMAC-SHA256 con el `WEBHOOK_SECRET`.
  4. Comparar con `hmac.compare_digest` (timing-safe).
  5. Rechazar si timestamp > 5 min de antigüedad (anti-replay).

**Pseudocódigo:**
```python
import hmac, hashlib, time

def verify_clover_webhook(body: bytes, signature: str, timestamp: str, secret: str) -> bool:
    if abs(time.time() - int(timestamp)) > 300:  # 5 min
        return False
    payload = f"{timestamp}.".encode() + body
    expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)
```

**DoD:** webhook rechaza eventos sin firma válida y test unitario que prueba ambos casos.

---

##### 1.2 — Cerrar CORS por entorno

**Owner:** gabosawn · **Estimación:** 0.5 día · **Archivos:** [main.py:21-27](backend/app/main.py#L21-L27), [config.py](backend/app/config.py)

**Cambio:**
```python
# Antes
allow_origins=["*"]

# Después
allow_origins=settings.cors_origins.split(",")  # "https://app.atlasnexus.io,https://localhost:3000"
```

**DoD:** request desde un dominio no-whitelisted es rechazado en staging.

---

##### 1.3 — Cifrado de secretos en producción

**Owner:** Esteban · **Estimación:** 1 día

- `.env.production` no se commitea, vive en el secret manager del hosting (Railway/Fly secrets).
- `JWT_SECRET` se genera con `secrets.token_urlsafe(64)` y se rota cada 90 días.
- Docs en `docs/runbooks/secrets-rotation.md`.

**DoD:** no hay un solo secreto hardcodeado en el repo. `git secrets` corre en CI.

---

#### Bloque B — Confiabilidad (P0–P1, semana 1–2)

##### 1.4 — Logs estructurados (JSON) + Request ID

**Owner:** gabosawn · **Estimación:** 2 días

**Stack propuesto:**
- `structlog` (Python) para logs estructurados.
- Middleware FastAPI que inyecta `request_id` UUID en cada request y lo propaga al logger.
- Cada log incluye: `timestamp`, `level`, `request_id`, `user_id`, `business_id`, `event`, `payload`.

**DoD:** un error en producción se puede rastrear de punta a punta con un solo `request_id`.

---

##### 1.5 — Tests de integración del flujo Clover

**Owner:** juan · **Estimación:** 3 días · **Archivo nuevo:** `backend/tests/test_clover_integration.py`

**Escenarios mínimos:**
1. Webhook con firma válida → crea Sale + SaleItems.
2. Webhook con firma inválida → 401, no toca DB.
3. Webhook con `order_id` ya importado → skip, no duplica.
4. `sync_clover_orders` con `limit=50` → trae 50 órdenes, mockeando la API de Clover con `httpx_mock`.
5. Orden con `payment.cardTransaction` vacío → `payment_method=qr`.
6. Producto no existente → se crea automáticamente.

**Stack:** `pytest` + `pytest-asyncio` + `httpx-mock` + `pytest-postgresql` (DB efímera por test).

**DoD:** coverage > 80% en `clover_service.py`, todos los escenarios pasan.

---

##### 1.6 — Migraciones con Alembic

**Owner:** Esteban · **Estimación:** 2 días

- Reemplazar el `init_db` automático con migraciones versionadas.
- Primera migración: capturar el schema actual completo (`alembic revision --autogenerate`).
- Pipeline CI corre `alembic upgrade head` contra una DB efímera.

**DoD:** schema reproducible desde cero con `alembic upgrade head`, rollback funcional con `downgrade -1`.

---

##### 1.7 — Recovery password + verificación email

**Owner:** Esteban · **Estimación:** 3 días total

**Stack:** Resend (email transaccional, $0 hasta 3000/mes, DX moderno).

**Flujo recovery:**
1. POST `/auth/forgot-password` con email → genera token `secrets.token_urlsafe(32)`, lo guarda en `password_reset_tokens` (TTL 1h).
2. Email con link `https://app.atlasnexus.io/reset?token=...`.
3. POST `/auth/reset-password` con `token` + `new_password` → valida TTL + uso único, actualiza hash.

**Flujo verificación email:**
1. Al registrarse, generar token, mandar email.
2. `User.email_verified` boolean = false hasta que confirmen.
3. Bloquear endpoints sensibles para emails no verificados (opcional, configurable).

**DoD:** ambos flujos probados end-to-end con un usuario real.

---

#### Bloque C — Performance (P1–P2, semana 2–3)

##### 1.8 — Paginación cursor-based

**Owner:** gabosawn · **Estimación:** 2 días

- Endpoints afectados: `/sales`, `/products`, `/categories`.
- Paginación cursor-based (no offset) para mejor performance con tablas grandes.
- Response shape: `{ "items": [...], "next_cursor": "abc...", "has_more": true }`.
- Frontend: infinite scroll o "Load more" en las listas.

**DoD:** una lista con 10k ventas responde en < 200ms p95.

---

##### 1.9 — Caché del dashboard

**Owner:** dav1dchaparro · **Estimación:** 2 días · **Archivo:** [dashboard.py](backend/app/routers/dashboard.py)

**Estrategia:**
- Redis con TTL 5 min para KPIs agregados.
- Cache key: `dashboard:{business_id}:{date_range}:{kpi}`.
- Invalidación en eventos: nueva venta, edit producto, edit categoría.

**DoD:** dashboard p95 < 500ms con 100k ventas.

---

#### Bloque D — Observabilidad y CI (P1, semana 3–4)

##### 1.10 — Sentry

**Owner:** gabosawn · **Estimación:** 1 día

- SDK en backend (FastAPI integration) y frontend (React integration).
- Source maps subidos en build de prod.
- Alertas en Slack para errores nuevos.

**DoD:** un `1/0` en cualquier endpoint genera evento en Sentry con stack trace + breadcrumbs.

---

##### 1.11 — CI/CD con GitHub Actions

**Owner:** gabosawn · **Estimación:** 2 días · **Archivo nuevo:** `.github/workflows/ci.yml`

**Jobs:**
1. `lint` — ruff + mypy backend, eslint frontend.
2. `test` — pytest backend, vitest frontend.
3. `build` — Docker image de backend y frontend, push a registry.
4. `deploy-staging` — auto-deploy a staging en merge a `develop`.
5. `deploy-prod` — manual approval en merge a `main`.

**DoD:** un PR pasa todos los checks antes de poder mergearse.

---

### 6.3. Definition of Done — Fase 1

- [ ] Webhook valida HMAC + anti-replay (5 min window).
- [ ] CORS configurado por entorno.
- [ ] Secretos en vault, no en repo.
- [ ] CI verde en cada PR a `main` (lint + tests + build).
- [ ] Sentry capturando errores en backend y frontend.
- [ ] Migraciones versionadas y reversibles con Alembic.
- [ ] Coverage > 60% global, > 80% en `clover_service.py`.
- [ ] Recovery password y email verification probados.
- [ ] Dashboard p95 < 500ms con 100k ventas (load test).
- [ ] Runbook de incidentes documentado.

---

## 7. Fase 2 — Multi-tenant + OAuth de Clover

> **Duración:** 6 semanas (julio–agosto 2026)
> **Objetivo:** que cualquier comercio se dé de alta y conecte su Clover sin que el equipo toque variables de entorno.

### 7.1. El cambio arquitectónico fundamental

```
ANTES (hoy)                              DESPUÉS (Fase 2)
┌──────────────┐                         ┌──────────────────────────┐
│  .env global │                         │  merchant_connections    │
│  CLOVER_ID   │                         ├──────────────────────────┤
│  CLOVER_TOK  │                         │ id │ business_id │ token │
└──────┬───────┘                         │ ── │ ─────────── │ ───── │
       │                                 │ 1  │ biz_a       │ enc_a │
       ▼                                 │ 2  │ biz_b       │ enc_b │
┌──────────────┐                         │ 3  │ biz_c       │ enc_c │
│   1 cliente  │                         └──────────────────────────┘
└──────────────┘                                     │
                                                     ▼
                                         ┌──────────────────────────┐
                                         │  Worker Celery por biz   │
                                         │  + Webhook router        │
                                         │  + RLS Postgres          │
                                         └──────────────────────────┘
```

### 7.2. OAuth v2 de Clover — flujo completo

Clover deprecó el OAuth legacy en octubre 2023. Toda app nueva **debe usar v2/OAuth** con tokens expirables.

#### 7.2.1. Características de los tokens

| Token | Lifetime | Reusable | Endpoint para refrescar |
|---|---|---|---|
| `access_token` | **30 minutos** | Sí (durante esos 30 min) | — |
| `refresh_token` | Más largo (configurable, típicamente días/semanas) | **No — single use**. Genera nuevo par al usarlo. | `/oauth/v2/refresh` |

#### 7.2.2. Flujo completo (sequence diagram)

```
Merchant         Clover App Market       Atlas Nexus           Clover OAuth
   │                    │                      │                     │
   │ instala app        │                      │                     │
   │───────────────────▶│                      │                     │
   │                    │ redirect a Atlas con │                     │
   │                    │ ?merchant_id=&code=  │                     │
   │                    │─────────────────────▶│                     │
   │                    │                      │ POST /oauth/v2/    │
   │                    │                      │ authorize          │
   │                    │                      │ + client_id        │
   │                    │                      │ + client_secret    │
   │                    │                      │ + code             │
   │                    │                      │────────────────────▶│
   │                    │                      │                     │
   │                    │                      │ { access_token,    │
   │                    │                      │   refresh_token,   │
   │                    │                      │   expires_in }     │
   │                    │                      │◀────────────────────│
   │                    │                      │                     │
   │                    │                      │ guarda cifrado     │
   │                    │                      │ en DB              │
   │                    │ redirect a dashboard │                     │
   │                    │◀─────────────────────│                     │
   │ ✅ conectado       │                      │                     │
```

#### 7.2.3. Refresh automático

Cada llamada a Clover debe:
1. Verificar si `access_token.expires_at` < `now() + 5 min`.
2. Si sí, POST a `/oauth/v2/refresh` con el `refresh_token` actual.
3. Guardar el nuevo par (el viejo refresh_token queda inválido).
4. Reintentar la llamada original.

**Crítico:** el refresh_token es de **un solo uso**. Si dos workers refrescan al mismo tiempo, uno falla. → **Hay que poner un lock por `merchant_id` (Redis SETNX o `SELECT FOR UPDATE`).**

### 7.3. Multi-tenancy en Postgres con Row-Level Security (RLS)

Stack recomendado por la industria 2026: **shared database + tenant_id column + RLS policies**.

#### 7.3.1. Por qué RLS y no solo filtros en queries

Si solo confiamos en `WHERE business_id = :current_biz` en cada query, **un solo olvido** en un router causa data leak entre clientes. RLS te lo aplica en la base, no en el código.

#### 7.3.2. Setup

```sql
-- 1. dos usuarios de DB
CREATE USER atlas_admin WITH PASSWORD '...';  -- migraciones
CREATE USER atlas_app WITH PASSWORD '...';    -- queries de la app

-- 2. RLS en cada tabla tenant-aware
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON sales
  USING (business_id = current_setting('app.business_id')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON sales TO atlas_app;
```

#### 7.3.3. Middleware FastAPI

```python
@app.middleware("http")
async def set_tenant_context(request: Request, call_next):
    user = await get_current_user_from_jwt(request)
    if user:
        # En cada conexión, setea el contexto
        async with engine.begin() as conn:
            await conn.execute(
                text("SET LOCAL app.business_id = :biz"),
                {"biz": str(user.business_id)}
            )
    return await call_next(request)
```

#### 7.3.4. Trampa documentada

Si usás un **global var** o un singleton mal-scoped para guardar `business_id`, **filtrás datos entre requests asincrónicos**. Usá siempre `contextvars` o pasalo explícito.

### 7.4. Tareas detalladas

| # | Tarea | Owner | Estimación |
|---|---|---|---|
| 2.1 | Documento de diseño OAuth Clover (incluyendo edge cases) | dav1dchaparro | 2 d |
| 2.2 | Endpoints `/clover/oauth/start` y `/clover/oauth/callback` | juan | 3 d |
| 2.3 | Modelo `MerchantConnection` (token cifrado con Fernet, refresh, scopes) | Esteban | 2 d |
| 2.4 | Refactor `clover_service.py` para multi-tenant | juan + dav1dchaparro | 3 d |
| 2.5 | Refresh automático con lock distribuido (Redis) | juan | 2 d |
| 2.6 | UI Settings: conectar/desconectar Clover | gabosawn | 3 d |
| 2.7 | Worker Celery para sync periódico por merchant | dav1dchaparro | 4 d |
| 2.8 | Migrar todas las queries a RLS (Postgres) | Esteban | 4 d |
| 2.9 | Tests de aislamiento (penetration testing entre tenants) | Esteban | 2 d |
| 2.10 | Rate limiting por merchant (Redis token bucket) | dav1dchaparro | 2 d |
| 2.11 | Onboarding wizard guiado | gabosawn | 4 d |
| 2.12 | Soporte multi-local (modelo `Location` bajo `Business`) | Esteban | 4 d |

### 7.5. Definition of Done — Fase 2

- [ ] Usuario nuevo: signup → OAuth Clover → primer insight en < 5 min, sin intervención manual.
- [ ] Tokens cifrados con Fernet, nunca en `.env`.
- [ ] RLS activo en `sales`, `products`, `categories`, `customers`, `merchant_connections`.
- [ ] Tests demuestran que biz A no ve datos de biz B (incluso con IDs hardcodeados o SQL injection básico).
- [ ] Worker Celery sincroniza cada 5 min (configurable por merchant).
- [ ] Refresh token con lock distribuido (no race conditions).
- [ ] Rate limit: 100 req/min por merchant a Clover API.
- [ ] Onboarding probado con 2 usuarios externos al equipo.

---

## 8. Fase 3 — Publicación en Clover App Market

> **Duración:** 4 semanas (septiembre 2026)
> **Objetivo:** app publicada en producción, lista para que cualquier merchant la instale desde su Clover Flex/Mini.

### 8.1. Por qué esta es la jugada estratégica

En lugar de adquirir clientes uno a uno (caro, lento), aprovechamos la base instalada de Clover. **Una sola app aprobada = visibilidad ante cientos de miles de merchants**.

Modelo de negocio:
- **Suscripción mensual** vía Clover (Clover cobra al merchant, nos transfiere 70%).
- **Trial gratis 14/30/60/90 días** (configurable).
- **Tier free** opcional (limitado en features) para acelerar adopción.

### 8.2. Checklist completo de aprobación

Basado en docs oficiales de Clover y experiencia documentada de devs.

#### 8.2.1. Developer account approval (PRIMERO)

Clover **primero aprueba el developer account, después la app**. Esto puede tardar 1–2 semanas.

Requisitos:
- [ ] Escaneo de pasaporte o licencia de conducir vigente.
- [ ] Comprobante de domicilio (factura de servicios, ≤ 3 meses) con mismo nombre.
- [ ] **Si es empresa**: comprobante de domicilio comercial (factura, extracto bancario, doc gubernamental) + datos fiscales.
- [ ] Email + teléfono + sitio web público.

#### 8.2.2. App submission checklist

| Item | Detalle |
|---|---|
| **Functional video** | Video (2–5 min) que muestra el flujo COMPLETO de la app. Si falta alguna pantalla = rechazo. |
| **App description** | 1–2 párrafos para merchants no técnicos. |
| **API description** | Qué endpoints de Clover usa y para qué (revisión técnica). |
| **Permissions** | Lista de scopes solicitados (inventario, órdenes, customers, etc.). **Solo pedir lo necesario** o se rechaza. |
| **Screenshots** | 3–5 capturas de pantalla del dashboard, mobile, alertas. |
| **Privacy policy** | URL pública. |
| **Terms of service** | URL pública. |
| **Support contact** | Email respondido por humano. |
| **Pricing** | Tiers configurados en el dashboard de Clover. |
| **Test merchant** | Cuenta de prueba con datos demo para que Clover testee. |

#### 8.2.3. Razones comunes de rechazo (y cómo evitarlas)

| Causa | Mitigación |
|---|---|
| App crashea o se cuelga durante review | Testing exhaustivo en sandbox antes de submit. Smoke tests E2E. |
| Video no muestra funcionalidad completa | Script del video pre-aprobado en review interna del equipo. |
| App ofrece integración con otro payment processor | **Nunca** mencionar Square/Stripe/MercadoPago en la copy del listing. Sí podemos tenerlo en el código (multi-POS interno) pero **no se muestra** al merchant Clover. |
| No cumple regulaciones regionales | Privacy policy debe cumplir GDPR (UE), CCPA (CA), LGPD (Brasil). |
| App permite transmisión de dinero por fuera de Clover | **Crítico**: todo movimiento monetario debe ir por Clover network. |

### 8.3. Tareas

| # | Tarea | Owner | Estimación |
|---|---|---|---|
| 3.1 | Crear cuenta dev sandbox + perfil empresa | dav1dchaparro | 0.5 d |
| 3.2 | Submission de developer account approval | dav1dchaparro | 0.5 d + 1–2 sem espera |
| 3.3 | Configurar app en sandbox (manifest, permissions, scopes mínimos) | juan | 1 d |
| 3.4 | Implementar billing webhooks (`APP_INSTALLED`, `APP_UNINSTALLED`, `APP_SUBSCRIPTION_CHANGED`, `APP_BILLING_RENEWAL`) | juan | 3 d |
| 3.5 | Landing page pública (atlasnexus.io) | gabosawn | 5 d |
| 3.6 | Privacy policy + ToS + Support form | dav1dchaparro | 2 d |
| 3.7 | Screenshots + video demo + copy del listing | gabosawn + dav1dchaparro | 3 d |
| 3.8 | Pricing tiers: Free Trial 30d + Starter $29 + Pro $79 + Business $149 | dav1dchaparro | 1 d |
| 3.9 | Test merchant con datos demo realistas | juan | 1 d |
| 3.10 | Submission a Clover + iteración con feedback | dav1dchaparro | 1 d + variable |
| 3.11 | Soporte cliente: mailbox compartido + form en landing | gabosawn | 2 d |
| 3.12 | Onboarding email sequence (Resend) | gabosawn | 2 d |

### 8.4. Estructura de pricing propuesta

| Tier | Precio/mes | Trial | Límites |
|---|---|---|---|
| **Free Trial** | $0 | 30 días | Full features |
| **Starter** | $29 | — | 1 local, hasta 500 ventas/mes, IA básica |
| **Pro** | $79 | — | 3 locales, ventas ilimitadas, IA conversacional, forecasting |
| **Business** | $149 | — | Locales ilimitados, churn prediction, benchmarking, soporte prioritario |

### 8.5. Definition of Done — Fase 3

- [ ] Developer account aprobado.
- [ ] App publicada en sandbox + aprobada para producción.
- [ ] Landing en `atlasnexus.io` con dominio propio.
- [ ] Flow completo install → trial → suscripción → uninstall probado en sandbox.
- [ ] Billing webhooks funcionando, registros en `app_billing_events`.
- [ ] Soporte cliente con SLA de respuesta < 24h hábiles.
- [ ] Privacy policy + ToS revisados por abogado.

---

## 9. Fase 4 — Expansión funcional e inteligencia

> **Duración:** 8 semanas (octubre–noviembre 2026)
> **Objetivo:** subir el ARPU y diferenciarse de competidores básicos. 4 tracks paralelos, uno por persona.

### 9.1. Track A — Mobile completo (Owner: juan)

Hoy la app Android tiene solo login + dashboard. Para terminales Clover Android, es clave.

**Pantallas a implementar:**
- Sales (lista + filtros + detalle).
- Products + categories (CRUD).
- Insights (lectura del backend + chat IA).
- Settings (conectar Clover, perfil, idioma).
- Push notifications nativas (FCM) para alertas críticas: stock bajo, venta anómala, churn detectado.

**Modo offline:**
- Cache local SQLite (Room).
- Cola de mutaciones pendientes.
- Sync al recuperar conexión con resolución de conflictos last-write-wins por timestamp.

### 9.2. Track B — IA Avanzada (Owner: dav1dchaparro)

#### 9.2.1. Predicción de churn de clientes

**Stack:** RFM + K-Means clustering + Random Forest (baseline) → upgrade a LSTM si hay datos suficientes.

**Features RFM:**
- **Recency**: días desde última compra del cliente.
- **Frequency**: total de compras en últimos 90 días.
- **Monetary**: gasto total en últimos 90 días.

**Pipeline:**
1. Agregar email/teléfono al modelo `Sale` (ya hay clientes recurrentes detectados en el seed).
2. Job nightly que recalcula features RFM por cliente.
3. K-Means con k=4 (champions / loyal / at-risk / churned).
4. Random Forest binario: ¿este cliente comprará en los próximos 30 días? Target: precisión > 70%.
5. Endpoint `/insights/churn` devuelve top 20 clientes en riesgo.

#### 9.2.2. Recomendador de combos (Market Basket Analysis)

**Stack:** mlxtend (Python) con **FP-Growth** (no Apriori — FP-Growth escala mejor a > 10k transacciones, no necesita candidate generation).

**Pipeline:**
1. Transformar `SaleItem` en matriz transaccional (1 fila por venta, columnas = productos).
2. Correr FP-Growth con `min_support=0.01`.
3. Generar association rules con `metric="lift"`, `min_threshold=1.2`.
4. Endpoint `/insights/combos` devuelve top 10 combos del comercio + sugerencias de promo.

**Output ejemplo:**
> *"El 35% de los clientes que compran café también compran factura — sugerí promo combo $X y subí 12% el ticket promedio."*

#### 9.2.3. Sugerencias proactivas (push)

Job nightly que detecta anomalías y manda push/email:
- Producto cae > 30% vs últimas 4 semanas.
- Cliente "champion" no compra en > 30 días.
- Stock crítico predicho para los próximos 7 días.

#### 9.2.4. Análisis de estacionalidad

- Detectar patrones de Navidad/Black Friday/Día del Padre con descomposición STL (statsmodels).
- Recomendar stock-up con 2 semanas de anticipación.

#### 9.2.5. IA conversacional con TTS

- Endpoint que responde con audio (TTS via ElevenLabs o local Coqui).
- UI: botón "🔊 escuchar" en cada insight.

### 9.3. Track C — Integraciones (Owner: Esteban)

#### 9.3.1. WhatsApp Business

**Stack:** WhatsApp Business Cloud API (Meta).

**Use cases:**
- Notificar al merchant alertas críticas.
- Mandar promos a clientes "at-risk" detectados por churn model.
- Confirmar pedidos online.

#### 9.3.2. Adapter genérico `POSProvider` (multi-POS)

Diseñar interfaz abstracta:

```python
class POSProvider(Protocol):
    def authenticate(self, merchant_credentials: dict) -> AuthResult: ...
    def fetch_orders(self, since: datetime, limit: int) -> list[NormalizedOrder]: ...
    def verify_webhook(self, body: bytes, headers: dict) -> bool: ...
    def parse_webhook_event(self, body: bytes) -> WebhookEvent: ...

class CloverProvider(POSProvider): ...
class SquareProvider(POSProvider): ...
class MercadoPagoProvider(POSProvider): ...
```

**Crítico:** esto NO se expone como feature al merchant Clover (rechazo seguro del App Market). Solo se usa para clientes que NO vienen del App Market.

#### 9.3.3. Importar productos desde CSV/Excel

- Endpoint `/products/import` con validación + dry-run mode.
- UI con preview antes de confirmar.
- Mapeo configurable de columnas.

#### 9.3.4. Integración AFIP / facturación electrónica (Argentina)

- Stack: librería [afip.py](https://github.com/PyAR-org/afip.py) o [pyafipws](https://github.com/reingart/pyafipws).
- Generar facturas A/B/C automáticamente desde ventas.
- WSAA + WSFE.

### 9.4. Track D — UX (Owner: gabosawn)

| Feature | Detalle |
|---|---|
| **Modo claro pulido** | Auditoría de contraste WCAG AA en todas las pantallas. |
| **i18n EN/ES** | `react-i18next` + extracción de strings. Inglés primero (App Market en USA). |
| **Reportes PDF** | `jspdf` o backend con WeasyPrint. Plantillas: ventas mensuales, top productos, clientes top. |
| **Comparativa MoM en KPIs** | Cada `StatCard` muestra ▲▼ % vs mes anterior + sparkline. |
| **Tutorial contextual** | Driver.js o React Joyride para tours guiados al primer login. |

### 9.5. Definition of Done — Fase 4

- [ ] App Android tiene paridad funcional con dashboard web.
- [ ] Churn prediction con precisión > 70% en datos de prueba.
- [ ] Recomendador de combos genera al menos 5 reglas accionables por comercio (con > 30 ventas).
- [ ] i18n EN/ES funcional, switcher en Settings.
- [ ] Reportes PDF exportables (ventas mensuales + top productos).
- [ ] Adapter `POSProvider` implementado con tests para Clover + 1 más.

---

## 10. Fase 5 — Foso defensivo

> **Duración:** continua desde diciembre 2026.
> **Objetivo:** crear barreras de entrada que se fortalecen con cada cliente nuevo (network effects).

### 10.1. Benchmarking anónimo entre comercios

Cuando tengamos > 50 comercios del mismo rubro, podemos mostrar a cada uno:
> *"Tu ticket promedio ($820) está 14% por debajo de la media de cafeterías similares en tu zona ($952)."*

**Privacidad:**
- Datos agregados (k-anonymity, k ≥ 5).
- Nunca mostrar nombres ni datos identificables.
- Opt-in explícito en onboarding.

**Por qué es foso:** cuanto más grande la red, más valioso el benchmark, más difícil de copiar.

### 10.2. Conciliación bancaria automática

Cruzar ventas de Clover con depósitos bancarios. Detectar diferencias (chargebacks, comisiones inesperadas). Dolor enorme en pymes que hoy se hace manual en Excel.

### 10.3. Inventario predictivo con auto-reposición

- Forecast de demanda por producto a 14/30 días.
- Generación automática de órdenes de compra a proveedores.
- Integración con WhatsApp Business para enviar la PO.

### 10.4. Loyalty integrado

- Programa de puntos / cashback.
- Cupones automáticos para clientes at-risk.
- Integrado con Clover Customers API.

### 10.5. Marketplace de plugins (long-term)

Permitir a terceros desarrollar extensiones para Atlas Nexus (similar a Shopify Apps). Split 80/20 a favor del dev.

---

## 11. Decisiones técnicas fundamentadas

### 11.1. Task queue: **Celery + Redis**

| Opción | Pros | Contras | Decisión |
|---|---|---|---|
| FastAPI BackgroundTasks | 0 setup | No status, no retry, muere con el server | ❌ |
| RQ | Simple, solo Redis | Menos features, sin Celery Beat | ❌ |
| APScheduler | In-process, sin broker | No distribuido, no escala horizontal | Solo para single-instance |
| **Celery + Beat** | Maduro, retries, scheduling, distribuido | Más setup | ✅ |
| ARQ | Async-native, moderno | Menos maduro | Watchlist |

**Decisión:** Celery + Redis para Fase 2+. APScheduler temporal en Fase 1 si urge.

### 11.2. Cifrado de tokens: **Fernet (cryptography) ahora, KMS después**

- Fernet es symmetric authenticated encryption (AES-128 + HMAC-SHA256).
- Clave maestra en secret manager del hosting.
- Migrar a AWS KMS / Google Cloud KMS cuando estemos en cloud enterprise.

### 11.3. Hosting de producción: **Railway (MVP) → Fly.io (escala)**

| Plataforma | DX | Pricing | Multi-región | Decisión |
|---|---|---|---|---|
| Railway | Excelente (deploy = push) | Usage-based | No nativo | ✅ MVP (Fases 1–3) |
| Render | Bueno, predecible | Flat | Limitado | Alternativa |
| Fly.io | Más complejo, Docker-first | Pay per use | ✅ 35+ regiones | ✅ Fase 4+ (latencia LATAM) |

**Decisión:** Railway hasta tener tracción comprobada (10 clientes), luego Fly.io.

### 11.4. Email transaccional: **Resend**

- Free tier: 3,000 emails/mes (alcanza para Fase 1–3).
- DX moderna (React Email para plantillas).
- Deliverability alta.

### 11.5. Error tracking: **Sentry**

- Free tier alcanza para MVP (5k errors/mes).
- Integración nativa FastAPI + React.
- Source maps en CI.

### 11.6. Frontend hosting: **Cloudflare Pages**

- Free, CDN global, deploy automático desde GitHub.
- 0 cold starts.

### 11.7. Migraciones: **Alembic**

- Standard de facto para SQLAlchemy.
- Soporta autogeneración + reversible.

### 11.8. Cliente HTTP: **httpx**

- Ya lo usamos. Async-native.
- Mantener `httpx-mock` para tests.

### 11.9. Analytics de producto: **PostHog (self-hosted) o Mixpanel**

- Trackear funnel: signup → connect Clover → first insight → trial converted.
- PostHog self-hosted = $0, controlamos los datos.

### 11.10. ML stack

| Tarea | Librería |
|---|---|
| RFM + clustering | `scikit-learn` (K-Means, RandomForest) |
| Market basket | `mlxtend` (FP-Growth) |
| Time series | `statsmodels` (STL), `prophet` para forecasting de demanda |
| LLM (insights) | Groq (ya integrado) |
| Embeddings (búsqueda semántica futura) | `sentence-transformers` local |

---

## 12. Matriz de riesgos

| Riesgo | Probabilidad | Impacto | Mitigación | Owner |
|---|---|---|---|---|
| Clover rechaza la app del App Market | Media | Alta | Iniciar dev account approval temprano (semana 1 de Fase 3). Iterar con feedback. Video script pre-aprobado por equipo. | dav1dchaparro |
| Rate limiting Clover API con muchos merchants | Alta | Media | Token bucket por merchant (100 req/min). Cola Celery con backoff exponencial. | juan |
| Costos Groq escalan con clientes | Alta | Media | Cachear respuestas idénticas (24h TTL). Batch insights. Considerar fine-tuning local (Llama 3) o Ollama self-hosted en Fase 5. | dav1dchaparro |
| Cumplimiento PCI con datos de tarjeta | Media | Alta | **Nunca** almacenar PAN/CVV. Solo metadata (brand, last4, type) — ya lo hacemos. Auditoría legal antes de Fase 3. | Esteban |
| Data leak entre tenants | Baja | Crítica | RLS Postgres + tests de aislamiento + bug bounty interno en cada release | Esteban |
| Pérdida de un miembro del equipo | Baja | Alta | Docs vivas en `/docs`. Pair programming en módulos críticos. Knowledge sharing semanal. | Equipo |
| Lock-in con Clover | Alta | Media | Adapter `POSProvider` desde Fase 4. No mostrar competidores en App Market listing. | dav1dchaparro |
| Refresh token race condition | Media | Media | Lock distribuido con Redis SETNX + retry idempotente | juan |
| Webhook replay attack | Media | Media | Anti-replay window 5 min en HMAC verification | juan |
| Deuda técnica acumulada | Alta | Media | "Tech debt Friday": 20% del tiempo de viernes para refactors. Revisión mensual. | dav1dchaparro |
| Onboarding > 5 min hace bouncear usuarios | Media | Alta | A/B test del wizard. Métrica: % que completa onboarding en < 5 min. | gabosawn |

---

## 13. Reglas de trabajo del equipo

### 13.1. Git workflow

- **`main`** = producción. Solo merge vía PR con 1 approval + CI verde.
- **`develop`** = staging. PRs van acá primero. Auto-deploy a staging.env.
- **`feature/<persona>-<descripcion-corta>`** = una rama por tarea.
- **Squash merge** a `develop`. Merge commit normal de `develop` → `main` para releases.
- Commits: imperativo, en inglés. Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.

### 13.2. PR rules

- 1 reviewer mínimo. 2 si toca módulos críticos (auth, multi-tenancy, OAuth, billing).
- CI verde obligatorio.
- PR description: qué, por qué, cómo testearlo.
- No merge sin checklist:
  - [ ] Tests agregados/actualizados
  - [ ] Docs actualizadas si es feature visible
  - [ ] No hay TODOs nuevos sin issue
  - [ ] No secretos hardcodeados

### 13.3. Convenciones de código

**Backend (Python):**
- Format: `black` (line length 100).
- Lint: `ruff` (configurar reglas en `pyproject.toml`).
- Types: `mypy --strict` en `app/services/` y `app/routers/`.
- Imports: absolute (`from app.services.clover_service import ...`).

**Frontend (React):**
- Format: `prettier`.
- Lint: `eslint` con `eslint-plugin-react-hooks`.
- Componentes funcionales + hooks. Nada de class components.
- Strings → `i18n` desde Fase 4. No hardcodear texto en JSX.

**Comentarios:**
- Default = no comentarios. Los nombres deberían bastar.
- Comentarios solo para el *por qué* cuando no es obvio.
- Nada de `// removed for now`, `// TODO refactor later`, `# old version` — borrar o abrir issue.

**Estructura de archivos:**
- 1 modelo / 1 router / 1 service por archivo.
- Servicios = lógica pura (testeables sin HTTP).
- Routers = thin layer (validación + llamada a service + response).

### 13.4. Cómo dividir trabajo

- Tarea > 3 días → romper en sub-tareas de < 1 día.
- Si bloqueás a alguien, su trabajo sube de prioridad sobre el tuyo.
- Trabado > 4 horas en algo = pedir ayuda en el canal del equipo.
- No empezar Fase N+1 sin DoD de Fase N firmado.

### 13.5. Documentación

- ADRs (Architecture Decision Records) en `docs/architecture/` para decisiones estructurales.
- Runbooks de incidentes en `docs/runbooks/` (backup, restore, secret rotation, deploy, rollback).
- Cada módulo grande con `README.md` propio si tiene > 5 archivos.

---

## 14. Arquitectura objetivo

### 14.1. Estructura de carpetas (post-Fase 2)

```
track_integracionpagos/
├── backend/
│   ├── app/
│   │   ├── models/              # SQLAlchemy
│   │   │   ├── user.py
│   │   │   ├── business.py
│   │   │   ├── location.py       # ← NUEVO Fase 2
│   │   │   ├── merchant_connection.py  # ← NUEVO Fase 2
│   │   │   ├── sale.py
│   │   │   ├── sale_item.py
│   │   │   ├── product.py
│   │   │   ├── category.py
│   │   │   ├── customer.py       # ← NUEVO Fase 4 (churn)
│   │   │   └── forecasting.py
│   │   ├── schemas/              # Pydantic
│   │   ├── routers/              # FastAPI endpoints
│   │   │   ├── auth.py
│   │   │   ├── oauth.py          # ← NUEVO Fase 2
│   │   │   ├── billing.py        # ← NUEVO Fase 3
│   │   │   ├── ...
│   │   ├── services/             # Lógica de negocio
│   │   │   ├── auth.py
│   │   │   ├── ml_forecasting.py
│   │   │   ├── churn_model.py    # ← NUEVO Fase 4
│   │   │   ├── basket_analysis.py # ← NUEVO Fase 4
│   │   │   └── ...
│   │   ├── workers/              # ← NUEVO Fase 2: Celery tasks
│   │   │   ├── celery_app.py
│   │   │   ├── sync_clover.py
│   │   │   ├── churn_nightly.py
│   │   │   └── send_alerts.py
│   │   ├── integrations/         # ← NUEVO Fase 2/4
│   │   │   ├── clover/
│   │   │   │   ├── client.py
│   │   │   │   ├── oauth.py
│   │   │   │   ├── webhooks.py
│   │   │   │   └── mappers.py
│   │   │   ├── square/           # ← Fase 4
│   │   │   ├── mercadopago/      # ← Fase 4
│   │   │   ├── whatsapp/         # ← Fase 4
│   │   │   ├── resend/           # ← Fase 1
│   │   │   └── afip/             # ← Fase 4
│   │   ├── crypto/               # ← NUEVO Fase 2
│   │   │   └── token_vault.py
│   │   ├── middleware/           # ← NUEVO
│   │   │   ├── tenant_context.py
│   │   │   ├── request_id.py
│   │   │   └── rate_limit.py
│   │   └── config.py
│   ├── alembic/                  # ← NUEVO Fase 1
│   │   └── versions/
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   └── pyproject.toml            # ← reemplazar requirements.txt
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── Onboarding.jsx    # ← NUEVO Fase 2
│       │   ├── ...
│       ├── components/
│       ├── hooks/                # ← NUEVO
│       ├── i18n/                 # ← NUEVO Fase 4
│       │   ├── en.json
│       │   └── es.json
│       └── lib/
├── android/                      # ← rename de CloverIAMarketing/
├── landing/                      # ← NUEVO Fase 3
├── docs/
│   ├── plans/
│   ├── architecture/             # ← NUEVO: ADRs
│   ├── runbooks/                 # ← NUEVO
│   └── api/                      # ← NUEVO: OpenAPI specs públicos
└── .github/workflows/            # ← NUEVO Fase 1
    ├── ci.yml
    ├── deploy-staging.yml
    └── deploy-prod.yml
```

### 14.2. Diagrama de componentes (Fase 3)

```
┌─────────────────────┐         ┌─────────────────────┐
│  Clover Terminal    │         │  Atlas Nexus Web    │
│  (Flex/Mini/etc.)   │         │  (React, CF Pages)  │
└──────────┬──────────┘         └──────────┬──────────┘
           │                                │
           │ webhooks                       │ HTTPS
           │ (HMAC signed)                  │
           ▼                                ▼
┌──────────────────────────────────────────────────────┐
│           FastAPI Backend (Railway/Fly)              │
│                                                       │
│   ┌──────────┐  ┌─────────┐  ┌──────────────┐       │
│   │ Routers  │→ │Services │→ │ Integrations │       │
│   └──────────┘  └─────────┘  └──────┬───────┘       │
│        │             │              │                │
│        │             ▼              ▼                │
│        │      ┌───────────────────────────┐         │
│        │      │  Postgres (RLS)           │         │
│        │      └───────────────────────────┘         │
│        │                                             │
│        ▼                                             │
│   ┌─────────────────┐    ┌──────────────────┐      │
│   │  Celery Worker  │←──→│  Redis (broker)  │      │
│   └────────┬────────┘    └──────────────────┘      │
└────────────┼─────────────────────────────────────────┘
             │
             ├──→ Clover API (OAuth, REST)
             ├──→ Groq (LLM)
             ├──→ Resend (email)
             └──→ Sentry (errors)
```

### 14.3. Modelo de datos clave (post-Fase 2)

```sql
-- Users belong to one Business
users (id, email, password_hash, role, business_id, email_verified, ...)

-- Business is the tenant
businesses (id, name, owner_id, plan, trial_ends_at, ...)

-- A business can have multiple locations (Fase 2.12)
locations (id, business_id, name, address, ...)

-- One connection per (business, POS provider)
merchant_connections (
  id,
  business_id,
  provider,          -- 'clover', 'square', 'mercadopago'
  external_merchant_id,
  access_token_encrypted,
  refresh_token_encrypted,
  expires_at,
  scopes,
  created_at
)

-- Existing models (con business_id agregado para RLS)
sales (id, business_id, location_id, ...)
products (id, business_id, ...)
categories (id, business_id, ...)
customers (id, business_id, email, phone, rfm_segment, ...)  -- Fase 4

-- Billing events (Fase 3)
app_billing_events (id, business_id, event_type, amount, provider, payload, created_at)
```

---

## 15. Glosario

| Término | Definición |
|---|---|
| **POS** | Point of Sale. Sistema donde el comercio cobra. |
| **Clover** | POS de Fiserv. Hardware (Flex, Mini, Station Duo, Kiosk) + Android software + App Market. |
| **Fiserv** | Empresa dueña de Clover. Procesador de pagos global. |
| **App Market** | "Play Store" de Clover, donde merchants instalan apps de terceros. |
| **OAuth v2/Clover** | Protocolo de autorización. `access_token` dura 30 min, `refresh_token` es single-use. |
| **Webhook** | HTTP callback que Clover envía cuando pasa algo (venta nueva, app instalada, etc.). |
| **HMAC** | Hash-based Message Authentication Code. Mecanismo para firmar webhooks. |
| **Multi-tenant** | Una sola instancia del sistema sirve a muchos clientes, aislados entre sí. |
| **RLS** | Row-Level Security. Feature de Postgres que filtra rows por usuario/tenant automáticamente. |
| **RFM** | Recency, Frequency, Monetary. Framework clásico de segmentación de clientes. |
| **Churn** | Pérdida de clientes. Predicción = identificar quién está por irse. |
| **MBA** | Market Basket Analysis. Análisis de qué productos se compran juntos. |
| **FP-Growth** | Algoritmo de MBA más eficiente que Apriori (no genera candidatos). |
| **K-Means** | Algoritmo de clustering no-supervisado. Útil para segmentar clientes. |
| **Celery** | Task queue distribuido para Python. Maneja background jobs. |
| **Fernet** | Symmetric encryption (cryptography lib). Para cifrar tokens en DB. |
| **ADR** | Architecture Decision Record. Doc breve que explica una decisión técnica importante. |
| **DoD** | Definition of Done. Criterios objetivos para considerar terminada una fase/tarea. |
| **RACI** | Responsible, Accountable, Consulted, Informed. Matriz de roles por iniciativa. |

---

## 16. Bibliografía y fuentes

### Clover

- [Clover OAuth flow overview](https://docs.clover.com/dev/docs/oauth-flows-in-clover)
- [Generate OAuth expiring tokens (v2)](https://docs.clover.com/dev/docs/generate-expiring-tokens-using-v2-oauth-flow)
- [Use refresh token to generate new expiring token](https://docs.clover.com/dev/docs/refresh-access-tokens)
- [Configure webhook signature verification](https://docs.clover.com/dev/docs/ecomm-hosted-checkout-webhook)
- [App Market — submit your app for approval](https://docs.clover.com/dev/docs/gdp-submit-your-app-for-approval)
- [App administration checklist](https://docs.clover.com/dev/docs/app-administration-checklist)
- [Set up pricing tiers](https://docs.clover.com/dev/docs/configuring-billing)
- [Monetize your apps (70/30 split)](https://docs.clover.com/dev/docs/monetizing-your-apps)
- [Clover REST API reference](https://docs.clover.com/dev/reference/api-reference-overview)
- [Clover App Market: How to Ensure Your App is Approved (Medium)](https://medium.com/clover-platform-blog/clover-app-market-how-to-ensure-your-app-is-approved-71dd1d1922cc)

### Multi-tenant architecture

- [FastAPI Multi-Tenant SaaS: Row-Level Security Without Pain](https://medium.com/@hjparmar1944/fastapi-multi-tenant-saas-row-level-security-without-pain-9ef960085bf4)
- [Python FastAPI Postgres SqlAlchemy Row Level Security Multitenancy](https://adityamattos.com/multi-tenancy-in-python-fastapi-and-sqlalchemy-using-postgres-row-level-security)
- [The Complete Guide to Building a Multi-Tenant SaaS (2026)](https://hiveforge.dev/guides/multi-tenant-saas)
- [Multi-Tenant Leakage: When Row-Level Security Fails in SaaS](https://medium.com/@instatunnel/multi-tenant-leakage-when-row-level-security-fails-in-saas-da25f40c788c)

### Background jobs

- [FastAPI Scheduling & Background Tasks: BackgroundTasks vs APScheduler vs Celery](https://medium.com/@rasifrazak123/fastapi-scheduling-background-tasks-backgroundtasks-vs-apscheduler-vs-celery-complete-guide-ff90d6be524b)
- [The Definitive Guide to Celery and FastAPI](https://testdriven.io/courses/fastapi-celery/intro/)

### Hosting

- [Fly.io vs Railway 2026: Which Is Faster, Cheaper & Less Painful](https://thesoftwarescout.com/fly-io-vs-railway-2026-which-developer-platform-should-you-deploy-on/)
- [Railway vs Render vs Fly.io for Solo Developers in 2026](https://devtoolpicks.com/blog/railway-vs-render-vs-fly-io-solo-developers-2026)

### ML / Analytics

- [Market Basket Analysis: A Comprehensive Guide for Businesses](https://www.analyticsvidhya.com/blog/2021/10/a-comprehensive-guide-on-market-basket-analysis/)
- [Retail Customer Churn Analysis using RFM Model and K-Means Clustering](https://www.ijert.org/research/retail-customer-churn-analysis-using-rfm-model-and-k-means-clustering-IJERTV10IS030170.pdf)
- [Enhancing customer retention in Online Retail through churn prediction (ScienceDirect)](https://www.sciencedirect.com/science/article/abs/pii/S0957417425020846)

### Webhook security

- [Webhook Security: How to Verify Incoming Requests with HMAC Signatures](https://dev.to/snappy_tools/webhook-security-how-to-verify-incoming-requests-with-hmac-signatures-2d)
- [Webhook Signature Verification: Complete Security Guide](https://inventivehq.com/blog/webhook-signature-verification-guide)

### Competidores

- [Square vs Clover vs Toast POS: 2026 Guide (Tech.co)](https://tech.co/pos-system/toast-vs-square-vs-clover)
- [5 Clover POS Alternatives & Competitors (KORONA)](https://koronapos.com/blog/clover-pos-alternatives/)

---

*Este documento es vivo. Si algo cambia, editalo en un PR. La fuente de verdad es el repo, no Slack ni Notion.*
