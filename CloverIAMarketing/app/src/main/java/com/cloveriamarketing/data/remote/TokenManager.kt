package com.cloveriamarketing.data.remote

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.runBlocking

/**
 * TokenManager — almacena y recupera el JWT token de forma segura.
 *
 * Usa DataStore (el reemplazo moderno de SharedPreferences).
 * El token se guarda en un archivo encriptado en el almacenamiento privado de la app.
 *
 * ¿Por qué no SharedPreferences?
 * - DataStore es asíncrono (no bloquea el hilo principal)
 * - DataStore es seguro contra escrituras concurrentes
 * - SharedPreferences puede perder datos si la app crashea durante una escritura
 *
 * Uso:
 *   val tokenManager = TokenManager(context)
 *   tokenManager.saveToken("eyJ...")     // Guardar después del login
 *   val token = tokenManager.getToken()  // Leer para cada request
 *   tokenManager.clearToken()            // Limpiar al hacer logout
 */

// Extensión que crea el DataStore como singleton (una sola instancia por app)
// El archivo se guarda en: /data/data/com.cloveriamarketing/files/datastore/auth_prefs.preferences_pb
private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "auth_prefs")

class TokenManager(private val context: Context) {

    companion object {
        // Claves para guardar datos en DataStore
        private val TOKEN_KEY = stringPreferencesKey("jwt_token")
        private val USER_EMAIL_KEY = stringPreferencesKey("user_email")
        private val STORE_NAME_KEY = stringPreferencesKey("store_name")
    }

    // ── Guardar token después del login ─────────────────────────
    suspend fun saveToken(token: String) {
        context.dataStore.edit { prefs ->
            prefs[TOKEN_KEY] = token
        }
    }

    // ── Leer token (versión suspend para coroutines) ────────────
    suspend fun getTokenAsync(): String? {
        return context.dataStore.data.map { prefs ->
            prefs[TOKEN_KEY]
        }.first()
    }

    /**
     * Leer token de forma BLOQUEANTE.
     *
     * OkHttp Interceptor no puede ser suspend, así que necesitamos esta versión.
     * Se ejecuta en el hilo de OkHttp (no en el main thread), así que es seguro.
     */
    fun getToken(): String? {
        return runBlocking {
            getTokenAsync()
        }
    }

    // ── Guardar datos del usuario ───────────────────────────────
    suspend fun saveUserInfo(email: String, storeName: String) {
        context.dataStore.edit { prefs ->
            prefs[USER_EMAIL_KEY] = email
            prefs[STORE_NAME_KEY] = storeName
        }
    }

    // ── Leer nombre de la tienda ────────────────────────────────
    suspend fun getStoreName(): String? {
        return context.dataStore.data.map { prefs ->
            prefs[STORE_NAME_KEY]
        }.first()
    }

    // ── Limpiar todo (logout) ───────────────────────────────────
    suspend fun clearAll() {
        context.dataStore.edit { prefs ->
            prefs.clear()
        }
    }

    // ── Verificar si hay sesión activa ──────────────────────────
    suspend fun isLoggedIn(): Boolean {
        return getTokenAsync() != null
    }
}
