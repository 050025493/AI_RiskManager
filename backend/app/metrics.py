import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    average_precision_score,
    precision_recall_curve,
    roc_auc_score,
)

ROOT = Path(__file__).resolve().parents[2]

ARTIFACT_DIR = ROOT / "ml" / "model_artifacts"
DATA_DIR = ROOT / "ml" / "data"

MODEL_FILE = ARTIFACT_DIR / "fraud_model_champion.joblib"
PREPROCESSOR_FILE = ARTIFACT_DIR / "preprocessor.joblib"
FEATURE_ORDER_FILE = ARTIFACT_DIR / "feature_order.joblib"

TRANSACTION_FILE = DATA_DIR / "curated" / "train_transaction_optimized.parquet"
IDENTITY_FILE = DATA_DIR / "raw" / "train_identity.csv"

METRICS_FILE = ARTIFACT_DIR / "evaluation_metrics.json"


def load_test_data():
    transactions = pd.read_parquet(TRANSACTION_FILE)
    identity = pd.read_csv(IDENTITY_FILE)

    sparse_threshold = 0.75

    missing_ratio = transactions.isna().mean()
    keep_columns = missing_ratio[missing_ratio <= sparse_threshold].index
    transactions = transactions[keep_columns].copy()

    identity_columns = identity.columns.tolist()

    data = transactions.merge(
        identity,
        on="TransactionID",
        how="left",
        suffixes=("", "_identity"),
    )

    data["has_identity"] = data[identity_columns].notna().any(axis=1).astype(int)

    identity_numeric = identity.select_dtypes(include=[np.number]).columns

    for column in identity_numeric:
        if column == "TransactionID":
            continue

        data[f"{column}_was_missing"] = data[column].isna().astype(int)

    data = data.sort_values("TransactionDT").reset_index(drop=True)

    split_index = int(len(data) * 0.8)
    test = data.iloc[split_index:].copy()

    return test


def generate_metrics():
    model = joblib.load(MODEL_FILE)
    preprocessor = joblib.load(PREPROCESSOR_FILE)
    feature_order = joblib.load(FEATURE_ORDER_FILE)

    test = load_test_data()

    y_test = test["isFraud"].astype(int)

    X_test = test.drop(
        columns=["isFraud", "TransactionID", "TransactionDT"],
        errors="ignore",
    )

    missing = [
        feature
        for feature in feature_order
        if feature not in X_test.columns
    ]

    if missing:
        raise RuntimeError(
            f"Missing required features: {missing}"
        )

    X_test = X_test[feature_order]

    X_processed = preprocessor.transform(X_test)

    probabilities = model.predict_proba(X_processed)[:, 1]

    pr_auc = average_precision_score(y_test, probabilities)
    roc_auc = roc_auc_score(y_test, probabilities)

    precision, recall, thresholds = precision_recall_curve(
        y_test,
        probabilities,
    )

    threshold_rows = []

    for index, threshold in enumerate(thresholds):
        tp = int(
            np.sum(
                (probabilities >= threshold)
                & (y_test.to_numpy() == 1)
            )
        )

        fp = int(
            np.sum(
                (probabilities >= threshold)
                & (y_test.to_numpy() == 0)
            )
        )

        fn = int(
            np.sum(
                (probabilities < threshold)
                & (y_test.to_numpy() == 1)
            )
        )

        tn = int(
            np.sum(
                (probabilities < threshold)
                & (y_test.to_numpy() == 0)
            )
        )

        review_rate = (tp + fp) / len(y_test)

        threshold_rows.append(
            {
                "threshold": float(threshold),
                "precision": float(precision[index]),
                "recall": float(recall[index]),
                "tp": tp,
                "fp": fp,
                "fn": fn,
                "tn": tn,
                "review_count": tp + fp,
                "review_rate": float(review_rate),
            }
        )

    result = {
        "test_samples": int(len(y_test)),
        "fraud_cases": int(y_test.sum()),
        "safe_cases": int((y_test == 0).sum()),
        "fraud_rate": float(y_test.mean()),
        "pr_auc": float(pr_auc),
        "roc_auc": float(roc_auc),
        "precision_recall_curve": [
            {
                "precision": float(p),
                "recall": float(r),
            }
            for p, r in zip(precision, recall)
        ],
        "threshold_analysis": threshold_rows,
    }

    with METRICS_FILE.open("w", encoding="utf-8") as file:
        json.dump(result, file)

    return result


def load_metrics():
    if not METRICS_FILE.exists():
        return generate_metrics()

    with METRICS_FILE.open("r", encoding="utf-8") as file:
        return json.load(file)