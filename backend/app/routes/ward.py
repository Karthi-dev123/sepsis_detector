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