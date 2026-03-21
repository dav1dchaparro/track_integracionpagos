package com.smartreceipt.track.models;

import com.google.gson.annotations.SerializedName;
import java.util.Map;

public class AIInsight {

    @SerializedName("id")               private String id;
    @SerializedName("merchant_id")      private String merchantId;
    @SerializedName("insight_type")     private String insightType;
    @SerializedName("title")            private String title;
    @SerializedName("description")      private String description;
    @SerializedName("recommendation")   private String recommendation;
    @SerializedName("value")            private Double value;
    @SerializedName("change_percent")   private Double changePercent;
    @SerializedName("trend")            private String trend; // "up", "down", "stable"
    @SerializedName("data")             private Map<String, Object> data;
    @SerializedName("created_at")       private String createdAt;

    public String getId()             { return id; }
    public String getMerchantId()     { return merchantId; }
    public String getInsightType()    { return insightType; }
    public String getTitle()          { return title; }
    public String getDescription()    { return description; }
    public String getRecommendation() { return recommendation; }
    public Double getValue()          { return value; }
    public Double getChangePercent()  { return changePercent; }
    public String getTrend()          { return trend; }
    public Map<String, Object> getData() { return data; }
    public String getCreatedAt()      { return createdAt; }

    public boolean isTrendUp()     { return "up".equals(trend); }
    public boolean isTrendDown()   { return "down".equals(trend); }
    public boolean isTrendStable() { return "stable".equals(trend); }
}
