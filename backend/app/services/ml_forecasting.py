"""
ML Forecasting Service — Demand prediction for inventory management.

Pipeline:
  1. Aggregate sale_items by (product, ISO week) from existing tables.
  2. Engineer lag and rolling features per product.
  3. Train XGBoost (if >= MIN_WEEKS_FOR_ML) or fallback to rolling average.
  4. Predict demand for the next 7 days per product.
  5. Compute recommended_purchase = max(0, predicted - current_stock).
  6. Persist results in demand_predictions table.
"""

import uuid
import warnings
from datetime import date, datetime, timedelta, timezone

import numpy as np
import pandas as pd
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.forecasting import DemandPrediction, ProductStock
from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_item import SaleItem

warnings.filterwarnings("ignore")

MIN_WEEKS_FOR_ML = 4

FEATURE_COLS = [
    "product_enc",
    "lag_1",
    "lag_2",
    "lag_3",
    "lag_4",
    "rolling_mean_4",
    "rolling_std_4",
    "week_of_year",
    "month",
    "is_first_half",
]


# ---------------------------------------------------------------------------
# Data extraction
# ---------------------------------------------------------------------------

def _get_weekly_sales(db: Session, user_id: uuid.UUID) -> pd.DataFrame:
    """
    Returns a DataFrame with weekly aggregated sales per product.
    Columns: product_id (str), week_start (datetime), quantity (int).
    """
    rows = db.execute(
        select(
            SaleItem.product_id,
            func.date_trunc("week", Sale.sold_at).label("week_start"),
            func.sum(SaleItem.quantity).label("quantity"),
        )
        .join(Sale, Sale.id == SaleItem.sale_id)
        .where(Sale.user_id == user_id)
        .group_by(SaleItem.product_id, func.date_trunc("week", Sale.sold_at))
        .order_by(func.date_trunc("week", Sale.sold_at))
    ).all()

    if not rows:
        return pd.DataFrame(columns=["product_id", "week_start", "quantity"])

    df = pd.DataFrame(rows, columns=["product_id", "week_start", "quantity"])
    df["product_id"] = df["product_id"].astype(str)
    df["week_start"] = pd.to_datetime(df["week_start"])
    df["quantity"] = df["quantity"].astype(int)
    return df


# ---------------------------------------------------------------------------
# Feature engineering
# ---------------------------------------------------------------------------

