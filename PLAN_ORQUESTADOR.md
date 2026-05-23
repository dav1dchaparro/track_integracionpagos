# Plan Orquestador — Atlas Nexus

> Documento de coordinación del equipo. Define hacia dónde va el producto, en qué fases, con qué responsables y con qué criterios de "terminado".
> **Última actualización:** 2026-05-23 · **Owners del plan:** Tech Lead + PM rotativo

---

## 0. TL;DR

Atlas Nexus hoy es un MVP funcional: un dashboard con IA que se conecta a **Clover POS** para un único comerciante (credenciales en `.env`). Para escalar a producto comercializable necesitamos tres movimientos en orden:

1. **Multi-tenant + OAuth de Clover** → cualquier comercio se conecta solo.
2. **Publicación en Clover App Market** → distribución a la base instalada de Clover.
3. **Expansión funcional + multi-POS** → loyalty, recomendador, conciliación, integración con Square/Mercado Pago.

El objetivo a 6 meses es **pasar de demo a SaaS con primeros 10 comercios pagos**.

---

## 1. Estado actual (snapshot 2026-05-23)

### Lo que ya funciona

| Área | Estado | Archivos clave |
|---|---|---|
| Backend FastAPI | ✅ Producción local | [backend/app/main.py](backend/app/main.py) |
| Auth JWT + roles (dueño/vendedor) | ✅ | [backend/app/routers/auth.py](backend/app/routers/auth.py), [backend/app/models/user.py](backend/app/models/user.py) |
| Dashboard React | ✅ | [frontend/src/pages/Dashboard.jsx](frontend/src/pages/Dashboard.jsx) |
| Clover REST API (pull + webhook) | ✅ single-tenant | [backend/app/services/clover_service.py](backend/app/services/clover_service.py), [backend/app/routers/clover.py](backend/app/routers/clover.py) |
| IA insights (Groq) | ✅ | [backend/app/routers/insights.py](backend/app/routers/insights.py) |
| Forecasting / ML | ✅ básico | [backend/app/services/ml_forecasting.py](backend/app/services/ml_forecasting.py), [backend/app/models/forecasting.py](backend/app/models/forecasting.py) |
| App Android | 🟡 parcial (login + dashboard) | [CloverIAMarketing/app/](CloverIAMarketing/app/) |
| Módulo Marketing | ✅ | [frontend/src/pages/Insights.jsx](frontend/src/pages/Insights.jsx) |
| Modelo Business separado de User | ✅ | [backend/app/models/business.py](backend/app/models/business.py) |
| Docker Compose dev | ✅ | [docker-compose.yml](docker-compose.yml) |

### Lo que NO funciona / limita la escala

