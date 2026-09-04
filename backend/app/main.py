import logging
from collections import Counter
from pathlib import Path

import numpy as np
import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import AnyHttpUrl, BaseModel
from .metrics import load_metrics
from .audit_log import record_prediction, get_audit_logs, update_alert
from .model_loader import prepare_features, preprocessor, model, feature_order
from .shap_explainer import explain_transaction
from .push_service import delete_subscription, save_subscription, send_high_risk_alert
from .supabase_store import is_configured, store_prediction


load_dotenv()


app = FastAPI(
    title="AI Risk Manager",
    description="Defense-only fraud risk scoring API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["*"],
)

logger = logging.getLogger("uvicorn.error")
ROOT = Path(__file__).resolve().parents[2]
TEST_DATA_DIR = ROOT / "ml" / "data" / "testing"
_test_transactions = None


class TransactionRequest(BaseModel):
    transaction_id: int
    transaction: dict


class AlertReviewRequest(BaseModel):
    status: str
    decision: str | None = None


class PushSubscriptionKeys(BaseModel):
    p256dh: str
    auth: str


class PushSubscriptionRequest(BaseModel):
    endpoint: AnyHttpUrl
    expirationTime: int | float | None = None
    keys: PushSubscriptionKeys


class PushSubscriptionEnvelope(BaseModel):
    subscription: PushSubscriptionRequest


class PushSubscriptionDeleteRequest(BaseModel):
    endpoint: AnyHttpUrl


def get_risk_level(score: float) -> str:
    if score >= 0.70:
        return "HIGH"
    if score >= 0.30:
        return "MEDIUM"
    return "LOW"


def load_test_transactions():
    global _test_transactions

    if _test_transactions is None:
        transaction_file = TEST_DATA_DIR / "test_transaction.csv"
        identity_file = TEST_DATA_DIR / "test_identity.csv"
        if not transaction_file.exists() or not identity_file.exists():
            raise FileNotFoundError("IEEE-CIS test transaction and identity files are required.")

        transactions = pd.read_csv(transaction_file)
        identity = pd.read_csv(identity_file)
        identity = identity.rename(columns=lambda column: column.replace("-", "_"))
        identity_ids = set(identity["TransactionID"])
        merged = transactions.merge(identity, on="TransactionID", how="left")
        merged["has_identity"] = merged["TransactionID"].isin(identity_ids).astype(np.int8)

        identity_numeric_columns = [
            column
            for column in identity.select_dtypes(include=["number"]).columns
            if column != "TransactionID"
        ]
        for column in identity_numeric_columns:
            merged[f"{column}_was_missing"] = merged[column].isnull().astype(np.int8)

        _test_transactions = merged

    return _test_transactions


def json_safe(value):
    if pd.isna(value):
        return None
    if isinstance(value, np.generic):
        return value.item()
    return value


def predict_and_record(transaction_id, transaction):
    X = prepare_features(transaction)
    X_processed = preprocessor.transform(X)
    probability = model.predict_proba(X_processed)[0, 1]
    risk_score = float(np.clip(probability, 0.0, 1.0))
    risk_level = get_risk_level(risk_score)
    reasons = explain_transaction(X_processed, top_k=3)
    action = "REVIEW" if risk_level != "LOW" else "MONITOR"

    record_prediction(
        transaction_id=transaction_id,
        risk_score=risk_score,
        risk_level=risk_level,
        action=action,
        reasons=reasons,
        amount=transaction.get("TransactionAmt"),
    )
    storage = store_prediction(
        transaction_id=transaction_id,
        transaction=transaction,
        risk_score=risk_score,
        risk_level=risk_level,
        action=action,
        reasons=reasons,
    )
    if is_configured() and not storage["stored"]:
        raise RuntimeError(storage["reason"])

    if risk_level == "HIGH":
        send_high_risk_alert({
            "transaction_id": transaction_id,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "action": action,
            "reasons": reasons,
        })

    return {
        "transaction_id": str(transaction_id),
        "risk_score": round(risk_score, 6),
        "risk_level": risk_level,
        "action": action,
        "reasons": reasons,
        "storage": storage,
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model": "fraud_model_champion",
    }