def _build_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Adds lag, rolling, and calendar features per product.
    Rows with NaN lag values are kept for training (dropped automatically).
    """
    records = []
    for product_id, group in df.groupby("product_id"):
        g = group.sort_values("week_start").reset_index(drop=True).copy()
        g["lag_1"] = g["quantity"].shift(1)
        g["lag_2"] = g["quantity"].shift(2)
        g["lag_3"] = g["quantity"].shift(3)
        g["lag_4"] = g["quantity"].shift(4)
        g["rolling_mean_4"] = g["quantity"].shift(1).rolling(4).mean()
        g["rolling_std_4"] = g["quantity"].shift(1).rolling(4).std().fillna(0)
        g["week_of_year"] = g["week_start"].dt.isocalendar().week.astype(int)
        g["month"] = g["week_start"].dt.month
        g["is_first_half"] = (g["week_start"].dt.day <= 15).astype(int)
        records.append(g)

    return pd.concat(records, ignore_index=True)


def _encode_products(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """Label-encode product_id strings to integers for the model."""
    unique_ids = df["product_id"].unique()
    mapping = {pid: i for i, pid in enumerate(unique_ids)}
    df = df.copy()
    df["product_enc"] = df["product_id"].map(mapping)
    return df, mapping


# ---------------------------------------------------------------------------
# Model training
# ---------------------------------------------------------------------------

def _train_xgboost(df: pd.DataFrame):
    from xgboost import XGBRegressor

    train = df.dropna(subset=FEATURE_COLS + ["quantity"])
    if len(train) < 10:
        return None

    X = train[FEATURE_COLS]
    y = train["quantity"]

    model = XGBRegressor(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        random_state=42,
        verbosity=0,
    )
    model.fit(X, y)
    return model


def _compute_confidence(model, df: pd.DataFrame) -> float:
    """
    Rough confidence score: 1 - normalized MAE on training data.
    Clipped to [0.40, 0.99].
    """
    train = df.dropna(subset=FEATURE_COLS + ["quantity"])
    X_train = train[FEATURE_COLS]
    y_train = train["quantity"].values
    y_hat = model.predict(X_train)
    mae = np.mean(np.abs(y_train - y_hat))
    max_y = max(float(y_train.max()), 1.0)
    return float(np.clip(1 - mae / max_y, 0.40, 0.99))


# ---------------------------------------------------------------------------
# Prediction
# ---------------------------------------------------------------------------

def _next_monday() -> date:
    today = date.today()
    days_ahead = 7 - today.weekday()
    return today + timedelta(days=days_ahead if days_ahead < 7 else 0)


def _predict_next_week(
    df: pd.DataFrame,
    model,
    product_enc_map: dict,
) -> dict[str, float]:
    """
    Build features for next week and predict demand per product.
    Returns dict: product_id → predicted quantity (float).
    """
    next_week = _next_monday()
    predictions: dict[str, float] = {}

    for product_id, group in df.groupby("product_id"):
        group = group.sort_values("week_start")
        last_4 = group["quantity"].tail(4).tolist()
        while len(last_4) < 4:
            last_4.insert(0, 0)

        lag_1, lag_2, lag_3, lag_4 = last_4[-1], last_4[-2], last_4[-3], last_4[-4]
        rolling_mean = float(np.mean(last_4))
        rolling_std = float(np.std(last_4))

        features = {
            "product_enc": product_enc_map.get(product_id, 0),
            "lag_1": lag_1,
            "lag_2": lag_2,
            "lag_3": lag_3,
            "lag_4": lag_4,
            "rolling_mean_4": rolling_mean,
            "rolling_std_4": rolling_std,
            "week_of_year": next_week.isocalendar()[1],
            "month": next_week.month,
            "is_first_half": int(next_week.day <= 15),
        }
        X = pd.DataFrame([features])[FEATURE_COLS]
        predictions[product_id] = max(0.0, float(model.predict(X)[0]))

    return predictions


def _fallback_average(df: pd.DataFrame) -> dict[str, float]:
    """Rolling average of last 4 weeks — used when not enough data for ML."""
    return {
        pid: float(group["quantity"].tail(4).mean())
        for pid, group in df.groupby("product_id")
    }


# ---------------------------------------------------------------------------
# Alert level
# ---------------------------------------------------------------------------

def _alert_level(recommended: int, predicted: int) -> str:
    if predicted == 0:
        return "ok"
    ratio = recommended / max(predicted, 1)
    if ratio >= 0.8:
        return "critico"
    if ratio >= 0.4:
        return "moderado"
    return "ok"


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def run_forecast(db: Session, user_id: uuid.UUID) -> dict:
    """
    Trains or applies the demand forecasting model for a user and returns
    purchase recommendations. Also persists predictions to the DB.

    Returns a dict with:
      - recommendations: list of per-product recommendation dicts
      - total_products_analyzed: int
      - data_weeks_available: int
      - generated_at: datetime
    """
    weekly_df = _get_weekly_sales(db, user_id)
    generated_at = datetime.now(timezone.utc)

    if weekly_df.empty:
        return {
            "recommendations": [],
            "total_products_analyzed": 0,
            "data_weeks_available": 0,
            "generated_at": generated_at,
        }

    total_weeks = weekly_df["week_start"].nunique()
    feature_df = _build_features(weekly_df)
    feature_df, enc_map = _encode_products(feature_df)

    if total_weeks >= MIN_WEEKS_FOR_ML:
        model = _train_xgboost(feature_df)
        if model is not None:
            raw_preds = _predict_next_week(feature_df, model, enc_map)
            confidence = _compute_confidence(model, feature_df)
            model_type = "xgboost"
        else:
            raw_preds = _fallback_average(weekly_df)
            confidence = 0.5
            model_type = "average"
    else:
        raw_preds = _fallback_average(weekly_df)
        confidence = 0.5
        model_type = "average"

    # Load current stock per product
    stock_rows = db.execute(
        select(ProductStock).where(ProductStock.user_id == user_id)
    ).scalars().all()
    stock_map = {str(s.product_id): s.current_stock for s in stock_rows}

    # Load product details
    product_ids = [uuid.UUID(pid) for pid in raw_preds]
    products = db.execute(
        select(Product).where(Product.id.in_(product_ids))
    ).unique().scalars().all()
    product_map = {str(p.id): p for p in products}

    period_start = _next_monday()
    period_end = period_start + timedelta(days=6)

    # Replace old predictions for this user
    old_preds = db.execute(
        select(DemandPrediction).where(DemandPrediction.user_id == user_id)
    ).scalars().all()
    for old in old_preds:
        db.delete(old)

    recommendations = []
    for product_id_str, predicted_float in raw_preds.items():
        predicted_qty = max(0, round(predicted_float))
        current_stock = stock_map.get(product_id_str, 0)
        recommended = max(0, predicted_qty - current_stock)
        prod = product_map.get(product_id_str)

        db.add(DemandPrediction(
            user_id=user_id,
            product_id=uuid.UUID(product_id_str),
            predicted_quantity=predicted_qty,
            period_start=period_start,
            period_end=period_end,
            confidence=confidence,
            recommended_purchase=recommended,
            model_type=model_type,
            created_at=generated_at,
        ))

        recommendations.append({
            "product_id": product_id_str,
            "product_name": prod.name if prod else "Desconocido",
            "categories": [c.name for c in prod.categories] if prod else [],
            "current_stock": current_stock,
            "predicted_demand_7d": predicted_qty,
            "recommended_purchase": recommended,
            "confidence": round(confidence, 2),
            "model_type": model_type,
            "period_start": period_start,
            "period_end": period_end,
            "alert": _alert_level(recommended, predicted_qty),
        })

    db.commit()

    recommendations.sort(key=lambda x: x["recommended_purchase"], reverse=True)

    return {
        "recommendations": recommendations,
        "total_products_analyzed": len(recommendations),
        "data_weeks_available": total_weeks,
        "generated_at": generated_at,
    }
