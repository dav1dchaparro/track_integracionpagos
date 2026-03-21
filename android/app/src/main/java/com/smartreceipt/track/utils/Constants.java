package com.smartreceipt.track.utils;

public class Constants {

    // URL base del backend — cambiar por la IP real en la demo
    // Si corren local: "http://10.0.2.2:8000" (emulador Android apunta al localhost de la PC con esa IP)
    // Si tienen servidor: "https://tu-servidor.com"
    public static final String BASE_URL = "http://10.0.2.2:8000/";

    // Merchant ID de demo — en producción viene del login con Clover
    public static final String DEMO_MERCHANT_ID = "demo_merchant_001";

    // Períodos para filtros
    public static final int PERIOD_WEEK    = 7;
    public static final int PERIOD_MONTH   = 30;
    public static final int PERIOD_QUARTER = 90;

    // Tipos de insight
    public static final String INSIGHT_PEAK_HOURS      = "peak_hours";
    public static final String INSIGHT_TOP_PRODUCTS    = "top_products";
    public static final String INSIGHT_AVERAGE_TICKET  = "average_ticket";
    public static final String INSIGHT_BEST_DAY        = "best_day";
    public static final String INSIGHT_PAYMENT_METHODS = "payment_methods";

    // Claves SharedPreferences
    public static final String PREFS_NAME         = "smartreceipt_prefs";
    public static final String PREF_MERCHANT_ID   = "merchant_id";
    public static final String PREF_MERCHANT_NAME = "merchant_name";
    public static final String PREF_ACCESS_TOKEN  = "clover_access_token";
}
