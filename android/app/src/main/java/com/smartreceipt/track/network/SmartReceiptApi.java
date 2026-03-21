package com.smartreceipt.track.network;

import com.smartreceipt.track.models.AIInsight;
import com.smartreceipt.track.models.Dashboard;
import com.smartreceipt.track.models.Transaction;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.Path;
import retrofit2.http.Query;

/**
 * Define todos los endpoints del backend que usa el Android.
 * Retrofit convierte esto en llamadas HTTP automáticamente.
 */
public interface SmartReceiptApi {

    // Dashboard completo del comerciante
    @GET("api/dashboard/{merchantId}")
    Call<Dashboard> getDashboard(
            @Path("merchantId") String merchantId,
            @Query("period_days") int periodDays
    );

    // Lista de transacciones
    @GET("api/transactions/{merchantId}")
    Call<List<Transaction>> getTransactions(
            @Path("merchantId") String merchantId,
            @Query("limit") int limit,
            @Query("offset") int offset
    );

    // Insights guardados
    @GET("api/insights/{merchantId}")
    Call<List<AIInsight>> getInsights(
            @Path("merchantId") String merchantId
    );

    // Generar nuevos insights con IA
    @POST("api/insights/{merchantId}/generate")
    Call<List<AIInsight>> generateInsights(
            @Path("merchantId") String merchantId,
            @Query("period_days") int periodDays
    );
}
