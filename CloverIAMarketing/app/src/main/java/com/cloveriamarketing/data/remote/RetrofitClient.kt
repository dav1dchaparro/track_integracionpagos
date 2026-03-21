package com.cloveriamarketing.data.remote

import android.content.Context
import com.google.gson.GsonBuilder
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

/**
 * RetrofitClient — punto de acceso único a la API del backend.
 *
 * Configura Retrofit con:
 * 1. OkHttp como cliente HTTP (maneja conexiones, timeouts, TLS)
 * 2. Gson como conversor JSON ↔ data class
 * 3. AuthInterceptor que agrega el JWT token a cada request
 * 4. LoggingInterceptor que imprime requests/responses en Logcat
 *
 * Patrón Singleton: solo hay UNA instancia de Retrofit en toda la app.
 * Se inicializa con RetrofitClient.init(context) desde MainActivity.
 *
 * ┌───────────────────────────────────────────────────────────────┐
 * │  App Android                                                  │
 * │    ↓ llama función suspend                                    │
 * │  ApiService.getDashboardSummary("month")                      │
 * │    ↓ Retrofit convierte a HTTP                                │
 * │  GET http://10.0.2.2:8000/dashboard/summary?period=month      │
 * │    ↓ AuthInterceptor agrega header                            │
 * │  Authorization: Bearer eyJhbGciOiJIUzI1NiIs...                │
 * │    ↓ OkHttp envía la request                                  │
 * │  Backend FastAPI responde con JSON                             │
 * │    ↓ Gson convierte JSON → DashboardDto                       │
 * │  Response<DashboardDto> llega al ViewModel                    │
 * └───────────────────────────────────────────────────────────────┘
 */
object RetrofitClient {

    // ── Configuración ───────────────────────────────────────────
    // 10.0.2.2 = IP especial del emulador Android que apunta al localhost de la PC
    // Si probás en dispositivo físico en la misma WiFi, usá la IP de tu PC (ej: 192.168.1.X)
    private const val BASE_URL = "http://10.0.2.2:8000/"

    private lateinit var tokenManager: TokenManager
    private lateinit var apiService: ApiService

    /**
     * Inicializa el cliente. Llamar UNA VEZ desde MainActivity.onCreate().
     *
     * @param context Application context para acceder a DataStore
     */
    fun init(context: Context) {
        tokenManager = TokenManager(context.applicationContext)
        apiService = buildRetrofit().create(ApiService::class.java)
    }

    /** Devuelve la instancia de ApiService lista para usar */
    fun getApi(): ApiService = apiService

    /** Devuelve el TokenManager para guardar/leer tokens */
    fun getTokenManager(): TokenManager = tokenManager

    // ── Construcción interna ────────────────────────────────────

    private fun buildRetrofit(): Retrofit {
        // Gson con formato de fecha compatible con el backend
        val gson = GsonBuilder()
            .setDateFormat("yyyy-MM-dd'T'HH:mm:ss")
            .create()

        return Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(buildOkHttpClient())
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
    }

    private fun buildOkHttpClient(): OkHttpClient {
        // Logger: imprime cada request y response en Logcat
        // Buscar "OkHttp" en Logcat para ver las llamadas
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        return OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)   // Timeout de conexión
            .readTimeout(30, TimeUnit.SECONDS)       // Timeout de lectura
            .writeTimeout(30, TimeUnit.SECONDS)      // Timeout de escritura
            .addInterceptor(authInterceptor())       // Agrega JWT a cada request
            .addInterceptor(logging)                 // Log en Logcat
            .build()
    }

    /**
     * AuthInterceptor — agrega automáticamente el header Authorization
     * a TODAS las requests (excepto login y register que no necesitan token).
     *
     * Funciona así:
     * 1. OkHttp va a enviar una request
     * 2. Antes de enviarla, pasa por este interceptor
     * 3. Si hay un JWT guardado, le agrega el header
     * 4. Continúa con la request modificada
     */
    private fun authInterceptor(): Interceptor = Interceptor { chain ->
        val originalRequest = chain.request()

        // No agregar token a login ni register (no lo tienen todavía)
        val path = originalRequest.url.encodedPath
        if (path.contains("auth/login") || path.contains("auth/register")) {
            return@Interceptor chain.proceed(originalRequest)
        }

        // Leer el token guardado en DataStore
        val token = tokenManager.getToken()

        // Si hay token, agregarlo al header Authorization
        val newRequest = if (token != null) {
            originalRequest.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        } else {
            originalRequest
        }

        chain.proceed(newRequest)
    }
}
