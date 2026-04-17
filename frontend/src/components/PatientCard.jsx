export default function PatientCard({ bed, data, onClick }) {
  const history   = data?.history ?? []
  const status    = data?.finished ? 'DATA OVER / STABLE' : (data?.status ?? 'GREEN')
  const latest    = history[history.length - 1] ?? null
  const isLoading = history.length === 0

  const risk = latest?.risk_score ?? null
  const hr   = latest?.hr         ?? null
  const temp = latest?.temp       ?? null
  const resp = latest?.resp       ?? null

  const isRed    = status.startsWith('RED')
  const isYellow = status.startsWith('YELLOW')
  const isDone   = status === 'DATA OVER / STABLE'

  const persistCount = status.match(/\((\d\/\d)\)/)?.[1] ?? null

  const borderClass = isRed ? 'border-red-500' : isYellow ? 'border-yellow-400' : isDone ? 'border-slate-500' : 'border-green-500'
  const dotColor    = isRed ? 'bg-red-500'     : isYellow ? 'bg-yellow-400'     : isDone ? 'bg-slate-400'     : 'bg-green-500'
  const riskBg      = isRed ? 'bg-red-900/60'  : isYellow ? 'bg-yellow-900/60'  : 'bg-slate-700'
  const riskText    = isRed ? 'text-red-400'   : isYellow ? 'text-yellow-400'   : risk !== null && risk < 0.4 ? 'text-green-400' : 'text-slate-400'
  const pingClass   = isRed ? 'animate-ping'   : isYellow ? 'animate-pulse'     : ''

  const statusLabel = isRed     ? `🔴 SEPSIS ALERT${persistCount ? ` (${persistCount})` : ''}`
                    : isYellow  ? `🟡 WATCH${persistCount ? ` (${persistCount})` : ''}`
                    : isDone    ? '⬛ STABLE / DONE'
                    : isLoading ? '⏳ CONNECTING...'
                    :             '🟢 NORMAL'

  const Shimmer = () => <div className="h-6 w-16 bg-slate-600 rounded animate-pulse" />

  return (
    <div
      onClick={onClick}
      className={`
        relative bg-slate-800/80 backdrop-blur-sm rounded-xl border-2 ${borderClass}
        p-5 cursor-pointer transition-all duration-300 hover:brightness-110
        ${isRed    ? 'shadow-[0_0_20px_rgba(239,68,68,0.3)]' : ''}
        ${isYellow ? 'shadow-[0_0_12px_rgba(234,179,8,0.2)]' : ''}
      `}
    >
      {isRed && (
        <div className="absolute inset-0 rounded-xl border-2 border-red-500 animate-ping opacity-20 pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center text-xl">👤</div>
        <div className="flex items-center gap-2">
          <div className="relative flex h-3 w-3">
            {(isRed || isYellow) && (
              <span className={`absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75 ${pingClass}`} />
            )}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${dotColor}`} />
          </div>
          <span className={`text-xs font-semibold ${
            isRed ? 'text-red-400' : isYellow ? 'text-yellow-400' : isDone || isLoading ? 'text-slate-400' : 'text-green-400'
          }`}>{statusLabel}</span>
        </div>
      </div>

      {/* Patient info */}
      <div className="mb-4">
        <p className="text-white font-bold text-base truncate">{data?.meta?.patient_id ?? 'Loading...'}</p>
        <p className="text-slate-400 text-sm">Age {data?.meta?.age ?? '--'} · Room {data?.meta?.room ?? '--'}</p>
        <p className="text-slate-500 text-xs mt-0.5">
          Bed {bed} · {isLoading ? 'Awaiting first reading...' : `${history.length}h monitored`}
        </p>
      </div>

      {/* Top metrics row */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div className="bg-slate-700 rounded-lg p-2.5">
          <p className="text-slate-400 text-xs mb-1">HR</p>
          {isLoading ? <Shimmer /> : <>
            <p className="text-white text-lg font-bold font-mono leading-none">{hr !== null ? Math.round(hr) : '--'}</p>
            <p className="text-slate-500 text-xs">bpm</p>
          </>}
        </div>
        <div className={`rounded-lg p-2.5 ${riskBg}`}>
          <p className="text-slate-400 text-xs mb-1">Risk</p>
          {isLoading ? <Shimmer /> : <>
            <p className={`text-lg font-bold font-mono leading-none ${riskText}`}>
              {risk !== null ? `${(risk * 100).toFixed(0)}%` : '--'}
            </p>
            <p className="text-slate-500 text-xs">score</p>
          </>}
        </div>
        <div className="bg-slate-700 rounded-lg p-2.5">
          <p className="text-slate-400 text-xs mb-1">Temp</p>
          {isLoading ? <Shimmer /> : <>
            <p className="text-white text-lg font-bold font-mono leading-none">{temp !== null ? temp.toFixed(1) : '--'}</p>
            <p className="text-slate-500 text-xs">°C</p>
          </>}
        </div>
      </div>

      {/* Bottom metrics row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-700 rounded-lg p-2">
          <p className="text-slate-400 text-xs">Resp</p>
          {isLoading
            ? <div className="h-4 w-12 bg-slate-600 rounded animate-pulse mt-1" />
            : <p className="text-white text-sm font-mono">{resp !== null ? `${Math.round(resp)} /min` : '--'}</p>
          }
        </div>
        <div className="bg-slate-700 rounded-lg p-2">
          <p className="text-slate-400 text-xs">Hours</p>
          <p className="text-white text-sm font-mono">{data?.meta?.total_hours ?? '--'} total</p>
        </div>
      </div>

      <p className="text-slate-600 text-xs text-center mt-3">
        {isLoading ? 'Stream starting...' : 'Click for clinical summary'}
      </p>
    </div>
  )
}
