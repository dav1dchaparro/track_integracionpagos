package com.cloveriamarketing.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.cloveriamarketing.data.remote.CartSuggestionDto
import com.cloveriamarketing.data.remote.ProductDto
import com.cloveriamarketing.ui.viewmodel.CheckoutAssistantViewModel
import com.cloveriamarketing.ui.viewmodel.CheckoutCatalogState
import com.cloveriamarketing.ui.viewmodel.SuggestionState

/**
 * Asistente de Checkout — pantalla exclusiva del terminal Clover.
 *
 * Mientras el cajero arma el carrito, esta pantalla pide al backend
 * sugerencias de cross-sell basadas en el market basket analysis del
 * propio comercio (últimos 90 días de ventas).
 *
 * Justificación de existencia (vs el dashboard web del dueño):
 *  - Acá sí hay un "carrito en vivo" que el dashboard web no tiene.
 *  - El cajero ejecuta la recomendación en el momento del cobro.
 *  - Este es el único punto donde el insight se convierte en venta.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CheckoutAssistantScreen(
    onBack: () -> Unit,
    viewModel: CheckoutAssistantViewModel = viewModel()
) {
    val darkBg = Color(0xFF0F172A)
    val cardBg = Color(0xFF1E293B)
    val accentColor = Color(0xFF6366F1)
    val textColor = Color(0xFFF1F5F9)
    val subtextColor = Color(0xFF94A3B8)
    val greenColor = Color(0xFF22C55E)
    val warnColor = Color(0xFFF59E0B)

    LaunchedEffect(Unit) { viewModel.loadCatalog() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            "🛒 Asistente de Checkout",
                            color = textColor,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                        Text(
                            "Sugerencias en vivo del terminal Clover",
                            color = subtextColor,
                            fontSize = 11.sp
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Volver", tint = subtextColor)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = cardBg)
            )
        },
        containerColor = darkBg
    ) { padding ->

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            contentPadding = PaddingValues(vertical = 16.dp)
        ) {

            item {
                CartHeader(
                    cart = viewModel.cart.toList(),
                    onRemove = { viewModel.removeFromCart(it) },
                    onClear = { viewModel.clearCart() },
                    cardBg = cardBg,
                    textColor = textColor,
                    subtextColor = subtextColor,
                    accentColor = accentColor,
                    greenColor = greenColor
                )
            }

            item {
                SuggestionsBlock(
                    state = viewModel.suggestionState,
                    onAdd = { suggestion ->
                        val catalog = viewModel.catalogState
                        if (catalog is CheckoutCatalogState.Success) {
                            catalog.products.firstOrNull { it.id == suggestion.productId }?.let { viewModel.addToCart(it) }
                        }
                    },
                    cardBg = cardBg,
                    textColor = textColor,
                    subtextColor = subtextColor,
                    accentColor = accentColor,
                    greenColor = greenColor,
                    warnColor = warnColor
                )
            }

            item {
                Text(
                    "Catálogo",
                    color = subtextColor,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium
                )
            }

            when (val state = viewModel.catalogState) {
                is CheckoutCatalogState.Loading -> {
                    item {
                        Box(modifier = Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(color = accentColor)
                        }
                    }
                }
                is CheckoutCatalogState.Error -> {
                    item {
                        Text(
                            text = state.message,
                            color = Color(0xFFEF4444),
                            fontSize = 13.sp,
                            modifier = Modifier.padding(16.dp)
                        )
                    }
                }
                is CheckoutCatalogState.Success -> {
                    val inCart = viewModel.cart.map { it.id }.toSet()
                    items(state.products) { product ->
                        ProductRow(
                            product = product,
                            inCart = product.id in inCart,
                            onClick = {
                                if (product.id in inCart) viewModel.removeFromCart(product)
                                else viewModel.addToCart(product)
                            },
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
    }
}

@Composable
private fun CartHeader(
    cart: List<ProductDto>,
    onRemove: (ProductDto) -> Unit,
    onClear: () -> Unit,
    cardBg: Color,
    textColor: Color,
    subtextColor: Color,
    accentColor: Color,
    greenColor: Color
) {
    val total = cart.sumOf { it.price }
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
                Column {
                    Text("Carrito actual", color = subtextColor, fontSize = 12.sp)
                    Text(
                        text = if (cart.isEmpty()) "Vacío" else "${cart.size} producto${if (cart.size == 1) "" else "s"}",
                        color = textColor,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text("$${String.format("%.2f", total)}", color = greenColor, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                    if (cart.isNotEmpty()) {
                        Text(
                            "Vaciar",
                            color = subtextColor,
                            fontSize = 11.sp,
                            modifier = Modifier.clickable { onClear() }
                        )
                    }
                }
            }
            if (cart.isNotEmpty()) {
                Spacer(modifier = Modifier.height(10.dp))
                cart.forEach { item ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("• ${item.name}", color = textColor.copy(alpha = 0.85f), fontSize = 13.sp)
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("$${String.format("%.2f", item.price)}", color = subtextColor, fontSize = 12.sp)
                            Spacer(modifier = Modifier.width(8.dp))
                            IconButton(onClick = { onRemove(item) }, modifier = Modifier.size(20.dp)) {
                                Icon(Icons.Default.Close, contentDescription = "Quitar", tint = subtextColor, modifier = Modifier.size(14.dp))
                            }
                        }
                    }
                }
            } else {
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    "Tocá un producto del catálogo para empezar.",
                    color = subtextColor,
                    fontSize = 12.sp
                )
            }
        }
    }
}

@Composable
private fun SuggestionsBlock(
    state: SuggestionState,
    onAdd: (CartSuggestionDto) -> Unit,
    cardBg: Color,
    textColor: Color,
    subtextColor: Color,
    accentColor: Color,
    greenColor: Color,
    warnColor: Color
) {
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
                Text("Qué más ofrecerle al cliente", color = accentColor, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            }
            Spacer(modifier = Modifier.height(10.dp))
            when (state) {
                SuggestionState.Idle -> {
                    Text(
                        "Sumá lo que ya pidió el cliente y te decimos qué suele llevar la gente junto con eso.",
                        color = subtextColor,
                        fontSize = 12.sp,
                        lineHeight = 18.sp
                    )
                }
                SuggestionState.Loading -> {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        CircularProgressIndicator(color = accentColor, modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                        Text("Mirando qué se suele llevar junto...", color = subtextColor, fontSize = 12.sp)
                    }
                }
                is SuggestionState.Empty -> {
                    Text(
                        text = if (state.basedOnSales == 0)
                            "Todavía no tenemos suficientes ventas para sugerirte combos. Vendé un poco más y empezás a ver recomendaciones acá."
                        else
                            "Mirando tus últimas ${state.basedOnSales} ventas no encontramos un producto que se lleve junto con este carrito.",
                        color = subtextColor,
                        fontSize = 12.sp,
                        lineHeight = 18.sp
                    )
                }
                is SuggestionState.Error -> {
                    Text(state.message, color = Color(0xFFEF4444), fontSize = 12.sp)
                }
                is SuggestionState.Success -> {
                    state.suggestions.forEach { sugg ->
                        SuggestionCard(
                            sugg = sugg,
                            onAdd = { onAdd(sugg) },
                            textColor = textColor,
                            subtextColor = subtextColor,
                            accentColor = accentColor,
                            greenColor = greenColor,
                            warnColor = warnColor
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                    Text(
                        "Lo aprendimos mirando tus últimas ${state.basedOnSales} ventas.",
                        color = subtextColor.copy(alpha = 0.6f),
                        fontSize = 10.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun SuggestionCard(
    sugg: CartSuggestionDto,
    onAdd: () -> Unit,
    textColor: Color,
    subtextColor: Color,
    accentColor: Color,
    greenColor: Color,
    warnColor: Color
) {
    val badge = when {
        sugg.lift >= 2.0 -> "🔥 Casi siempre"
        sugg.lift >= 1.5 -> "⭐ Muchas veces"
        else -> "💡 A veces"
    }
    val badgeColor = when {
        sugg.lift >= 2.0 -> warnColor
        sugg.lift >= 1.5 -> accentColor
        else -> subtextColor
    }
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, accentColor.copy(alpha = 0.25f), RoundedCornerShape(12.dp))
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(sugg.productName, color = textColor, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                Box(
                    modifier = Modifier
                        .background(badgeColor.copy(alpha = 0.15f), RoundedCornerShape(6.dp))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(badge, color = badgeColor, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(sugg.reason, color = subtextColor, fontSize = 11.sp, lineHeight = 16.sp)
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                "$${String.format("%.2f", sugg.price)}",
                color = greenColor,
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium
            )
        }
        Spacer(modifier = Modifier.width(10.dp))
        FilledIconButton(
            onClick = onAdd,
            colors = IconButtonDefaults.filledIconButtonColors(containerColor = accentColor)
        ) {
            Icon(Icons.Default.Add, contentDescription = "Agregar al carrito", tint = Color.White)
        }
    }
}

@Composable
private fun ProductRow(
    product: ProductDto,
    inCart: Boolean,
    onClick: () -> Unit,
    cardBg: Color,
    textColor: Color,
    subtextColor: Color,
    accentColor: Color,
    greenColor: Color
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (inCart) accentColor.copy(alpha = 0.15f) else cardBg
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(product.name, color = textColor, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                Text("$${String.format("%.2f", product.price)}", color = greenColor, fontSize = 12.sp)
            }
            if (inCart) {
                Text("En carrito", color = accentColor, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            } else {
                Icon(Icons.Default.Add, contentDescription = "Agregar", tint = subtextColor)
            }
        }
    }
}