- **Single-tenant disfrazado**: `CLOVER_ACCESS_TOKEN` está en [config.py:14](backend/app/config.py#L14) como variable global. Un solo merchant por instalación.
- **CORS abierto** (`allow_origins=["*"]` en [main.py:23](backend/app/main.py#L23)).
- **Sin verificación HMAC del webhook de Clover** — cualquiera con la URL puede meter ventas falsas en [clover.py:18](backend/app/routers/clover.py#L18).
- **Sin recuperación de contraseña, sin verificación de email** (ver [PENDIENTES.md](PENDIENTES.md)).
- **Sin tests de integración** del flujo Clover → DB.
- **Sin observabilidad** (logs estructurados, métricas, error tracking).
- **Sin CI/CD** ni entorno de staging.
- **Frontend dashboard lento con muchas ventas** — no hay paginación ni caché.

---

## 2. Visión a 6 meses

> **"Cualquier comerciante con Clover instala Atlas Nexus desde su terminal en 2 clicks, paga una suscripción mensual, y al día siguiente recibe insights accionables generados por IA sobre sus ventas, clientes e inventario."**

### KPIs del producto (Sept 2026)

- 10 comercios pagos activos
- < 5 min de onboarding (desde "instalar app" hasta "primer insight")
- Webhook latency p95 < 2s
- NPS > 40

---

## 3. Equipo y áreas de ownership

Roles propuestos según lo que cada uno viene tocando en `git log`. **No son cárceles** — son la persona "primer responsable" del área. Cualquiera puede contribuir a cualquier área vía PR.

| Persona | Área primaria | Área secundaria | Responsabilidades |
|---|---|---|---|
| **dav1dchaparro** (David) | Tech Lead / Backend & ML | Integración Clover | Arquitectura, decisiones técnicas, code review final, ML/forecasting |
| **Esteban** | Backend Architect | Datos | Modelos de datos, refactors, separación User/Business, migraciones |
| **juan** | Mobile & Integrations | Clover API | App Android completa, integración Clover REST + webhooks, OAuth |
| **gabosawn** (Gabo) | Frontend & DevOps | UX | Dashboard, componentes, Docker, CI/CD, releases |

**Rituales del equipo:**
- **Daily async** (Slack/Discord): qué hice ayer / qué hago hoy / blockers — 3 líneas, sin meeting.
- **Weekly sync** (lunes, 30 min): revisar el board, decidir prioridades de la semana.
- **Demo Friday** (viernes, 20 min): cada uno muestra lo que terminó. Si no hay nada, no hay demo (no se llena de relleno).
- **Retros** cada 2 semanas (30 min): qué funcionó, qué no, qué cambiar.

---

## 4. Roadmap por fases

> Cada fase termina con un **Definition of Done** explícito. No se pasa a la siguiente sin cerrar la anterior.

---

### 🟦 Fase 1 — Endurecer el MVP (4 semanas · jun 2026)

**Objetivo:** dejar el código actual production-ready *antes* de meter más features. Hoy hay deuda técnica que va a doler cuando entren clientes reales.

#### Tareas

| # | Tarea | Owner | Archivos | Estimación |
|---|---|---|---|---|
| 1.1 | Verificar firma HMAC en webhook de Clover | juan | [clover.py:18](backend/app/routers/clover.py#L18), [clover_service.py](backend/app/services/clover_service.py) | 1 d |
| 1.2 | Cerrar CORS a dominios específicos por env | gabosawn | [main.py:21-27](backend/app/main.py#L21-L27), [config.py](backend/app/config.py) | 0.5 d |
| 1.3 | Mover secretos a vault / `.env.production` cifrado | Esteban | [config.py](backend/app/config.py) | 1 d |
| 1.4 | Logs estructurados (JSON) + request ID | gabosawn | [main.py](backend/app/main.py), todos los routers | 2 d |
| 1.5 | Tests de integración del flujo Clover → DB | juan | nuevo: `backend/tests/test_clover_integration.py` | 3 d |
| 1.6 | Recuperación de contraseña por email | Esteban | [auth.py](backend/app/routers/auth.py), nuevo service de email | 2 d |
| 1.7 | Verificación de email al registrarse | Esteban | [auth.py](backend/app/routers/auth.py) | 1 d |
| 1.8 | Paginación en `/sales`, `/products`, `/categories` | gabosawn | [sales.py](backend/app/routers/sales.py), [products.py](backend/app/routers/products.py), [categories.py](backend/app/routers/categories.py) + frontend | 2 d |
| 1.9 | Caché del dashboard (Redis o in-memory con TTL) | dav1dchaparro | [dashboard.py](backend/app/routers/dashboard.py) | 2 d |
| 1.10 | Error tracking (Sentry) | gabosawn | nuevo wiring | 1 d |
| 1.11 | CI/CD con GitHub Actions (lint + tests + build Docker) | gabosawn | nuevo `.github/workflows/ci.yml` | 2 d |
| 1.12 | Migraciones con Alembic (hoy DDL al vuelo) | Esteban | nuevo `backend/alembic/` | 2 d |

#### Definition of Done — Fase 1

- [ ] Webhook valida firma HMAC y rechaza eventos no firmados.
- [ ] CORS configurado por entorno (dev/staging/prod).
- [ ] Pipeline CI verde en cada PR a `main`.
- [ ] Sentry capturando errores en backend y frontend.
- [ ] Migraciones versionadas y reversibles.
- [ ] Cobertura de tests > 60% en `app/services/clover_service.py`.
- [ ] Recovery password y email verification funcionando end-to-end.

---

### 🟩 Fase 2 — Multi-tenant + OAuth Clover (6 semanas · jul–ago 2026)

**Objetivo:** que cualquier comercio se pueda dar de alta y conectar su Clover sin que el equipo toque variables de entorno.

#### Cambio de arquitectura central

```
ANTES                                  DESPUÉS
┌──────────────┐                       ┌──────────────┐
│ .env global  │                       │  Comercio A  │──token A─┐
│  CLOVER_ID   │                       │  Comercio B  │──token B─┤
│  CLOVER_TOK  │                       │  Comercio C  │──token C─┤
└──────┬───────┘                       └──────────────┘          │
       │                                                          ▼
       ▼                                                  ┌──────────────┐
┌──────────────┐                                          │   DB cifrada │
│   1 cliente  │                                          │ merchant_id  │
└──────────────┘                                          │ access_token │
                                                          └──────────────┘
```

#### Tareas

| # | Tarea | Owner | Archivos | Estimación |
|---|---|---|---|---|
| 2.1 | Diseño del flujo OAuth de Clover (doc + diagrama) | dav1dchaparro | nuevo `docs/plans/oauth-clover.md` | 2 d |
| 2.2 | Endpoints `/clover/oauth/start` y `/clover/oauth/callback` | juan | [clover.py](backend/app/routers/clover.py) | 3 d |
| 2.3 | Modelo `MerchantConnection` (token cifrado con Fernet, refresh, scopes) | Esteban | nuevo `backend/app/models/merchant_connection.py` | 2 d |
| 2.4 | Refactor `clover_service.py` para recibir `merchant_id` y `token` por parámetro | juan + dav1dchaparro | [clover_service.py](backend/app/services/clover_service.py) | 3 d |
| 2.5 | Refresh automático de tokens expirados | juan | [clover_service.py](backend/app/services/clover_service.py) | 2 d |
| 2.6 | UI para conectar/desconectar Clover desde Settings | gabosawn | [frontend/src/pages/Settings.jsx](frontend/src/pages/Settings.jsx) | 3 d |
| 2.7 | Worker de sincronización periódica (APScheduler / Celery beat) | dav1dchaparro | nuevo `backend/app/workers/clover_sync.py` | 4 d |
| 2.8 | Aislamiento de datos por `business_id` en todas las queries | Esteban | revisión de todos los routers | 4 d |
| 2.9 | Tests de aislamiento (que comercio A no vea datos de B) | Esteban | `backend/tests/test_tenant_isolation.py` | 2 d |
| 2.10 | Rate limiting por merchant (evitar pegar a Clover API en bursts) | dav1dchaparro | nuevo middleware | 2 d |
| 2.11 | Onboarding wizard (paso a paso primer login) | gabosawn | nuevo `frontend/src/pages/Onboarding.jsx` | 4 d |
| 2.12 | Soporte multi-local por dueño | Esteban | `business.py` + nuevo `location.py` | 4 d |

#### Definition of Done — Fase 2

- [ ] Un usuario nuevo puede registrarse, conectar su Clover via OAuth y ver ventas en < 5 minutos sin intervención del equipo.
- [ ] Tokens nunca aparecen en `.env`; están cifrados en DB.
- [ ] Tests demuestran que comercio A no puede acceder a datos de B (ni con SQL injection, ni con IDs hardcodeados).
- [ ] Worker sincroniza automáticamente cada 5 min (configurable).
- [ ] Onboarding documentado y testeado con 2 usuarios externos.

---

### 🟨 Fase 3 — Publicación en Clover App Market (4 semanas · sept 2026)

**Objetivo:** estar listed en el App Market y poder cobrar suscripción a través de Clover (70/30 split).

#### Tareas

| # | Tarea | Owner | Estimación |
|---|---|---|---|
| 3.1 | Crear sandbox developer account en Clover | dav1dchaparro | 0.5 d |
| 3.2 | Crear app en Clover Developer Dashboard (sandbox) | dav1dchaparro | 1 d |
| 3.3 | Implementar billing webhook (`APP_INSTALLED`, `APP_UNINSTALLED`, `APP_SUBSCRIPTION_CHANGED`) | juan | 3 d |
| 3.4 | Landing page pública del producto | gabosawn | 5 d |
| 3.5 | Docs públicas (privacy policy, terms, support email) | dav1dchaparro | 2 d |
| 3.6 | Screenshots + video demo + copy del listing | gabosawn + dav1dchaparro | 3 d |
| 3.7 | Pricing tiers configurados (free trial + 2-3 planes) | dav1dchaparro | 1 d |
| 3.8 | App approval submission | dav1dchaparro | 1 d (+ espera Clover) |
| 3.9 | Soporte: email + form en la landing | gabosawn | 2 d |

#### Definition of Done — Fase 3

- [ ] App publicada en Clover App Market (al menos en sandbox aprobada y lista para producción).
- [ ] Landing pública en producción con dominio propio.
- [ ] Flujo completo de install → trial → suscripción → uninstall probado.
- [ ] Soporte cliente funcionando (mailbox compartido).

---

### 🟥 Fase 4 — Expansión funcional (8 semanas · oct–nov 2026)

**Objetivo:** subir el valor por cliente para justificar el precio y diferenciar del resto del App Market.

#### Tracks paralelos

**Track A — Mobile (Owner: juan)**
- Completar app Android: Sales, Products, Categories, Insights, Settings (hoy solo login + dashboard).
- Push notifications nativas para alertas críticas.
- Modo offline básico (cache local + sync al recuperar conexión).

**Track B — IA Avanzada (Owner: dav1dchaparro)**
- Sugerencias proactivas (el sistema avisa sin que el user pregunte).
- Predicción de churn de clientes (los que están por dejar de comprar).
- Análisis de estacionalidad (Navidad, vacaciones).
- IA con respuestas en voz (TTS).
- Recomendador de combos / market-basket analysis.

**Track C — Integraciones (Owner: Esteban)**
- WhatsApp Business API para promos.
- Adapter genérico `POSProvider` → soportar Square y Mercado Pago Point además de Clover.
- Importar productos desde Excel/CSV.
- Sincronización con AFIP / facturación electrónica.

**Track D — UX (Owner: gabosawn)**
- Modo claro pulido.
- Versión en inglés (i18n con `react-i18next`).
- Reportes PDF descargables.
- Comparativa MoM en cada KPI.
- Tutorial contextual.

#### Definition of Done — Fase 4

- [ ] App Android tiene paridad de features con el dashboard web.
- [ ] Al menos 1 integración adicional al stack Clover (Square o Mercado Pago).
- [ ] i18n EN/ES funcional.
- [ ] Reportes PDF exportables.
- [ ] Predicción de churn con precisión > 70% en datos de prueba.

---

### 🟪 Fase 5 — Crecimiento y benchmarking (continua · dic 2026+)

**Objetivo:** crear un foso defensivo basado en datos agregados.

- **Benchmark anónimo entre comercios**: cuando haya > 50 clientes del mismo rubro, mostrar "tu ticket promedio está X% por debajo del promedio". **Esto es difícil de copiar y se vuelve más fuerte con cada cliente nuevo.**
- **Conciliación bancaria** (cruce de ventas Clover con depósitos del banco).
- **Inventario predictivo con auto-reposición** (generar órdenes de compra automáticas).
- **Loyalty / programa de fidelización** integrado.

---

## 5. Decisiones técnicas pendientes

> Cosas que hay que decidir como equipo antes de Fase 2.

| Decisión | Opciones | Recomendación | Decidir antes de |
|---|---|---|---|
| Worker queue | APScheduler vs Celery vs RQ | **Celery** (probado a escala, soporta beat) | Inicio Fase 2 |
| Cifrado de tokens | Fernet (symmetric) vs KMS | **Fernet** ahora, KMS cuando estemos en AWS | Inicio Fase 2 |
| Hosting de producción | Render vs Railway vs AWS vs Fly.io | **Fly.io** (Docker-first, barato, multi-región) | Inicio Fase 3 |
| Email transaccional | SendGrid vs Resend vs AWS SES | **Resend** (DX moderno, barato) | Tarea 1.6 |
| Error tracking | Sentry vs Datadog | **Sentry** (free tier alcanza) | Tarea 1.10 |
| CDN frontend | Cloudflare Pages vs Vercel | **Cloudflare Pages** | Tarea 1.11 |

---

## 6. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Clover rechaza la app del App Market | Media | Alta | Empezar el approval temprano (Fase 3 inicio), iterar con el feedback de Clover |
| Rate limiting de Clover API con muchos merchants | Alta | Media | Implementar backoff exponencial + cola Celery desde Fase 2 |
| Costos de IA (Groq) escalan con clientes | Alta | Media | Cachear respuestas, batchear consultas, considerar fine-tuning local |
| Cumplimiento PCI / datos de tarjetas | Media | Alta | **Nunca** almacenar PAN/CVV. Solo metadata (brand, last4, type) — ya lo hacemos bien. Auditar antes de Fase 3. |
| Pérdida de un miembro del equipo | Baja | Alta | Documentación viva en `/docs`, pair programming, todos los servicios con ≥ 2 personas que los entiendan |
| Lock-in con Clover | Alta | Media | Diseñar `POSProvider` abstracto desde Fase 4 (Track C) |

---

## 7. Cómo trabajar (reglas del equipo)

### Git workflow

- **`main`** = producción. Solo se mergea via PR aprobado.
- **`develop`** = staging. Aquí van PRs antes de pasar a main.
- **`feature/<persona>-<descripcion>`** = una rama por tarea.
- Squash merge a `develop`. Merge commit de `develop` → `main` para releases.
- Cada PR necesita **1 reviewer mínimo** + CI verde.
- Commits en imperativo, en inglés o español consistente: `feat: add OAuth callback endpoint`.

### Convenciones de código

- **Backend**: black + ruff + mypy strict. Type hints obligatorios en services y routers.
- **Frontend**: prettier + eslint. Componentes funcionales con hooks (no class components).
- **No comentarios** que expliquen *qué* hace el código — los nombres deberían bastar. Comentarios solo para el *por qué* cuando no es obvio.
- **Sin features-flags ni compatibility shims** durante MVP — borrar código viejo cuando se reemplaza.

### Cómo dividir el trabajo

- Tareas grandes (> 3 días) se rompen en sub-tareas de < 1 día.
- Si una tarea bloquea a otro miembro del equipo, sube su prioridad.
- Si te trabás más de 4 horas en algo, pedí ayuda. No es debilidad — es ahorrar el tiempo del equipo.

---

## 8. Estructura de carpetas objetivo (post-Fase 2)

```
track_integracionpagos/
├── backend/
│   ├── app/
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic
│   │   ├── routers/          # FastAPI endpoints
│   │   ├── services/         # Lógica de negocio
│   │   ├── workers/          # Celery tasks
│   │   ├── integrations/     # ← NUEVO: clover/, square/, mercadopago/
│   │   └── crypto/           # ← NUEVO: cifrado de tokens
│   ├── alembic/              # ← NUEVO: migraciones
│   └── tests/
├── frontend/
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── hooks/            # ← NUEVO
│       └── i18n/             # ← NUEVO: en.json, es.json
├── CloverIAMarketing/        # App Android (renombrar a `android/`)
├── docs/
│   ├── plans/
│   ├── architecture/         # ← NUEVO: ADRs
│   └── runbooks/             # ← NUEVO: cómo recuperar incidentes
├── landing/                  # ← NUEVO: sitio público
└── .github/workflows/        # ← NUEVO: CI
```

---

## 9. Glosario rápido

- **POS** — Point of Sale. El sistema donde el comercio cobra.
- **Clover** — POS de Fiserv. Hardware + software + app market.
- **Fiserv** — empresa dueña de Clover. Procesador de pagos.
- **Webhook** — Clover nos avisa cuando pasa algo (venta nueva, etc.).
- **OAuth** — protocolo para que un comercio autorice a Atlas Nexus a leer sus datos sin compartir password.
- **Multi-tenant** — una sola instancia del sistema atiende a muchos clientes aislados entre sí.
- **App Market** — la "Play Store" de Clover, donde los comercios descubren e instalan apps.

---

## 10. Próximas acciones (esta semana)

> Acordadas en el sync de arranque. Cada uno crea su rama y abre PR.

- [ ] **dav1dchaparro** — Documento de diseño OAuth Clover (tarea 2.1, aunque sea Fase 2 — bloquea a juan).
- [ ] **juan** — Verificación HMAC del webhook (tarea 1.1).
- [ ] **Esteban** — Migrar a Alembic (tarea 1.12).
- [ ] **gabosawn** — Setup CI con GitHub Actions (tarea 1.11).

Próximo sync: **lunes 2026-06-01 · 10:00**.

---

*Este documento es vivo. Si algo cambia, edítenlo en un PR — no en Slack, no en un Notion paralelo. La fuente de verdad es el repo.*
