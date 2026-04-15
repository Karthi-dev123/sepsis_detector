import axios from 'axios'

const BASE_URL = 'http://localhost:8000'

export async function checkHealth() {
  const res = await axios.get(`${BASE_URL}/health`)
  return res.data
}

export async function predictPatient(file) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await axios.post(`${BASE_URL}/predict`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
}

export async function generateReport(predictionData) {
  const res = await axios.post(`${BASE_URL}/generate-report`, predictionData)
  return res.data
}