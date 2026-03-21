package com.cloveriamarketing.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cloveriamarketing.data.model.DashboardStats
import com.cloveriamarketing.data.model.FakeData
import com.cloveriamarketing.data.model.RecentSale

/**
 * Pantalla principal del Dashboard.
 *
 * Muestra:
 * - Estadísticas clave (revenue, ventas, ticket promedio)
 * - Producto estrella
 * - Lista de ventas recientes
 *
 * @param onLogout Función que se ejecuta al presionar "Cerrar sesión".
 *                 NavGraph la usa para volver al Login.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(onLogout: () -> Unit) {

    // ── Colores ───────────────────────────────────────────────────
    val darkBg = Color(0xFF0F172A)
    val cardBg = Color(0xFF1E293B)
    val accentColor = Color(0xFF6366F1)
    val textColor = Color(0xFFF1F5F9)
    val subtextColor = Color(0xFF94A3B8)
    val greenColor = Color(0xFF22C55E)

    // ── Datos ─────────────────────────────────────────────────────
    // FASE 1: Datos fake. FASE 2: Reemplazar por llamada a la API.
    val stats = FakeData.dashboardStats
    val sales = FakeData.recentSales

    // ── UI ────────────────────────────────────────────────────────
    // Scaffold = estructura base con TopBar + contenido
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "📊 CloverIA Marketing",
                        color = textColor,
                        fontWeight = FontWeight.Bold
                    )
                },
                actions = {
                    // Botón de logout en la esquina superior derecha
                    IconButton(onClick = onLogout) {
                        Icon(
                            imageVector = Icons.Default.ExitToApp,
                            contentDescription = "Cerrar sesión",
                            tint = subtextColor
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = cardBg)
            )
        },
        containerColor = darkBg
    ) { paddingValues ->

        // LazyColumn = lista que solo renderiza los elementos visibles.
        // Es el equivalente a RecyclerView en el sistema de vistas tradicional.
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(vertical = 16.dp)
        ) {

            // ── Fila de estadísticas ──────────────────────────────
            // `item { }` = un elemento único en la lista (no repetido)
            item {
                Text(
                    text = "Resumen del período",
                    color = subtextColor,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium
                )
            }

            item {
                // Row = apila elementos horizontalmente
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Las tres tarjetas de KPI comparten el espacio equitativamente
                    StatCard(
                        modifier = Modifier.weight(1f),
                        label = "Ingresos",
                        value = "$${String.format("%.0f", stats.totalRevenue)}",
                        icon = "💰",
                        cardBg = cardBg,
                        textColor = textColor,
                        valueColor = greenColor
                    )
                    StatCard(
                        modifier = Modifier.weight(1f),
                        label = "Ventas",
                        value = "${stats.totalSales}",
                        icon = "🛒",
                        cardBg = cardBg,
                        textColor = textColor,
                        valueColor = accentColor
                    )
                    StatCard(
                        modifier = Modifier.weight(1f),
                        label = "Ticket prom.",
                        value = "$${String.format("%.2f", stats.averageTicket)}",
                        icon = "🎫",
                        cardBg = cardBg,
                        textColor = textColor,
                        valueColor = Color(0xFFF59E0B)   // Amarillo
                    )
                }
            }

            // ── Tarjeta producto estrella ─────────────────────────
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = cardBg)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(
                                text = "⭐ Producto estrella",
                                color = subtextColor,
                                fontSize = 12.sp
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = stats.topProduct,
                                color = textColor,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                        Text(
                            text = "$${String.format("%.0f", stats.topProductRevenue)}",
                            color = greenColor,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            // ── Título de la lista ────────────────────────────────
            item {
                Text(
                    text = "Ventas recientes",
                    color = subtextColor,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium
                )
            }

            // ── Lista de ventas ───────────────────────────────────
            // `items(lista)` = itera la lista y llama al bloque por cada elemento.
            // Compose solo renderiza los que están en pantalla (lazy).
            items(sales) { sale ->
                SaleItem(
                    sale = sale,
                    cardBg = cardBg,
                    textColor = textColor,
                    subtextColor = subtextColor,
                    accentColor = accentColor,
                    greenColor = greenColor
                )
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────
//  Componente: Tarjeta de estadística (KPI)
// ─────────────────────────────────────────────────────────────

/**
 * Tarjeta pequeña para mostrar un número clave.
 * Se usa en la fila de KPIs del dashboard.
 *
 * Es un @Composable reutilizable — la misma tarjeta sirve para
 * Ingresos, Ventas y Ticket promedio, solo cambian los parámetros.
 */
@Composable
fun StatCard(
    modifier: Modifier = Modifier,
    label: String,
    value: String,
    icon: String,
    cardBg: Color,
    textColor: Color,
    valueColor: Color
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = cardBg)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(text = icon, fontSize = 24.sp)
            Text(
                text = value,
                color = valueColor,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = label,
                color = textColor.copy(alpha = 0.7f),
                fontSize = 11.sp
            )
        }
    }
}

// ─────────────────────────────────────────────────────────────
//  Componente: Fila de venta individual
// ─────────────────────────────────────────────────────────────

/**
 * Fila de la lista "Ventas recientes".
 * Muestra: icono del método de pago | producto | hora | monto
 */
@Composable
fun SaleItem(
    sale: RecentSale,
    cardBg: Color,
    textColor: Color,
    subtextColor: Color,
    accentColor: Color,
    greenColor: Color
) {
    // Ícono según el método de pago
    val paymentIcon = when (sale.paymentMethod) {
        "CARD"   -> "💳"
        "CASH"   -> "💵"
        "DEBIT"  -> "💳"
        "CREDIT" -> "💳"
        else     -> "💰"
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = cardBg)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {

            // Ícono + datos de la venta
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Círculo con el ícono del método de pago
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .background(
                            color = accentColor.copy(alpha = 0.15f),
                            shape = RoundedCornerShape(10.dp)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(text = paymentIcon, fontSize = 18.sp)
                }

                Column {
                    Text(
                        text = sale.product,
                        color = textColor,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium
                    )
                    Text(
                        text = "${sale.time} · ${sale.paymentMethod}",
                        color = subtextColor,
                        fontSize = 12.sp
                    )
                }
            }

            // Monto de la venta
            Text(
                text = "$${String.format("%.2f", sale.amount)}",
                color = greenColor,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}
