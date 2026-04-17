import asyncio, json, os
import pandas as pd
import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import shap

# ── Fix: call load_model() FIRST, then import the now-populated values ──
from app.model_loader import load_model
load_model()  # populate globals before ward.py uses them
from app.model_loader import model, feature_columns

from app.preprocessing import preprocess_patient as preprocess

router = APIRouter()

# ── Patient metadata (hardcoded for demo) ──────────────────────
PATIENTS = [
    { 'bed': 1, 'room': 'Room 101', 'file': 'bed1_sepsis.csv',
      'patient_id': 'P-0042', 'age': 67 },
    { 'bed': 2, 'room': 'Room 102', 'file': 'bed2_healthy.csv',
      'patient_id': 'P-0091', 'age': 54 },
    { 'bed': 3, 'room': 'Room 103', 'file': 'bed3_healthy.csv',
      'patient_id': 'P-0137', 'age': 71 },
    { 'bed': 4, 'room': 'Room 104', 'file': 'bed4_healthy.csv',
      'patient_id': 'P-0208', 'age': 48 },
]

DEMO_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'demo_data')
THRESHOLD = 0.65
PERSISTENCE_REQUIRED = 3
TICK_INTERVAL = 2

# ── Load all 4 patient dataframes at module import time ────────
def load_patient_data():
    patients = []
    for meta in PATIENTS:
        path = os.path.join(DEMO_DIR, meta['file'])
        df = pd.read_csv(path)
        df['patient_id'] = meta['patient_id']
        processed = preprocess(df)
        avail = [f for f in feature_columns if f in processed.columns]
        scores = model.predict_proba(processed[avail])[:, 1]
        vitals_raw = df[['HR','Temp','Resp','SBP','O2Sat']].copy()
        patients.append({
            'meta': meta,
            'scores': scores.tolist(),
            'vitals': vitals_raw.to_dict(orient='records'),
            'total_hours': len(scores),
        })
    return patients

WARD_DATA = load_patient_data()

# ── Route defined AFTER WARD_DATA is populated ─────────────────
@router.get('/ward/patients')
def get_ward_patients():
    return [
        {
            'bed': p['meta']['bed'],
            'patient_id': p['meta']['patient_id'],
            'room': p['meta']['room'],
            'age': p['meta']['age'],
            'total_hours': p['total_hours'],
        }
        for p in WARD_DATA
    ]

# ── Persistence state per connection ───────────────────────────
def make_persistence_state():
    return [{'consecutive': 0, 'status': 'GREEN', 'alert_sent': False}
            for _ in PATIENTS]

def update_persistence(state, bed_idx, score):
    s = state[bed_idx]
    if score >= THRESHOLD:
        s['consecutive'] += 1
    else:
        s['consecutive'] = 0
        s['status'] = 'GREEN'
        return s
    count = min(s['consecutive'], PERSISTENCE_REQUIRED)
    if count < PERSISTENCE_REQUIRED:
        s['status'] = f'YELLOW ({count}/{PERSISTENCE_REQUIRED})'
    else:
        s['status'] = f'RED ({PERSISTENCE_REQUIRED}/{PERSISTENCE_REQUIRED})'
    return s

# ── SHAP for alert hour ────────────────────────────────────────
def get_shap_values(df_processed, row_idx):
    try:
        avail = [f for f in feature_columns if f in df_processed.columns]
        explainer = shap.TreeExplainer(model)
        sv = explainer.shap_values(df_processed[avail].iloc[[row_idx]])
        series = pd.Series(sv[0], index=avail).sort_values(key=abs, ascending=False)
        return series.head(6).to_dict()
    except Exception:
        return {}

# ── WebSocket endpoint ─────────────────────────────────────────
@router.websocket('/ws/ward')
async def ward_stream(websocket: WebSocket):
    await websocket.accept()
    persistence = make_persistence_state()
    alert_fired = [False] * len(PATIENTS)

    for i, patient in enumerate(WARD_DATA):
        await websocket.send_json({
            'type': 'init',
            'bed': patient['meta']['bed'],
            'patient_id': patient['meta']['patient_id'],
            'room': patient['meta']['room'],
            'age': patient['meta']['age'],
            'total_hours': patient['total_hours'],
        })

    max_hours = max(p['total_hours'] for p in WARD_DATA)

    try:
        for hour in range(max_hours):
            tick_data = []

            for i, patient in enumerate(WARD_DATA):
                if hour >= patient['total_hours']:
                    tick_data.append({
                        'type': 'tick',
                        'bed': patient['meta']['bed'],
                        'hour': hour,
                        'status': 'DATA OVER / STABLE',
                        'risk_score': None,
                        'hr': None,
                        'finished': True,
                    })
                    continue

                score = patient['scores'][hour]
                vitals = patient['vitals'][hour]
                p_state = update_persistence(persistence, i, score)

                payload = {
                    'type': 'tick',
                    'bed': patient['meta']['bed'],
                    'hour': hour + 1,
                    'risk_score': round(score, 4),
                    'status': p_state['status'],
                    'hr': vitals.get('HR'),
                    'temp': vitals.get('Temp'),
                    'resp': vitals.get('Resp'),
                    'sbp': vitals.get('SBP'),
                    'o2sat': vitals.get('O2Sat'),
                    'finished': False,
                }

                if 'RED' in p_state['status'] and not alert_fired[i]:
                    alert_fired[i] = True
                    payload['trigger_alert'] = True
                    payload['shap_values'] = get_shap_values(
                        pd.DataFrame([patient['vitals'][hour]]), 0
                    )

                tick_data.append(payload)

            await websocket.send_json({'type': 'batch', 'ticks': tick_data})
            await asyncio.sleep(TICK_INTERVAL)

        await websocket.send_json({'type': 'done', 'message': 'All patient streams complete'})

    except WebSocketDisconnect:
        print('Client disconnected from ward stream')
    except Exception as e:
        print(f'Ward stream error: {e}')
        await websocket.close()
    

