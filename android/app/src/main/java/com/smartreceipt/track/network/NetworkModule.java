package com.smartreceipt.track.network;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.smartreceipt.track.utils.Constants;

import java.util.concurrent.TimeUnit;

import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

/**
 * Configura Retrofit para llamar al backend SmartReceipt.
 * Usar como singleton: NetworkModule.getApiClient()
 */
public class NetworkModule {

    private static SmartReceiptApi apiInstance;

    public static SmartReceiptApi getApiClient() {
        if (apiInstance == null) {
            apiInstance = buildRetrofit().create(SmartReceiptApi.class);
        }
        return apiInstance;
    }

    private static Retrofit buildRetrofit() {
        Gson gson = new GsonBuilder()
                .setDateFormat("yyyy-MM-dd'T'HH:mm:ss")
                .create();

        HttpLoggingInterceptor logging = new HttpLoggingInterceptor();
        logging.setLevel(HttpLoggingInterceptor.Level.BODY); // Ver requests en Logcat

        OkHttpClient client = new OkHttpClient.Builder()
                .connectTimeout(15, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .addInterceptor(logging)
                .build();

        return new Retrofit.Builder()
                .baseUrl(Constants.BASE_URL)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create(gson))
                .build();
    }
}
