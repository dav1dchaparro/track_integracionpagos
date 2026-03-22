package com.cloveriamarketing.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.cloveriamarketing.data.remote.AlertDto
import com.cloveriamarketing.data.remote.DashboardDto
import com.cloveriamarketing.data.remote.SaleDto
import com.cloveriamarketing.ui.viewmodel.DashboardUiState
import com.cloveriamarketing.ui.viewmodel.DashboardViewModel

/**
 * Pantalla principal del Dashboard — conectada al backend real.
 *
 * Ya NO usa FakeData. Los datos vienen de:
 * - GET /dashboard/summary → KPIs, top productos, métodos de pago
 * - GET /sales/ → lista de ventas recientes
 *
 * Flujo:
 * 1. La pantalla se muestra → LaunchedEffect llama viewModel.loadDashboard()
 * 2. DashboardViewModel hace las requests HTTP en background
 * 3. Cuando llegan los datos → uiState cambia a Success
 * 4. Compose re-dibuja automáticamente con los datos reales
 *
 * @param onLogout Función que NavGraph usa para volver al Login
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onLogout: () -> Unit,
    dashboardViewModel: DashboardViewModel = viewModel()
) {
    // ── Colores ─────────────────────────────────────────────────
    val darkBg = Color(0xFF0F172A)
    val cardBg = Color(0xFF1E293B)
    val accentColor = Color(0xFF6366F1)
    val textColor = Color(0xFFF1F5F9)
    val subtextColor = Color(0xFF94A3B8)
    val greenColor = Color(0xFF22C55E)

    // ── Cargar datos al entrar a la pantalla ────────────────────
    // LaunchedEffect(Unit) = se ejecuta UNA vez cuando la pantalla se muestra
    LaunchedEffect(Unit) {
        dashboardViewModel.loadDashboard()
    }

    val uiState = dashboardViewModel.uiState

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    val title = when (uiState) {
                        is DashboardUiState.Success -> "📊 ${uiState.storeName}"
                        else -> "📊 CloverIA Marketing"
                    }
                    Text(text = title, color = textColor, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                },
                actions = {
                    // Botón refrescar datos
                    IconButton(onClick = { dashboardViewModel.loadDashboard() }) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Actualizar",
                            tint = subtextColor
                        )
                    }
                    // Botón logout
                    IconButton(onClick = {
                        dashboardViewModel.logout { onLogout() }
                    }) {
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

        when (uiState) {
            // ── Estado Loading: spinner centrado ─────────────────
            is DashboardUiState.Loading -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        CircularProgressIndicator(color = accentColor)
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("Cargando datos del backend...", color = subtextColor)
                    }
                }
            }

            // ── Estado Error: mensaje + botón reintentar ────────
            is DashboardUiState.Error -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("⚠️", fontSize = 48.sp)
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = uiState.message,
                            color = Color(0xFFEF4444),
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(horizontal = 32.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(
                            onClick = { dashboardViewModel.loadDashboard() },
                            colors = ButtonDefaults.buttonColors(containerColor = accentColor)
                        ) {
                            Text("Reintentar", color = Color.White)
                        }
                    }
                }
            }

            // ── Estado Success: datos reales del backend ────────
            is DashboardUiState.Success -> {
                DashboardContent(
                    dashboard = uiState.dashboard,
                    recentSales = uiState.recentSales,
                    selectedPeriod = dashboardViewModel.selectedPeriod,
                    onPeriodChange = { dashboardViewModel.changePeriod(it) },
                    paddingValues = paddingValues,
                    cardBg = cardBg,
                    textColor = textColor,
                    subtextColor = subtextColor,
                    accentColor = accentColor,
                    greenColor = greenColor,
                    briefing = uiState.briefing,
                    alerts = uiState.alerts,
                    monthlyGoal = uiState.monthlyGoal
                )
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════
//  Contenido del Dashboard cuando los datos cargaron
// ═══════════════════════════════════════════════════════════════

@Composable
private fun DashboardContent(
    dashboard: DashboardDto,
    recentSales: List<SaleDto>,
    selectedPeriod: String,
    onPeriodChange: (String) -> Unit,
    paddingValues: PaddingValues,
    cardBg: Color,
    textColor: Color,
    subtextColor: Color,
    accentColor: Color,
    greenColor: Color,
    briefing: String? = null,
    alerts: List<AlertDto> = emptyList(),
    monthlyGoal: Double? = null
) {
    val kpis = dashboard.kpis
    val changes = dashboard.kpiChanges
    val warnColor = Color(0xFFF59E0B)
    val dangerColor = Color(0xFFEF4444)
    val infoColor = Color(0xFF3B82F6)

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(paddingValues)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        contentPadding = PaddingValues(vertical = 16.dp)
    ) {

        // ── Alertas inteligentes ──────────────────────────────────
        if (alerts.isNotEmpty()) {
            items(alerts.size) { idx ->
                val alert = alerts[idx]
                val (bgColor, dotColor) = when (alert.level) {
                    "success" -> Pair(greenColor.copy(alpha = 0.1f), greenColor)
                    "warning" -> Pair(warnColor.copy(alpha = 0.1f), warnColor)
                    "info" -> Pair(infoColor.copy(alpha = 0.1f), infoColor)
                    else -> Pair(subtextColor.copy(alpha = 0.1f), subtextColor)
                }
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = bgColor)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.Top,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .padding(top = 4.dp)
                                .size(8.dp)
                                .background(dotColor, RoundedCornerShape(4.dp))
                        )
                        Column {
                            Text(
                                text = alert.title,
                                color = dotColor,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = alert.message,
                                color = textColor.copy(alpha = 0.8f),
                                fontSize = 12.sp
                            )
                        }
                    }
                }
            }
        }

        // ── Briefing del día ──────────────────────────────────────
        if (!briefing.isNullOrBlank()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = cardBg)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text("🤖", fontSize = 18.sp)
                            Text(
                                "Briefing del día",
                                color = greenColor,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                "IA · Groq",
                                color = subtextColor.copy(alpha = 0.5f),
                                fontSize = 10.sp
                            )
                        }
                        Spacer(modifier = Modifier.height(10.dp))
                        Text(
                            text = briefing,
                            color = textColor.copy(alpha = 0.9f),
                            fontSize = 13.sp,
                            lineHeight = 20.sp
                        )
                    }
                }
            }
        }

        // ── Meta mensual ──────────────────────────────────────────
        if (monthlyGoal != null && monthlyGoal > 0) {
            item {
                val pct = (kpis.totalRevenue / monthlyGoal).coerceAtMost(1.0)
                val pctText = "${(pct * 100).toInt()}%"
                val barColor = when {
                    pct >= 1.0 -> greenColor
                    pct >= 0.75 -> warnColor
                    else -> accentColor
                }
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = cardBg)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("🎯 Meta mensual", color = subtextColor, fontSize = 12.sp)
                            Text(
                                text = pctText,
                                color = barColor,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(8.dp)
                                .background(
                                    color = subtextColor.copy(alpha = 0.15f),
                                    shape = RoundedCornerShape(4.dp)
                                )
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth(pct.toFloat())
                                    .height(8.dp)
                                    .background(
                                        color = barColor,
                                        shape = RoundedCornerShape(4.dp)
                                    )
                            )
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                "$${String.format("%.0f", kpis.totalRevenue)}",
                                color = subtextColor,
                                fontSize = 11.sp
                            )
                            Text(
                                "$${String.format("%.0f", monthlyGoal)}",
                                color = textColor,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }

        // ── Selector de período ─────────────────────────────────
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf("today" to "Hoy", "week" to "Semana", "month" to "Mes", "year" to "Año").forEach { (key, label) ->
                    FilterChip(
                        selected = selectedPeriod == key,
                        onClick = { onPeriodChange(key) },
                        label = { Text(label, fontSize = 12.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = accentColor,
                            selectedLabelColor = Color.White,
                            containerColor = cardBg,
                            labelColor = subtextColor
                        )
                    )
                }
            }
        }

        // ── KPIs principales (con % cambio) ──────────────────────
        item {
            Text("Resumen del período", color = subtextColor, fontSize = 13.sp, fontWeight = FontWeight.Medium)
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                KpiCardWithChange(
                    modifier = Modifier.weight(1f),
                    label = "Ingresos",
                    value = "$${String.format("%.0f", kpis.totalRevenue)}",
                    icon = "💰",
                    change = changes?.totalRevenue,
                    cardBg = cardBg,
                    textColor = textColor,
                    valueColor = greenColor,
                    greenColor = greenColor,
                    dangerColor = dangerColor
                )
                KpiCardWithChange(
                    modifier = Modifier.weight(1f),
                    label = "Ventas",
                    value = "${kpis.totalOrders}",
                    icon = "🛒",
                    change = changes?.totalOrders,
                    cardBg = cardBg,
                    textColor = textColor,
                    valueColor = accentColor,
                    greenColor = greenColor,
                    dangerColor = dangerColor
                )
                KpiCardWithChange(
                    modifier = Modifier.weight(1f),
                    label = "Ticket",
                    value = "$${String.format("%.0f", kpis.avgTicket)}",
                    icon = "🎫",
                    change = changes?.avgTicket,
                    cardBg = cardBg,
                    textColor = textColor,
                    valueColor = warnColor,
                    greenColor = greenColor,
                    dangerColor = dangerColor
                )
            }
        }

        // ── KPIs de clientes ──────────────────────────────────────
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                StatCard(
                    modifier = Modifier.weight(1f),
                    label = "Clientes",
                    value = "${kpis.uniqueCustomers ?: 0}",
                    icon = "👥",
                    cardBg = cardBg,
                    textColor = textColor,
                    valueColor = Color(0xFFEC4899)
                )
                StatCard(
                    modifier = Modifier.weight(1f),
                    label = "Retorno",
                    value = "${kpis.returnRate ?: 0}%",
                    icon = "🔄",
                    cardBg = cardBg,
                    textColor = textColor,
                    valueColor = warnColor
                )
                StatCard(
                    modifier = Modifier.weight(1f),
                    label = "Productos",
                    value = "${kpis.totalProducts}",
                    icon = "📦",
                    cardBg = cardBg,
                    textColor = textColor,
                    valueColor = infoColor
                )
            }
        }

        // ── Producto estrella ───────────────────────────────────
        if (dashboard.topProducts.isNotEmpty()) {
            val topProduct = dashboard.topProducts.first()
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
                            Text("⭐ Producto estrella", color = subtextColor, fontSize = 12.sp)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = topProduct.name,
                                color = textColor,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                            Text(
                                text = "${topProduct.units} unidades vendidas",
                                color = subtextColor,
                                fontSize = 12.sp
                            )
                        }
                        Text(
                            text = "$${String.format("%.0f", topProduct.revenue)}",
                            color = greenColor,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        // ── Métodos de pago ─────────────────────────────────────
        if (dashboard.paymentMethods.isNotEmpty()) {
            item {
                Text("Métodos de pago", color = subtextColor, fontSize = 13.sp, fontWeight = FontWeight.Medium)
            }
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = cardBg)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        dashboard.paymentMethods.forEach { (method, detail) ->
                            val icon = when (method) {
                                "card" -> "💳"
                                "qr" -> "📱"
                                else -> "💰"
                            }
                            val label = when (method) {
                                "card" -> "Tarjeta"
                                "qr" -> "QR"
                                else -> method.uppercase()
                            }
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 6.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("$icon $label (${detail.count})", color = textColor, fontSize = 14.sp)
                                Text(
                                    "$${String.format("%.2f", detail.total)}",
                                    color = greenColor,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    }
                }
            }
        }

        // ── Ventas recientes ────────────────────────────────────
        if (recentSales.isNotEmpty()) {
            item {
                Text("Ventas recientes", color = subtextColor, fontSize = 13.sp, fontWeight = FontWeight.Medium)
            }

            items(recentSales) { sale ->
                SaleItemCard(
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

// ═══════════════════════════════════════════════════════════════
//  Componente: Tarjeta KPI
// ═══════════════════════════════════════════════════════════════

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
            Text(text = value, color = valueColor, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            Text(text = label, color = textColor.copy(alpha = 0.7f), fontSize = 11.sp)
        }
    }
}

// ═══════════════════════════════════════════════════════════════
//  Componente: Tarjeta KPI con % de cambio
// ═══════════════════════════════════════════════════════════════

@Composable
fun KpiCardWithChange(
    modifier: Modifier = Modifier,
    label: String,
    value: String,
    icon: String,
    change: Double?,
    cardBg: Color,
    textColor: Color,
    valueColor: Color,
    greenColor: Color,
    dangerColor: Color
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
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(text = icon, fontSize = 24.sp)
            Text(text = value, color = valueColor, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            Text(text = label, color = textColor.copy(alpha = 0.7f), fontSize = 11.sp)
            if (change != null) {
                val arrow = if (change >= 0) "↑" else "↓"
                val color = if (change >= 0) greenColor else dangerColor
                Text(
                    text = "$arrow ${String.format("%.1f", kotlin.math.abs(change))}%",
                    color = color,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════
//  Componente: Fila de venta (usando SaleDto real del backend)
// ═══════════════════════════════════════════════════════════════

@Composable
fun SaleItemCard(
    sale: SaleDto,
    cardBg: Color,
    textColor: Color,
    subtextColor: Color,
    accentColor: Color,
    greenColor: Color
) {
    val paymentIcon = when (sale.paymentMethod) {
        "card" -> "💳"
        "qr" -> "📱"
        else -> "💰"
    }

    val paymentLabel = when (sale.paymentMethod) {
        "card" -> sale.cardBrand?.uppercase() ?: "TARJETA"
        "qr" -> "QR"
        else -> sale.paymentMethod.uppercase()
    }

    // Extraer hora de la fecha ISO (ej: "2026-03-21T14:30:00" → "14:30")
    val time = try {
        sale.soldAt.substring(11, 16)
    } catch (e: Exception) {
        ""
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
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
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
                        text = "#${sale.invoiceNumber}",
                        color = textColor,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium
                    )
                    Text(
                        text = "$time · $paymentLabel · ${sale.items.size} items",
                        color = subtextColor,
                        fontSize = 12.sp
                    )
                }
            }
            Text(
                text = "$${String.format("%.2f", sale.total)}",
                color = greenColor,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}
