import { useState } from 'react'
import CsvPage from './pages/CsvPage'
import WardDashboard from './WardDashboard'

export default function App() {
  const [page, setPage] = useState('csv')

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="flex items-center gap-1 px-6 py-3 bg-slate-950 border-b border-slate-800">
        <span className="text-white font-bold text-lg mr-6">🏥 Sepsis Detector</span>
        <button
          onClick={() => setPage('csv')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            page === 'csv'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          📁 CSV Analysis
        </button>
        <button
          onClick={() => setPage('ward')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            page === 'ward'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          🏥 Ward Monitor
        </button>
      </nav>

      {page === 'csv' ? <CsvPage /> : <WardDashboard />}
    </div>
  )
}