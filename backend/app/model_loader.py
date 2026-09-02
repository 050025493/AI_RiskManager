from pathlib import Path

import joblib
import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parents[2]
ARTIFACT_DIR = ROOT / "ml" / "model_artifacts"

MODEL_FILE = ARTIFACT_DIR / "fraud_model_champion.joblib"
PREPROCESSOR_FILE = ARTIFACT_DIR / "preprocessor.joblib"
FEATURE_ORDER_FILE = ARTIFACT_DIR / "feature_order.joblib"


model = joblib.load(MODEL_FILE)
preprocessor = joblib.load(PREPROCESSOR_FILE)
feature_order = joblib.load(FEATURE_ORDER_FILE)


if model.n_features_in_ != len(feature_order):
    raise RuntimeError(
        f"Feature mismatch: model expects {model.n_features_in_}, "
        f"but feature_order contains {len(feature_order)} features."
    )


def prepare_features(data: dict) -> pd.DataFrame:
    X = pd.DataFrame([data])

    missing = [feature for feature in feature_order if feature not in X.columns]

    if missing:
        raise ValueError(
            f"Missing required features: {missing}"
        )

    X = X[feature_order]

    return X


def predict(data: dict) -> float:
    X = prepare_features(data)

    X_processed = preprocessor.transform(X)

    probability = model.predict_proba(X_processed)[0, 1]

    return float(np.clip(probability, 0.0, 1.0))