import numpy as np
import shap

from .model_loader import model, feature_order


explainer = shap.TreeExplainer(model)

FEATURE_LABELS = {
    "TransactionAmt": "unusual transaction amount",
    "has_identity": "identity/device information is missing",
}


def explain_transaction(feature_vector, top_k=3):
    feature_vector = np.asarray(feature_vector)

    if feature_vector.ndim != 2:
        raise ValueError(
            f"Expected 2D feature vector, got shape {feature_vector.shape}"
        )

    if feature_vector.shape[1] != len(feature_order):
        raise ValueError(
            f"Expected {len(feature_order)} features, "
            f"got {feature_vector.shape[1]}"
        )

    shap_values = explainer.shap_values(feature_vector)

    if isinstance(shap_values, list):
        shap_values = shap_values[-1]

    shap_values = np.asarray(shap_values)

    if shap_values.ndim == 3:
        row_shap = shap_values[0, :, -1]
    elif shap_values.ndim == 2:
        row_shap = shap_values[0]
    else:
        raise ValueError(
            f"Unexpected SHAP output shape: {shap_values.shape}"
        )

    top_indices = np.argsort(np.abs(row_shap))[::-1][:top_k]

    reasons = []

    for index in top_indices:
        feature = feature_order[index]
        contribution = float(row_shap[index])

        reasons.append({
            "feature": feature,
            "label": FEATURE_LABELS.get(feature, feature),
            "contribution": round(contribution, 4),
            "direction": (
                "increases risk"
                if contribution > 0
                else "decreases risk"
            ),
        })

    return reasons