package com.cloveriamarketing.data.remote

import retrofit2.Response
import retrofit2.http.*

/**
 * Interfaz Retrofit — define TODOS los endpoints del backend FastAPI.
 *
 * Cómo funciona:
 * 1. Vos definís una función con anotaciones (@GET, @POST, etc.)
 * 2. Retrofit genera automáticamente el código HTTP real
 * 3. Cada función devuelve Response<T> donde T es un DTO de Dto.kt
 *
 * Las funciones son "suspend" = se ejecutan en una coroutine (no bloquean la UI).
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │  Endpoint del backend        │  Función Kotlin               │
 * ├──────────────────────────────┼───────────────────────────────│
 * │  POST /auth/login            │  login()                      │
 * │  POST /auth/register         │  register()                   │
 * │  POST /auth/refresh          │  refreshToken()               │
 * │  GET  /auth/me               │  getCurrentUser()             │
 * │  GET  /dashboard/summary     │  getDashboardSummary()        │
 * │  GET  /sales/                │  getSales()                   │
 * │  GET  /products/             │  getProducts()                │
 * │  GET  /categories/           │  getCategories()              │
 * └──────────────────────────────────────────────────────────────┘
 */
interface ApiService {

    // ═══════════════════════════════════════════════════════════
    //  AUTH — Autenticación y registro
    // ═══════════════════════════════════════════════════════════

    /**
     * Inicia sesión con email y contraseña.
     * Devuelve un JWT token que se usa en todas las demás llamadas.
     *
     * Backend: POST /auth/login
     * Body: { "email": "...", "password": "..." }
     * Response: { "access_token": "eyJ...", "token_type": "bearer" }
     */
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<TokenDto>

    /**
     * Registra un nuevo usuario/comercio.
     * Después del registro hay que llamar a login() para obtener el token.
     *
     * Backend: POST /auth/register
     * Body: { "store_name": "...", "email": "...", "password": "..." }
     */
    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<UserDto>

    /**
     * Renueva un token expirado sin pedir login de nuevo.
     * Envía el token viejo en el header Authorization.
     *
     * Backend: POST /auth/refresh
     * Header: Authorization: Bearer {token_viejo}
     */
    @POST("auth/refresh")
    suspend fun refreshToken(): Response<TokenDto>

    /**
     * Obtiene los datos del usuario actualmente logueado.
     * Útil para mostrar "Hola, {nombre}" en el dashboard.
     *
     * Backend: GET /auth/me
     * Header: Authorization: Bearer {token}
     */
    @GET("auth/me")
    suspend fun getCurrentUser(): Response<UserDto>

    // ═══════════════════════════════════════════════════════════
    //  DASHBOARD — KPIs y Analytics
    // ═══════════════════════════════════════════════════════════

    /**
     * Obtiene el resumen completo del dashboard:
     * - KPIs (revenue, ventas, ticket promedio)
     * - Métodos de pago
     * - Marcas de tarjeta
     * - Timeline de ventas
     * - Top 10 productos
     * - Desglose por categoría
     *
     * Backend: GET /dashboard/summary?period=month
     * @param period "today", "week", "month", "year"
     */
    @GET("dashboard/summary")
    suspend fun getDashboardSummary(
        @Query("period") period: String = "month"
    ): Response<DashboardDto>

    // ═══════════════════════════════════════════════════════════
    //  VENTAS — Lista y filtros
    // ═══════════════════════════════════════════════════════════

    /**
     * Lista las ventas del comercio con filtros opcionales.
     *
     * Backend: GET /sales/?payment_method=card&limit=50&skip=0
     * @param paymentMethod Filtrar por "card" o "qr" (null = todas)
     * @param cardBrand Filtrar por "visa", "mastercard", "amex" (null = todas)
     * @param limit Cantidad máxima de resultados (máx 100)
     * @param skip Offset para paginación
     */
    @GET("sales/")
    suspend fun getSales(
        @Query("payment_method") paymentMethod: String? = null,
        @Query("card_brand") cardBrand: String? = null,
        @Query("limit") limit: Int = 50,
        @Query("skip") skip: Int = 0
    ): Response<List<SaleDto>>

    // ═══════════════════════════════════════════════════════════
    //  PRODUCTOS y CATEGORÍAS
    // ═══════════════════════════════════════════════════════════

    /** Lista todos los productos del comercio */
    @GET("products/")
    suspend fun getProducts(): Response<List<ProductDto>>

    /** Lista todas las categorías del comercio */
    @GET("categories/")
    suspend fun getCategories(): Response<List<CategoryDto>>

    // ═══════════════════════════════════════════════════════════
    //  INSIGHTS — IA y Alertas
    // ═══════════════════════════════════════════════════════════

    /** Briefing diario generado por IA con datos del negocio */
    @GET("insights/briefing")
    suspend fun getBriefing(): Response<BriefingResponse>

    /** Alertas inteligentes: clientes en riesgo, productos lentos, metas */
    @GET("insights/alerts")
    suspend fun getAlerts(): Response<AlertsResponse>
}
