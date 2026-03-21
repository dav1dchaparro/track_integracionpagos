package com.cloveriamarketing.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Pantalla de Login de CloverIA Marketing.
 *
 * En Compose, una pantalla es una función anotada con @Composable.
 * No hay XML, todo se construye con código Kotlin.
 *
 * Parámetros:
 * @param onLoginSuccess Función que se ejecuta cuando el login es correcto.
 *                       NavGraph la usa para navegar al Dashboard.
 */
@Composable
fun LoginScreen(onLoginSuccess: () -> Unit) {

    // ── Estado de los campos ──────────────────────────────────────
    // `remember` + `mutableStateOf` = variable reactiva.
    // Cada vez que cambia su valor, Compose re-dibuja los componentes que la usan.
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }

    // ── Colores del tema ──────────────────────────────────────────
    val darkBg = Color(0xFF0F172A)         // Fondo oscuro principal
    val cardBg = Color(0xFF1E293B)         // Fondo de la tarjeta
    val accentColor = Color(0xFF6366F1)    // Violeta — color principal de la app
    val textColor = Color(0xFFF1F5F9)      // Texto claro
    val subtextColor = Color(0xFF94A3B8)   // Texto secundario gris

    // ── UI ───────────────────────────────────────────────────────
    // Box = contenedor que apila elementos. Acá lo usamos como fondo.
    Box(
        modifier = Modifier
            .fillMaxSize()                          // Ocupa toda la pantalla
            .background(darkBg),                   // Color de fondo oscuro
        contentAlignment = Alignment.Center         // Centra el contenido
    ) {

        // Card = tarjeta con bordes redondeados y sombra
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp),      // Margen a los costados
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = cardBg),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {

            // Column = apila elementos verticalmente (como un LinearLayout vertical)
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(32.dp),               // Padding interno
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(20.dp)  // Espacio entre elementos
            ) {

                // ── Logo / Título ─────────────────────────────────
                Text(
                    text = "📊",
                    fontSize = 48.sp
                )

                Text(
                    text = "CloverIA Marketing",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = textColor
                )

                Text(
                    text = "Ingresá para ver tu panel de ventas",
                    fontSize = 14.sp,
                    color = subtextColor,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(8.dp))

                // ── Campo Usuario ─────────────────────────────────
                // OutlinedTextField = campo de texto con borde. Similar a EditText en XML.
                OutlinedTextField(
                    value = username,
                    onValueChange = { username = it },  // Actualiza el estado al escribir
                    label = { Text("Usuario", color = subtextColor) },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = "Usuario",
                            tint = accentColor
                        )
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = accentColor,
                        unfocusedBorderColor = subtextColor,
                        focusedTextColor = textColor,
                        unfocusedTextColor = textColor,
                        cursorColor = accentColor
                    ),
                    singleLine = true   // No permite salto de línea
                )

                // ── Campo Contraseña ──────────────────────────────
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Contraseña", color = subtextColor) },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Lock,
                            contentDescription = "Contraseña",
                            tint = accentColor
                        )
                    },
                    // PasswordVisualTransformation = muestra puntos en lugar de texto
                    visualTransformation = PasswordVisualTransformation(),
                    // KeyboardType.Password = el teclado sugiere contraseñas
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = accentColor,
                        unfocusedBorderColor = subtextColor,
                        focusedTextColor = textColor,
                        unfocusedTextColor = textColor,
                        cursorColor = accentColor
                    ),
                    singleLine = true
                )

                // ── Mensaje de error (solo se muestra si hay error) ──
                if (errorMessage.isNotEmpty()) {
                    Text(
                        text = errorMessage,
                        color = Color(0xFFEF4444),   // Rojo
                        fontSize = 13.sp,
                        textAlign = TextAlign.Center
                    )
                }

                // ── Botón Ingresar ────────────────────────────────
                Button(
                    onClick = {
                        // Validación básica de campos vacíos
                        if (username.isBlank() || password.isBlank()) {
                            errorMessage = "Completá usuario y contraseña"
                            return@Button
                        }

                        // ─────────────────────────────────────────────
                        // FASE 1: Validación local (datos hardcodeados)
                        // FASE 2: Reemplazar por llamada a POST /api/auth/login
                        // ─────────────────────────────────────────────
                        if (username == "demo" && password == "demo123") {
                            errorMessage = ""
                            isLoading = true
                            onLoginSuccess()   // Navega al Dashboard
                        } else {
                            errorMessage = "Usuario o contraseña incorrectos"
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = accentColor),
                    enabled = !isLoading
                ) {
                    // Muestra spinner o texto según el estado
                    if (isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = Color.White,
                            strokeWidth = 2.dp
                        )
                    } else {
                        Text(
                            text = "Ingresar",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color.White
                        )
                    }
                }

                // ── Botón acceso demo rápido ──────────────────────
                TextButton(
                    onClick = {
                        username = "demo"
                        password = "demo123"
                    }
                ) {
                    Text(
                        text = "Usar cuenta demo",
                        color = accentColor,
                        fontSize = 14.sp
                    )
                }

                // ── Credenciales de ayuda ─────────────────────────
                Text(
                    text = "demo / demo123",
                    color = subtextColor,
                    fontSize = 12.sp
                )
            }
        }
    }
}
