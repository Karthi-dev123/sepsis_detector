# At the very top of main.py, before anything else
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.model_loader import load_model
from app.routes import predict, report
# Add at top with other imports:
from app.routes.ward import router as ward_router


# The lifespan context manager is FastAPI's modern way of handling
# startup and shutdown events. Code before `yield` runs at startup,
# code after `yield` would run at shutdown (we don't need any cleanup here).
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting up — loading model artifacts...")
    load_model()  # loads model, features, medians into memory once
    yield
    print("🛑 Shutting down.")

app = FastAPI(
    title="Early Sepsis Detector API",
    description="XGBoost-based sepsis risk prediction with SHAP explainability",
    version="1.0.0",
    lifespan=lifespan
)

# CORS lets the React frontend (running on a different port) talk to this API.
# Without this, the browser blocks every request from localhost:5173 to localhost:8000.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # lock this down to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register the route files — each file handles a specific group of endpoints.
app.include_router(predict.router)
app.include_router(report.router)
# Add after your existing app.include_router lines:
app.include_router(ward_router)

# Simple health check — Group B's frontend calls this on page load
# to confirm the backend is up and the model is ready before showing the upload form.
@app.get("/health")
def health_check():
    from app.model_loader import model
    return {
        "status": "ok",
        "model_loaded": model is not None
    }