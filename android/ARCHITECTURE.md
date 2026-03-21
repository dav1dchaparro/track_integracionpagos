# Arquitectura Android — SmartReceipt

Explicación en palabras simples de cómo funciona la capa de red del app Android.

---

## Para qué sirve esta carpeta

El backend (servidor Python) tiene los datos. El app Android los necesita mostrar.
Esta carpeta tiene todo el código que conecta los dos mundos.

Sin esto, el Android y el backend son dos programas separados que no se hablan.

---

## El flujo completo

```
┌──────────────────┐
│  DashboardActivity│   ← tu compañero trabaja acá (pantalla)
└────────┬─────────┘
         │ usa
         ▼
┌──────────────────┐
│  Repository      │   ← pide los datos al servidor
└────────┬─────────┘
         │ llama
         ▼
┌──────────────────┐
│  SmartReceiptApi │   ← define qué URLs existen
└────────┬─────────┘
         │ configurado por
         ▼
┌──────────────────┐
│  NetworkModule   │   ← arma el request HTTP real
└────────┬─────────┘
         │ usando URL de
         ▼
┌──────────────────┐
│  Constants       │   ← dirección del servidor
└──────────────────┘
         │
         │  internet
         ▼
┌──────────────────┐
│  Backend FastAPI │   ← devuelve JSON
└──────────────────┘
         │
         ▼ Gson convierte JSON → objeto Java
┌──────────────────┐
│  Modelos         │   ← Dashboard, Transaction, AIInsight
│  (Transaction,   │
│   Dashboard,     │
│   AIInsight)     │
└──────────────────┘
         │
         ▼
  onSuccess(datos)      ← tu compañero muestra en pantalla
```

---

## Archivo por archivo

---

### `utils/Constants.java` — La agenda de contactos

Guarda la dirección del backend y constantes que se usan en todo el proyecto.
Si el servidor cambia de dirección, solo tocás este archivo.

```java
BASE_URL = "http://10.0.2.2:8000/"
```

> **¿Por qué 10.0.2.2?**
> El emulador de Android corre dentro de tu computadora como una máquina virtual.
> Para referirse al `localhost` de la PC, usa la IP especial `10.0.2.2`.
> Si corren en un celular físico, hay que poner la IP real de la PC en la red WiFi.

Otras constantes que guarda:
- `DEMO_MERCHANT_ID` — el ID del comerciante de prueba
- `PERIOD_WEEK / MONTH / QUARTER` — períodos para filtros (7, 30, 90 días)
- `INSIGHT_*` — nombres de los tipos de insight
- `PREF_*` — claves para guardar datos en SharedPreferences (como el login)

---

### `network/NetworkModule.java` — El cartero

Configura cómo se mandan y reciben los mensajes HTTP. Es el motor interno.
No lo usás directamente — lo usa `FisservApiClient` por debajo.

Configura tres cosas:

**Gson** — el traductor de JSON a Java
```
Backend devuelve:  {"total_revenue": 1250.50, "total_transactions": 87}
Gson convierte a:  dashboard.getTotalRevenue()      → 1250.50
                   dashboard.getTotalTransactions() → 87
```

**OkHttpClient** — el cliente HTTP real
- Si el servidor no responde en 15 segundos → cancela la conexión
- Si el servidor no responde en 30 segundos → cancela la lectura
- Tiene un interceptor que imprime en Logcat cada request y response (útil para debuggear)

**Retrofit** — el framework que une todo
- Toma la interfaz `SmartReceiptApi` y la convierte en llamadas HTTP reales automáticamente

---

### `network/SmartReceiptApi.java` — El menú de servicios

Define qué podés pedirle al backend. Cada método es una URL.
Retrofit lee las anotaciones y construye la URL completa solo.

```java
@GET("api/dashboard/{merchantId}")
// → GET http://10.0.2.2:8000/api/dashboard/demo_merchant_001?period_days=30

@GET("api/transactions/{merchantId}")
// → GET http://10.0.2.2:8000/api/transactions/demo_merchant_001?limit=50&offset=0

@GET("api/insights/{merchantId}")
// → GET http://10.0.2.2:8000/api/insights/demo_merchant_001

@POST("api/insights/{merchantId}/generate")
// → POST http://10.0.2.2:8000/api/insights/demo_merchant_001/generate?period_days=30
```

| Anotación | Qué hace |
|-----------|----------|
| `@GET` | Pide datos (solo lectura) |
| `@POST` | Manda datos o dispara una acción |
| `@Path` | Reemplaza `{merchantId}` en la URL |
| `@Query` | Agrega `?param=valor` al final de la URL |

---

### `network/FisservApiClient.java` — La puerta de entrada única

Un punto de acceso único a la API. En vez de que cada pantalla cree su
propia conexión (lo que gastaría memoria), todas comparten la misma instancia.

```java
// Cualquier archivo del proyecto accede a la API así:
SmartReceiptApi api = FisservApiClient.getApi();
```

---

### `repositories/TransactionRepository.java` — El asistente de ventas

Es lo que las Activities usan para pedir datos. Esconde toda la complejidad
de HTTP, JSON y Retrofit detrás de métodos simples con callbacks.

