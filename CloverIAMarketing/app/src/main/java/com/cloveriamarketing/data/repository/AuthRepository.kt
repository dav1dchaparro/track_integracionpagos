package com.cloveriamarketing.data.repository

import com.cloveriamarketing.data.remote.*

/**
 * AuthRepository — maneja toda la lógica de autenticación.
 *
 * ¿Por qué un Repository?
 * En la arquitectura MVVM, el Repository es la ÚNICA fuente de datos.
 * El ViewModel no sabe si los datos vienen de la API, de una base local o de caché.
 * Esto permite cambiar la fuente de datos sin tocar la UI.
 *
 * ┌────────────────────────────────────────────────┐
 * │  LoginScreen (UI)                              │
 * │    ↓ usuario escribe email + contraseña        │
 * │  AuthViewModel                                 │
 * │    ↓ llama authRepository.login(email, pass)   │
 * │  AuthRepository ← estás acá                    │
 * │    ↓ llama apiService.login(request)           │
 * │  ApiService → Retrofit → HTTP → Backend        │
 * │    ↓ respuesta                                 │
 * │  AuthRepository guarda token en TokenManager   │
 * │    ↓ devuelve Result<UserDto>                  │
 * │  AuthViewModel actualiza el estado             │
 * │    ↓ Compose re-dibuja                         │
 * │  LoginScreen navega al Dashboard               │
 * └────────────────────────────────────────────────┘
 *
 * Todas las funciones devuelven Result<T>:
 * - Result.success(valor) si todo salió bien
 * - Result.failure(exception) si hubo error
 * Esto permite que el ViewModel maneje errores sin try/catch en la UI.
 */
class AuthRepository {

    private val api: ApiService = RetrofitClient.getApi()
    private val tokenManager: TokenManager = RetrofitClient.getTokenManager()

    /**
     * Inicia sesión con email y contraseña.
     *
     * Flujo:
     * 1. POST /auth/login con las credenciales
     * 2. Si responde 200 → guarda el JWT token en DataStore
     * 3. GET /auth/me para obtener datos del usuario
     * 4. Guarda nombre de tienda y email en DataStore
     * 5. Devuelve Result.success(UserDto)
     *
     * Si falla → devuelve Result.failure con el mensaje de error
     */
    suspend fun login(email: String, password: String): Result<UserDto> {
        return try {
            // Paso 1: Pedir token al backend
            val tokenResponse = api.login(LoginRequest(email, password))

            if (!tokenResponse.isSuccessful) {
                // El backend rechazó las credenciales (401, 422, etc.)
                return Result.failure(
                    Exception("Error ${tokenResponse.code()}: Credenciales incorrectas")
                )
            }

            val token = tokenResponse.body()
                ?: return Result.failure(Exception("Respuesta vacía del servidor"))

            // Paso 2: Guardar el token en almacenamiento seguro
            tokenManager.saveToken(token.accessToken)

            // Paso 3: Obtener datos del usuario con el token recién guardado
            val userResponse = api.getCurrentUser()

            if (userResponse.isSuccessful && userResponse.body() != null) {
                val user = userResponse.body()!!
                // Paso 4: Guardar info del usuario para uso offline
                tokenManager.saveUserInfo(user.email, user.storeName)
                Result.success(user)
            } else {
                // El token funciona pero no se pudo obtener el usuario
                // (raro, pero manejamos el caso)
                Result.success(UserDto(
                    id = "",
                    storeName = "Mi Comercio",
                    email = email,
                    createdAt = ""
                ))
            }
        } catch (e: Exception) {
            // Error de red (sin internet, timeout, servidor caído)
            Result.failure(Exception("Sin conexión al servidor: ${e.message}"))
        }
    }

    /**
     * Registra un nuevo usuario/comercio.
     *
     * Después del registro exitoso, llama a login() automáticamente
     * para que el usuario no tenga que escribir las credenciales de nuevo.
     */
    suspend fun register(storeName: String, email: String, password: String): Result<UserDto> {
        return try {
            val response = api.register(RegisterRequest(storeName, email, password))

            if (!response.isSuccessful) {
                return Result.failure(
                    Exception("Error ${response.code()}: No se pudo crear la cuenta")
                )
            }

            // Registro exitoso → hacer login automático
            login(email, password)
        } catch (e: Exception) {
            Result.failure(Exception("Sin conexión al servidor: ${e.message}"))
        }
    }

    /**
     * Cierra sesión: borra token y datos del usuario del almacenamiento.
     */
    suspend fun logout() {
        tokenManager.clearAll()
    }

    /**
     * Verifica si hay una sesión activa (token guardado).
     * Útil para decidir si mostrar Login o Dashboard al abrir la app.
     */
    suspend fun isLoggedIn(): Boolean {
        return tokenManager.isLoggedIn()
    }

    /**
     * Obtiene el nombre de la tienda guardado localmente.
     */
    suspend fun getStoreName(): String {
        return tokenManager.getStoreName() ?: "Mi Comercio"
    }
}
