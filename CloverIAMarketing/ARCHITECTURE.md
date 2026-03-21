# Arquitectura Android — CloverIA Marketing

## Resumen

App Android con **Jetpack Compose** + **Kotlin** conectada al backend **FastAPI** via **Retrofit**.
Usa arquitectura **MVVM** (Model-View-ViewModel) con repositorios.

## Diagrama de flujo

```
┌─────────────────────────────────────────────────────────────┐
│  CAPA UI (lo que el usuario ve)                             │
│                                                             │
│  LoginScreen.kt ──────→ DashboardScreen.kt                  │
│       ↑                       ↑                             │
│       │ observa estado        │ observa estado              │
│       ↓                       ↓                             │
│  AuthViewModel           DashboardViewModel                  │
│       ↑                       ↑                             │
├───────┼───────────────────────┼─────────────────────────────┤
│  CAPA DATOS (lógica de negocio)                             │
│       ↓                       ↓                             │
│  AuthRepository          DashboardRepository                 │
│       ↑                       ↑                             │
├───────┼───────────────────────┼─────────────────────────────┤
│  CAPA RED (comunicación HTTP)                               │
│       ↓                       ↓                             │
│  ApiService (interfaz Retrofit)                             │
│       ↓                                                     │
│  RetrofitClient (OkHttp + JWT interceptor)                  │
│       ↓                                                     │
│  TokenManager (DataStore — almacena JWT)                    │
│       ↓                                                     │
│  HTTP → http://10.0.2.2:8000 (backend FastAPI)              │
└─────────────────────────────────────────────────────────────┘
```

## Estructura de archivos

```
CloverIAMarketing/app/src/main/java/com/cloveriamarketing/
│
├── MainActivity.kt                    # Punto de entrada: init Retrofit + NavGraph
│
├── navigation/
│   └── NavGraph.kt                    # Mapa de pantallas (Login ↔ Dashboard)
│
├── data/
│   ├── model/
│   │   └── Models.kt                 # Data classes + FakeData (fallback sin backend)
│   │
│   ├── remote/
│   │   ├── Dto.kt                    # DTOs: espejo exacto de los schemas del backend
│   │   ├── ApiService.kt             # Interfaz Retrofit con todos los endpoints
│   │   ├── RetrofitClient.kt         # Singleton: configura OkHttp + Gson + JWT
│   │   └── TokenManager.kt           # DataStore: guarda/lee JWT token localmente
│   │
│   └── repository/
│       ├── AuthRepository.kt         # Login, register, logout, isLoggedIn
│       └── DashboardRepository.kt    # Dashboard summary, ventas recientes, productos
│
└── ui/
    ├── screens/
    │   ├── LoginScreen.kt            # Formulario con email/contraseña → AuthViewModel
    │   └── DashboardScreen.kt        # KPIs + ventas reales → DashboardViewModel
    │
    ├── viewmodel/
    │   ├── AuthViewModel.kt          # Estado Login: Idle → Loading → Success/Error
    │   └── DashboardViewModel.kt     # Estado Dashboard: Loading → Success/Error
    │
    └── theme/
        ├── Color.kt                  # Paleta de colores
        ├── Theme.kt                  # Tema Material3
        └── Type.kt                   # Tipografía
```

## Endpoints que consume la app

| Método | Endpoint | Archivo que lo usa | Para qué |
|--------|----------|--------------------|----------|
| POST | /auth/login | AuthRepository | Obtener JWT token |
| POST | /auth/register | AuthRepository | Crear cuenta nueva |
| POST | /auth/refresh | ApiService | Renovar token expirado |
| GET | /auth/me | AuthRepository | Datos del usuario logueado |
| GET | /dashboard/summary?period=X | DashboardRepository | KPIs, top productos, timeline |
| GET | /sales/ | DashboardRepository | Lista de ventas recientes |
| GET | /products/ | DashboardRepository | Catálogo de productos |
| GET | /categories/ | ApiService | Lista de categorías |

## Cómo funciona la autenticación

1. Usuario escribe email + contraseña en LoginScreen
2. `AuthViewModel.login()` llama a `AuthRepository.login()`
3. AuthRepository hace `POST /auth/login` → backend devuelve JWT token
4. `TokenManager.saveToken(jwt)` lo guarda en DataStore (almacenamiento cifrado)
5. En cada request subsiguiente, `RetrofitClient.authInterceptor()` lee el token y agrega:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   ```
6. El backend valida el token y devuelve datos del usuario

## Cómo probar

### Con backend corriendo en la PC:

```bash
# Terminal 1: arrancar backend
cd backend && uvicorn app.main:app --reload

# Terminal 2: Android Studio
# Correr en emulador — automáticamente usa http://10.0.2.2:8000
```

### Con dispositivo físico en la misma WiFi:

Cambiar `BASE_URL` en `RetrofitClient.kt`:
```kotlin
private const val BASE_URL = "http://192.168.1.X:8000/"  // IP de tu PC
```

### Sin backend (datos fake):

La app muestra estado de error con botón "Reintentar" si no hay backend.
Para volver a FakeData, cambiar en DashboardScreen:
```kotlin
val stats = FakeData.dashboardStats  // en vez del ViewModel
```

## Tecnologías y versiones

| Librería | Versión | Para qué |
|----------|---------|----------|
| Jetpack Compose | BOM 2024.09 | UI declarativa sin XML |
| Navigation Compose | 2.7.7 | Navegación entre pantallas |
| Retrofit | 2.9.0 | HTTP client → interfaz Kotlin → requests automáticas |
| OkHttp | 4.12.0 | Transporte HTTP + interceptors |
| Gson | 2.10.1 | JSON ↔ data class |
| DataStore | 1.0.0 | Almacenamiento local seguro (reemplazo SharedPreferences) |
| ViewModel | 2.6.1 | Estado que sobrevive rotaciones |
| Coroutines | 1.7.3 | Llamadas asíncronas sin bloquear UI |
