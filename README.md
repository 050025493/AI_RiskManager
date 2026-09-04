# AI Risk Manager

AI Risk Manager is a **defense-first fraud risk scoring platform** with:
- a **FastAPI backend** for fraud inference, explanations, alerting, and metrics
- a **React + Vite frontend** for analyst workflows and monitoring
- **ML artifacts** (model, preprocessor, feature schema, evaluation metadata) for reproducible scoring

The application is designed for **human-in-the-loop review**. It scores transactions and routes medium/high-risk outcomes for analyst action instead of auto-blocking payments.

## Repository Structure

```text
AI_RiskManager/
├── backend/          # FastAPI service, audit logs, notifications, persistence hooks
├── frontend/         # React dashboard and review interface
├── ml/               # Model artifacts, notebook assets, inference tests
└── README.md
```

## Core Features

- **Risk scoring API** with LOW / MEDIUM / HIGH risk bands
- **Top feature explanations** using SHAP for each prediction
- **Alert queue workflow** with review status updates (pending, reviewed, escalated, cleared)
- **Dashboard summary** for transaction and risk monitoring
- **Model performance view** with PR/ROC metrics, PR curve, and threshold-cost analysis
- **Test transaction lab** to evaluate batches from IEEE-CIS-style test data
- **Optional web push notifications** for high-risk events
- **Optional Supabase persistence** for transactions, predictions, explanations, alerts, and audit logs

## Tech Stack

- **Backend:** Python, FastAPI, scikit-learn, SHAP, Uvicorn
- **Frontend:** React, Vite, Tailwind CSS, Lucide icons
- **Data/Model:** joblib model artifacts and evaluation JSON
- **Storage (optional):** Supabase

## Prerequisites

- Python 3.10+ (recommended)
- Node.js 18+ and npm

## Local Setup

### 1) Clone and enter the repository

```bash
git clone <your-fork-or-repo-url>
cd AI_RiskManager
```

### 2) Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### 3) Frontend setup

```bash
cd frontend
npm install
cd ..
```

## Environment Configuration

### Frontend (`/frontend/.env`)

```env
VITE_API_URL=http://localhost:8000
VITE_VAPID_PUBLIC_KEY=your_public_vapid_key
VITE_PUSH_SUBSCRIPTION_URL=/push-subscriptions
```

### Backend (`/.env` or `/backend/.env`)

```env
# Optional: push notifications
VAPID_PRIVATE_KEY=your_private_vapid_key
VAPID_SUBJECT=mailto:security-team@example.com

# Optional: Supabase persistence
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

> If Supabase is not configured, the API still runs and returns a storage status explaining that persistence is disabled.

## Running the Application

### Start backend

```bash
cd backend
uvicorn app.main:app --reload
```

Backend default URL: `http://127.0.0.1:8000`

### Start frontend (new terminal)

```bash
cd frontend
npm run dev
```

Frontend default URL: `http://localhost:5173`

## Main API Endpoints

- `GET /health` — service health check
- `POST /predict` — score one transaction payload
- `GET /alerts` — fetch review alerts
- `PATCH /alerts/{transaction_id}` — update review state/decision
- `GET /transactions` — fetch recent audit entries
- `GET /dashboard/summary` — dashboard totals
- `GET /metrics` — model evaluation metrics
- `GET /threshold-analysis` — threshold operating points + cost assumptions
- `GET /pr-curve` — sampled precision-recall curve
- `GET /test-transactions` — fetch test records
- `POST /test-transactions/analyze` — score a test batch
- `POST /test-transactions/{transaction_id}/predict` — score one test transaction
- `POST /push-subscriptions` / `DELETE /push-subscriptions` — manage browser push endpoints

## Data and Artifacts

The backend expects trained artifacts in:
- `/ml/model_artifacts/fraud_model_champion.joblib`
- `/ml/model_artifacts/preprocessor.joblib`
- `/ml/model_artifacts/feature_order.joblib`

Some evaluation and test flows also expect IEEE-CIS dataset files under `/ml/data` (for example `raw/train_identity.csv` and `curated/train_transaction_optimized.parquet`).

## Running Tests

From repository root:

```bash
pytest ml/tests/test_inference.py
```

This validates artifact loading, feature alignment, preprocessing, prediction behavior, and SHAP output shape.

## Notes

- Audit logs are written to `backend/logs/audit_log.jsonl`.
- Push subscriptions are stored in `backend/logs/push_subscriptions.json`.
- The UI is optimized for analyst review workflows and operational monitoring.
