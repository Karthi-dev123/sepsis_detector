import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

SMTP_HOST     = os.environ.get("SMTP_HOST",     "smtp.gmail.com")
SMTP_PORT     = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER     = os.environ.get("SMTP_USER",     "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
ALERT_TO      = os.environ.get("ALERT_TO",      "")


def send_alert_email(peak_score: float, peak_hour: int, shap_values: dict) -> bool:
    """Send SMTP email alert. Returns True if sent successfully."""
    if not all([SMTP_USER, SMTP_PASSWORD, ALERT_TO]):
        print("SMTP not configured — skipping email")
        return False

    shap_rows = "".join(
        f"<tr><td style='padding:4px 8px'>{k}</td>"
        f"<td style='padding:4px 8px;color:{'#ef4444' if v>=0 else '#3b82f6'}'>"
        f"{v:+.4f}</td></tr>"
        for k, v in list(shap_values.items())[:6]
    )

    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:16px">
      <h1 style="color:#ef4444;margin-bottom:4px">🚨 Sepsis Alert</h1>
      <p style="color:#94a3b8;margin-top:0">Automated alert from Early Sepsis Detector</p>
      <div style="background:#1e293b;border:1px solid #ef4444;border-radius:12px;padding:20px;margin:20px 0">
        <p style="margin:0;font-size:14px;color:#94a3b8">Peak Risk Score</p>
        <p style="margin:4px 0 0;font-size:36px;font-weight:bold;color:#ef4444;font-family:monospace">
          {peak_score*100:.1f}%
        </p>
        <p style="margin:8px 0 0;font-size:13px;color:#94a3b8">Detected at hour <strong style="color:#e2e8f0">{peak_hour}</strong></p>
      </div>
      <h3 style="color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:1px">Top Contributing Factors</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tr style="color:#64748b"><th style="text-align:left;padding:4px 8px">Feature</th><th style="text-align:left;padding:4px 8px">SHAP Value</th></tr>
        {shap_rows}
      </table>
      <p style="margin-top:24px;font-size:12px;color:#475569">
        This is an automated alert. Please review the patient immediately.
      </p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"🚨 Sepsis Alert — Risk {peak_score*100:.1f}% at Hour {peak_hour}"
    msg["From"]    = SMTP_USER
    msg["To"]      = ALERT_TO
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
            s.starttls()
            s.login(SMTP_USER, SMTP_PASSWORD)
            s.sendmail(SMTP_USER, ALERT_TO, msg.as_string())
        print(f"✅ Alert email sent to {ALERT_TO}")
        return True
    except Exception as e:
        print(f"Email send failed: {e}")
        return False