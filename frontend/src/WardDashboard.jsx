// WardDashboard: main page owning WebSocket connection to ws://localhost:8000/ws/ward
// State: beds object with keys 1,2,3,4 each having meta, history, status, finished
// Handles: init messages, batch tick messages, trigger_alert for auto report
// Renders: 2x2 grid of PatientCard, DetailModal on card click
// Dark navy background with ECG waveform backdrop

import { useState, useEffect, useRef } from 'react'
import PatientCard from './components/PatientCard'
import DetailModal from './components/DetailModal'
import ecgBackdrop from './assets/ecg-backdrop.png'

export default function WardDashboard() {
  const [beds, setBeds] = useState({
    1: { meta: { patient_id: 'P-1001', age: 45, room: '101', total_hours: 24 }, history: [{ hour: 0, hr: 82, risk_score: 0.2 }], status: 'GREEN', consecutive: 0, finished: false },
    2: { meta: { patient_id: 'P-1002', age: 62, room: '204', total_hours: 24 }, history: [{ hour: 0, hr: 95, risk_score: 0.5 }], status: 'GREEN', consecutive: 0, finished: false },
    3: { meta: { patient_id: 'P-1003', age: 38, room: '307', total_hours: 24 }, history: [{ hour: 0, hr: 110, risk_score: 0.8 }], status: 'GREEN', consecutive: 0, finished: false },
    4: { meta: { patient_id: 'P-1004', age: 71, room: '412', total_hours: 24 }, history: [{ hour: 0, hr: 76, risk_score: 0.2 }], status: 'GREEN', consecutive: 0, finished: false },
  })

  const [selectedBed, setSelectedBed] = useState(null)
  const [alerts, setAlerts] = useState([])
  const wsRef = useRef(null)

  useEffect(() => {
    wsRef.current = new WebSocket('ws://localhost:8000/ws/ward')

    wsRef.current.onmessage = (event) => {
      const msg = JSON.parse(event.data)

      if (msg.type === 'init') {
        setBeds(prev => ({
          ...prev,
          [msg.bed]: {
            ...prev[msg.bed],
            meta: {
              patient_id: msg.patient_id,
              room: msg.room,
              age: msg.age,
              total_hours: msg.total_hours,
            }
          }
        }))
      }

      if (msg.type === 'batch') {
        msg.ticks.forEach(tick => {
          setBeds(prev => ({
            ...prev,
            [tick.bed]: {
              ...prev[tick.bed],
              status: tick.status,
              finished: tick.finished || false,
              history: tick.finished
                ? prev[tick.bed].history
                : [...prev[tick.bed].history, {
                  hour: tick.hour,
                  risk_score: tick.risk_score,
                  hr: tick.hr,
                  temp: tick.temp,
                  resp: tick.resp,
                  sbp: tick.sbp,
                  o2sat: tick.o2sat,
                }]
            }
          }))

          // Handle auto-alert trigger
          if (tick.trigger_alert) {
            setAlerts(prev => [...prev, {
              bed: tick.bed,
              hour: tick.hour,
              shap: tick.shap_values,
            }])
            // Trigger report generation
            triggerReport(tick)
          }
        })
      }
    }

    wsRef.current.onerror = (e) => console.error('WS error', e)
    return () => wsRef.current?.close()
  }, [])

  const triggerReport = async (tick) => {
    try {
      await fetch('http://localhost:8000/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bed: tick.bed,
          risk_score: tick.risk_score,
          hour: tick.hour,
          shap_values: tick.shap_values,
        })
      })
    } catch (e) {
      console.error('Report trigger failed', e)
    }
  }

  return (
    <>
      <style>{`
        @keyframes ecgScroll {
          0% { background-position: 0% center; }
          100% { background-position: 100% center; }
        }
      `}</style>
      <div
        className='min-h-screen p-6'
        style={{
          backgroundImage: `url(${ecgBackdrop})`,
          backgroundSize: '200% 100%',
          backgroundPosition: '0% center',
          backgroundRepeat: 'repeat-x',
          animation: 'ecgScroll 8s linear infinite',
        }}
      >
        {/* Content container */}
        <div>
          {/* Header */}
          <div className='mb-8'>
            <h1 className='text-4xl font-bold text-white'>🏥 Ward Monitor</h1>
          </div>

          {/* Patient Grid 2x2 */}
          <div className='grid grid-cols-2 gap-6 mb-8'>
            {[1, 2, 3, 4].map(bedNum => (
              <PatientCard
                key={bedNum}
                bed={beds[bedNum]}
                onClick={() => setSelectedBed(bedNum)}
              />
            ))}
          </div>

          {/* Alert Log */}
          {alerts.length > 0 && (
            <div className='bg-slate-800 rounded-lg p-4 border border-red-500'>
              <h3 className='text-red-400 font-bold mb-2'>🚨 Alert History</h3>
              {alerts.map((alert, i) => (
                <p key={i} className='text-slate-300 text-sm'>
                  Bed {alert.bed} - Hour {alert.hour} - Alert triggered
                </p>
              ))}
            </div>
          )}

          {/* Detail Modal */}
          {selectedBed && (
            <DetailModal
              bed={beds[selectedBed]}
              onClose={() => setSelectedBed(null)}
            />
          )}
        </div>
      </div>
    </>
  )
}
