import pandas as pd
import numpy as np
import json
import os

# Load saved medians and feature columns at import time
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MEDIANS = json.load(open(os.path.join(BASE_DIR, 'models', 'population_medians.json')))
FEATURES = json.load(open(os.path.join(BASE_DIR, 'models', 'feature_columns.json')))

VITALS = ['HR', 'O2Sat', 'Temp', 'SBP', 'MAP', 'Resp']


def preprocess_patient(df: pd.DataFrame) -> pd.DataFrame:
    """
    Takes a raw patient DataFrame (from uploaded .psv or .csv file)
    and returns a cleaned, feature-engineered DataFrame
    ready for model.predict_proba().

    Works for both:
    - Single patient (API use)
    - All patients combined (training use)
    """
    df = df.copy()

    # ── Step 1: Forward fill then backward fill ──────────────────────
    # Within a patient, carry last known value forward
    # (e.g. if WBC was measured at hour 3, use that for hours 4,5,6...)
    if 'patient_id' in df.columns:
       df = df.groupby('patient_id', group_keys=False).apply(
           lambda x: x.ffill().bfill(), include_groups=False)
    else:
        # Single patient file — no groupby needed
        df = df.ffill().bfill()

    # ── Step 2: Fill remaining NaNs with population medians ──────────
    # These are medians calculated from the full training set
    for col, median_val in MEDIANS.items():
        if col in df.columns:
            df[col] = df[col].fillna(median_val)

    # Safety net — fill anything still missing with 0
    df = df.fillna(0)

    # ── Step 3: Feature engineering ──────────────────────────────────

    # Rolling means (last 6 hours and last 3 hours)
    for col in VITALS:
        if col in df.columns:
            if 'patient_id' in df.columns:
                df[f'{col}_6h_mean'] = (
                    df.groupby('patient_id')[col]
                    .transform(lambda x: x.rolling(6, min_periods=1).mean())
                )
                df[f'{col}_3h_mean'] = (
                    df.groupby('patient_id')[col]
                    .transform(lambda x: x.rolling(3, min_periods=1).mean())
                )
            else:
                df[f'{col}_6h_mean'] = df[col].rolling(6, min_periods=1).mean()
                df[f'{col}_3h_mean'] = df[col].rolling(3, min_periods=1).mean()

    # Delta features (change from previous hour)
    for col in VITALS:
        if col in df.columns:
            if 'patient_id' in df.columns:
                df[f'{col}_delta'] = (
                    df.groupby('patient_id')[col].diff().fillna(0)
                )
            else:
                df[f'{col}_delta'] = df[col].diff().fillna(0)

    # Shock index (HR / SBP — clinical indicator of circulatory failure)
    df['shock_index'] = df['HR'] / (df['SBP'].replace(0, np.nan).fillna(1))

    # ── Step 4: Select only the features the model expects ───────────
    # This enforces correct column order — critical for XGBoost
    X = df[FEATURES]

    return X
