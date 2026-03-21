# Frontend — Arquitectura

Dashboard web para SmartReceipt. Una sola página HTML/CSS/JS que consume la API REST del backend y muestra los datos de ventas en tiempo real.

---

## Stack

| Elemento | Decisión |
|----------|----------|
| HTML/CSS/JS | Sin frameworks — un solo archivo, fácil de desplegar |
| HTTP client | `fetch` nativo del browser |
| Estilos | CSS puro, variables y grid nativas |
| Sin dependencias | No requiere npm ni build step |

No se usó React, Vue ni ningún framework para mantener el frontend lo más simple posible durante el hackathon. Se puede abrir directo como archivo o servir con cualquier servidor HTTP.

---

## Estructura

```
frontend/
└── index.html   ← todo el código: HTML + CSS + JS en un solo archivo
```

### Secciones del dashboard

```
┌──────────────────────────────────────────────┐
│  Header: logo + selector de período          │
├──────────────────────────────────────────────┤
│  KPI Cards: ingresos · transacciones · ticket│
├────────────────────┬─────────────────────────┤
│  Top 5 productos   │  Hora pico               │
├────────────────────┴─────────────────────────┤
│  Insights de IA                              │
├──────────────────────────────────────────────┤
│  Tabla: últimas 10 transacciones             │
└──────────────────────────────────────────────┘
```

---

## Flujo de datos

```
Browser
  │
  ├── GET /api/dashboard/{merchantId}?period_days=N  ──→  KPIs + productos + hora pico
  ├── GET /api/insights/{merchantId}                 ──→  Insights de IA
  └── GET /api/transactions/{merchantId}?limit=10    ──→  Tabla de transacciones
```

Las tres llamadas se hacen en paralelo con `Promise.all()` al cargar la página y cada vez que el usuario cambia el período.

---

## Cómo correr

### Opción 1 — abrir directo (puede fallar por CORS en algunos browsers)
```
Abrir frontend/index.html en el browser
```

### Opción 2 — servidor local (recomendado)
```bash
cd frontend
python3 -m http.server 3000
# Abrir http://localhost:3000
```

**Requisito:** el backend debe estar corriendo en `http://localhost:8000` antes de abrir el frontend.

---

## Variables de configuración

Están al inicio del `<script>` en `index.html`:

```js
const API      = 'http://localhost:8000';   // URL del backend
const MERCHANT = 'demo_merchant_001';        // Merchant ID de demo
```

Cambiar `API` apuntando a un servidor real para producción.

---

## Decisiones de diseño

- **Un solo archivo** — facilita compartir y desplegar durante el hackathon sin necesidad de build tools.
- **Dark theme** — más cómodo para demos en vivo y pantallas de proyección.
- **Sin estado global** — cada cambio de período dispara un `loadAll()` que recarga todo desde el backend, simple y predecible.
- **Manejo de errores visible** — si el backend no responde, aparece un banner rojo con el mensaje de error para facilitar el debugging.
