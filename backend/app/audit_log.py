import json
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
LOG_DIR = ROOT / "backend" / "logs"
LOG_FILE = LOG_DIR / "audit_log.jsonl"


def record_prediction(
    transaction_id,
    risk_score,
    risk_level,
    action,
    reasons,
    amount=None,
):
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "transaction_id": str(transaction_id),
        "risk_score": float(risk_score),
        "risk_level": risk_level,
        "action": action,
        "reasons": reasons,
        "amount": amount,
        "review_status": "PENDING",
    }

    with LOG_FILE.open("a", encoding="utf-8") as file:
        file.write(json.dumps(entry) + "\n")

    return entry


def update_alert(transaction_id, status, decision=None):
    if not LOG_FILE.exists():
        return None

    with LOG_FILE.open("r", encoding="utf-8") as file:
        lines = file.readlines()

    updated_alert = None
    updated_lines = []

    for line in lines:
        try:
            alert = json.loads(line)
        except json.JSONDecodeError:
            updated_lines.append(line)
            continue

        if str(alert.get("transaction_id")) == str(transaction_id) and alert.get("risk_level") in {"HIGH", "MEDIUM"}:
            alert["review_status"] = status
            if decision is not None:
                alert["reviewer_decision"] = decision
            alert["reviewed_at"] = datetime.now(timezone.utc).isoformat()
            updated_alert = alert

        updated_lines.append(json.dumps(alert) + "\n")

    if updated_alert is None:
        return None

    with LOG_FILE.open("w", encoding="utf-8") as file:
        file.writelines(updated_lines)

    return updated_alert


def get_audit_logs(limit=100):
    if not LOG_FILE.exists():
        return []

    with LOG_FILE.open("r", encoding="utf-8") as file:
        lines = file.readlines()

    logs = []

    for line in reversed(lines[-limit:]):
        try:
            alert = json.loads(line)
            alert.setdefault("review_status", "PENDING")
            logs.append(alert)
        except json.JSONDecodeError:
            continue

    return logs