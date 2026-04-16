from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.agent import generate_clinical_summary

router = APIRouter()


class SummaryRequest(BaseModel):
    peak_risk_score: float
    peak_hour:       int
    shap_values:     Optional[dict] = {}
    alert_triggered: Optional[bool] = False


@router.post("/report/summary")
async def get_report_summary(req: SummaryRequest):
    """
    Called by PredictPage after a CSV prediction.
    Returns a MedGemma-generated clinical summary.
    """
    shap_str = "Insufficient data"
    if req.shap_values:
        top = sorted(req.shap_values.items(), key=lambda x: abs(x[1]), reverse=True)[:3]
        shap_str = ", ".join([f"{k} ({v:+.3f})" for k, v in top])

    prompt = f"""You are a clinical decision support AI.

A patient's sepsis risk model produced the following result:
- Peak risk score: {req.peak_risk_score:.3f} (threshold: 0.65)
- Peak hour: {req.peak_hour}
- Alert triggered: {'Yes' if req.alert_triggered else 'No'}
- Top contributing factors: {shap_str}

Generate a 3-4 sentence clinical summary of this result for a physician.
Be factual, concise, and do not recommend specific medications."""

    summary = generate_clinical_summary(prompt)

    return {
        "summary": summary,
        "source":  "medgemma" if summary else "unavailable",
    }