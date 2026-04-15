import { ShieldCheck, ShieldAlert, Clock, TrendingUp } from 'lucide-react'

export default function AlertStatus({ result }) {
  // No result yet — waiting state
  if (!result) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm
                      flex flex-col items-center justify-center text-center min-h-40">
        <div className="bg-slate-100 rounded-full p-3 mb-3">
          <ShieldCheck className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-500">Awaiting Analysis</p>
        <p className="text-xs text-slate-400 mt-1">
          Upload a patient CSV or use Demo Mode
        </p>
      </div>
    )
  }

  const { alert_triggered, alert_hour, risk_scores, threshold, patient_id } = result
  const peakScore = Math.max(...risk_scores)

  // Alert triggered — danger state
  if (alert_triggered) {
    return (
      <div className="bg-red-50 rounded-xl border-2 border-red-200 p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-red-100 rounded-lg p-2 animate-pulse">
              <ShieldAlert className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-red-700 uppercase tracking-wide">
                Sepsis Alert
              </h2>
              <p className="text-xs text-red-400">{patient_id}</p>
            </div>
          </div>
          <span className="text-xs bg-red-100 text-red-600 font-semibold
                           px-2 py-1 rounded-full border border-red-200">
            HIGH RISK
          </span>
        </div>

        {/* Peak Risk Score */}
        <div className="bg-white rounded-lg p-4 border border-red-200 mb-3">
          <p className="text-xs text-slate-500 mb-1">Peak Risk Score</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-red-600 font-mono">
              {peakScore.toFixed(2)}
            </span>
            <span className="text-sm text-slate-400 mb-1">
              / threshold {threshold}
            </span>
          </div>
          {/* Risk bar */}
          <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full transition-all duration-1000"
              style={{ width: `${peakScore * 100}%` }}
            />
          </div>
        </div>

        {/* Alert Hour */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-400" />
            <span className="text-xs text-slate-600">
              Alert at <strong>ICU Hour {alert_hour}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-red-400" />
            <span className="text-xs text-slate-600">
              <strong>{risk_scores.filter(s => s > threshold).length}</strong> hours above threshold
            </span>
          </div>
        </div>
      </div>
    )
  }

  // No alert — healthy state
  return (
    <div className="bg-emerald-50 rounded-xl border-2 border-emerald-200 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-100 rounded-lg p-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-emerald-700 uppercase tracking-wide">
              No Risk Detected
            </h2>
            <p className="text-xs text-emerald-400">{patient_id}</p>
          </div>
        </div>
        <span className="text-xs bg-emerald-100 text-emerald-600 font-semibold
                         px-2 py-1 rounded-full border border-emerald-200">
          LOW RISK
        </span>
      </div>

      {/* Peak Risk Score */}
      <div className="bg-white rounded-lg p-4 border border-emerald-200 mb-3">
        <p className="text-xs text-slate-500 mb-1">Peak Risk Score</p>
        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold text-emerald-600 font-mono">
            {peakScore.toFixed(2)}
          </span>
          <span className="text-sm text-slate-400 mb-1">
            / threshold {threshold}
          </span>
        </div>
        <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
            style={{ width: `${peakScore * 100}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-emerald-400" />
        <span className="text-xs text-slate-600">
          Risk stayed below threshold across all{' '}
          <strong>{risk_scores.length} hours</strong>
        </span>
      </div>
    </div>
  )
}