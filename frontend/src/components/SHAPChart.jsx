import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export default function SHAPChart({ shapValues }) {
  // Convert object to array and sort by absolute value (largest first)
  const data = Object.entries(shapValues || {})
    .map(([feature, value]) => ({
      feature,
      value,
      absValue: Math.abs(value),
    }))
    .sort((a, b) => b.absValue - a.absValue);

  if (!shapValues || Object.keys(shapValues).length === 0) {
    return (
      <div className="w-full bg-slate-800 rounded-lg p-4">
        <h2 className="text-teal-400 uppercase tracking-widest text-xs font-semibold mb-4">Feature Importance (SHAP)</h2>
        <div className="flex items-center justify-center py-12 text-slate-400">
          <p>No alert triggered</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-800 rounded-lg p-4">
      <h2 className="text-teal-400 uppercase tracking-widest text-xs font-semibold mb-2">Feature Importance (SHAP)</h2>
      <p className="text-sm text-slate-400 mb-3">
        Red = increased risk | Teal = decreased risk
      </p>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 100, left: 140, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />

          <XAxis type="number" stroke="#94a3b8" />

          <YAxis
            dataKey="feature"
            type="category"
            width={135}
            stroke="#94a3b8"
            tick={{ fontSize: 12, fill: '#cbd5e1' }}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '6px',
            }}
            labelStyle={{ color: '#f1f5f9' }}
            formatter={(value) => value.toFixed(4)}
          />

          <Bar
            dataKey="value"
            radius={4}
            label={{
              position: 'right',
              fill: '#cbd5e1',
              fontSize: 11,
              formatter: (value) => value.toFixed(3),
            }}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.value >= 0 ? '#EF4444' : '#14B8A6'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
