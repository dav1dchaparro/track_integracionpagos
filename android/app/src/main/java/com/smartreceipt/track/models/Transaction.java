package com.smartreceipt.track.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class Transaction {

    @SerializedName("id")
    private String id;

    @SerializedName("merchant_id")
    private String merchantId;

    @SerializedName("amount")
    private double amount;

    @SerializedName("tip")
    private double tip;

    @SerializedName("tax")
    private double tax;

    @SerializedName("currency")
    private String currency;

    @SerializedName("payment_method")
    private String paymentMethod;

    @SerializedName("card_type")
    private String cardType;

    @SerializedName("status")
    private String status;

    @SerializedName("customer_name")
    private String customerName;

    @SerializedName("items")
    private List<TransactionItem> items;

    @SerializedName("item_count")
    private int itemCount;

    @SerializedName("transaction_at")
    private String transactionAt;

    public String getId()            { return id; }
    public String getMerchantId()    { return merchantId; }
    public double getAmount()        { return amount; }
    public double getTip()           { return tip; }
    public double getTax()           { return tax; }
    public String getCurrency()      { return currency; }
    public String getPaymentMethod() { return paymentMethod; }
    public String getCardType()      { return cardType; }
    public String getStatus()        { return status; }
    public String getCustomerName()  { return customerName; }
    public List<TransactionItem> getItems() { return items; }
    public int getItemCount()        { return itemCount; }
    public String getTransactionAt() { return transactionAt; }

    public static class TransactionItem {
        @SerializedName("name")     private String name;
        @SerializedName("price")    private double price;
        @SerializedName("quantity") private int quantity;
        @SerializedName("category") private String category;

        public String getName()     { return name; }
        public double getPrice()    { return price; }
        public int getQuantity()    { return quantity; }
        public String getCategory() { return category; }
    }
}
