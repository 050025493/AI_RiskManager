import logging
import os

from dotenv import load_dotenv

from .model_loader import feature_order

load_dotenv()

logger = logging.getLogger(__name__)
_client = None


def get_client():
    global _client
    if _client is not None:
        return _client

    url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not service_key:
        return None

    try:
        from supabase import create_client
        _client = create_client(url, service_key)
        return _client
    except Exception:
        logger.exception("Could not initialize Supabase client.")
        return None


def is_configured():
    return bool(os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_SERVICE_ROLE_KEY"))


def store_prediction(transaction_id, transaction, risk_score, risk_level, action, reasons):
    client = get_client()
    if client is None:
        return {"stored": False, "reason": "Supabase is not configured."}

    transaction_id = str(transaction_id)
    transaction_row = {
        "transaction_id": transaction_id,
        "source": "ieee_cis_test",
        "transaction_amt": transaction.get("TransactionAmt"),
        "features": {feature: transaction.get(feature) for feature in feature_order},
    }

    try:
        transaction_response = client.table("transactions").upsert(
            transaction_row,
            on_conflict="transaction_id",
        ).execute()
        transaction_data = transaction_response.data[0]

        prediction_response = client.table("predictions").insert({
            "transaction_id": transaction_id,
            "risk_score": float(risk_score),
            "risk_level": risk_level,
            "action": action,
            "model_version": "fraud_model_champion",
        }).execute()
        prediction_data = prediction_response.data[0]
        prediction_id = prediction_data["id"]

        explanation_rows = [
            {
                "prediction_id": prediction_id,
                "feature": reason["feature"],
                "label": reason.get("label"),
                "contribution": float(reason["contribution"]),
                "direction": reason["direction"],
                "rank": rank,
            }
            for rank, reason in enumerate(reasons, start=1)
        ]
        if explanation_rows:
            client.table("explanations").insert(explanation_rows).execute()

        if risk_level in {"HIGH", "MEDIUM"}:
            client.table("alerts").insert({
                "prediction_id": prediction_id,
                "transaction_id": transaction_id,
                "status": "PENDING",
            }).execute()

        client.table("audit_logs").insert({
            "transaction_id": transaction_id,
            "event_type": "PREDICTION_CREATED",
            "details": {
                "prediction_id": prediction_id,
                "risk_level": risk_level,
                "risk_score": float(risk_score),
                "action": action,
            },
        }).execute()

        return {
            "stored": True,
            "transaction_id": transaction_data["transaction_id"],
            "prediction_id": prediction_id,
        }
    except Exception:
        logger.exception("Supabase persistence failed for transaction %s.", transaction_id)
        return {"stored": False, "reason": "Supabase persistence failed."}