@app.post("/push-subscriptions", status_code=201)
def register_push_subscription(request: PushSubscriptionEnvelope):
    subscription = request.subscription.dict(exclude_none=True)
    subscription["endpoint"] = str(subscription["endpoint"])
    save_subscription(subscription)
    return {"registered": True}


@app.delete("/push-subscriptions")
def unregister_push_subscription(request: PushSubscriptionDeleteRequest):
    return {"removed": delete_subscription(str(request.endpoint))}


@app.post("/push-test")
def push_test():
    result = send_high_risk_alert({
        "transaction_id": "TEST-001",
        "risk_score": 0.99,
        "risk_level": "HIGH",
        "action": "REVIEW",
        "reasons": [],
    })

    return result


@app.get("/test-transactions")
def get_test_transactions(limit: int = 20):
    if limit < 1 or limit > 100:
        raise HTTPException(status_code=400, detail="Limit must be between 1 and 100.")

    try:
        test_data = load_test_transactions().head(limit)
        rows = []
        for _, row in test_data.iterrows():
            rows.append({
                "transaction_id": int(row["TransactionID"]),
                "amount": json_safe(row.get("TransactionAmt")),
                "has_identity": bool(row["has_identity"]),
            })
        return {"count": len(rows), "transactions": rows}
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.post("/test-transactions/analyze")
def analyze_test_transactions(offset: int = 0, limit: int = 25):
    if offset < 0 or limit < 1 or limit > 100:
        raise HTTPException(status_code=400, detail="Offset must be non-negative and limit must be between 1 and 100.")

    try:
        test_data = load_test_transactions().iloc[offset:offset + limit]
        results = []
        for _, row in test_data.iterrows():
            transaction_id = int(row["TransactionID"])
            transaction = {
                feature: json_safe(row[feature])
                for feature in feature_order
            }
            results.append(predict_and_record(transaction_id, transaction))
        return {
            "offset": offset,
            "count": len(results),
            "results": results,
        }
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.post("/test-transactions/{transaction_id}/predict")
def predict_test_transaction(transaction_id: int):
    try:
        test_data = load_test_transactions()
        matching_rows = test_data[test_data["TransactionID"] == transaction_id]
        if matching_rows.empty:
            raise HTTPException(status_code=404, detail="Test transaction not found.")

        row = matching_rows.iloc[0]
        transaction = {
            feature: json_safe(row[feature])
            for feature in feature_order
        }
        return predict_and_record(transaction_id, transaction)
    except HTTPException:
        raise
    except (FileNotFoundError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/predict")
def predict_transaction(request: TransactionRequest):
    try:
        return predict_and_record(request.transaction_id, request.transaction)

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        logger.error(
            f"Inference failed: {str(exc)}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=500,
            detail="Internal server error during risk scoring.",
        ) from exc


@app.get("/alerts")
def get_alerts(limit: int = 100):
    if limit < 1 or limit > 500:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 500.",
        )

    logs = get_audit_logs(limit)

    alerts = [
        log
        for log in logs
        if log["risk_level"] in {"HIGH", "MEDIUM"}
    ]

    return {
        "count": len(alerts),
        "alerts": alerts,
    }


@app.get("/transactions")
def get_transactions(limit: int = 100):
    if limit < 1 or limit > 500:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 500.",
        )

    logs = get_audit_logs(limit)

    return {
        "count": len(logs),
        "transactions": logs,
    }


