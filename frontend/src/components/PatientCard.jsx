// PatientCard: clickable bed card showing one ICU patient
// Props: bed (meta, history, status, finished), onClick
// Shows: patient ID, room, age, latest HR, latest risk score as percentage
// Status colors: GREEN=green border, YELLOW=yellow border+pulse, RED=red border+ping animation
// Risk score box turns red background when status is RED

export default function PatientCard({ bed, onClick }) {
  const latest = bed.history[bed.history.length - 1]
  const risk = latest?.risk_score ?? null
  const hr = latest?.hr ?? '--'
  const status = bed.finished ? 'DATA OVER / STABLE' : bed.status
  
  // Determine risk level text and color
  const riskLevel = risk !== null ? (risk < 0.4 ? 'Low' : risk < 0.7 ? 'Moderate' : 'High') : '--'
  const riskTextColor = riskLevel === 'Low' ? 'text-green-400' : riskLevel === 'Moderate' ? 'text-yellow-400' : riskLevel === 'High' ? 'text-red-400' : 'text-slate-400'

  // Color scheme per risk level
  const isYellow = riskLevel === 'Moderate'
  const isRed = riskLevel === 'High'
  const isGreen = riskLevel === 'Low'

  const cardBorder = isRed ? 'border-red-500 border-2'
    : isYellow ? 'border-yellow-400 border-2'
    : 'border-blue-300 border-2'

  const badgeColor = isRed ? 'bg-red-600'
    : isYellow ? 'bg-yellow-500'
    : 'bg-green-500'

  const pulseClass = isRed ? 'animate-ping' : isYellow ? 'animate-pulse' : ''
  
  const statusDisplayText = riskLevel === '--' ? 'LOADING' : riskLevel.toUpperCase()

  return (
    <div
      onClick={onClick}
      className={`bg-blue-100 bg-opacity-80 rounded-xl border ${cardBorder} p-5 cursor-pointer hover:bg-blue-200 hover:bg-opacity-90 transition-all duration-200`}
    >
      {/* Header: Avatar + Status Badge */}
      <div className='flex items-start justify-between mb-4'>
        {/* Avatar */}
        <div className='w-14 h-14 rounded-full bg-blue-300 flex items-center justify-center text-2xl'>
          👤
        </div>

        {/* Status Badge with pulse */}
        <div className='flex items-center gap-2'>
          {(isRed || isYellow) && (
            <span className={`absolute inline-flex h-3 w-3 rounded-full ${badgeColor} opacity-75 ${pulseClass}`} />
          )}
          <span className={`relative inline-flex rounded-full h-3 w-3 ${badgeColor}`} />
          <span className='text-xs text-slate-700 font-medium'>{statusDisplayText}</span>
        </div>
      </div>

      {/* Patient Info */}
      <div className='mb-4'>
        <p className='text-slate-800 font-bold text-lg'>
          Patient-ID: {bed.meta.patient_id || 'Patient ID'}
        </p>
        <p className='text-slate-600 text-sm'>
          Age {bed.meta.age}
        </p>
      </div>

      {/* Live Metrics Grid */}
      <div className='grid grid-cols-3 gap-2 mb-4'>
        {/* Heart Rate */}
        <div className='bg-slate-700 rounded-lg p-3'>
          <p className='text-slate-400 text-xs'>Heart Rate</p>
          <p className='text-white text-xl font-bold'>
            {hr !== '--' ? `${Math.round(hr)} bpm` : '--'}
          </p>
        </div>

        {/* Sepsis Risk */}
        <div className={`rounded-lg p-3 ${isRed ? 'bg-red-900' : isYellow ? 'bg-yellow-900' : 'bg-slate-700'}`}>
          <p className='text-slate-400 text-xs'>Sepsis Risk</p>
          <p className={`text-xl font-bold ${riskTextColor}`}>
            {riskLevel}
          </p>
        </div>

        {/* Room Number */}
        <div className='bg-slate-700 rounded-lg p-3'>
          <p className='text-slate-400 text-xs'>Room Number</p>
          <p className='text-white text-xl font-bold'>
            {bed.meta.room || '--'}
          </p>
        </div>
      </div>
    </div>
  )
}
