package com.smartreceipt.track.network;

/**
 * Punto de acceso único a la API.
 * Usar así en cualquier Activity o Repository:
 *
 *   SmartReceiptApi api = FisservApiClient.getApi();
 *   api.getDashboard("merchant_001", 30).enqueue(...);
 */
public class FisservApiClient {

    private FisservApiClient() {}

    public static SmartReceiptApi getApi() {
        return NetworkModule.getApiClient();
    }
}
