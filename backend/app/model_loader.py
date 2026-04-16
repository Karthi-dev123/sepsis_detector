import joblib
import json
import os

# These will hold our loaded artifacts in memory.
# They start as None and get populated when load_model() is called at startup.
model = None
feature_columns = None
population_medians = None
# In model_loader.py — add this guard at the top of load_model()
def load_model():
    global model, feature_columns, population_medians
    if model is not None:   # ← already loaded, skip
        return
    # ... rest of function unchanged
def load_model():
    """
    Called once at FastAPI startup.
    Loads the XGBoost model, feature list, and population medians into memory.
    """
    global model, feature_columns, population_medians

    # Build paths relative to this file's location so it works
    # regardless of where uvicorn is launched from.
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    models_dir = os.path.join(base_dir, "models")

    # Load the trained XGBoost model
    model_path = os.path.join(models_dir, "sepsis_xgb_model.pkl")
    model = joblib.load(model_path)
    print(f"✅ Model loaded from {model_path}")

    # Load the ordered list of feature names — ORDER MATTERS here.
    # The model was trained with features in a specific sequence,
    # and prediction input must match that exact sequence.
    features_path = os.path.join(models_dir, "feature_columns.json")
    with open(features_path, "r") as f:
        feature_columns = json.load(f)
    print(f"✅ Feature columns loaded: {len(feature_columns)} features")

    # Load the population medians saved during training.
    # preprocessing.py uses these to fill missing values the same way
    # training did — using the same medians, not recomputing from a single patient.
    medians_path = os.path.join(models_dir, "population_medians.json")
    with open(medians_path, "r") as f:
        population_medians = json.load(f)
    print(f"✅ Population medians loaded")
