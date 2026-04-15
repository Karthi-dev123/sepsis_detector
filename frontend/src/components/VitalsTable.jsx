import { Activity } from 'lucide-react'

const VITALS_CONFIG = {
  HR:   { label: 'Heart Rate',       unit: 'bpm',      normal: '60–100',   decimals: 0 },
  Temp: { label: 'Temperature',      unit: '°C',       normal: '36.1–37.2', decimals: 1 },
  Resp: { label: 'Respiratory Rate', unit: 'br/min',   normal: '12–20',    decimals: 0 },
  WBC:  { label: 'WBC Count',        unit: 'x10³/µL',  normal: '4.5–11.0', decimals: 1 },
}

const ALERT_RANGES = {
  HR:   { min: 60,   max: 100  },
  Temp: { min: 36.1, max: 37.2 },
  Resp: { min: 12,   max: 20   },
  WBC:  { min: 4.5,  max: 11.0 },
}

function isAbnormal(key, value) {
  const range = ALERT_RANGES[key]
  if (!range || value == null) return false
  return value < range.min || value > range.max
}

export default function VitalsTable({ vitals, hours, alertHour }) {
  if (!vitals || !hours) return null

  // Show a window of hours around the alert hour, or last 10 if no alert
  const windowSize = 8
  const centerHour = alertHour !== null ? alertHour : hours.length - 1
  const startIdx = Math.max(0, centerHour - Math.floor(windowSize / 2))
  const endIdx = Math.min(hours.length - 1, startIdx + windowSize - 1)
  const displayHours = hours.slice(startIdx, endIdx + 1)

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-500" />
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Vitals at Alert Window
          </h2>
        </div>
        {alertHour !== null && (
          <span className="text-xs bg-red-50 text-red-500 border border-red-200
                           px-2 py-1 rounded-full font-medium">
            Alert at Hour {alertHour}
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-2 pr-3 text-slate-500 font-medium w-28">
                Vital
              </th>
              <th className="text-left py-2 pr-3 text-slate-400 font-normal w-20">
                Normal
              </th>
              {displayHours.map(h => (
                <th
                  key={h}
                  className={`text-center py-2 px-1 font-medium min-w-10
                    ${h === alertHour
                      ? 'text-red-500 bg-red-50 rounded-t-md'
                      : 'text-slate-400'
                    }`}
                >
                  {h === alertHour ? (
                    <span className="flex flex-col items-center">
                      <span className="text-red-400 text-xs">⚠</span>
                      Hr {h}
                    </span>
                  ) : `Hr ${h}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(VITALS_CONFIG).map(([key, config]) => {
              const vals = vitals[key] || []
              return (
                <tr key={key} className="border-b border-slate-50 hover:bg-slate-50
                                          transition-colors">
                  <td className="py-2.5 pr-3">
                    <div className="font-medium text-slate-700">{config.label}</div>
                    <div className="text-slate-400">{config.unit}</div>
                  </td>
                  <td className="py-2.5 pr-3 text-slate-400">
                    {config.normal}
                  </td>
                  {displayHours.map(h => {
                    const val = vals[h]
                    const abnormal = isAbnormal(key, val)
                    const isAlert = h === alertHour
                    return (
                      <td
                        key={h}
                        className={`text-center py-2.5 px-1 font-mono
                          ${isAlert ? 'bg-red-50' : ''}
                          ${abnormal
                            ? 'text-red-500 font-semibold'
                            : 'text-slate-600'
                          }`}
                      >
                        {val != null
                          ? val.toFixed(config.decimals)
                          : <span className="text-slate-300">—</span>
                        }
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400 mt-3 text-center">
        Showing hours {displayHours[0]}–{displayHours[displayHours.length - 1]} •
        Red values are outside normal range
      </p>
    </div>
  )
}