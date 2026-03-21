package com.smartreceipt.track.repositories;

import com.smartreceipt.track.models.AIInsight;
import com.smartreceipt.track.network.FisservApiClient;
import com.smartreceipt.track.network.SmartReceiptApi;

import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Maneja las llamadas al backend relacionadas a insights de IA.
 *
 * Uso desde una Activity:
 *
 *   InsightRepository repo = new InsightRepository();
 *   repo.getInsights("merchant_001", new InsightRepository.InsightCallback() {
 *       public void onSuccess(List<AIInsight> insights) { ... }
 *       public void onError(String message) { ... }
 *   });
 */
public class InsightRepository {

    private final SmartReceiptApi api;

    public InsightRepository() {
        this.api = FisservApiClient.getApi();
    }

    public interface InsightCallback {
        void onSuccess(List<AIInsight> insights);
        void onError(String message);
    }

    public void getInsights(String merchantId, InsightCallback callback) {
        api.getInsights(merchantId).enqueue(new Callback<List<AIInsight>>() {
            @Override
            public void onResponse(Call<List<AIInsight>> call, Response<List<AIInsight>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    callback.onSuccess(response.body());
                } else {
                    callback.onError("Error " + response.code());
                }
            }

            @Override
            public void onFailure(Call<List<AIInsight>> call, Throwable t) {
                callback.onError("Sin conexión: " + t.getMessage());
            }
        });
    }

    public void generateInsights(String merchantId, int periodDays, InsightCallback callback) {
        api.generateInsights(merchantId, periodDays).enqueue(new Callback<List<AIInsight>>() {
            @Override
            public void onResponse(Call<List<AIInsight>> call, Response<List<AIInsight>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    callback.onSuccess(response.body());
                } else {
                    callback.onError("Error " + response.code());
                }
            }

            @Override
            public void onFailure(Call<List<AIInsight>> call, Throwable t) {
                callback.onError("Sin conexión: " + t.getMessage());
            }
        });
    }
}
