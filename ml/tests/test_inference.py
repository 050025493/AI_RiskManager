import pytest
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
import shap

ROOT = Path(__file__).resolve().parents[2]

RAW_DIR = ROOT / "ml" / "data" / "raw"
CURATED_DIR = ROOT / "ml" / "data" / "curated"
ARTIFACT_DIR = ROOT / "ml" / "model_artifacts"

TRANSACTION_FILE = CURATED_DIR / "train_transaction_optimized.parquet"
IDENTITY_FILE = RAW_DIR / "train_identity.csv"

MODEL_FILE = ARTIFACT_DIR / "fraud_model_champion.joblib"
PREPROCESSOR_FILE = ARTIFACT_DIR / "preprocessor.joblib"
FEATURE_ORDER_FILE = ARTIFACT_DIR / "feature_order.joblib"


def sparse_filter(df, threshold=0.75):
    missing_rates = df.isnull().mean()
    columns_to_drop = missing_rates[missing_rates > threshold].index.tolist()
    return df.drop(columns=columns_to_drop)

# ==========================================
# 1. FIXTURES (Run strictly ONCE per session)
# ==========================================

@pytest.fixture(scope="session")
def pipeline_artifacts():
    model = joblib.load(MODEL_FILE)
    preprocessor = joblib.load(PREPROCESSOR_FILE)
    feature_order = joblib.load(FEATURE_ORDER_FILE)
    return model, preprocessor, feature_order

@pytest.fixture(scope="session")
def prepared_sample():
    df_tx = pd.read_parquet(TRANSACTION_FILE)
    df_id = pd.read_csv(IDENTITY_FILE)

    identity_ids = set(df_id["TransactionID"])

    df_tx = sparse_filter(df_tx)
    df_id = sparse_filter(df_id)

    df = df_tx.merge(df_id, on="TransactionID", how="left")

    df["has_identity"] = df["TransactionID"].isin(identity_ids).astype(np.int8)

    identity_numeric_cols = [
        col for col in df_id.select_dtypes(include=["number"]).columns
        if col != "TransactionID"
    ]

    for col in identity_numeric_cols:
        df[f"{col}_was_missing"] = df[col].isnull().astype(np.int8)

    df = df.sort_values("TransactionDT").reset_index(drop=True)
    split_idx = int(len(df) * 0.8)
    test_df = df.iloc[split_idx:]
    sample = test_df.iloc[[0]].copy()

    actual_label = int(sample["isFraud"].iloc[0])
    transaction_id = sample["TransactionID"].iloc[0]

    X = sample.drop(columns=["isFraud", "TransactionID", "TransactionDT"])

    return X, transaction_id, actual_label

# ==========================================
# 2. TEST CASES (Lightning fast using cached fixtures)
# ==========================================

def test_real_artifacts_load(pipeline_artifacts):
    model, preprocessor, feature_order = pipeline_artifacts

    assert model is not None
    assert preprocessor is not None
    assert feature_order is not None
    
    assert model.n_features_in_ == 271
    assert len(feature_order) == 271
    assert model.n_features_in_ == len(feature_order)


def test_real_feature_alignment(pipeline_artifacts, prepared_sample):
    _, _, feature_order = pipeline_artifacts
    X, _, _ = prepared_sample

    missing = [f for f in feature_order if f not in X.columns]
    extra = [f for f in X.columns if f not in feature_order]

    assert not missing, f"Missing features: {missing}"
    assert not extra, f"Unexpected features: {extra}"

    X = X[feature_order]
    assert list(X.columns) == feature_order
    assert X.shape[1] == 271


def test_real_preprocessing(pipeline_artifacts, prepared_sample):
    model, preprocessor, feature_order = pipeline_artifacts
    X, _, _ = prepared_sample
    
    X = X[feature_order]
    X_processed = preprocessor.transform(X)

    assert X_processed.shape == (1, 271)
    assert X_processed.shape[1] == model.n_features_in_
    assert not np.isnan(X_processed).any()


def test_real_model_prediction(pipeline_artifacts, prepared_sample):
    model, preprocessor, feature_order = pipeline_artifacts
    X, transaction_id, actual_label = prepared_sample
    
    X = X[feature_order]
    X_processed = preprocessor.transform(X)
    
    probability = model.predict_proba(X_processed)[0, 1]

    assert np.isfinite(probability)
    assert 0.0 <= probability <= 1.0

    print(f"\nTransaction ID: {transaction_id}")
    print(f"Actual label: {actual_label}")
    print(f"Fraud probability: {probability:.6f}")


def test_real_shap_explanation(pipeline_artifacts, prepared_sample):
    model, preprocessor, feature_order = pipeline_artifacts
    X, _, _ = prepared_sample

    X = X[feature_order]
    X_processed = preprocessor.transform(X)

    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_processed)

    if isinstance(shap_values, list):
        shap_values = shap_values[-1]

    shap_values = np.asarray(shap_values)

    if shap_values.ndim == 3:
        row_shap = shap_values[0, :, -1]
    elif shap_values.ndim == 2:
        row_shap = shap_values[0]
    else:
        raise AssertionError(f"Unexpected SHAP shape: {shap_values.shape}")

    assert len(row_shap) == 271
    assert len(row_shap) == len(feature_order)
    assert np.isfinite(row_shap).all()

    top_indices = np.argsort(np.abs(row_shap))[::-1][:3]
    assert len(top_indices) == 3

    print("\nTop 3 SHAP features:")
    for rank, index in enumerate(top_indices, start=1):
        feature = feature_order[index]
        contribution = float(row_shap[index])
        direction = "increases risk" if contribution > 0 else "decreases risk"
        print(f"{rank}. {feature} | {direction} | {contribution:.4f}")