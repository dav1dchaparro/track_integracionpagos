package com.cloveriamarketing.data.remote

import com.google.gson.annotations.SerializedName

/**
 * DTOs (Data Transfer Objects) — representan exactamente lo que el backend devuelve.
 *
 * Cada data class acá es un espejo de un schema Pydantic del backend.
 * Gson los convierte automáticamente desde JSON usando @SerializedName.
 *
 * ┌──────────────────────────────────────────────────────────┐
 * │ Backend (Python)          →  Android (Kotlin)            │
 * │ UserResponse              →  UserDto                     │
 * │ TokenResponse             →  TokenDto                    │
 * │ SaleResponse              →  SaleDto                     │
 * │ GET /dashboard/summary    →  DashboardDto                │
 * └──────────────────────────────────────────────────────────┘
 */

// ═══════════════════════════════════════════════════════════
//  AUTH — Login y Registro
// ═══════════════════════════════════════════════════════════

/** Body que se envía al POST /auth/login */
data class LoginRequest(
    val email: String,
    val password: String
)

/** Body que se envía al POST /auth/register */
data class RegisterRequest(
    @SerializedName("store_name") val storeName: String,
    val email: String,
    val password: String
)

/** Respuesta del POST /auth/login y /auth/refresh — contiene el JWT */
data class TokenDto(
    @SerializedName("access_token") val accessToken: String,
    @SerializedName("token_type") val tokenType: String
)

/** Respuesta del GET /auth/me — datos del usuario logueado */
data class UserDto(
    val id: String,
    @SerializedName("store_name") val storeName: String,
    val email: String,
    val rol: String? = null,
    @SerializedName("monthly_goal") val monthlyGoal: Double? = null,
    @SerializedName("created_at") val createdAt: String
)

// ═══════════════════════════════════════════════════════════
//  DASHBOARD — KPIs y Analytics
// ═══════════════════════════════════════════════════════════

/** Respuesta del GET /dashboard/summary */
data class DashboardDto(
    val period: String,
    val kpis: KpisDto,
    @SerializedName("kpi_changes") val kpiChanges: KpiChangesDto? = null,
    @SerializedName("payment_methods") val paymentMethods: Map<String, PaymentMethodDetail>,
    @SerializedName("card_brands") val cardBrands: Map<String, CardBrandDetail>,
    @SerializedName("sales_timeline") val salesTimeline: List<TimelinePoint>,
    @SerializedName("top_products") val topProducts: List<TopProductDto>,
    @SerializedName("category_breakdown") val categoryBreakdown: List<CategoryBreakdownDto>,
    @SerializedName("top_customers") val topCustomers: List<TopCustomerDto>? = null
)

data class KpisDto(
    @SerializedName("total_revenue") val totalRevenue: Double,
    @SerializedName("total_orders") val totalOrders: Int,
    @SerializedName("avg_ticket") val avgTicket: Double,
    @SerializedName("total_products") val totalProducts: Int,
    @SerializedName("total_categories") val totalCategories: Int,
    @SerializedName("unique_customers") val uniqueCustomers: Int? = 0,
    @SerializedName("return_rate") val returnRate: Double? = 0.0
)

data class PaymentMethodDetail(
    val count: Int,
    val total: Double
)

data class CardBrandDetail(
    val count: Int,
    val total: Double
)

data class TimelinePoint(
    val date: String,
    val count: Int,
    val total: Double
)

data class TopProductDto(
    val name: String,
    val revenue: Double,
    val units: Int
)

data class CategoryBreakdownDto(
    val name: String,
    val revenue: Double
)

data class KpiChangesDto(
    @SerializedName("total_revenue") val totalRevenue: Double? = null,
    @SerializedName("total_orders") val totalOrders: Double? = null,
    @SerializedName("avg_ticket") val avgTicket: Double? = null
)

data class TopCustomerDto(
    val email: String,
    val orders: Int,
    val total: Double
)

// ═══════════════════════════════════════════════════════════
//  INSIGHTS — Briefing y Alertas
// ═══════════════════════════════════════════════════════════

data class BriefingResponse(
    val briefing: String
)

data class AlertsResponse(
    val alerts: List<AlertDto>
)

data class AlertDto(
    val type: String,
    val level: String,
    val title: String,
    val message: String
)

// ═══════════════════════════════════════════════════════════
//  VENTAS — Lista de ventas
// ═══════════════════════════════════════════════════════════

/** Respuesta del GET /sales/ — una venta individual */
data class SaleDto(
    val id: String,
    @SerializedName("invoice_number") val invoiceNumber: String,
    @SerializedName("payment_method") val paymentMethod: String,
    @SerializedName("card_type") val cardType: String?,
    @SerializedName("card_brand") val cardBrand: String?,
    @SerializedName("card_category") val cardCategory: String?,
    val total: Double,
    val items: List<SaleItemDto>,
    @SerializedName("sold_at") val soldAt: String
)

data class SaleItemDto(
    val id: String,
    @SerializedName("product_id") val productId: String,
    val quantity: Int,
    val subtotal: Double
)

// ═══════════════════════════════════════════════════════════
//  PRODUCTOS y CATEGORÍAS
// ═══════════════════════════════════════════════════════════

data class ProductDto(
    val id: String,
    val name: String,
    val price: Double,
    val categories: List<CategoryDto>?,
    @SerializedName("created_at") val createdAt: String
)

data class CategoryDto(
    val id: String,
    val name: String,
    @SerializedName("created_at") val createdAt: String
)
