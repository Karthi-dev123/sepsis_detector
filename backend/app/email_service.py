"""
email_service.py — Gmail SMTP Alert Email Dispatcher

This module has one public function: send_alert_email().
It reads Gmail credentials from .env, builds an HTML-formatted clinical
alert email, and dispatches it via Gmail's SMTP server.

Why smtplib instead of a third-party library?
smtplib is part of Python's standard library — no extra pip install needed.
For a hackathon where every dependency is a potential point of failure,
using a built-in is always the safer choice.
"""

import smtplib
import logging
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv

# Load environment variables from backend/.env
# This must be called before any os.getenv() calls below.
load_dotenv()

logger = logging.getLogger(__name__)

# ── Credentials from .env ──────────────────────────────────────────────────────

SENDER_EMAIL       = os.getenv("SENDER_EMAIL")
SENDER_APP_PASSWORD = os.getenv("SENDER_APP_PASSWORD")
RECIPIENT_EMAIL    = os.getenv("RECIPIENT_EMAIL")
SMTP_HOST          = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT          = int(os.getenv("SMTP_PORT", "587"))


# ── HTML Email Builder ─────────────────────────────────────────────────────────

def _build_html_email(
    patient_id: str,
    clinical_summary: str,
    prediction_data: dict
) -> str:
    """
    Builds a professional HTML email body for the clinical alert.

    Why HTML and not plain text? Because HTML lets us use color, bold text,
    and a structured table for vitals — which makes the email look like a
    real clinical alert system rather than a script output. Judges who see
    this email in the demo inbox will immediately understand what they're
    looking at.

    The structure is:
        Red alert banner header
        Patient ID + risk score
        Vitals table at the alert hour
        Top SHAP contributors
        MedGemma clinical summary paragraph
        Timestamp footer
    """

    alert_hour   = prediction_data.get("alert_hour", "N/A")
    risk_scores  = prediction_data.get("risk_scores", [0])
    shap_values  = prediction_data.get("shap_values", {})
    vitals       = prediction_data.get("vitals_summary", {})
    threshold    = prediction_data.get("threshold", 0.65)

    # Peak risk score for the headline number
    peak_score = max(risk_scores) if isinstance(risk_scores, list) else risk_scores

    # Pull vitals at the alert hour for the table
    def get_vital_at_alert(key: str) -> str:
        vals = vitals.get(key, [])
        if isinstance(vals, list) and isinstance(alert_hour, int) and alert_hour < len(vals):
            return f"{vals[alert_hour]:.1f}"
        return "N/A"

    hr   = get_vital_at_alert("HR")
    temp = get_vital_at_alert("Temp")
    resp = get_vital_at_alert("Resp")
    wbc  = get_vital_at_alert("WBC")

    # Top 3 SHAP contributors formatted as table rows
    top_shap = sorted(shap_values.items(), key=lambda x: abs(x[1]), reverse=True)[:3]
    shap_rows = ""
    for feature, value in top_shap:
        direction_color = "#c0392b" if value > 0 else "#27ae60"
        direction_label = "↑ Increases Risk" if value > 0 else "↓ Decreases Risk"
        shap_rows += f"""
        <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">{feature}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee; color: {direction_color}; font-weight: bold;">
                {direction_label}
            </td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-family: monospace;">
                {value:+.3f}
            </td>
        </tr>"""

    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">

        <div style="max-width: 640px; margin: 0 auto; background: white;
                    border-radius: 8px; overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

            <!-- Red Alert Banner -->
            <div style="background-color: #c0392b; padding: 24px 32px;">
                <h1 style="color: white; margin: 0; font-size: 22px; letter-spacing: 1px;">
                    ⚠ SEPSIS ALERT — Immediate Attention Required
                </h1>
                <p style="color: #f5b7b1; margin: 8px 0 0 0; font-size: 14px;">
                    Early Sepsis Detector — Automated Clinical Alert
                </p>
            </div>

            <!-- Patient Summary -->
            <div style="padding: 24px 32px; border-bottom: 2px solid #f0f0f0;">
                <table style="width: 100%;">
                    <tr>
                        <td>
                            <span style="color: #7f8c8d; font-size: 12px; text-transform: uppercase;">
                                Patient ID
                            </span><br>
                            <strong style="font-size: 18px;">{patient_id}</strong>
                        </td>
                        <td style="text-align: right;">
                            <span style="color: #7f8c8d; font-size: 12px; text-transform: uppercase;">
                                Risk Score at Alert
                            </span><br>
                            <strong style="font-size: 28px; color: #c0392b;">{peak_score:.2f}</strong>
                            <span style="color: #7f8c8d; font-size: 13px;"> / threshold {threshold}</span>
                        </td>
                    </tr>
                </table>
                <p style="color: #7f8c8d; margin: 12px 0 0 0; font-size: 13px;">
                    Alert triggered at ICU Hour <strong>{alert_hour}</strong>
                </p>
            </div>

            <!-- Vitals Table -->
            <div style="padding: 24px 32px; border-bottom: 2px solid #f0f0f0;">
                <h3 style="margin: 0 0 16px 0; color: #2c3e50; font-size: 15px;
                           text-transform: uppercase; letter-spacing: 0.5px;">
                    Vitals at Alert Hour
                </h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #f8f9fa;">
                            <th style="padding: 8px 12px; text-align: left; font-size: 13px;
                                       color: #7f8c8d; border-bottom: 2px solid #dee2e6;">Vital</th>
                            <th style="padding: 8px 12px; text-align: left; font-size: 13px;
                                       color: #7f8c8d; border-bottom: 2px solid #dee2e6;">Value</th>
                            <th style="padding: 8px 12px; text-align: left; font-size: 13px;
                                       color: #7f8c8d; border-bottom: 2px solid #dee2e6;">Normal Range</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">Heart Rate</td>
                            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;
                                       font-weight: bold; color: #c0392b;">{hr} bpm</td>
                            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;
                                       color: #7f8c8d;">60 – 100 bpm</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">Temperature</td>
                            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;
                                       font-weight: bold; color: #c0392b;">{temp} °C</td>
                            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;
                                       color: #7f8c8d;">36.1 – 37.2 °C</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">Respiratory Rate</td>
                            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;
                                       font-weight: bold; color: #c0392b;">{resp} breaths/min</td>
                            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;
                                       color: #7f8c8d;">12 – 20 breaths/min</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 12px;">WBC Count</td>
                            <td style="padding: 8px 12px; font-weight: bold;
                                       color: #c0392b;">{wbc} x10³/µL</td>
                            <td style="padding: 8px 12px; color: #7f8c8d;">4.5 – 11.0 x10³/µL</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- SHAP Contributors -->
            <div style="padding: 24px 32px; border-bottom: 2px solid #f0f0f0;">
                <h3 style="margin: 0 0 16px 0; color: #2c3e50; font-size: 15px;
                           text-transform: uppercase; letter-spacing: 0.5px;">
                    Top Contributing Factors (ML Explanation)
                </h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #f8f9fa;">
                            <th style="padding: 8px 12px; text-align: left; font-size: 13px;
                                       color: #7f8c8d; border-bottom: 2px solid #dee2e6;">Feature</th>
                            <th style="padding: 8px 12px; text-align: left; font-size: 13px;
                                       color: #7f8c8d; border-bottom: 2px solid #dee2e6;">Direction</th>
                            <th style="padding: 8px 12px; text-align: left; font-size: 13px;
                                       color: #7f8c8d; border-bottom: 2px solid #dee2e6;">SHAP Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shap_rows}
                    </tbody>
                </table>
            </div>

            <!-- MedGemma Clinical Summary -->
            <div style="padding: 24px 32px; border-bottom: 2px solid #f0f0f0;
                        background-color: #fdfefe;">
                <h3 style="margin: 0 0 12px 0; color: #2c3e50; font-size: 15px;
                           text-transform: uppercase; letter-spacing: 0.5px;">
                    AI Clinical Summary
                </h3>
                <p style="color: #2c3e50; line-height: 1.7; margin: 0;
                          font-size: 14px; font-style: italic;">
                    {clinical_summary}
                </p>
                <p style="color: #bdc3c7; font-size: 11px; margin: 12px 0 0 0;">
                    Generated by MedGemma 1.5 clinical reasoning agent
                </p>
            </div>

            <!-- Footer -->
            <div style="padding: 16px 32px; background-color: #f8f9fa;">
                <p style="color: #bdc3c7; font-size: 11px; margin: 0; text-align: center;">
                    Early Sepsis Detector — Hack The Knight 2025 &nbsp;|&nbsp;
                    This alert was generated autonomously by an AI monitoring system.
                    Clinical decisions must be verified by a qualified physician.
                </p>
            </div>

        </div>
    </body>
    </html>
    """
    return html


# ── Public Interface ───────────────────────────────────────────────────────────

def send_alert_email(
    patient_id: str,
    clinical_summary: str,
    prediction_data: dict
) -> bool:
    """
    Public function called by report.py.

    Builds the HTML email and sends it via Gmail SMTP.
    Returns True if the email was sent successfully, False otherwise.

    Why not async? smtplib is a synchronous library and the SMTP handshake
    is fast (< 2 seconds) compared to the Ollama call (5–15 seconds).
    For a hackathon, keeping this synchronous is simpler and fine in practice.
    If you wanted to be rigorous, you'd run this in a thread pool executor —
    but that's unnecessary complexity here.
    """

    # Validate that credentials are actually loaded from .env.
    # If .env is missing or misconfigured, fail immediately with a clear
    # message instead of a cryptic SMTP authentication error.
    if not SENDER_EMAIL or not SENDER_APP_PASSWORD or not RECIPIENT_EMAIL:
        logger.error(
            "Email credentials missing from .env. "
            "Check SENDER_EMAIL, SENDER_APP_PASSWORD, and RECIPIENT_EMAIL."
        )
        return False

    try:
        # Build the email as a MIME message.
        # MIMEMultipart("alternative") means the email has multiple versions
        # of the same content — in our case, just HTML. If we wanted a
        # plain-text fallback for email clients that don't render HTML,
        # we'd attach a MIMEText("plain") part as well.
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"⚠ SEPSIS ALERT — Patient {patient_id} — Immediate Attention Required"
        msg["From"]    = SENDER_EMAIL
        msg["To"]      = RECIPIENT_EMAIL

        # Build and attach the HTML body
        html_body = _build_html_email(patient_id, clinical_summary, prediction_data)
        msg.attach(MIMEText(html_body, "html"))

        # Open SMTP connection to Gmail.
        # Port 587 with STARTTLS is the modern standard for authenticated
        # email sending — it starts as a plain connection, then upgrades to
        # encrypted TLS before credentials are ever transmitted.
        logger.info(f"Connecting to {SMTP_HOST}:{SMTP_PORT}...")
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()           # Identify ourselves to the server
            server.starttls()       # Upgrade to encrypted TLS connection
            server.ehlo()           # Re-identify after TLS upgrade
            server.login(SENDER_EMAIL, SENDER_APP_PASSWORD)
            server.sendmail(SENDER_EMAIL, RECIPIENT_EMAIL, msg.as_string())

        logger.info(f"Alert email sent successfully to {RECIPIENT_EMAIL}")
        return True

    except smtplib.SMTPAuthenticationError:
        # This is the most common failure — wrong App Password or
        # 2FA not enabled on the Gmail account.
        logger.error(
            "SMTP Authentication failed. "
            "Verify your App Password in .env and that 2FA is enabled on your Gmail account."
        )
        return False

    except smtplib.SMTPException as e:
        logger.error(f"SMTP error while sending email: {e}")
        return False

    except Exception as e:
        logger.error(f"Unexpected error in send_alert_email: {e}")
        return False