package com.cloveriamarketing.ui.viewmodel

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cloveriamarketing.data.remote.CartSuggestionDto
import com.cloveriamarketing.data.remote.ProductDto
import com.cloveriamarketing.data.repository.DashboardRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

sealed class CheckoutCatalogState {
    object Loading : CheckoutCatalogState()
    data class Success(val products: List<ProductDto>) : CheckoutCatalogState()
    data class Error(val message: String) : CheckoutCatalogState()
}

sealed class SuggestionState {
    object Idle : SuggestionState()
    object Loading : SuggestionState()
    data class Success(val suggestions: List<CartSuggestionDto>, val basedOnSales: Int) : SuggestionState()
    data class Empty(val basedOnSales: Int) : SuggestionState()
    data class Error(val message: String) : SuggestionState()
}

class CheckoutAssistantViewModel : ViewModel() {

    private val repo = DashboardRepository()

    var catalogState: CheckoutCatalogState by mutableStateOf(CheckoutCatalogState.Loading)
        private set

    val cart = mutableStateListOf<ProductDto>()

    var suggestionState: SuggestionState by mutableStateOf<SuggestionState>(SuggestionState.Idle)
        private set

    private var pendingJob: Job? = null

    fun loadCatalog() {
        viewModelScope.launch {
            catalogState = CheckoutCatalogState.Loading
            val result = repo.getProducts()
            catalogState = result.fold(
                onSuccess = { CheckoutCatalogState.Success(it) },
                onFailure = { CheckoutCatalogState.Error(it.message ?: "Error cargando productos") }
            )
        }
    }

    fun addToCart(product: ProductDto) {
        if (cart.any { it.id == product.id }) return
        cart.add(product)
        scheduleRefresh()
    }

    fun removeFromCart(product: ProductDto) {
        cart.removeAll { it.id == product.id }
        scheduleRefresh()
    }

    fun clearCart() {
        cart.clear()
        suggestionState = SuggestionState.Idle
        pendingJob?.cancel()
    }

    private fun scheduleRefresh() {
        pendingJob?.cancel()
        if (cart.isEmpty()) {
            suggestionState = SuggestionState.Idle
            return
        }
        pendingJob = viewModelScope.launch {
            delay(250)  // debounce — no consultamos en cada tap
            suggestionState = SuggestionState.Loading
            val result = repo.getCartSuggestions(cart.map { it.id })
            suggestionState = result.fold(
                onSuccess = { resp ->
                    if (resp.suggestions.isEmpty()) {
                        SuggestionState.Empty(resp.basedOnSales)
                    } else {
                        SuggestionState.Success(resp.suggestions, resp.basedOnSales)
                    }
                },
                onFailure = { SuggestionState.Error(it.message ?: "Sin sugerencias") }
            )
        }
    }
}
