import axios from 'axios';

// Base URL for Group A's backend
const API_BASE_URL = 'http://localhost:8000';

/**
 * Upload a patient CSV file and get risk predictions
 * @param {File} file - The CSV/PSV file to analyze
 * @returns {Promise} - Response data with risk scores, SHAP values, vitals
 * @throws {Error} - Network or validation errors
 */
export async function predictPatient(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(
      `${API_BASE_URL}/predict`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error calling /predict:', error);
    throw new Error(
      error.response?.data?.detail ||
        error.message ||
        'Failed to analyze patient file'
    );
  }
}

/**
 * Generate a clinical report and send alert email
 * @param {Object} predictionData - The prediction result from /predict endpoint
 * @returns {Promise} - Response data with clinical_summary and email_sent status
 * @throws {Error} - Network or API errors
 */
export async function generateReport(predictionData) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/generate-report`,
      predictionData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error calling /generate-report:', error);
    throw new Error(
      error.response?.data?.detail ||
        error.message ||
        'Failed to generate clinical report'
    );
  }
}
