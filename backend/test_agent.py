# Run this as: python -m asyncio (Python 3.11+) or paste into a test script

import asyncio, sys
sys.path.insert(0, ".")  # so Python can find app/

from app.agent import generate_clinical_summary

# Mock prediction data — same shape as what /predict returns
mock_data = {
    "alert_hour": 53,
    "risk_scores": [0.10, 0.15, 0.20] * 17 + [0.72, 0.88, 0.966],  # 53 hours
    "shap_values": {
        "ICULOS": 0.41,
        "WBC": 0.28,
        "Creatinine": 0.19,
        "HR": 0.14,
        "Resp": 0.09,
        "Temp": -0.05
    },
    "vitals_summary": {
        "HR":   [82] * 53 + [118],
        "Temp": [37.1] * 53 + [39.1],
        "Resp": [16] * 53 + [26],
        "WBC":  [7.5] * 53 + [14.2]
    }
}

summary = asyncio.run(generate_clinical_summary(mock_data))
print("\n--- Clinical Summary ---")
print(summary)
print("--- End ---\n")