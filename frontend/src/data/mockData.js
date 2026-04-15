export const mockSepsisResult = {
  patient_id: "sepsis_patient_DEMO",
  hours: Array.from({ length: 54 }, (_, i) => i),
  risk_scores: [
    0.10, 0.11, 0.12, 0.11, 0.13, 0.14, 0.12, 0.15, 0.14, 0.16,
    0.15, 0.17, 0.16, 0.18, 0.17, 0.19, 0.18, 0.20, 0.21, 0.22,
    0.21, 0.23, 0.24, 0.25, 0.26, 0.28, 0.30, 0.32, 0.35, 0.38,
    0.40, 0.42, 0.44, 0.47, 0.50, 0.53, 0.55, 0.57, 0.59, 0.61,
    0.63, 0.64, 0.65, 0.67, 0.70, 0.74, 0.78, 0.82, 0.86, 0.90,
    0.93, 0.95, 0.96, 0.97
  ],
  alert_triggered: true,
  alert_hour: 43,
  threshold: 0.65,
  shap_values: {
    "ICULOS":     0.373,
    "WBC":        0.279,
    "Creatinine": 0.254,
    "HR":         0.187,
    "Resp":       0.142,
    "Temp":      -0.063
  },
  vitals_summary: {
    HR:   Array.from({ length: 54 }, (_, i) => Math.round(72 + i * 0.9)),
    Temp: Array.from({ length: 54 }, (_, i) => parseFloat((36.8 + i * 0.04).toFixed(1))),
    Resp: Array.from({ length: 54 }, (_, i) => Math.round(15 + i * 0.22)),
    WBC:  Array.from({ length: 54 }, (_, i) => parseFloat((7.2 + i * 0.17).toFixed(1)))
  }
}

export const mockHealthyResult = {
  patient_id: "healthy_patient_DEMO",
  hours: Array.from({ length: 49 }, (_, i) => i),
  risk_scores: Array.from({ length: 49 }, () =>
    parseFloat((Math.random() * 0.15 + 0.08).toFixed(3))
  ),
  alert_triggered: false,
  alert_hour: null,
  threshold: 0.65,
  shap_values: {},
  vitals_summary: {
    HR:   Array.from({ length: 49 }, () => Math.round(68 + Math.random() * 10)),
    Temp: Array.from({ length: 49 }, () => parseFloat((36.6 + Math.random() * 0.4).toFixed(1))),
    Resp: Array.from({ length: 49 }, () => Math.round(14 + Math.random() * 4)),
    WBC:  Array.from({ length: 49 }, () => parseFloat((7.0 + Math.random() * 2).toFixed(1)))
  }
}