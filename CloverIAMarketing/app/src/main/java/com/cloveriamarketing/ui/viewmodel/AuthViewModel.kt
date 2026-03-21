package com.cloveriamarketing.ui.viewmodel

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cloveriamarketing.data.remote.UserDto
import com.cloveriamarketing.data.repository.AuthRepository
import kotlinx.coroutines.launch

/**
 * AuthViewModel — maneja el estado de la pantalla de Login.
 *
 * ¿Qué es un ViewModel?
 * Es una clase que SOBREVIVE a las rotaciones de pantalla.
 * Sin ViewModel, si el usuario rota el celular durante un login,
 * se pierde el estado (isLoading, errorMessage, etc.).
 *
 * ¿Qué es viewModelScope?
 * Es un ámbito de coroutines atado al ViewModel.
 * Cuando la pantalla se destruye, todas las coroutines se cancelan automáticamente.
 * Así evitamos memory leaks y llamadas HTTP que ya no necesitamos.
 *
 * Flujo de datos (MVVM unidireccional):
 * ┌─────────────────────────────────────────────────────────┐
 * │  LoginScreen observa → AuthViewModel.uiState            │
 * │  Usuario toca "Ingresar" → AuthViewModel.login()        │
 * │  AuthViewModel llama → AuthRepository.login()           │
 * │  AuthRepository llama → ApiService → Backend            │
 * │  Resultado actualiza → AuthViewModel.uiState            │
 * │  Compose re-dibuja → LoginScreen muestra resultado      │
 * └─────────────────────────────────────────────────────────┘
 */

/** Representa los posibles estados de la pantalla de Login */
sealed class AuthUiState {
    /** Estado inicial — esperando que el usuario escriba */
    object Idle : AuthUiState()

    /** Llamada HTTP en curso — mostrar spinner */
    object Loading : AuthUiState()

    /** Login exitoso — navegar al Dashboard */
    data class Success(val user: UserDto) : AuthUiState()

    /** Error — mostrar mensaje en rojo */
    data class Error(val message: String) : AuthUiState()
}

class AuthViewModel : ViewModel() {

    private val repository = AuthRepository()

    // Estado observable por la UI.
    // `mutableStateOf` = cada vez que cambia, Compose re-dibuja los componentes que lo leen.
    var uiState: AuthUiState by mutableStateOf(AuthUiState.Idle)
        private set  // Solo el ViewModel puede modificarlo (la UI solo lee)

    /**
     * Intenta hacer login con email y contraseña.
     *
     * Esta función:
     * 1. Valida que los campos no estén vacíos
     * 2. Cambia el estado a Loading (la UI muestra spinner)
     * 3. Llama al backend con AuthRepository
     * 4. Si sale bien → Success (la UI navega al Dashboard)
     * 5. Si falla → Error (la UI muestra el mensaje)
     */
    fun login(email: String, password: String) {
        // Validación local antes de llamar al backend
        if (email.isBlank() || password.isBlank()) {
            uiState = AuthUiState.Error("Completá email y contraseña")
            return
        }

        // viewModelScope.launch = ejecutar en background sin bloquear la UI
        viewModelScope.launch {
            uiState = AuthUiState.Loading

            val result = repository.login(email, password)

            uiState = result.fold(
                onSuccess = { user -> AuthUiState.Success(user) },
                onFailure = { error -> AuthUiState.Error(error.message ?: "Error desconocido") }
            )
        }
    }

    /**
     * Intenta registrar un nuevo usuario y hacer login automáticamente.
     */
    fun register(storeName: String, email: String, password: String) {
        if (storeName.isBlank() || email.isBlank() || password.isBlank()) {
            uiState = AuthUiState.Error("Completá todos los campos")
            return
        }

        viewModelScope.launch {
            uiState = AuthUiState.Loading

            val result = repository.register(storeName, email, password)

            uiState = result.fold(
                onSuccess = { user -> AuthUiState.Success(user) },
                onFailure = { error -> AuthUiState.Error(error.message ?: "Error desconocido") }
            )
        }
    }

    /** Resetea el estado a Idle (útil después de mostrar un error) */
    fun resetState() {
        uiState = AuthUiState.Idle
    }
}
