// WardDashboard.jsx
// Owns the WebSocket connection to ws://localhost:8000/ws/ward
// State: beds {1,2,3,4} each with meta, history, status, finished
// Handles: init, batch tick, trigger_alert messages
// Renders: 2x2 PatientCard grid + PatientDetailModal on click

import { useState, useEffect, useRef } from 'react'
import PatientCard from './components/PatientCard'
import PatientDetailModal from './components/PatientDetailModal'
import ecgBackdrop from './assets/ecg-backdrop.png'

const INITIAL_BEDS = {
  1: { meta: { patient_id: '...', age: '--', room: '101', total_hours: 0 }, history: [], status: 'GREEN', finished: false },
  2: { meta: { patient_id: '...', age: '--', room: '102', total_hours: 0 }, history: [], status: 'GREEN', finished: false },
  3: { meta: { patient_id: '...', age: '--', room: '103', total_hours: 0 }, history: [], status: 'GREEN', finished: false },
  4: { meta: { patient_id: '...', age: '--', room: '104', total_hours: 0 }, history: [], status: 'GREEN', finished: false },
}

export default function WardDashboard() {
  const [beds, setBeds]                 = useState(INITIAL_BEDS)
  const [selectedBed, setSelectedBed]   = useState(null)   // bed number 1-4, or null
  const [alerts, setAlerts]             = useState([])
  const [wsStatus, setWsStatus]         = useState('connecting') // 'connecting' | 'live' | 'done' | 'error'
  const wsRef = useRef(null)

  // ── WebSocket setup ──────────────────────────────────────────
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/ward')
    wsRef.current = ws

    ws.onopen  = () => setWsStatus('live')
    ws.onerror = () => setWsStatus('error')

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)

      // Backend sends one init per bed at connection time
      if (msg.type === 'init') {
        setBeds(prev => ({
          ...prev,
          [msg.bed]: {
            ...prev[msg.bed],
            meta: {
              patient_id:  msg.patient_id,
              room:        msg.room,
              age:         msg.age,
              total_hours: msg.total_hours,
            }
          }
        }))
      }

      // Every 2s: batch of 4 ticks, one per bed
      if (msg.type === 'batch') {
        msg.ticks.forEach(tick => {
          setBeds(prev => ({
            ...prev,
            [tick.bed]: {
              ...prev[tick.bed],
              status:   tick.status,
              finished: tick.finished ?? false,
              // Don't append to history once stream is done
              history: tick.finished
                ? prev[tick.bed].history
                : [
                    ...prev[tick.bed].history,
                    {
                      hour:       tick.hour,
                      risk_score: tick.risk_score,
                      hr:         tick.hr,
                      temp:       tick.temp,
                      resp:       tick.resp,
                      sbp:        tick.sbp,
                      o2sat:      tick.o2sat,
                    }
                  ]
            }
          }))

          // Fires exactly once per patient when RED is first hit
          if (tick.trigger_alert) {
            setAlerts(prev => [...prev, {
              bed:  tick.bed,
              hour: tick.hour,
              shap: tick.shap_values,
            }])
            triggerReport(tick)
          }
        })
      }

      // All 4 patient streams finished
      if (msg.type === 'done') {
        setWsStatus('done')
      }
    }

    return () => ws.close()
  }, [])

  // ── Fire-and-forget report generation ───────────────────────
  const triggerReport = async (tick) => {
    try {
      await fetch('http://localhost:8000/generate-report', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bed:         tick.bed,
          risk_score:  tick.risk_score,
          hour:        tick.hour,
          shap_values: tick.shap_values,
        }),
      })
    } catch (e) {
      console.error('Report trigger failed:', e)
    }
  }

  // ── Card click → open detail modal ──────────────────────────
  const handleCardClick = (bedNum) => {
    setSelectedBed(bedNum)
  }

  // ── Status bar color ─────────────────────────────────────────
  const statusColors = {
    connecting: 'bg-yellow-600',
    live:       'bg-green-600',
    done:       'bg-blue-600',
    error:      'bg-red-600',
  }
  const statusLabels = {
    connecting: '⏳ Connecting to backend...',
    live:       '🟢 Live — streaming patient data',
    done:       '✅ All streams complete',
    error:      '🔴 WebSocket error — is the backend running?',
  }

  return (
    <>
      <style>{`
        @keyframes ecgScroll {
          0%   { background-position: 0% center; }
          100% { background-position: 100% center; }
        }
      `}</style>

      <div
        className="min-h-screen p-6"
        style={{
          backgroundImage:    `url(${ecgBackdrop})`,
          backgroundSize:     '200% 100%',
          backgroundPosition: '0% center',
          backgroundRepeat:   'repeat-x',
          animation:          'ecgScroll 8s linear infinite',
        }}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">
              🏥 Ward Monitor
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Early Sepsis Detection · ICU Real-Time Dashboard
            </p>
          </div>

          {/* Live status pill */}
          <span className={`text-white text-xs font-semibold px-3 py-1 rounded-full ${statusColors[wsStatus]}`}>
            {statusLabels[wsStatus]}
          </span>
        </div>

        {/* ── 2×2 Patient Grid ───────────────────────────────── */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {[1, 2, 3, 4].map(bedNum => (
            <div
              key={bedNum}
              onClick={() => handleCardClick(bedNum)}
              className="cursor-pointer"
            >
              <PatientCard
                bed={bedNum}
                data={beds[bedNum]}
              />
            </div>
          ))}
        </div>

        {/* ── Alert Log (only shows if RED was triggered) ────── */}
        {alerts.length > 0 && (
          <div className="bg-slate-900/80 rounded-xl p-4 border border-red-500 backdrop-blur-sm">
            <h3 className="text-red-400 font-bold mb-3 text-sm uppercase tracking-widest">
              🚨 Sepsis Alert Log
            </h3>
            <div className="space-y-1">
              {alerts.map((alert, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-slate-300">
                    <span className="text-red-400 font-semibold">Bed {alert.bed}</span>
                    {' '}· Hour {alert.hour} · Sepsis risk threshold exceeded
                  </span>
                  <button
                    onClick={() => handleCardClick(alert.bed)}
                    className="text-xs text-blue-400 hover:text-blue-300 underline ml-4"
                  >
                    View patient
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Detail Modal ────────────────────────────────────── */}
        {selectedBed !== null && (
          <PatientDetailModal
            patient={{
              ...beds[selectedBed],
              meta: {
                ...beds[selectedBed].meta,
                bed: selectedBed,
              },
              currentStatus: beds[selectedBed].status,
              scores: beds[selectedBed].history.map(h => h.risk_score),
              vitals: beds[selectedBed].history.map(h => ({
                HR:    h.hr,
                Temp:  h.temp,
                Resp:  h.resp,
                SBP:   h.sbp,
                O2Sat: h.o2sat,
              })),
            }}
            onClose={() => setSelectedBed(null)}
          />
        )}
      </div>
    </>
  )
}
