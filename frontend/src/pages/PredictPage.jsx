import { useState, useRef } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine,
  ResponsiveContainer, CartesianGrid, Legend,
  BarChart, Bar, Cell,
} from 'recharts'

const API = 'http://localhost:8000'
const THRESHOLD = 0.65

// ── Sub-components ─────────────────────────────────────────────

function RiskTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value ?? 0
  return (
    <div className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-1">Hour {label}</p>
      <p className={`font-bold font-mono ${val >= THRESHOLD ? 'text-red-400' : 'text-green-400'}`}>
        Risk: {(val * 100).toFixed(1)}%
      </p>
    </div>
  )
}

function SHAPTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value ?? 0
  return (
    <div className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-300 font-semibold">{label}</p>
      <p className={`font-mono ${val >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
        Impact: {val >= 0 ? '+' : ''}{val.toFixed(4)}
      </p>
    </div>
  )
}

function AlertBanner({ result }) {
  if (!result) return null
  const isAlert = result.alert_triggered
  return (
    <div className={`rounded-xl p-4 border-2 flex items-center gap-4 ${
      isAlert
        ? 'bg-red-950/60 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
        : 'bg-green-950/60 border-green-500'
    }`}>
      <span className="text-4xl">{isAlert ? '🚨' : '✅'}</span>
      <div>
        <p className={`font-bold text-lg ${isAlert ? 'text-red-400' : 'text-green-400'}`}>
          {isAlert ? 'SEPSIS ALERT TRIGGERED' : 'No Sepsis Detected'}
        </p>
        <p className="text-slate-300 text-sm mt-0.5">
          Peak risk score: <span className="font-mono font-bold">
            {(result.peak_risk_score * 100).toFixed(1)}%
          </span>
          {' '}at hour <span className="font-mono">{result.peak_hour}</span>
          {isAlert && result.email_sent && (
            <span className="ml-3 text-green-400">· ✉️ Email alert sent</span>
          )}
        </p>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────

export default function PredictPage() {
  const [file, setFile]         = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summary, setSummary]   = useState(null)
  const inputRef = useRef()

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped?.name.endsWith('.csv') || dropped?.name.endsWith('.psv')) {
      setFile(dropped)
      setResult(null)
      setError(null)
      setSummary(null)
    } else {
      setError('Please upload a .csv or .psv file')
    }
  }

  const handleAnalyze = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    setSummary(null)

    const form = new FormData()
    form.append('file', file)

    try {
      const res = await fetch(`${API}/predict`, { method: 'POST', body: form })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      setResult(data)

      // Auto-fetch MedGemma summary after prediction
      if (data.peak_risk_score > 0) {
        fetchSummary(data)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async (data) => {
    setSummaryLoading(true)
    try {
      const res = await fetch(`${API}/report/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          peak_risk_score: data.peak_risk_score,
          peak_hour:       data.peak_hour,
          shap_values:     data.shap_values,
          alert_triggered: data.alert_triggered,
        }),
      })
      const d = await res.json()
      setSummary(d.summary)
    } catch {
      setSummary(null)
    } finally {
      setSummaryLoading(false)
    }
  }

  // Build chart data
  const riskChartData = result?.risk_scores?.map((s, i) => ({
    hour: i + 1,
    risk: parseFloat(s.toFixed(4)),
  })) ?? []

  const shapChartData = result?.shap_values
    ? Object.entries(result.shap_values)
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
        .slice(0, 10)
        .map(([k, v]) => ({ feature: k, value: parseFloat(v.toFixed(4)) }))
    : []

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">CSV Patient Analysis</h1>
        <p className="text-slate-400 text-sm mt-1">
          Upload a patient CSV/PSV file to get sepsis risk scores, SHAP explainability, and a clinical summary.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
          dragging
            ? 'border-blue-400 bg-blue-950/30'
            : file
            ? 'border-green-500 bg-green-950/20'
            : 'border-slate-600 bg-slate-800/40 hover:border-slate-400'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.psv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files[0]
            if (f) { setFile(f); setResult(null); setError(null); setSummary(null) }
          }}
        />
        <p className="text-4xl mb-3">{file ? '📄' : '📂'}</p>
        {file ? (
          <>
            <p className="text-green-400 font-semibold">{file.name}</p>
            <p className="text-slate-400 text-sm mt-1">
              {(file.size / 1024).toFixed(1)} KB · Click to change file
            </p>
          </>
        ) : (
          <>
            <p className="text-slate-300 font-medium">Drag & drop a patient CSV or PSV file</p>
            <p className="text-slate-500 text-sm mt-1">or click to browse</p>
          </>
        )}
      </div>

      {/* Analyze button */}
      {file && !loading && (
        <button
          onClick={handleAnalyze}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
        >
          🔬 Analyze Patient
        </button>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-slate-400">Analyzing patient vitals...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-950/60 border border-red-500 rounded-xl p-4 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">

          {/* Alert banner */}
          <AlertBanner result={result} />

          {/* Risk Timeline */}
          <div className="bg-slate-800 rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-4">📈 Risk Timeline</h2>
            {riskChartData.length < 2 ? (
              <p className="text-slate-400 text-sm text-center py-8">Not enough data points</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={riskChartData} margin={{ top: 8, right: 16, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}
                    label={{ value: 'Hour', position: 'insideBottomRight', offset: -4, fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                    tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<RiskTooltip />} />
                  <ReferenceLine y={THRESHOLD} stroke="#ef4444" strokeDasharray="6 3" strokeWidth={1.5}
                    label={{ value: 'Alert threshold (65%)', position: 'insideTopRight', fill: '#ef4444', fontSize: 10 }} />
                  <Line type="monotone" dataKey="risk" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={true} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* SHAP Chart */}
          {shapChartData.length > 0 && (
            <div className="bg-slate-800 rounded-2xl p-5">
              <h2 className="text-white font-semibold mb-1">🧠 SHAP Explainability</h2>
              <p className="text-slate-400 text-xs mb-4">
                Top features driving the risk score at peak hour {result.peak_hour}
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={shapChartData}
                  layout="vertical"
                  margin={{ top: 0, right: 16, bottom: 0, left: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => v.toFixed(3)} />
                  <YAxis type="category" dataKey="feature" tick={{ fill: '#cbd5e1', fontSize: 11 }} axisLine={false} tickLine={false} width={95} />
                  <Tooltip content={<SHAPTooltip />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {shapChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.value >= 0 ? '#ef4444' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 justify-center text-xs text-slate-400">
                <span><span className="inline-block w-3 h-3 bg-red-500 rounded-sm mr-1" />Increases risk</span>
                <span><span className="inline-block w-3 h-3 bg-blue-500 rounded-sm mr-1" />Decreases risk</span>
              </div>
            </div>
          )}

          {/* MedGemma Summary */}
          <div className="bg-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-white font-semibold">🩺 Clinical Summary</h2>
              <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-full">MedGemma</span>
            </div>
            {summaryLoading && (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`h-4 bg-slate-700 rounded animate-pulse ${i === 3 ? 'w-2/3' : 'w-full'}`} />
                ))}
              </div>
            )}
            {!summaryLoading && summary && (
              <p className="text-slate-200 text-sm leading-relaxed">{summary}</p>
            )}
            {!summaryLoading && !summary && (
              <p className="text-slate-500 text-sm italic">Summary unavailable — MedGemma may not be running.</p>
            )}
          </div>

          {/* Email alert status */}
          {result.alert_triggered && (
            <div className={`rounded-xl p-4 border text-sm ${
              result.email_sent
                ? 'bg-green-950/40 border-green-600 text-green-400'
                : 'bg-slate-800 border-slate-600 text-slate-400'
            }`}>
              {result.email_sent
                ? '✉️ Email alert successfully sent to the attending physician.'
                : '📧 Email alert not sent — check SMTP configuration in backend/.env'}
            </div>
          )}

        </div>
      )}
    </div>
  )
}