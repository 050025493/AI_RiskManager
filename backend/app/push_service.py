import json
import logging
import os
from pathlib import Path
from threading import Lock

from dotenv import load_dotenv

logger = logging.getLogger(__name__)
ROOT = Path(__file__).resolve().parents[2]
SUBSCRIPTIONS_FILE = ROOT / "backend" / "logs" / "push_subscriptions.json"
SUBSCRIPTIONS_LOCK = Lock()

load_dotenv(ROOT / ".env")
load_dotenv(ROOT / "backend" / ".env")


def _read_subscriptions():
    if not SUBSCRIPTIONS_FILE.exists():
        return {}

    try:
        with SUBSCRIPTIONS_FILE.open("r", encoding="utf-8") as file:
            data = json.load(file)
        return data if isinstance(data, dict) else {}
    except (OSError, json.JSONDecodeError):
        logger.exception("Could not read push subscriptions.")
        return {}


def _write_subscriptions(subscriptions):
    SUBSCRIPTIONS_FILE.parent.mkdir(parents=True, exist_ok=True)
    temporary_file = SUBSCRIPTIONS_FILE.with_suffix(".tmp")

    with temporary_file.open("w", encoding="utf-8") as file:
        json.dump(subscriptions, file)

    temporary_file.replace(SUBSCRIPTIONS_FILE)


def save_subscription(subscription):
    endpoint = subscription["endpoint"]

    with SUBSCRIPTIONS_LOCK:
        subscriptions = _read_subscriptions()
        subscriptions[endpoint] = subscription
        _write_subscriptions(subscriptions)


def delete_subscription(endpoint):
    with SUBSCRIPTIONS_LOCK:
        subscriptions = _read_subscriptions()
        removed = subscriptions.pop(endpoint, None) is not None
        if removed:
            _write_subscriptions(subscriptions)
        return removed


def send_high_risk_alert(alert):
    private_key = os.getenv("VAPID_PRIVATE_KEY")
    subject = os.getenv("VAPID_SUBJECT")

    if not private_key or not subject:
        logger.warning("Push delivery skipped: VAPID configuration is incomplete.")
        return {"sent": 0, "failed": 0, "skipped": True}

    try:
        from pywebpush import WebPushException, webpush
    except ImportError:
        logger.error("Push delivery unavailable: install backend requirements.")
        return {"sent": 0, "failed": 0, "skipped": True}

    payload = json.dumps({
    "title": "RiskEngine • High Risk Alert",
    "body": (
        f"Transaction {alert['transaction_id']} "
        f"has been flagged for human review."
    ),
    "url": "/?page=alerts",
    "tag": f"risk-alert-{alert['transaction_id']}",
    "priority": "HIGH",
    })
    result = {"sent": 0, "failed": 0, "skipped": False}

    with SUBSCRIPTIONS_LOCK:
        subscriptions = _read_subscriptions()

        for endpoint, subscription in list(subscriptions.items()):
            try:
                webpush(
                    subscription_info=subscription,
                    data=payload,
                    vapid_private_key=private_key,
                    vapid_claims={"sub": subject},
                )
                result["sent"] += 1
            except WebPushException as error:
                result["failed"] += 1
                status_code = getattr(error.response, "status_code", None)
                if status_code in {404, 410}:
                    subscriptions.pop(endpoint, None)
                logger.warning("Push delivery failed for endpoint: %s", endpoint)
            except Exception:
                result["failed"] += 1
                logger.exception("Unexpected push delivery failure.")

        _write_subscriptions(subscriptions)

    return result