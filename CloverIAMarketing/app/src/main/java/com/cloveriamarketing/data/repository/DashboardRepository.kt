package com.cloveriamarketing.data.repository

import com.cloveriamarketing.data.remote.*

/**
 * DashboardRepository — obtiene todos los datos para el panel principal.
 *
 * Centraliza las llamadas a:
 * - GET /dashboard/summary (KPIs, top productos, timeline, métodos de pago)
 * - GET /sales/ (lista de ventas recientes)
 * - GET /products/ (catálogo de productos)
 *
 * ¿Por qué separar AuthRepository y DashboardRepository?
 * Responsabilidad única: AuthRepository maneja sesión, DashboardRepository maneja datos.
 * Si mañana los datos vienen de otra API (ej: Clover directo), solo cambiás este archivo.
 */
class DashboardRepository {

    private val api: ApiService = RetrofitClient.getApi()

    /**
     * Obtiene el resumen completo del dashboard.
     *
     * @param period "today", "week", "month", "year"
     * @return DashboardDto con KPIs, top productos, timeline, métodos de pago, marcas de tarjeta
     */
    suspend fun getDashboardSummary(period: String = "month"): Result<DashboardDto> {
        return try {
            val response = api.getDashboardSummary(period)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Error ${response.code()}: No se pudo cargar el dashboard"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Sin conexión: ${e.message}"))
        }
    }

    /**
     * Obtiene la lista de ventas recientes.
     *
     * @param limit Cantidad máxima de ventas a traer
     * @param paymentMethod Filtrar por "card" o "qr" (null = todas)
     */
    suspend fun getRecentSales(
        limit: Int = 20,
        paymentMethod: String? = null
    ): Result<List<SaleDto>> {
        return try {
            val response = api.getSales(
                paymentMethod = paymentMethod,
                limit = limit,
                skip = 0
            )
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Error ${response.code()}: No se pudieron cargar las ventas"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Sin conexión: ${e.message}"))
        }
    }

    /**
     * Obtiene la lista completa de productos del comercio.
     */
    suspend fun getProducts(): Result<List<ProductDto>> {
        return try {
            val response = api.getProducts()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Error ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Sin conexión: ${e.message}"))
        }
    }
}
