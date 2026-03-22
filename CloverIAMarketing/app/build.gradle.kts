plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.cloveriamarketing"
    compileSdk {
        version = release(36) {
            minorApiLevel = 1
        }
    }

    defaultConfig {
        applicationId = "com.cloveriamarketing"
        minSdk = 23
        targetSdk = 28
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    // Navegación entre pantallas: permite ir de Login → Dashboard sin recargar la app
    implementation(libs.androidx.navigation.compose)

    // ── Red: Retrofit + OkHttp + Gson ──────────────────────────
    // Retrofit convierte una interfaz Kotlin en llamadas HTTP reales
    implementation(libs.retrofit.core)
    // Gson converter: parsea automáticamente JSON → data class y viceversa
    implementation(libs.retrofit.gson)
    // OkHttp: cliente HTTP de bajo nivel que Retrofit usa internamente
    implementation(libs.okhttp.core)
    // Logging interceptor: imprime cada request/response en Logcat (solo debug)
    implementation(libs.okhttp.logging)
    // Gson: librería de Google para serializar/deserializar JSON
    implementation(libs.gson)

    // ── Arquitectura MVVM ──────────────────────────────────────
    // ViewModel Compose: conecta lógica de negocio con pantallas sin perder estado al rotar
    implementation(libs.androidx.lifecycle.viewmodel.compose)

    // ── Almacenamiento local seguro ────────────────────────────
    // DataStore: guarda el JWT token de forma segura (reemplazo moderno de SharedPreferences)
    implementation(libs.androidx.datastore.preferences)

    // ── Coroutines ─────────────────────────────────────────────
    // Permite hacer llamadas HTTP sin bloquear la UI (suspend functions)
    implementation(libs.kotlinx.coroutines.android)

    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
}