@app.patch("/alerts/{transaction_id}")
def review_alert(transaction_id: str, request: AlertReviewRequest):
    if request.status not in {"PENDING", "REVIEWED", "ESCALATED", "CLEARED"}:
        raise HTTPException(status_code=400, detail="Unsupported review status.")

    if request.decision is not None and request.decision not in {"CLEARED", "ESCALATED"}:
        raise HTTPException(status_code=400, detail="Decision must be CLEARED or ESCALATED.")

    alert = update_alert(transaction_id, request.status, request.decision)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found.")

    return alert


@app.get("/dashboard/summary")
def dashboard_summary():
    logs = get_audit_logs(500)

    risk_counts = Counter(
        log["risk_level"]
        for log in logs
    )

    review_count = sum(
        1
        for log in logs
        if log["action"] == "REVIEW"
    )

    return {
        "total_transactions": len(logs),
        "high_risk": risk_counts.get("HIGH", 0),
        "medium_risk": risk_counts.get("MEDIUM", 0),
        "low_risk": risk_counts.get("LOW", 0),
        "review_required": review_count,
    }
@app.get("/metrics")
def get_metrics():
    metrics = load_metrics()

    return {
        "test_samples": metrics["test_samples"],
        "fraud_cases": metrics["fraud_cases"],
        "safe_cases": metrics["safe_cases"],
        "fraud_rate": metrics["fraud_rate"],
        "pr_auc": metrics["pr_auc"],
        "roc_auc": metrics["roc_auc"],
    }
@app.get("/threshold-analysis")
def threshold_analysis(review_cost: float = 50.0, missed_fraud_cost: float = 100.0):
    if review_cost < 0:
        raise HTTPException(
            status_code=400,
            detail="review_cost must be non-negative."
        )

    if missed_fraud_cost < 0:
        raise HTTPException(
            status_code=400,
            detail="missed_fraud_cost must be non-negative."
        )

    metrics = load_metrics()
    rows = metrics["threshold_analysis"]

    selected_thresholds = [
        0.10,
        0.20,
        0.30,
        0.40,
        0.50,
        0.60,
        0.70,
        0.80,
        0.90,
        0.95,
    ]

    operating_points = []

    for target in selected_thresholds:
        closest = min(
            rows,
            key=lambda row: abs(row["threshold"] - target)
        )

        tp = closest["tp"]
        fp = closest["fp"]
        fn = closest["fn"]

        review_cost_total = (tp + fp) * review_cost
        missed_fraud_cost_total = fn * missed_fraud_cost
        total_cost = review_cost_total + missed_fraud_cost_total

        operating_points.append({
            "threshold": round(float(closest["threshold"]), 4),
            "precision": round(float(closest["precision"]), 4),
            "recall": round(float(closest["recall"]), 4),
            "review_count": closest["review_count"],
            "review_rate": round(float(closest["review_rate"]), 4),
            "tp": tp,
            "fp": fp,
            "fn": fn,
            "tn": closest["tn"],
            "review_cost": round(review_cost_total, 2),
            "missed_fraud_cost": round(missed_fraud_cost_total, 2),
            "total_cost": round(total_cost, 2),
        })

    best = min(
        operating_points,
        key=lambda row: row["total_cost"]
    )

    return {
        "assumptions": {
            "review_cost_per_transaction": review_cost,
            "missed_fraud_cost_per_transaction": missed_fraud_cost,
        },
        "operating_points": operating_points,
        "lowest_cost_point": best,
    }
@app.get("/pr-curve")
def pr_curve(points: int = 100):
    if points < 10 or points > 500:
        raise HTTPException(
            status_code=400,
            detail="points must be between 10 and 500."
        )

    metrics = load_metrics()
    curve = metrics["precision_recall_curve"]

    if len(curve) <= points:
        sampled_curve = curve
    else:
        indices = np.linspace(
            0,
            len(curve) - 1,
            points,
            dtype=int
        )

        sampled_curve = [
            curve[index]
            for index in indices
        ]

    return {
        "pr_auc": metrics["pr_auc"],
        "points": len(sampled_curve),
        "curve": sampled_curve
    }
