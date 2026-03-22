package com.cloveriamarketing

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.navigation.compose.rememberNavController
import com.cloveriamarketing.data.remote.RetrofitClient
import com.cloveriamarketing.navigation.NavGraph
import com.cloveriamarketing.ui.theme.CloverIAMarketingTheme

/**
 * MainActivity — punto de entrada de la app Android.
 *
 * Responsabilidades:
 * 1. Inicializar RetrofitClient (conexión HTTP al backend)
 * 2. Arrancar el sistema de navegación (NavGraph)
 *
 * RetrofitClient.init() se llama ANTES de setContent() porque:
 * - Las pantallas pueden hacer requests HTTP inmediatamente al mostrarse
 * - Si no se inicializa antes, el primer request crashea con "lateinit not initialized"
 * - Solo se llama UNA vez en toda la vida de la app (patrón singleton)
 */
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // ── Paso 1: Inicializar la conexión al backend ──────────
        // Esto configura Retrofit, OkHttp, el interceptor JWT y el TokenManager.
        // applicationContext se usa en vez de 'this' para evitar memory leaks
        // (applicationContext vive tanto como la app, no se destruye al rotar).
        RetrofitClient.init(applicationContext)

        enableEdgeToEdge()

        // ── Paso 2: Arrancar la UI ──────────────────────────────
        setContent {
            CloverIAMarketingTheme {
                val navController = rememberNavController()
                NavGraph(navController = navController)
            }
        }
    }
}
