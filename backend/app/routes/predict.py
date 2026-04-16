# backend/app/routes/predict.py
import io
import numpy as np
import pandas as pd
import shap
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.preprocessing import preprocess_patient as preprocess
from app.agent import generate_clinical_summary
from app.email_service import send_alert_email

router = APIRouter()
THRESHOLD = 0.65

# ── Must call load_model() FIRST, then import the populated globals ──
from app.model_loader import load_model
load_model()
from app.model_loader import model, feature_columns  # now both are populated


@router.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not (file.filename.endswith(".csv") or file.filename.endswith(".psv")):
        raise HTTPException(status_code=400, detail="Only .csv or .psv files accepted")

    contents = await file.read()
    sep = "|" if file.filename.endswith(".psv") else ","

    try:
        df = pd.read_csv(io.BytesIO(contents), sep=sep)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse file: {e}")

    if df.empty or len(df) < 2:
        raise HTTPException(status_code=400, detail="File has too few rows")

    df["patient_id"] = "uploaded"
    processed = preprocess(df)
    avail = [f for f in feature_columns if f in processed.columns]

    if not avail:
        raise HTTPException(status_code=400, detail="No recognisable feature columns found")

    scores = model.predict_proba(processed[avail])[:, 1]
    peak_idx        = int(np.argmax(scores))
    peak_score      = float(scores[peak_idx])
    alert_triggered = peak_score >= THRESHOLD

    # SHAP at peak hour
    shap_values = {}
    try:
        explainer   = shap.TreeExplainer(model)
        sv          = explainer.shap_values(processed[avail].iloc[[peak_idx]])
        series      = pd.Series(sv[0], index=avail).sort_values(key=abs, ascending=False)
        shap_values = {k: float(v) for k, v in series.head(10).items()}
    except Exception:
        pass

    # Email alert
    email_sent = False
    if alert_triggered:
        try:
            email_sent = send_alert_email(
                peak_score=peak_score,
                peak_hour=peak_idx + 1,
                shap_values=shap_values,
            )
        except Exception:
            pass

    return {
        "risk_scores":     scores.tolist(),
        "peak_risk_score": peak_score,
        "peak_hour":       peak_idx + 1,
        "alert_triggered": alert_triggered,
        "shap_values":     shap_values,
        "email_sent":      email_sent,
        "total_hours":     len(scores),
    }