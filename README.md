# Early Sepsis Detector

An AI-powered ICU monitoring system that predicts sepsis risk from patient vitals, generates clinical summaries via MedGemma, and dispatches HTML alert emails to clinicians.

Built for **Hack The Knight 2025**.

---

## Architecture

```
CSV Upload (ICU vitals)
        ↓
POST /predict  →  XGBoost classifier (30 engineered features)
                  + SHAP explainability at alert hour
        ↓
POST /generate-report  →  MedGemma 1.5 (via Ollama) → clinical summary
                          + Gmail SMTP → HTML alert email
```

**Stack:** FastAPI · XGBoost · SHAP · Ollama (MedGemma) · Gmail SMTP · Python 3.13

---

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| Python 3.13 | `python3 --version` to verify |
| Ollama | Local LLM runner — install from [ollama.com](https://ollama.com) |
| Gmail account with 2FA | Required for App Password (email alerts) |

---

## Installation

### 1. Clone the repository

```bash
git clone <repo-url>
cd sepsis_detector
```

### 2. Create and activate the virtual environment

```bash
python3 -m venv venv
source venv/bin/activate        # macOS / Linux
# venv\Scripts\activate         # Windows
```

### 3. Install dependencies

```bash
pip install -r backend/requirements.txt
```

---

## Configuration

Create a `.env` file inside the `backend/` directory:

```bash
touch backend/.env
```

Add the following five keys:

```env
SENDER_EMAIL=your-gmail@gmail.com
SENDER_APP_PASSWORD=xxxx xxxx xxxx xxxx
RECIPIENT_EMAIL=doctor@example.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

**How to get a Gmail App Password:**
1. Enable 2-Factor Authentication on your Google account
2. Go to `myaccount.google.com → Security → 2-Step Verification → App Passwords`
3. Generate a new App Password for "Mail"
4. Paste the 16-character password (with spaces) as `SENDER_APP_PASSWORD`

> `.env` is gitignored and will never be committed.

---

## Ollama Setup

The `/generate-report` endpoint requires Ollama running locally with the MedGemma model.

### Start Ollama

```bash
ollama serve
```

### Pull the MedGemma model (first time only — ~2.5 GB download)

```bash
ollama pull dcarrascosa/medgemma-1.5-4b-it:Q4_K_M
```

### Verify

```bash
curl http://localhost:11434/api/tags
```

You should see JSON listing the available models.

---

## Running the Server

```bash
cd backend
source ../venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The server starts at `http://localhost:8000`. Watch for:
```
INFO:     Loading model artifacts...
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Interactive API docs (Swagger UI):** `http://localhost:8000/docs`

---

## API Reference

### GET /health

Health check — confirms the ML model loaded successfully.

```bash
curl http://localhost:8000/health
```

```json
{ "status": "ok", "model_loaded": true }
```

---

### POST /predict

Accepts an ICU patient CSV file and returns a time-series risk assessment.

```bash
curl -X POST http://localhost:8000/predict \
  -F "file=@backend/demo_data/sepsis_patient_DEMO.csv" \
  | python3 -m json.tool
```

**Response:**
```json
{
  "patient_id": "p001",
  "hours": [0, 1, 2, ...],
  "risk_scores": [0.12, 0.18, ..., 0.83],
  "alert_triggered": true,
  "alert_hour": 10,
  "threshold": 0.65,
  "shap_values": {
    "HR": 0.32,
    "Temp": 0.21,
    "Resp": 0.18
  },
  "vitals_summary": {
    "HR": [88, 91, null, 97, ...],
    "Temp": [37.2, 37.5, ...],
    "Resp": [18, 20, ...]
  }
}
```

| Field | Description |
|-------|-------------|
| `alert_triggered` | `true` if any risk score exceeded the threshold |
| `alert_hour` | ICU hour at which the alert fired |
| `shap_values` | Feature contributions at the alert hour |
| `vitals_summary` | Raw vitals per hour (may contain `null` for sparse data) |

---

### POST /generate-report

Generates a MedGemma clinical summary and dispatches an HTML email alert.
Pass the response body from `/predict` directly as the request body.

```bash
# Save predict response first
curl -X POST http://localhost:8000/predict \
  -F "file=@backend/demo_data/sepsis_patient_DEMO.csv" \
  -s > /tmp/predict_response.json

# Generate report + send email
curl -X POST http://localhost:8000/generate-report \
  -H "Content-Type: application/json" \
  -d @/tmp/predict_response.json \
  | python3 -m json.tool
```

> This call takes 10–30 seconds — MedGemma is generating the clinical narrative.

**Response:**
```json
{
  "clinical_summary": "The patient presents with tachycardia and elevated respiratory rate...",
  "email_sent": true,
  "email_recipient": "doctor@example.com"
}
```

---

## Testing with Demo Data

Two demo CSV files are included:

| File | Expected Result |
|------|----------------|
| `backend/demo_data/sepsis_patient_DEMO.csv` | `alert_triggered: true`, peak score > 0.65 |
| `backend/demo_data/healthy_patient_DEMO.csv` | `alert_triggered: false`, all scores < 0.65 |

Run the full test sequence:

```bash
# 1. Health check
curl http://localhost:8000/health

# 2. Sepsis patient — should trigger alert
curl -X POST http://localhost:8000/predict \
  -F "file=@backend/demo_data/sepsis_patient_DEMO.csv" \
  | python3 -m json.tool

# 3. Healthy patient — should NOT trigger alert
curl -X POST http://localhost:8000/predict \
  -F "file=@backend/demo_data/healthy_patient_DEMO.csv" \
  | python3 -m json.tool

# 4. Full report (email) — requires Ollama running and .env configured
curl -X POST http://localhost:8000/predict \
  -F "file=@backend/demo_data/sepsis_patient_DEMO.csv" \
  -s > /tmp/predict_response.json && \
curl -X POST http://localhost:8000/generate-report \
  -H "Content-Type: application/json" \
  -d @/tmp/predict_response.json \
  | python3 -m json.tool
```

---

## Project Structure

```
sepsis_detector/
├── venv/                          # Python virtual environment (gitignored)
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI app, lifespan model loading, CORS
│   │   ├── model_loader.py        # Loads XGBoost model + feature columns + medians
│   │   ├── preprocessing.py       # Feature engineering (rolling means, deltas, imputation)
│   │   ├── agent.py               # MedGemma clinical summary via Ollama
│   │   ├── email_service.py       # Gmail SMTP HTML alert dispatcher
│   │   └── routes/
│   │       ├── predict.py         # POST /predict — XGBoost + SHAP
│   │       └── report.py          # POST /generate-report — agent + email
│   ├── models/
│   │   ├── sepsis_xgb_model.pkl   # Trained XGBoost classifier
│   │   ├── feature_columns.json   # 30 features in exact training order
│   │   └── population_medians.json # Imputation values for missing vitals
│   ├── demo_data/
│   │   ├── sepsis_patient_DEMO.csv
│   │   └── healthy_patient_DEMO.csv
│   ├── requirements.txt
│   └── .env                       # Credentials (gitignored — create manually)
└── README.md
```

---

## Model Details

- **Algorithm:** XGBoost binary classifier
- **Training data:** PhysioNet 2019 Sepsis Challenge (ICU EHR data)
- **Features:** 30 engineered features — raw vitals (HR, Temp, Resp, WBC, SBP, MAP), 6h/3h rolling means, delta features, shock index (HR/SBP), ICULOS
- **Alert threshold:** 0.65 (risk score ≥ 0.65 triggers alert)
- **Explainability:** SHAP TreeExplainer, computed only at the alert hour for performance

---

## Troubleshooting

**`email_sent: false` in response**
- Check uvicorn logs for `SMTPAuthenticationError`
- Verify `SENDER_APP_PASSWORD` in `.env` is the App Password (not your Gmail login password)
- Confirm 2FA is enabled on the sender Gmail account

**`Connection refused` on Ollama**
- Run `ollama serve` in a separate terminal
- Verify with `curl http://localhost:11434/api/tags`

**`422 Unprocessable Entity` on /generate-report**
- Ensure you're passing the full `/predict` response body as JSON
- The `vitals_summary` field must be included with `null` values preserved

**`Model not found` at server startup**
- Verify `backend/models/` contains all three files: `sepsis_xgb_model.pkl`, `feature_columns.json`, `population_medians.json`

**`ModuleNotFoundError: No module named 'app'`**
- You must `cd backend` before running uvicorn — the working directory must be `backend/`, not the project root
