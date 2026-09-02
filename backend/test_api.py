import json
from pathlib import Path
from urllib.request import Request, urlopen

import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]

TRANSACTION_FILE = (
    ROOT / "ml" / "data" / "curated" / "train_transaction_optimized.parquet"
)

IDENTITY_FILE = ROOT / "ml" / "data" / "raw" / "train_identity.csv"


def sparse_filter(df, threshold=0.75):
    missing_rates = df.isnull().mean()
    columns_to_drop = missing_rates[missing_rates > threshold].index.tolist()
    return df.drop(columns=columns_to_drop)


df_tx = pd.read_parquet(TRANSACTION_FILE)
df_id = pd.read_csv(IDENTITY_FILE)

identity_ids = set(df_id["TransactionID"])

df_tx = sparse_filter(df_tx)
df_id = sparse_filter(df_id)

df = df_tx.merge(
    df_id,
    on="TransactionID",
    how="left",
)

df["has_identity"] = (
    df["TransactionID"].isin(identity_ids).astype(np.int8)
)

identity_numeric_cols = [
    col
    for col in df_id.select_dtypes(include=["number"]).columns
    if col != "TransactionID"
]

for col in identity_numeric_cols:
    df[f"{col}_was_missing"] = df[col].isnull().astype(np.int8)

df = df.sort_values("TransactionDT").reset_index(drop=True)

split_idx = int(len(df) * 0.8)
test_df = df.iloc[split_idx:]

sample = test_df.iloc[[0]].copy()

transaction_id = sample["TransactionID"].iloc[0]
actual_label = int(sample["isFraud"].iloc[0])

X = sample.drop(
    columns=["isFraud", "TransactionID", "TransactionDT"]
)

payload_transaction = json.loads(
    X.to_json(orient="records")
)[0]

payload = json.dumps({
    "transaction_id": int(transaction_id),
    "transaction": payload_transaction
}).encode("utf-8")

request = Request(
    "http://127.0.0.1:8000/predict",
    data=payload,
    headers={"Content-Type": "application/json"},
    method="POST",
)

print(f"Transaction ID: {transaction_id}")
print(f"Actual label: {actual_label}")
print("Sending transaction to /predict...")

try:
    with urlopen(request) as response:
        result = json.loads(response.read().decode("utf-8"))

    print("\nAPI response:")
    print(json.dumps(result, indent=2))

except Exception as exc:
    print(f"\nAPI request failed: {exc}")
    raise