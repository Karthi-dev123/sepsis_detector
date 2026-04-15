import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Area, AreaChart
} from 'recharts'
import { TrendingUp } from 'lucide-react'

const CustomTooltip = ({ active, payload, label, threshold }) => {
  if (!active || !payload?.length) return null
  const score = payload[0].value
  const isAbove = score >= threshold
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2">
      <p className="text-xs text-slate-400 mb-1">Hour {label}</p>
      <p className={`text-sm font-bold font-mono ${isAbove ? 'text-red-600' : 'text-teal-600'}`}>
        Risk: {score.toFixed(3)}
      </p>
      {isAbove && (
        <p className="text-xs text-red-400 mt-0.5">Above threshold</p>
      )}
    </div>
  )
}

export default function RiskTimeline({ hours, riskScores, threshold, alertHour }) {
  const data = hours.map((h, i) => ({
    hour: h,
    risk: riskScores[i],
    threshold: threshold
  }))

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-teal-500" />
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Sepsis Risk Timeline
          </h2>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-teal-500 rounded" />
            <span>Risk Score</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-red-400 rounded border-dashed" />
            <span>Alert Threshold ({threshold})</span>
          </div>
          {alertHour !== null && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span>Alert at Hour {alertHour}</span>
            </div>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="riskLineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset={`${(alertHour / hours.length) * 100}%`} stopColor="#14b8a6" />
              <stop offset={`${(alertHour / hours.length) * 100}%`} stopColor="#ef4444" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

          <XAxis
            dataKey="hour"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
            label={{
              value: 'ICU Hour',
              position: 'insideBottom',
              offset: -2,
              fontSize: 11,
              fill: '#94a3b8'
            }}
          />

          <YAxis
            domain={[0, 1]}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => v.toFixed(1)}
          />

          <Tooltip content={<CustomTooltip threshold={threshold} />} />

          {/* Alert threshold line */}
          <ReferenceLine
            y={threshold}
            stroke="#ef4444"
            strokeDasharray="6 3"
            strokeWidth={1.5}
            label={{
              value: `Threshold ${threshold}`,
              position: 'insideTopRight',
              fontSize: 10,
              fill: '#ef4444'
            }}
          />

          {/* Alert hour vertical line */}
          {alertHour !== null && (
            <ReferenceLine
              x={alertHour}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{
                value: `Alert`,
                position: 'top',
                fontSize: 10,
                fill: '#ef4444'
              }}
            />
          )}

          <Area
            type="monotone"
            dataKey="risk"
            stroke="url(#riskLineGradient)"
            strokeWidth={2.5}
            fill="url(#riskGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#14b8a6', stroke: 'white', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}