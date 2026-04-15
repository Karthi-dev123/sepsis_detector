from app.email_service import send_alert_email

mock_prediction = {
    "alert_hour": 7,
    "risk_scores": [0.10, 0.12, 0.15, 0.18, 0.22, 0.35, 0.55, 0.72, 0.96],
    "threshold": 0.65,
    "shap_values": {"ICULOS": 0.41, "WBC": 0.28, "Creatinine": 0.19},
    "vitals_summary": {
        "HR":   [82, 85, 88, 92, 98, 104, 110, 118, 122],
        "Temp": [37.1, 37.2, 37.4, 37.6, 37.9, 38.3, 38.7, 39.1, 39.4],
        "Resp": [16, 16, 17, 18, 19, 21, 23, 26, 28],
        "WBC":  [7.5, 7.5, 7.8, 8.1, 9.2, 10.4, 11.8, 14.2, 16.1]
    }
}

result = send_alert_email(
    patient_id="p000123",
    clinical_summary="The patient is flagged as HIGH RISK for sepsis. Tachycardia and fever are the most concerning vitals. Immediate blood cultures and empiric antibiotics are recommended.",
    prediction_data=mock_prediction
)

print("Email sent:", result)