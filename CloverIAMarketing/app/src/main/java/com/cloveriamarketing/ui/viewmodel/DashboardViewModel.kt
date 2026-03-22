package com.cloveriamarketing.ui.viewmodel

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cloveriamarketing.data.remote.*
import com.cloveriamarketing.data.repository.AuthRepository
import com.cloveriamarketing.data.repository.DashboardRepository
import kotlinx.coroutines.launch

/**
 * DashboardViewModel — maneja el estado del panel principal.
 *
 * Carga los datos del backend cuando la pantalla se abre y los expone
 * como estado reactivo que Compose observa automáticamente.
 *
 * Flujo:
 * ┌──────────────────────────────────────────────────────────────┐
 * │  DashboardScreen se muestra                                  │
 * │    ↓ LaunchedEffect llama viewModel.loadDashboard()          │
 * │  DashboardViewModel.uiState = Loading                        │
 * │    ↓ Compose muestra spinner                                 │
 * │  DashboardRepository llama GET /dashboard/summary             │
 * │  DashboardRepository llama GET /sales/                        │
 * │    ↓ ambas respuestas llegan                                 │
 * │  DashboardViewModel.uiState = Success(dashboard, sales)      │
 * │    ↓ Compose re-dibuja con datos reales                      │
 * │  DashboardScreen muestra KPIs, productos, ventas reales      │
 * └──────────────────────────────────────────────────────────────┘
 */

/** Estados posibles del Dashboard */
sealed class DashboardUiState {
    object Loading : DashboardUiState()
    data class Success(
        val storeName: String,
        val dashboard: DashboardDto,
        val recentSales: List<SaleDto>
    ) : DashboardUiState()
    data class Error(val message: String) : DashboardUiState()
}

class DashboardViewModel : ViewModel() {

    private val dashboardRepo = DashboardRepository()
    private val authRepo = AuthRepository()

    var uiState: DashboardUiState by mutableStateOf(DashboardUiState.Loading)
        private set

    // Período seleccionado actualmente ("today", "week", "month", "year")
    var selectedPeriod: String by mutableStateOf("month")
        private set

    /**
     * Carga todos los datos del dashboard.
     *
     * Hace dos llamadas en paralelo:
     * 1. GET /dashboard/summary → KPIs, top productos, timeline
     * 2. GET /sales/ → lista de ventas recientes
     *
     * Si alguna falla, muestra el error.
     */
    fun loadDashboard(period: String = selectedPeriod) {
        selectedPeriod = period

        viewModelScope.launch {
            uiState = DashboardUiState.Loading

            // Obtener nombre de tienda desde almacenamiento local
            val storeName = authRepo.getStoreName()

            // Llamada al dashboard
            val dashboardResult = dashboardRepo.getDashboardSummary(period)

            if (dashboardResult.isFailure) {
                uiState = DashboardUiState.Error(
                    dashboardResult.exceptionOrNull()?.message ?: "Error cargando dashboard"
                )
                return@launch
            }

            // Llamada a ventas recientes
            val salesResult = dashboardRepo.getRecentSales(limit = 20)

            val dashboard = dashboardResult.getOrThrow()
            val sales = salesResult.getOrDefault(emptyList())

            uiState = DashboardUiState.Success(
                storeName = storeName,
                dashboard = dashboard,
                recentSales = sales
            )
        }
    }

    /**
     * Cambia el período y recarga los datos.
     */
    fun changePeriod(period: String) {
        loadDashboard(period)
    }

    /**
     * Cierra sesión: borra token y datos del usuario.
     */
    fun logout(onComplete: () -> Unit) {
        viewModelScope.launch {
            authRepo.logout()
            onComplete()
        }
    }
}
