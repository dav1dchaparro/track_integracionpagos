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
import androidx.lifecycle.viewmodel.compose.viewModel
import com.cloveriamarketing.ui.viewmodel.AuthUiState
import com.cloveriamarketing.ui.viewmodel.AuthViewModel

/**
 * Pantalla de Login — conectada al backend real via AuthViewModel.
 *
 * Flujo completo:
 * 1. Usuario escribe email y contraseña
 * 2. Toca "Ingresar" → AuthViewModel.login()
 * 3. AuthViewModel → AuthRepository → POST /auth/login
 * 4. Si el backend responde 200 → guarda JWT → navega al Dashboard
 * 5. Si responde 401 → muestra "Credenciales incorrectas"
 * 6. Si no hay red → muestra "Sin conexión al servidor"
 *
 * @param onLoginSuccess Se ejecuta cuando el login fue exitoso → NavGraph navega al Dashboard
 */
@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    authViewModel: AuthViewModel = viewModel()
) {

    // ── Estado de los campos de texto ───────────────────────────
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    // ── Observar el estado del ViewModel ────────────────────────
    // Cada vez que uiState cambia, Compose re-dibuja automáticamente
    val uiState = authViewModel.uiState

    // Si el login fue exitoso, navegar al Dashboard
    LaunchedEffect(uiState) {
        if (uiState is AuthUiState.Success) {
            onLoginSuccess()
        }
    }

    // ── Colores del tema ────────────────────────────────────────
    val darkBg = Color(0xFF0F172A)
    val cardBg = Color(0xFF1E293B)
    val accentColor = Color(0xFF6366F1)
    val textColor = Color(0xFFF1F5F9)
    val subtextColor = Color(0xFF94A3B8)

    // ── UI ──────────────────────────────────────────────────────
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(darkBg),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = cardBg),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                // ── Logo / Título ───────────────────────────────
                Text(text = "📊", fontSize = 48.sp)
                Text(
                    text = "ATLAS NEXUS",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = textColor
                )
                Text(
                    text = "Ingresá tu email para ver tu panel de ventas",
                    fontSize = 14.sp,
                    color = subtextColor,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(8.dp))

                // ── Campo Email ─────────────────────────────────
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email", color = subtextColor) },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = "Email",
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
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    // Deshabilitar campo mientras se hace login
                    enabled = uiState !is AuthUiState.Loading
                )

                // ── Campo Contraseña ────────────────────────────
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
                    visualTransformation = PasswordVisualTransformation(),
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
                    singleLine = true,
                    enabled = uiState !is AuthUiState.Loading
                )

                // ── Mensaje de error ────────────────────────────
                if (uiState is AuthUiState.Error) {
                    Text(
                        text = (uiState as AuthUiState.Error).message,
                        color = Color(0xFFEF4444),
                        fontSize = 13.sp,
                        textAlign = TextAlign.Center
                    )
                }

                // ── Botón Ingresar ──────────────────────────────
                Button(
                    onClick = {
                        authViewModel.login(email, password)
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = accentColor),
                    enabled = uiState !is AuthUiState.Loading
                ) {
                    if (uiState is AuthUiState.Loading) {
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

                // ── Botón demo rápido ───────────────────────────
                TextButton(
                    onClick = {
                        email = "demo@smartreceipt.com"
                        password = "demo123"
                    }
                ) {
                    Text(
                        text = "Usar cuenta demo",
                        color = accentColor,
                        fontSize = 14.sp
                    )
                }

                Text(
                    text = "demo@smartreceipt.com / demo123",
                    color = subtextColor,
                    fontSize = 12.sp
                )
            }
        }
    }
}
