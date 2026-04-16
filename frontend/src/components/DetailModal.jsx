// DetailModal: fullscreen overlay opened when PatientCard is clicked
// Props: bed (meta, history), onClose
// Contains: RiskTimeline LineChart (Recharts), VitalsTable, close button
// LineChart: x=hour, y=risk_score 0-1, red dashed ReferenceLine at y=0.65
// VitalsTable: shows last 20 rows reversed, highlights rows where risk > 0.65 in red
// Close on background click or X button

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'

export default function DetailModal({ bed, onClose }) {
  const history = bed.history

  return (
    <div
      className='fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4'
      onClick={onClose}
    >
      <div
        className='bg-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex justify-between items-center mb-6'>
          <div>
            <h2 className='text-white text-2xl font-bold'>
              {bed.meta.patient_id}
            </h2>
            <p className='text-slate-400'>{bed.meta.room} • Age {bed.meta.age}</p>
          </div>
          <button
            onClick={onClose}
            className='text-slate-400 hover:text-white text-3xl'
          >
            ✕
          </button>
        </div>

        {/* Risk Timeline Chart */}
        <div className='bg-slate-700 rounded-xl p-4 mb-6'>
          <h3 className='text-white font-semibold mb-3'>Live Risk Timeline</h3>
          <ResponsiveContainer width='100%' height={300}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray='3 3' stroke='#475569' />
              <XAxis
                dataKey='hour'
                stroke='#94a3b8'
                label={{ value: 'Hour', position: 'bottom', fill: '#94a3b8' }}
              />
              <YAxis
                domain={[0, 1]}
                stroke='#94a3b8'
                tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                label={{ value: 'Risk Score', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
              />
              <Tooltip
                formatter={(v) => [`${(v * 100).toFixed(1)}%`, 'Risk']}
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <ReferenceLine
                y={0.65}
                stroke='#ef4444'
                strokeDasharray='5 5'
                label={{ value: 'Alert Threshold', fill: '#ef4444', position: 'right' }}
              />
              <Line
                type='monotone'
                dataKey='risk_score'
                stroke='#3b82f6'
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Vitals Table */}
        <div className='bg-slate-700 rounded-xl p-4 overflow-x-auto'>
          <h3 className='text-white font-semibold mb-3'>Vitals History</h3>
          <table className='w-full text-sm text-slate-300'>
            <thead>
              <tr className='text-slate-400 border-b border-slate-600'>
                <th className='text-left py-2 pr-4'>Hour</th>
                <th className='text-left py-2 pr-4'>HR (60-100)</th>
                <th className='text-left py-2 pr-4'>Temp (36.1-37.2)</th>
                <th className='text-left py-2 pr-4'>Resp (12-20)</th>
                <th className='text-left py-2 pr-4'>SBP (90-140)</th>
                <th className='text-left py-2'>O2Sat (95-100)</th>
                <th className='text-left py-2'>Risk</th>
              </tr>
            </thead>
            <tbody>
              {[...history].reverse().slice(0, 20).map((row, idx) => {
                const isAlertRow = row.risk_score > 0.65
                return (
                  <tr
                    key={idx}
                    className={`border-b border-slate-600 ${
                      isAlertRow ? 'bg-red-900 bg-opacity-30' : ''
                    }`}
                  >
                    <td className='py-2 pr-4'>{row.hour}</td>
                    <td className='py-2 pr-4'>{row.hr?.toFixed(0) ?? '--'}</td>
                    <td className='py-2 pr-4'>{row.temp?.toFixed(1) ?? '--'}</td>
                    <td className='py-2 pr-4'>{row.resp?.toFixed(0) ?? '--'}</td>
                    <td className='py-2 pr-4'>{row.sbp?.toFixed(0) ?? '--'}</td>
                    <td className='py-2 pr-4'>{row.o2sat?.toFixed(1) ?? '--'}</td>
                    <td className={`py-2 font-bold ${
                      isAlertRow ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {(row.risk_score * 100).toFixed(1)}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