**¿Por qué hay callbacks (`onSuccess` / `onError`)?**

Las llamadas al servidor son **asíncronas** — no podés pausar el app esperando
la respuesta porque la pantalla se congelaría. Entonces funciona así:

```
1. Pedís los datos:  repo.getDashboard(...)
2. El app sigue funcionando normalmente
3. Cuando llega la respuesta → se ejecuta onSuccess o onError
```

**Cómo lo usa tu compañero desde una Activity:**

```java
TransactionRepository repo = new TransactionRepository();

// Pedir el dashboard
repo.getDashboard("demo_merchant_001", 30, new TransactionRepository.DashboardCallback() {
    @Override
    public void onSuccess(Dashboard dashboard) {
        // Llegaron los datos — mostrá en pantalla
        textRevenue.setText("$" + dashboard.getTotalRevenue());
        textTransactions.setText(dashboard.getTotalTransactions() + " ventas");
    }

    @Override
    public void onError(String message) {
        // Algo salió mal — mostrá un error
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show();
    }
});

// Pedir lista de transacciones
repo.getTransactions("demo_merchant_001", 50, 0, new TransactionRepository.TransactionListCallback() {
    @Override
    public void onSuccess(List<Transaction> transactions) {
        // Pasale la lista al adapter del RecyclerView
        adapter.setData(transactions);
    }

    @Override
    public void onError(String message) { ... }
});
```

---

### `repositories/InsightRepository.java` — El asistente de IA

Igual que el anterior pero para los análisis de IA.

```java
InsightRepository repo = new InsightRepository();

// Ver insights ya guardados en el servidor
repo.getInsights("demo_merchant_001", new InsightRepository.InsightCallback() {
    @Override
    public void onSuccess(List<AIInsight> insights) {
        // Mostrar la lista de insights en pantalla
        adapter.setData(insights);
    }
    @Override
    public void onError(String message) { ... }
});

// Pedirle al backend que analice y genere insights nuevos
repo.generateInsights("demo_merchant_001", 30, callback);
```

---

### `models/Transaction.java` — Una venta

Representa una transacción individual. Cada campo tiene `@SerializedName`
que le dice a Gson cómo llamaba ese campo en el JSON del backend.

```
JSON:                           Java:
"amount": 12.50          →      transaction.getAmount()        = 12.50
"payment_method": "CARD" →      transaction.getPaymentMethod() = "CARD"
"transaction_at": "..."  →      transaction.getTransactionAt() = "..."
"items": [...]           →      transaction.getItems()         = List<TransactionItem>
```

También tiene la clase interna `TransactionItem` que representa
cada producto dentro de una venta (nombre, precio, cantidad, categoría).

---

### `models/AIInsight.java` — Un análisis de IA

Representa un insight generado por el backend. Tiene helpers para la UI:

```java
insight.isTrendUp()     → true si la métrica subió
insight.isTrendDown()   → true si bajó
insight.isTrendStable() → true si está estable
```

Tu compañero puede usar esto para mostrar flechas o colores en pantalla
(verde si sube, rojo si baja, gris si está estable).

---

### `models/Dashboard.java` — El resumen completo

Es el objeto más grande — contiene todo lo que muestra la pantalla principal:

```java
dashboard.getTotalRevenue()         → 1250.50   (ingresos del período)
dashboard.getTotalTransactions()    → 87        (cantidad de ventas)
dashboard.getAverageTicket()        → 14.37     (gasto promedio por cliente)
dashboard.getRevenueChangePercent() → 12.5      (% de cambio vs período anterior)
dashboard.getTopHour()              → 9         (hora con más ventas = 9am)
dashboard.getTopProducts()          → List<TopProduct>
dashboard.getPaymentMethods()       → {"CARD": 850.0, "CASH": 400.5}
dashboard.getDailyRevenue()         → List<DailyRevenue>  (para el gráfico de línea)
```

---

## Cómo agregar un endpoint nuevo

Si el backend agrega un endpoint nuevo y el Android lo necesita, el proceso es:

1. **Agregar el método en `SmartReceiptApi.java`**
```java
@GET("api/merchants/{merchantId}")
Call<Merchant> getMerchant(@Path("merchantId") String merchantId);
```

2. **Crear el modelo si hace falta** (`models/Merchant.java`)

3. **Agregar el método en el Repository correspondiente**
```java
public void getMerchant(String merchantId, MerchantCallback callback) { ... }
```

4. **Llamarlo desde la Activity**
```java
repo.getMerchant("demo_merchant_001", callback);
```

---

## Dependencias necesarias en `build.gradle`

Para que este código compile, el `build.gradle` del módulo app necesita estas líneas:

```gradle
dependencies {
    // Retrofit — cliente HTTP
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    implementation 'com.squareup.retrofit2:converter-gson:2.9.0'

    // OkHttp — motor HTTP + logs
    implementation 'com.squareup.okhttp3:okhttp:4.12.0'
    implementation 'com.squareup.okhttp3:logging-interceptor:4.12.0'

    // Gson — convierte JSON a Java
    implementation 'com.google.code.gson:gson:2.10.1'
}
```
