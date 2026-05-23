# Roadmap — Atlas Nexus / Clover

Plan para escalar la app trabajando con Clover. Ordenado por prioridad: arriba lo más urgente, abajo lo que viene después.

---

## Fase 1 — Cerrar la app Android (1-2 semanas)

La app móvil hoy solo tiene login y dashboard. Es lo más débil. Sin esto el comerciante no puede operar desde el celular.

- [ ] Pantalla de **Productos** (listar, crear, editar)
- [ ] Pantalla de **Categorías**
- [ ] Pantalla de **Ventas recientes** con detalle
- [ ] Pantalla de **Insights** (briefing + chat IA + alerts) — replicar lo de la web
- [ ] Pantalla de **Forecasting / Stock**
- [ ] Pantalla de **Settings** con meta mensual
- [ ] Refresh con pull-to-refresh
- [ ] Manejo de "sin internet" — mostrar último dato cacheado
- [ ] Notificaciones push cuando hay alerta crítica
- [ ] Logo, splash screen, ícono propio

---

## Fase 2 — Calidad y confiabilidad (2-3 semanas)

Antes de meter más features hay que tapar agujeros.

- [ ] **Recuperar contraseña** por email (hoy no se puede)
- [ ] **Verificación de email** al registrarse
- [ ] **Tests E2E** del flujo completo (registro → carga datos → ve dashboard)
- [ ] **Backups automáticos** de la base de datos
- [ ] **Logs centralizados** para debuggear en producción
- [ ] **Manejo de errores** uniforme (hoy a veces explota feo)
- [ ] **Rate limiting** en endpoints públicos (login, register)
- [ ] **Validaciones** más estrictas en backend
- [ ] **Política de privacidad** y términos (necesario para publicar en Play Store / App Store)

---

## Fase 3 — Sacar más jugo a Clover (3-4 semanas)

Ahora solo se leen las órdenes. Clover tiene muchísimo más.

- [ ] **OAuth con Clover** — que el comerciante conecte su cuenta con un click, en vez de pegar tokens manuales
- [ ] **Publicar en Clover App Market** — distribución gratis a miles de comercios
- [ ] **Sincronizar inventario** bidireccional (cambio en Clover → cambio en Atlas y viceversa)
- [ ] **Sincronizar empleados** de Clover para reportes por vendedor
- [ ] **Sincronizar clientes** de Clover (customer database)
- [ ] **Imprimir recibos** desde Clover con info extra (cumpleaños del cliente, próxima visita sugerida)
- [ ] **Webhooks completos** — manejar refunds, cancelaciones, no solo ventas nuevas
- [ ] **Soporte para varios merchants** por cuenta (cadenas, franquicias)

---

## Fase 4 — Diferenciación con IA (1-2 meses)

Esto es lo que va a hacer que el comerciante elija Atlas sobre la competencia.

- [ ] **IA proactiva** — que avise sin que pregunten ("hoy vas a vender 30% menos por la lluvia")
- [ ] **Sugerencias de precios** dinámicas según demanda
- [ ] **Detección de fraude** en ventas raras
- [ ] **Predicción de churn** — qué clientes están por dejar de venir
- [ ] **Análisis de competencia** con datos públicos (Google Trends, clima, eventos locales)
- [ ] **IA por voz** — preguntar "che, ¿cómo vendí hoy?" hablando al celular
- [ ] **Generador de promos** con IA — que sugiera qué descuento mandar a quién

---

## Fase 5 — Crecimiento comercial (2-3 meses)

Hasta acá Atlas es una herramienta. Acá pasa a ser un canal de venta para el comerciante.

- [ ] **WhatsApp Business** integrado — mandar promos automáticas a clientes recurrentes
- [ ] **Programa de fidelidad** — puntos, descuentos, cumpleaños
- [ ] **E-commerce** mini — link de WhatsApp con catálogo y pago Clover
- [ ] **Marketplace** entre comerciantes (compartir proveedores, hacer compras conjuntas)
- [ ] **Préstamos / capital de trabajo** basados en historial de ventas (alianza con fintech)
- [ ] **Facturación electrónica** (AFIP en Argentina, equivalente en otros países)
- [ ] **Integración contable** (Quickbooks, Xero, Tango)

---

## Fase 6 — Escalar técnico (cuando haya ≥500 comercios)

Hoy la arquitectura aguanta poco. Cuando crezca hay que arreglar:

- [ ] **Multi-tenant real** — agregar `business_id`, no atar todo al `user_id`
- [ ] **Roles y permisos** — dueño, encargado, vendedor con vistas distintas
- [ ] **Cache** (Redis) para el dashboard — hoy reconsulta la DB cada vez
- [ ] **Cola de tareas** (Celery / RQ) para procesar IA y forecasting sin bloquear
- [ ] **CDN** para los assets del frontend
- [ ] **Microservicios** — separar el módulo de IA del backend principal
- [ ] **Observabilidad** — Grafana, Sentry, alertas de errores
- [ ] **CI/CD** — deploy automático con tests obligatorios
- [ ] **Multi-región** si se va a otros países

---

## Modelo de negocio sugerido

- **Free**: dashboard básico, hasta 100 ventas/mes
- **Pro ($29/mes)**: insights IA, forecasting, alertas, sin límite
- **Business ($99/mes)**: multi-local, multi-usuario, integraciones
- **Enterprise**: precio a medida + soporte dedicado

Comisión de Clover App Market: ~15-30%. Pensar en eso al fijar precios.

---

## Cosa más urgente esta semana

1. Terminar pantallas faltantes en Android (Productos, Ventas, Insights)
2. Sacar tokens de Clover hardcodeados y meter OAuth
3. Verificación de email en el registro
