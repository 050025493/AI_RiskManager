import logging
from collections import Counter

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .metrics import load_metrics
from .audit_log import record_prediction, get_audit_logs, update_alert
from .model_loader import prepare_features, preprocessor, model
from .shap_explainer import explain_transaction


app = FastAPI(
    title="AI Risk Manager",
    description="Defense-only fraud risk scoring API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1):\d+",
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["*"],
)

logger = logging.getLogger("uvicorn.error")


class TransactionRequest(BaseModel):
    transaction_id: int
    transaction: dict


class AlertReviewRequest(BaseModel):
    status: str
    decision: str | None = None


def get_risk_level(score: float) -> str:
    if score >= 0.70:
        return "HIGH"
    if score >= 0.30:
        return "MEDIUM"
    return "LOW"


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model": "fraud_model_champion",
    }


@app.post("/predict")
def predict_transaction(request: TransactionRequest):
    try:
        X = prepare_features(request.transaction)
        X_processed = preprocessor.transform(X)

        probability = model.predict_proba(X_processed)[0, 1]
        risk_score = float(np.clip(probability, 0.0, 1.0))
        risk_level = get_risk_level(risk_score)

        reasons = explain_transaction(X_processed, top_k=3)

        action = "REVIEW" if risk_level != "LOW" else "MONITOR"

        record_prediction(
            transaction_id=request.transaction_id,
            risk_score=risk_score,
            risk_level=risk_level,
            action=action,
            reasons=reasons,
            amount=request.transaction.get("TransactionAmt"),
        )

        return {
            "risk_score": round(risk_score, 6),
            "risk_level": risk_level,
            "action": action,
            "reasons": reasons,
        }

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
