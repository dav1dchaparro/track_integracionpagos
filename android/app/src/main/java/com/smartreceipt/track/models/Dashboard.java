package com.smartreceipt.track.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;
import java.util.Map;

public class Dashboard {

    @SerializedName("merchant_id")
    private String merchantId;

    @SerializedName("period")
    private String period;

    @SerializedName("total_revenue")
    private double totalRevenue;

    @SerializedName("total_transactions")
    private int totalTransactions;

    @SerializedName("average_ticket")
    private double averageTicket;

    @SerializedName("revenue_change_percent")
    private double revenueChangePercent;

    @SerializedName("top_hour")
    private int topHour;

    @SerializedName("top_hour_revenue")
    private double topHourRevenue;

    @SerializedName("top_products")
    private List<TopProduct> topProducts;

    @SerializedName("payment_methods")
    private Map<String, Double> paymentMethods;

    @SerializedName("daily_revenue")
    private List<DailyRevenue> dailyRevenue;

    // Getters
    public String getMerchantId()          { return merchantId; }
    public String getPeriod()              { return period; }
    public double getTotalRevenue()        { return totalRevenue; }
    public int getTotalTransactions()      { return totalTransactions; }
    public double getAverageTicket()       { return averageTicket; }
    public double getRevenueChangePercent(){ return revenueChangePercent; }
    public int getTopHour()                { return topHour; }
    public double getTopHourRevenue()      { return topHourRevenue; }
    public List<TopProduct> getTopProducts()        { return topProducts; }
    public Map<String, Double> getPaymentMethods()  { return paymentMethods; }
    public List<DailyRevenue> getDailyRevenue()     { return dailyRevenue; }

    public static class TopProduct {
        @SerializedName("name")
        private String name;

        @SerializedName("revenue")
        private double revenue;

        @SerializedName("quantity")
        private int quantity;

        public String getName()    { return name; }
        public double getRevenue() { return revenue; }
        public int getQuantity()   { return quantity; }
    }

    public static class DailyRevenue {
        @SerializedName("date")
        private String date;

        @SerializedName("revenue")
        private double revenue;

        public String getDate()    { return date; }
        public double getRevenue() { return revenue; }
    }
}
