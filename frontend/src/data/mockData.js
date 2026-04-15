// src/data/mockData.js
// This file simulates the /predict response for a sepsis patient and a healthy patient
// Use during development before Group A's backend is ready

export const mockSepsisResult = {
  patient_id: "p000412",
  hours: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  risk_scores: [0.05, 0.08, 0.11, 0.15, 0.22, 0.35, 0.52, 0.68, 0.79, 0.85, 0.88, 0.84, 0.81],
  alert_triggered: true,
  alert_hour: 7,
  threshold: 0.65,
  shap_values: {
    "Heart Rate": 0.32,
    "Temperature": 0.21,
    "Respiratory Rate": 0.15,
    "WBC Count": 0.11,
    "Blood Pressure": -0.05,
    "O2 Saturation": -0.08
  },
  vitals_summary: {
    HR: [78, 82, 85, 90, 96, 104, 110, 118, 122, 119, 116, 112, 108],
    Temp: [36.8, 36.9, 37.1, 37.3, 37.6, 38.0, 38.4, 38.9, 39.2, 39.0, 38.7, 38.4, 38.1],
    Resp: [14, 15, 16, 17, 19, 21, 23, 26, 28, 27, 25, 23, 22]
  }
};

export const mockHealthyResult = {
  patient_id: "p000891",
  hours: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  risk_scores: [0.03, 0.05, 0.04, 0.06, 0.08, 0.05, 0.07, 0.04, 0.06, 0.05],
  alert_triggered: false,
  alert_hour: null,
  threshold: 0.65,
  shap_values: {},
  vitals_summary: {
    HR: [72, 75, 73, 71, 74, 72, 73, 70, 72, 71],
    Temp: [36.6, 36.7, 36.5, 36.6, 36.8, 36.7, 36.6, 36.5, 36.7, 36.6],
    Resp: [14, 15, 14, 15, 14, 13, 14, 15, 14, 14]
  }
};
