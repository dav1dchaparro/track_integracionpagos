package com.cloveriamarketing

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.navigation.compose.rememberNavController
import com.cloveriamarketing.navigation.NavGraph
import com.cloveriamarketing.ui.theme.CloverIAMarketingTheme

/**
 * MainActivity — punto de entrada de la app Android.
 *
 * En una app Jetpack Compose, MainActivity tiene una sola responsabilidad:
 * inicializar el sistema de UI (setContent) y arrancar el NavGraph.
 *
 * Todo el contenido visual vive en los archivos de screens/ y navigation/.
 * MainActivity NO conoce las pantallas directamente — solo le pasa
 * el navController al NavGraph y este se encarga del resto.
 */
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // enableEdgeToEdge = la app dibuja bajo la barra de estado y navegación del sistema.
        // Hace que se vea más moderna (sin franjas blancas en los bordes).
        enableEdgeToEdge()

        // setContent = reemplaza el sistema de XML de Android.
        // Todo lo que se ponga acá es la UI de la app.
        setContent {
            // El tema aplica colores y tipografía globales (definido en ui/theme/)
            CloverIAMarketingTheme {

                // rememberNavController = controlador de navegación.
                // Permite moverse entre pantallas con navController.navigate("ruta")
                // "remember" = lo mantiene en memoria cuando la pantalla se rearma
                val navController = rememberNavController()

                // NavGraph contiene el mapa de todas las pantallas.
                // Se le pasa el navController para que las pantallas puedan navegar.
                NavGraph(navController = navController)
            }
        }
    }
}
