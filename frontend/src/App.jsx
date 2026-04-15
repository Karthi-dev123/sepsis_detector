import { useState } from 'react'
import { Activity, Shield } from 'lucide-react'
import { predictPatient } from './utils/api'
import { mockSepsisResult } from './data/mockdata' 
import FileUpload from './components/FileUpload'
import AlertStatus from './components/AlertStatus'
import RiskTimeline from './components/RiskTimeline'
import SHAPChart from './components/SHAPChart'
import VitalsTable from './components/VitalsTable'
import ReportPreview from './components/ReportPreview'

export default function App() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleAnalyze(file) {
    setLoading(true)
    setError(null)
    try {
      const data = await predictPatient(file)
      setResult(data)
    } catch (err) {
      setError('Failed to analyze patient file. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  function handleDemoMode() {
    setResult(mockSepsisResult)
  }

  function handleReset() {
    setResult(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-teal-500 rounded-lg p-2">
              <Activity className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-none">
                Early Sepsis Detector
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                ICU Clinical Decision Support System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50
                            border border-slate-200 px-3 py-1.5 rounded-full">
              <Shield className="w-3 h-3 text-teal-500" />
              XGBoost + SHAP + MedGemma
            </div>
            {result && (
              <button
                onClick={handleReset}
                className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200
                           hover:border-slate-300 px-3 py-1.5 rounded-full transition-colors"
              >
                New Patient
              </button>
            )}
            <button
              onClick={handleDemoMode}
              className="text-xs bg-teal-500 hover:bg-teal-600 text-white
                         px-3 py-1.5 rounded-full transition-colors font-medium"
            >
              Demo Mode
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-5">

        {/* Row 1 — Upload + Alert Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <FileUpload
            onAnalyze={handleAnalyze}
            loading={loading}
            error={error}
            hasResult={!!result}
          />
          <AlertStatus result={result} />
        </div>

        {/* Row 2 — Risk Timeline (full width) */}
        {result && (
          <RiskTimeline
            hours={result.hours}
            riskScores={result.risk_scores}
            threshold={result.threshold}
            alertHour={result.alert_hour}
          />
        )}

        {/* Row 3 — SHAP Chart + Vitals Table */}
        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <SHAPChart shapValues={result.shap_values} />
            <VitalsTable
              vitals={result.vitals_summary}
              hours={result.hours}
              alertHour={result.alert_hour}
            />
          </div>
        )}

        {/* Row 4 — Report Preview (full width) */}
        {result && result.alert_triggered && (
          <ReportPreview result={result} />
        )}

      </main>
    </div>
  )
}