# ── Patient Summary Endpoint ───────────────────────────────────
import httpx

MEDGEMMA_URL = os.environ.get("MEDGEMMA_URL", "http://localhost:11434/api/generate")
MEDGEMMA_MODEL = os.environ.get("MEDGEMMA_MODEL", "medgemma")

def _build_trend(vitals_list: list, key: str) -> str:
    """Return 'rising', 'falling', or 'stable' for a vital over last N hours."""
    vals = [v.get(key) for v in vitals_list if v.get(key) is not None]
    if len(vals) < 2:
        return "insufficient data"
    delta = vals[-1] - vals[0]
    if delta > 5:   return "rising"
    if delta < -5:  return "falling"
    return "stable"

def _template_summary(patient: dict, current_hour: int) -> str:
    """Fallback template when MedGemma is unavailable or slow."""
    meta    = patient["meta"]
    scores  = patient["scores"]
    vitals  = patient["vitals"]
    score   = scores[current_hour - 1] if current_hour > 0 else scores[-1]
    latest  = vitals[current_hour - 1] if current_hour > 0 else vitals[-1]

    hr   = latest.get("HR",    "N/A")
    temp = latest.get("Temp",  "N/A")
    resp = latest.get("Resp",  "N/A")
    o2   = latest.get("O2Sat", "N/A")
    sbp  = latest.get("SBP",   "N/A")

    risk_label = "elevated" if score >= 0.65 else "low" if score < 0.30 else "moderate"

    return (
        f"Patient {meta['patient_id']} is a {meta['age']}-year-old currently at hour "
        f"{current_hour} of ICU monitoring. "
        f"Current sepsis risk score is {score:.2f} ({risk_label}). "
        f"Latest vitals: HR {hr} bpm, Temp {temp}°C, Resp {resp} breaths/min, "
        f"O2Sat {o2}%, SBP {sbp} mmHg. "
        f"Continued monitoring is advised with attention to trend changes."
    )

@router.get("/ward/patients/{bed_id}/summary")
async def get_patient_summary(bed_id: int):
    """
    Called when doctor clicks a patient card.
    Returns a MedGemma-generated real-time clinical status summary.
    Falls back to a template summary if MedGemma is unavailable.
    """
    # Find the patient by bed number
    patient = next((p for p in WARD_DATA if p["meta"]["bed"] == bed_id), None)
    if patient is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Bed {bed_id} not found")

    scores  = patient["scores"]
    vitals  = patient["vitals"]
    meta    = patient["meta"]

    # Use the latest available data point
    current_hour = len(scores)
    latest_score = scores[-1]
    latest_vitals = vitals[-1]

    # Last 6 hours of vitals for trend analysis
    recent_vitals = vitals[-6:] if len(vitals) >= 6 else vitals

    hr_trend   = _build_trend(recent_vitals, "HR")
    temp_trend = _build_trend(recent_vitals, "Temp")
    resp_trend = _build_trend(recent_vitals, "Resp")

    # Build SHAP context if available (fired during RED alert)
    shap_context = "Insufficient data for feature attribution."
    try:
        import shap as shap_lib
        avail = [f for f in feature_columns if f in pd.DataFrame([latest_vitals]).columns]
        if avail:
            explainer = shap_lib.TreeExplainer(model)
            sv = explainer.shap_values(pd.DataFrame([latest_vitals])[avail])
            top = pd.Series(sv[0], index=avail).sort_values(key=abs, ascending=False).head(3)
            shap_context = ", ".join([f"{k} ({v:+.3f})" for k, v in top.items()])
    except Exception:
        pass  # SHAP is best-effort

    prompt = f"""You are a clinical decision support AI assisting ICU staff.

Patient: {meta['patient_id']}, Age: {meta['age']}, Room: {meta['room']}
Current hour of monitoring: {current_hour}
Sepsis risk score: {latest_score:.3f} (threshold: 0.65)

Latest vitals:
- Heart Rate: {latest_vitals.get('HR', 'N/A')} bpm (trend: {hr_trend})
- Temperature: {latest_vitals.get('Temp', 'N/A')}°C (trend: {temp_trend})
- Respiratory Rate: {latest_vitals.get('Resp', 'N/A')} breaths/min (trend: {resp_trend})
- O2 Saturation: {latest_vitals.get('O2Sat', 'N/A')}%
- Systolic BP: {latest_vitals.get('SBP', 'N/A')} mmHg

Top contributing factors to risk score: {shap_context}

Generate a 3-4 sentence real-time clinical status summary of how this patient is doing right now. Be concise, factual, and clinically relevant. Do not diagnose. Do not recommend medications."""

    # Try MedGemma with a 5-second timeout
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(MEDGEMMA_URL, json={
                "model":  MEDGEMMA_MODEL,
                "prompt": prompt,
                "stream": False,
            })
            resp.raise_for_status()
            data = resp.json()
            summary = data.get("response", "").strip()
            if not summary:
                raise ValueError("Empty response from MedGemma")
            return {"bed": bed_id, "summary": summary, "source": "medgemma"}

    except Exception as e:
        print(f"MedGemma unavailable for bed {bed_id}: {e} — using template fallback")
        return {
            "bed":     bed_id,
            "summary": _template_summary(patient, current_hour),
            "source":  "template",
        }