import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts'
import { Brain } from 'lucide-react'

const FEATURE_LABELS = {
  ICULOS:     'ICU Length of Stay',
  WBC:        'White Blood Cells',
  Creatinine: 'Creatinine',
  HR:         'Heart Rate',
  Resp:       'Respiratory Rate',
  Temp:       'Temperature',
  SBP:        'Systolic BP',
  MAP:        'Mean Art. Pressure',
  O2Sat:      'Oxygen Saturation',
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0].payload
  const isPositive = value >= 0
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2">
      <p className="text-xs text-slate-500 mb-1">
        {FEATURE_LABELS[name] || name}
      </p>
      <p className={`text-sm font-bold font-mono
                     ${isPositive ? 'text-red-600' : 'text-teal-600'}`}>
        {value > 0 ? '+' : ''}{value.toFixed(3)}
      </p>
      <p className="text-xs text-slate-400 mt-0.5">
        {isPositive ? '↑ Increases sepsis risk' : '↓ Decreases sepsis risk'}
      </p>
    </div>
  )
}

export default function SHAPChart({ shapValues }) {
  if (!shapValues || Object.keys(shapValues).length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm
                      flex items-center justify-center min-h-64">
        <p className="text-sm text-slate-400">
          No SHAP data — alert was not triggered
        </p>
      </div>
    )
  }

  const data = Object.entries(shapValues)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-teal-500" />
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            ML Explanation (SHAP)
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-red-400" />
            <span>Increases Risk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-teal-400" />
            <span>Decreases Risk</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 40, left: 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />

          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => v.toFixed(2)}
          />

          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            width={80}
            tickFormatter={(name) => FEATURE_LABELS[name] || name}
          />

          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x={0} stroke="#e2e8f0" strokeWidth={1.5} />

          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.value >= 0 ? '#f87171' : '#2dd4bf'}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <p className="text-xs text-slate-400 text-center mt-2">
        SHAP values show each feature's contribution to the sepsis risk score
      </p>
    </div>
  )
}