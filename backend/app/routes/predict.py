import io
import numpy as np
import pandas as pd
import shap
from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter()

THRESHOLD = 0.65
# These are the raw vitals we'll send back to the frontend for the chart table.
VITALS_TO_SUMMARIZE = ["HR", "Temp", "Resp", "SBP", "O2Sat"]


@router.post("/predict")
async def predict(file: UploadFile = File(...)):
    # ── Step 1: Read the uploaded CSV into a DataFrame ──────────────────────
    # UploadFile gives us a file-like object, so we read its bytes
    # and wrap them in io.BytesIO so pandas can parse it like a normal file.
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read CSV file: {e}")

    # ── Step 2: Attach a patient_id so preprocessing.py can groupby it ──────
    # The preprocessing function expects this column to exist because it
    # does per-patient forward-fill and rolling calculations.
    patient_id = file.filename.replace(".csv", "").replace(".psv", "")
    df["patient_id"] = patient_id

    # ── Step 3: Run the shared preprocessing pipeline ───────────────────────
    # This MUST be the exact same function used during training.
    # Member 1 owns this file — we just import and call it.
    try:
        from app.preprocessing import preprocess_patient
        df_processed = preprocess_patient(df)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preprocessing failed: {e}")

    # ── Step 4: Select features in the exact order the model expects ─────────
    # XGBoost is sensitive to column order — it learned from features in a
    # specific sequence, and we must replicate that sequence exactly.
    try:
        from app.model_loader import model, feature_columns
        X = df_processed[feature_columns]
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing expected column: {e}")

    # ── Step 5: Get a risk score for every ICU hour ──────────────────────────
    # predict_proba returns [[prob_class0, prob_class1], ...] for each row.
    # We take [:, 1] to get just the probability of sepsis (class 1).
    risk_scores = model.predict_proba(X)[:, 1]

    # ── Step 6: Check if any hour crosses the alert threshold ────────────────
    alert_hours = np.where(risk_scores > THRESHOLD)[0]
    alert_triggered = len(alert_hours) > 0
    # The first hour that crosses the threshold is the clinically relevant one.
    alert_hour = int(alert_hours[0]) if alert_triggered else None

    # ── Step 7: Run SHAP only on the alert hour ──────────────────────────────
    # Running SHAP on all hours would be 50x slower and the doctor only
    # needs an explanation for the moment the alert fired — not every hour.
    shap_values = {}
    if alert_triggered:
        explainer = shap.TreeExplainer(model)
        # Double brackets [[alert_hour]] are critical here — SHAP needs a
        # 2D array (even for a single row). Single bracket gives a 1D Series
        # and SHAP will silently return garbage values.
        sv = explainer.shap_values(X.iloc[[alert_hour]])
        raw_shap = dict(zip(feature_columns, sv[0]))
        # Sort by absolute contribution and keep the top 6.
        # Absolute value matters because negative SHAP means the feature
        # *reduced* the risk — that's still clinically interesting.
        shap_values = dict(
            sorted(raw_shap.items(), key=lambda x: abs(x[1]), reverse=True)[:6]
        )

    # ── Step 8: Extract raw vitals for the frontend table ────────────────────
    # The frontend renders these as a timeline table alongside the risk chart.
    vitals_summary = {}
    for vital in VITALS_TO_SUMMARIZE:
        if vital in df.columns:
            # Round to 1 decimal place and replace NaN with None so
            # the JSON serializer handles it cleanly (NaN is not valid JSON).
            vitals_summary[vital] = [
                round(v, 1) if not np.isnan(v) else None
                for v in df[vital].tolist()
            ]

    # ── Step 9: Return the full response matching the API contract ────────────
    return {
        "patient_id": patient_id,
        "hours": list(range(len(risk_scores))),
        "risk_scores": [round(float(s), 4) for s in risk_scores],
        "alert_triggered": alert_triggered,
        "alert_hour": alert_hour,
        "threshold": THRESHOLD,
        "shap_values": {k: round(float(v), 4) for k, v in shap_values.items()},
        "vitals_summary": vitals_summary,
    }