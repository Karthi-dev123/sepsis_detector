"""
routes/report.py — POST /generate-report endpoint

This file is the traffic controller between the frontend and the two
service modules (agent.py and email_service.py). It does no heavy lifting
itself — its job is to validate incoming data, coordinate the two services,
and return a clean JSON response.

The frontend calls this endpoint after /predict has already run and the
alert has been triggered. It sends the prediction payload, and expects back:
    {
        "clinical_summary": "Patient presents with...",
        "email_sent": true,
        "email_recipient": "doctor@demo-inbox.com"
    }
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Union

from app.agent import generate_clinical_summary
# email_service import is stubbed for now — we'll uncomment this once
# email_service.py is written and tested.
# from app.email_service import send_alert_email

logger = logging.getLogger(__name__)

router = APIRouter()

# ── Request Body Model ─────────────────────────────────────────────────────────
#
# Pydantic models are how FastAPI validates incoming JSON bodies.
# When the frontend sends a POST request, FastAPI automatically parses
# the JSON and checks it against this model BEFORE your handler function
# even runs. If a required field is missing or the wrong type, FastAPI
# returns a clean 422 error to the frontend automatically — you don't
# have to write any validation logic yourself. This is one of FastAPI's
# biggest quality-of-life features.
#
# These fields mirror exactly what /predict already returns, so the
# frontend can forward that response body directly to this endpoint
# without transforming it.

class PredictionPayload(BaseModel):
    patient_id: Optional[str] = "unknown"
    hours: list[int]
    risk_scores: list[float]
    alert_triggered: bool
    alert_hour: Optional[int] = None
    threshold: float = 0.65
    shap_values: dict[str, float]
    vitals_summary: dict[str, list[Optional[float]]]


# ── Route Handler ──────────────────────────────────────────────────────────────

@router.post("/generate-report")
async def generate_report(payload: PredictionPayload):
    """
    Accepts the prediction result from the frontend, generates a clinical
    summary via MedGemma (through agent.py), and dispatches an alert email.

    Why async? Because generate_clinical_summary() makes an async HTTP call
    to Ollama, which can take 5–15 seconds. Marking this handler as async
    and awaiting that call means FastAPI's event loop stays free to handle
    other requests while we wait for MedGemma to respond. If this were a
    regular synchronous def, the entire server would freeze for every request.
    """

    logger.info(f"POST /generate-report received for patient: {payload.patient_id}")

    # Guard clause: if no alert was triggered, there's nothing to report.
    # The frontend should only call this endpoint when alert_triggered is True,
    # but we validate it here as a safety net. Returning a 400 (Bad Request)
    # is cleaner than silently generating a report for a healthy patient.
    if not payload.alert_triggered or payload.alert_hour is None:
        raise HTTPException(
            status_code=400,
            detail="Cannot generate report: no alert was triggered for this patient."
        )

    # Convert the Pydantic model to a plain dict to pass into agent.py.
    # agent.py is designed to work with plain dicts (not Pydantic models)
    # so it stays decoupled from FastAPI's request/response types.
    prediction_data = payload.model_dump()

    # ── Step 1: Generate Clinical Summary ─────────────────────────────────────
    # This is the async call to agent.py, which internally calls Ollama.
    # generate_clinical_summary() is guaranteed to return a string in all cases —
    # if Ollama fails, it returns the fallback template. So we don't need a
    # try/except here; agent.py already handles all failure modes internally.
    logger.info("Requesting clinical summary from MedGemma agent...")
    clinical_summary = await generate_clinical_summary(prediction_data)
    logger.info("Clinical summary received.")

    # ── Step 2: Send Alert Email ───────────────────────────────────────────────
    # STUBBED for now. Once email_service.py is written and tested, replace
    # this block with the real call:
    #
    #   email_recipient = "doctor@demo-inbox.com"
    #   email_sent = await send_alert_email(
    #       recipient=email_recipient,
    #       patient_id=payload.patient_id,
    #       clinical_summary=clinical_summary,
    #       prediction_data=prediction_data
    #   )
    #
    # The stub below lets us test the full report.py → agent.py chain right
    # now without needing email credentials configured yet.
    # email_recipient = "doctor@demo-inbox.com"
    # email_sent = False  # ← Will become True once email_service.py is live
    # logger.info("Email step stubbed — will be replaced with real send_alert_email() call.")
    from app.email_service import send_alert_email, RECIPIENT_EMAIL

    email_recipient = RECIPIENT_EMAIL  # pull from env, or hardcode your demo inbox
    email_sent = send_alert_email(
        patient_id=payload.patient_id,
        clinical_summary=clinical_summary,
        prediction_data=prediction_data
    )

    # ── Step 3: Return Response ────────────────────────────────────────────────
    return {
        "clinical_summary": clinical_summary,
        "email_sent": email_sent,
        "email_recipient": email_recipient
    }