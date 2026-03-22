package com.cloveriamarketing.data.model

/**
 * Modelos de datos de la app SmartReceipt / CloverIA Marketing.
 *
 * Por ahora estos modelos contienen datos fake para mostrar las pantallas.
 * En la Fase 2 se van a llenar con la respuesta real del backend (FastAPI).
 *
 * Kotlin usa "data class" para modelos: genera automáticamente equals(), copy(),
 * toString() y hashCode() — no hace falta escribirlos a mano como en Java.
 */

// ─────────────────────────────────────────────────────────────
//  Estadísticas generales del dashboard
// ─────────────────────────────────────────────────────────────

/**
 * Contiene los números principales que se muestran en el Dashboard.
 * Se llena desde el endpoint GET /api/dashboard/{merchant_id}
 */
data class DashboardStats(
    val totalRevenue: Double,       // Ingresos totales del período
    val totalSales: Int,            // Cantidad de ventas
    val averageTicket: Double,      // Ticket promedio por venta
    val topProduct: String,         // Producto más vendido
    val topProductRevenue: Double   // Ingresos del producto estrella
)

// ─────────────────────────────────────────────────────────────
//  Venta reciente (para la lista del Dashboard)
// ─────────────────────────────────────────────────────────────

/**
 * Representa una venta individual en la lista "Ventas recientes".
 * Se llena desde el endpoint GET /api/sales/
 */
data class RecentSale(
    val id: String,         // ID único de la venta
    val product: String,    // Nombre del producto o descripción
    val amount: Double,     // Monto total de la venta
    val time: String,       // Hora formateada, ej: "14:32"
    val paymentMethod: String   // "CARD", "CASH", "DEBIT", etc.
)

// ─────────────────────────────────────────────────────────────
//  Datos del usuario logueado
// ─────────────────────────────────────────────────────────────

/**
 * Información del usuario después del login.
 * En la Fase 2 se llena con la respuesta de POST /api/auth/login
 */
data class User(
    val id: Int,
    val username: String,
    val email: String,
    val token: String   // JWT token para autenticar las siguientes requests
)

// ─────────────────────────────────────────────────────────────
//  Datos fake para Fase 1 (sin backend)
// ─────────────────────────────────────────────────────────────

/**
 * Objeto con datos de ejemplo para poder ver las pantallas sin backend.
 * En la Fase 2 esto se elimina y se reemplaza por llamadas reales a la API.
 */
object FakeData {

    // Estadísticas de ejemplo del dashboard
    val dashboardStats = DashboardStats(
        totalRevenue = 4850.75,
        totalSales = 342,
        averageTicket = 14.18,
        topProduct = "Tostado Jamón/Queso",
        topProductRevenue = 1056.00
    )

    // Lista de ventas recientes de ejemplo
    val recentSales = listOf(
        RecentSale("1", "Café Americano + Medialuna", 6.30, "14:52", "CARD"),
        RecentSale("2", "Tostado Jamón/Queso", 5.50, "14:45", "CASH"),
        RecentSale("3", "Cappuccino x2 + Scone", 11.50, "14:38", "DEBIT"),
        RecentSale("4", "Jugo de Naranja", 3.20, "14:30", "CARD"),
        RecentSale("5", "Combo Almuerzo", 8.70, "14:15", "CREDIT"),
        RecentSale("6", "Agua Mineral x2 + Torta", 7.00, "14:02", "CASH"),
    )
}
