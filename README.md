# Early Sepsis Detector

> An AI-powered ICU clinical decision support system that detects sepsis risk hours before clinical onset using XGBoost, SHAP explainability, and an autonomous MedGemma alert agent.

Built for **Hack The Knight** by a team of 4: **Group A** (ML + Backend) and **Group B** (Frontend).

---

## Badges

![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)
![XGBoost](https://img.shields.io/badge/XGBoost-2.1-FF6600?style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-MedGemma_1.5-black?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## Tech Stack

### Backend

| Layer | Technology |
|-------|-----------|
| API Server | FastAPI + Uvicorn |
| ML Model | XGBoost (sepsis risk prediction) |
| Explainability | SHAP TreeExplainer |
| Clinical LLM | MedGemma 1.5 via Ollama |
| Email Alerts | Gmail SMTP |
| Config | Python-dotenv |

### Frontend

| Layer | Technology |
|-------|-----------|
| Framework | React + Vite |
| Styling | Tailwind CSS v4 |
| Charts | Recharts (RiskTimeline area chart, SHAP horizontal bar chart) |
| HTTP | Axios |
| Icons | Lucide React |

---

## System Architecture

End-to-end flow:

```
1. Doctor uploads patient CSV via React dashboard
         ↓
2. FastAPI backend receives file, runs preprocessing pipeline
         ↓
3. XGBoost model outputs hourly risk scores (0–1)
         ↓
4. If any score exceeds threshold (0.65) → alert triggered
         ↓
5. SHAP TreeExplainer runs on alert hour only
   → identifies top contributing vitals
         ↓
6. Frontend renders:
   RiskTimeline chart · SHAP bar chart · VitalsTable · AlertStatus
         ↓
7. Doctor clicks "Generate Report"
   → MedGemma 1.5 agent generates clinical summary via Ollama
         ↓
8. Gmail SMTP dispatches HTML-formatted alert email to demo inbox
         ↓
9. Frontend displays clinical summary and email confirmation
```

---

## Project Structure

```
sepsis_detector/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── preprocessing.py
│   │   ├── model_loader.py
│   │   ├── agent.py
│   │   ├── email_service.py
│   │   └── routes/
│   │       ├── predict.py
│   │       └── report.py
│   ├── models/
│   │   ├── sepsis_xgb_model.pkl
│   │   └── feature_columns.json
│   ├── demo_data/
│   │   ├── sepsis_patient_DEMO.csv
│   │   └── healthy_patient_DEMO.csv
│   ├── requirements.txt
│   └── .env
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   │   ├── FileUpload.jsx
    │   │   ├── AlertStatus.jsx
    │   │   ├── RiskTimeline.jsx
    │   │   ├── SHAPChart.jsx
    │   │   ├── VitalsTable.jsx
    │   │   └── ReportPreview.jsx
    │   ├── utils/
    │   │   └── api.js
    │   └── data/
    │       └── mockData.js
    └── package.json
```

---

## Backend Setup

### Prerequisites

| Requirement | Notes |
|-------------|-------|
| Python 3.13 | `python3 --version` to verify |
| Ollama | Local LLM runner — install from [ollama.com](https://ollama.com) |
| Gmail account with 2FA | Required for App Password (email alerts) |

### Steps

**1. Navigate to the backend directory**

```bash
cd backend
```

**2. Create and activate a virtual environment**

```bash
python -m venv venv && source venv/bin/activate
# Windows: venv\Scripts\activate
```

**3. Install dependencies**

```bash
pip install -r requirements.txt
```

**4. Create the `.env` file**

```bash
touch .env
```

Add the following keys:

```env
SENDER_EMAIL=your-gmail@gmail.com
SENDER_APP_PASSWORD=xxxx xxxx xxxx xxxx
RECIPIENT_EMAIL=doctor@example.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

**5. Pull the MedGemma model via Ollama** *(first time only — ~2.5 GB)*

```bash
ollama pull dcarrascosa/medgemma-1.5-4b-it:Q4_K_M
```

Make sure Ollama is running in a separate terminal:

```bash
ollama serve
```

**6. Start the backend server**

```bash
uvicorn app.main:app --reload --port 8000
```

**7. Verify the server is healthy**

```bash
curl http://localhost:8000/health
# Expected: { "status": "ok", "model_loaded": true }
```

Interactive Swagger UI: `http://localhost:8000/docs`

---

## Frontend Setup

### Steps

**1. Navigate to the frontend directory**

```bash
cd frontend
```

**2. Install dependencies**

```bash
npm install
```

**3. Start the dev server**

```bash
npm run dev
```

**4. Open in browser**

```
http://localhost:5173
# (or http://localhost:5174 if port 5173 is already in use)
```

---

## API Endpoints

### `GET /health`

Health check — confirms the XGBoost model loaded successfully.

```bash
curl http://localhost:8000/health
```

```json
{ "status": "ok", "model_loaded": true }
```

---

### `POST /predict`

Accepts an ICU patient CSV file upload. Runs the preprocessing pipeline, XGBoost scoring, and (if alert triggered) SHAP explainability.

```bash
curl -X POST http://localhost:8000/predict \
  -F "file=@backend/demo_data/sepsis_patient_DEMO.csv" \
  | python3 -m json.tool
```

**Response:**

```json
{
  "patient_id": "p001",
  "hours": [0, 1, 2, "..."],
  "risk_scores": [0.12, 0.18, "...", 0.97],
  "alert_triggered": true,
  "alert_hour": 43,
  "threshold": 0.65,
  "shap_values": {
    "ICULOS": 0.41,
    "WBC": 0.29,
    "Creatinine": 0.18
  },
  "vitals_summary": {
    "HR": [88, 91, null, 97, "..."],
    "Temp": [37.2, 37.5, "..."],
    "Resp": [18, 20, "..."]
  }
}
```

| Field | Description |
|-------|-------------|
| `alert_triggered` | `true` if any risk score exceeded 0.65 |
| `alert_hour` | ICU hour at which the alert fired |
| `shap_values` | Feature contributions at the alert hour only |
| `vitals_summary` | Raw vitals per hour (may contain `null` for sparse data) |

---

### `POST /generate-report`

Generates a MedGemma 1.5 clinical summary and dispatches an HTML-formatted alert email via Gmail SMTP. Pass the full `/predict` response body directly as JSON.

```bash
# Save the predict response
curl -X POST http://localhost:8000/predict \
  -F "file=@backend/demo_data/sepsis_patient_DEMO.csv" \
  -s > /tmp/predict_response.json

# Generate report and send email
curl -X POST http://localhost:8000/generate-report \
  -H "Content-Type: application/json" \
  -d @/tmp/predict_response.json \
  | python3 -m json.tool
```

> This call takes 10–30 seconds — MedGemma is generating the clinical narrative locally.

**Response:**

```json
{
  "clinical_summary": "The patient presents with tachycardia and elevated respiratory rate...",
  "email_sent": true,
  "email_recipient": "doctor@example.com"
}
```

---

## Demo

Two ways to demo the application:

### Option 1 — Demo Mode button *(recommended)*

Click the **Demo Mode** button on the dashboard. This instantly loads the pre-selected sepsis patient data without requiring a file upload.

### Option 2 — Manual CSV upload

Drag and drop one of the included demo files from `backend/demo_data/`:

| File | Expected Result |
|------|----------------|
| `sepsis_patient_DEMO.csv` | Risk score climbs to **0.97**, alert fires at **hour 43** |
| `healthy_patient_DEMO.csv` | Risk stays below **0.45**, no alert, green status shown |

### Expected Demo Flow

**Sepsis patient:**
1. Risk score climbs steadily, peaking at **0.97**
2. Alert triggers at **hour 43** (threshold: 0.65)
3. SHAP chart shows **ICULOS / WBC / Creatinine** as top contributors
4. Click "Generate Report" — MedGemma generates clinical summary
5. Alert email arrives in demo inbox

**Healthy patient:**
1. Risk stays below **0.45** throughout
2. No alert triggered
3. Green status indicator shown
4. Report generation still available but no email dispatched

---

## Environment Variables

Create `backend/.env` with the following keys. **Never commit this file — it is in `.gitignore`.**

| Variable | Description |
|----------|-------------|
| `SENDER_EMAIL` | Gmail address used to send alerts |
| `SENDER_APP_PASSWORD` | 16-character Gmail App Password (requires 2FA enabled on the account) |
| `RECIPIENT_EMAIL` | Demo inbox email address that receives alert emails |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |

**How to generate a Gmail App Password:**
1. Enable 2-Factor Authentication on your Google account
2. Go to `myaccount.google.com → Security → 2-Step Verification → App Passwords`
3. Generate a new App Password for "Mail"
4. Paste the 16-character password as `SENDER_APP_PASSWORD`

> The `.env` file is listed in `.gitignore` and will never be committed to this repository.

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
- Verify `SENDER_APP_PASSWORD` is the App Password, not your Gmail login password
- Confirm 2FA is enabled on the sender Gmail account

**`Connection refused` on Ollama**
- Run `ollama serve` in a separate terminal
- Verify with `curl http://localhost:11434/api/tags`

**`422 Unprocessable Entity` on /generate-report**
- Ensure you're passing the full `/predict` response body as JSON
- The `vitals_summary` field must be included with `null` values preserved

**`Model not found` at server startup**
- Verify `backend/models/` contains: `sepsis_xgb_model.pkl` and `feature_columns.json`

**`ModuleNotFoundError: No module named 'app'`**
- You must `cd backend` before running uvicorn — the working directory must be `backend/`, not the project root

**Frontend shows no data after upload**
- Confirm the backend is running on port 8000
- Check browser console for CORS errors
- Ensure the CSV file matches the expected PhysioNet column format
