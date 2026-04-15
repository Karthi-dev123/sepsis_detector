import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

export default function RiskTimeline({ hours, riskScores, threshold, alertHour }) {
  // Prepare data for Recharts
  const data = hours.map((h, i) => ({
    hour: h,
    risk: riskScores[i],
  }));

  // Custom dot renderer - pulsing red dot at alert hour
  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (payload.hour === alertHour) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill="#EF4444"
          style={{
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-slate-800 rounded-lg p-4">
      <h2 className="text-teal-400 uppercase tracking-widest text-xs font-semibold mb-4">Risk Timeline</h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />

          <XAxis
            dataKey="hour"
            label={{ value: 'Hour', position: 'insideBottomRight', offset: -5 }}
            stroke="#94a3b8"
          />

          <YAxis
            domain={[0, 1]}
            label={{ value: 'Risk Score', angle: -90, position: 'insideLeft' }}
            stroke="#94a3b8"
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '6px',
            }}
            labelStyle={{ color: '#f1f5f9' }}
            formatter={(value) => value.toFixed(3)}
          />

          {/* Alert threshold reference line */}
          <ReferenceLine
            y={threshold}
            stroke="#EF4444"
            strokeDasharray="5 5"
            label={{
              value: 'Alert Threshold',
              position: 'right',
              fill: '#EF4444',
              offset: 10,
            }}
          />

          {/* Risk score line */}
          <Line
            type="monotone"
            dataKey="risk"
            stroke="#22C55E"
            strokeWidth={2}
            dot={<CustomDot />}
            activeDot={{ r: 8, fill: '#22C55E' }}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Pulsing animation keyframe */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
