package com.smartreceipt.track.repositories;

import com.smartreceipt.track.models.Dashboard;
import com.smartreceipt.track.models.Transaction;
import com.smartreceipt.track.network.FisservApiClient;
import com.smartreceipt.track.network.SmartReceiptApi;

import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Maneja todas las llamadas al backend relacionadas a transacciones y dashboard.
 *
 * Uso desde una Activity:
 *
 *   TransactionRepository repo = new TransactionRepository();
 *   repo.getDashboard("merchant_001", 30, new TransactionRepository.DashboardCallback() {
 *       public void onSuccess(Dashboard dashboard) { ... }
 *       public void onError(String message) { ... }
 *   });
 */
public class TransactionRepository {

    private final SmartReceiptApi api;

    public TransactionRepository() {
        this.api = FisservApiClient.getApi();
    }

    // ── Interfaces de callback ──────────────────────────────

    public interface DashboardCallback {
        void onSuccess(Dashboard dashboard);
        void onError(String message);
    }

    public interface TransactionListCallback {
        void onSuccess(List<Transaction> transactions);
        void onError(String message);
    }

    // ── Métodos públicos ────────────────────────────────────

    public void getDashboard(String merchantId, int periodDays, DashboardCallback callback) {
        api.getDashboard(merchantId, periodDays).enqueue(new Callback<Dashboard>() {
            @Override
            public void onResponse(Call<Dashboard> call, Response<Dashboard> response) {
                if (response.isSuccessful() && response.body() != null) {
                    callback.onSuccess(response.body());
                } else {
                    callback.onError("Error " + response.code());
                }
            }

            @Override
            public void onFailure(Call<Dashboard> call, Throwable t) {
                callback.onError("Sin conexión: " + t.getMessage());
            }
        });
    }

    public void getTransactions(String merchantId, int limit, int offset, TransactionListCallback callback) {
        api.getTransactions(merchantId, limit, offset).enqueue(new Callback<List<Transaction>>() {
            @Override
            public void onResponse(Call<List<Transaction>> call, Response<List<Transaction>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    callback.onSuccess(response.body());
                } else {
                    callback.onError("Error " + response.code());
                }
            }

            @Override
            public void onFailure(Call<List<Transaction>> call, Throwable t) {
                callback.onError("Sin conexión: " + t.getMessage());
            }
        });
    }
}
