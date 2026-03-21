package com.cloveriamarketing.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.cloveriamarketing.ui.screens.DashboardScreen
import com.cloveriamarketing.ui.screens.LoginScreen

/**
 * Rutas de navegación de la app.
 *
 * "sealed class" es como un enum pero más potente: cada ruta es un objeto
 * con una propiedad `route` (String) que identifica la pantalla.
 *
 * Beneficio: si cambias el nombre de una ruta, el compilador te avisa
 * en todos los lugares donde se usa — no hay errores en runtime.
 */
sealed class Screen(val route: String) {
    object Login     : Screen("login")       // Pantalla de ingreso
    object Dashboard : Screen("dashboard")   // Panel principal
}

/**
 * NavGraph define el mapa completo de navegación de la app.
 *
 * Cómo funciona:
 * 1. NavHost es el contenedor que muestra una pantalla a la vez
 * 2. startDestination = la primera pantalla que se muestra (Login)
 * 3. Cada `composable(ruta)` define qué pantalla se muestra para esa ruta
 *
 * Para navegar desde una pantalla: navController.navigate(Screen.Dashboard.route)
 */
@Composable
fun NavGraph(navController: NavHostController) {
    NavHost(
        navController = navController,
        startDestination = Screen.Login.route  // Siempre arranca en Login
    ) {

        // ── Pantalla Login ────────────────────────────────────────
        composable(route = Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    // Cuando el login es exitoso, navegamos al Dashboard
                    // popUpTo(Login) { inclusive = true } = borra Login del historial
                    // así el usuario no puede volver atrás con el botón "back"
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }

        // ── Pantalla Dashboard ────────────────────────────────────
        composable(route = Screen.Dashboard.route) {
            DashboardScreen(
                onLogout = {
                    // Al cerrar sesión, volvemos al Login y limpiamos el historial
                    navController.navigate(Screen.Login.route) {
                        popUpTo(Screen.Dashboard.route) { inclusive = true }
                    }
                }
            )
        }
    }
}
