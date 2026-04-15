import { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { mockSepsisResult } from './data/mockData';
import { predictPatient, generateReport } from './utils/api';
import {
  Menu,
  LayoutGrid,
  LineChart,
  Users,
  Settings,
  Shield,
  Cpu,
  User,
} from 'lucide-react';

// Component imports
import FileUpload from './components/FileUpload';
import RiskTimeline from './components/RiskTimeline';
import SHAPChart from './components/SHAPChart';
import VitalsTable from './components/VitalsTable';
import AlertStatus from './components/AlertStatus';
import ReportPreview from './components/ReportPreview';
import ECGBackground from './components/ECGBackground';
import { AnalyticsPage, PatientsPage, SettingsPage } from './pages/PlaceholderPages';

export default function App() {
  const [result, setResult] = useState(null);
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Update timestamp every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle file analysis
  async function handleAnalyze(file) {
    setIsLoading(true);
    setError('');
    try {
      const data = await predictPatient(file);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to analyze patient file');
    } finally {
      setIsLoading(false);
    }
  }

  // Handle report generation
  async function handleGenerateReport() {
    setIsGeneratingReport(true);
    setError('');
    try {
      const data = await generateReport(result);
      setReport(data);
    } catch (err) {
      setError(err.message || 'Failed to generate clinical report');
    } finally {
      setIsGeneratingReport(false);
    }
  }

  // Demo Mode
  function handleDemoMode() {
    setResult(mockSepsisResult);
    setError('');
  }

  const timeString = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <div
      className="min-h-screen flex relative"
      style={{
        background: 'linear-gradient(135deg, #e8f4f8 0%, #d6eaf8 50%, #e8f4f8 100%)',
        minHeight: '100vh',
      }}
    >
      <ECGBackground />

      {/* All content above the animated background */}
      <div className="relative z-10 flex w-full min-h-screen">
      {/* SIDEBAR */}
      <aside className="w-20 bg-white/20 backdrop-blur-sm border-r border-white/30 flex flex-col items-center py-6 gap-8 flex-shrink-0">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-slate-700 hover:text-teal-600 transition"
        >
          <Menu size={24} />
        </button>

        <nav className="flex flex-col gap-6">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `p-3 rounded-lg transition ${
                isActive
                  ? 'bg-teal-500/25 border border-teal-500/50 text-teal-700'
                  : 'text-slate-600 hover:text-teal-600 hover:bg-white/30'
              }`
            }
            title="Dashboard"
          >
            <LayoutGrid size={24} />
          </NavLink>
          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              `p-3 rounded-lg transition ${
                isActive
                  ? 'bg-teal-500/25 border border-teal-500/50 text-teal-700'
                  : 'text-slate-600 hover:text-teal-600 hover:bg-white/30'
              }`
            }
            title="Analytics"
          >
            <LineChart size={24} />
          </NavLink>
          <NavLink
            to="/patients"
            className={({ isActive }) =>
              `p-3 rounded-lg transition ${
                isActive
                  ? 'bg-teal-500/25 border border-teal-500/50 text-teal-700'
                  : 'text-slate-600 hover:text-teal-600 hover:bg-white/30'
              }`
            }
            title="Patients"
          >
            <Users size={24} />
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `p-3 rounded-lg transition ${
                isActive
                  ? 'bg-teal-500/25 border border-teal-500/50 text-teal-700'
                  : 'text-slate-600 hover:text-teal-600 hover:bg-white/30'
              }`
            }
            title="Settings"
          >
            <Settings size={24} />
          </NavLink>
        </nav>

        <div className="flex-1"></div>

        {/* User Avatar */}
        <div className="p-3 rounded-lg bg-white/30 border border-slate-300/40">
          <User size={24} className="text-slate-600" />
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">
        {/* HEADER */}
        <header className="border-b border-white/30 bg-white/15 backdrop-blur-sm py-8 px-8">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse flex-shrink-0"></div>
              <h1 className="text-4xl font-bold text-slate-900">Early Sepsis Detector</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleDemoMode}
                className="bg-slate-800/70 hover:bg-slate-700/80 text-white px-6 py-2 rounded-full font-medium transition backdrop-blur-sm"
              >
                Demo Mode
              </button>
              <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center border border-slate-300/50">
                <User size={20} className="text-slate-700" />
              </div>
            </div>
          </div>
          <p className="text-teal-600 font-medium text-sm tracking-widest uppercase mb-3">ICU Predictive Analytics System</p>
          <p className="text-slate-600 text-sm">Live Timestamp: {timeString}</p>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-8 space-y-6">
            {error && (
              <div className="bg-red-100/80 border border-red-400/50 rounded-lg p-4 flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0 mt-1.5"></div>
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

          {/* FILE UPLOAD CARD */}
          <Routes>
            <Route path="/" element={
              !result ? (
                <>
                  <div className="bg-white/30 backdrop-blur-md border border-white/50 rounded-xl p-8">
                    <FileUpload onFileAnalyzed={handleAnalyze} isLoading={isLoading} />
                  </div>

                  {/* STAT CARDS */}
                  <div className="grid grid-cols-3 gap-6">
                    {/* Monitoring Status */}
                    <div className="bg-white/25 backdrop-blur-md border border-white/40 border-l-4 border-l-teal-500 rounded-xl p-6">
                      <p className="text-teal-700 uppercase tracking-widest text-xs font-semibold mb-4">
                        Monitoring Status
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-600 flex items-center justify-center">
                          <Shield size={32} className="text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-slate-800 text-xl font-bold">System Ready</p>
                          <p className="text-slate-500 text-xs font-normal mt-1">Awaiting patient file upload</p>
                          <p className="text-slate-500 text-xs font-normal mt-0.5">System health: 100%</p>
                        </div>
                      </div>
                    </div>

                    {/* Model */}
                    <div className="bg-white/25 backdrop-blur-md border border-white/40 border-l-4 border-l-amber-500 rounded-xl p-6">
                      <p className="text-amber-700 uppercase tracking-widest text-xs font-semibold mb-4">Model</p>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-600 flex items-center justify-center">
                          <Cpu size={32} className="text-amber-600" />
                        </div>
                        <div>
                          <p className="text-slate-800 text-xl font-bold">XGBoost v2</p>
                          <p className="text-amber-700 text-lg font-bold mt-1">AUROC: 0.91</p>
                          <p className="text-slate-500 text-xs font-normal mt-0.5">High accuracy</p>
                        </div>
                      </div>
                    </div>

                    {/* Alert Threshold */}
                    <div className="bg-white/25 backdrop-blur-md border border-white/40 border-l-4 border-l-teal-500 rounded-xl p-6">
                      <p className="text-teal-700 uppercase tracking-widest text-xs font-semibold mb-4">Alert Threshold</p>
                      <p className="text-slate-800 text-6xl font-bold mb-2">0.65</p>
                      <p className="text-slate-600 text-xs font-medium mb-3">Risk score boundary</p>
                      {/* Risk Scale Bar */}
                      <div className="relative h-2 bg-slate-300 rounded-full overflow-hidden">
                        <div className="absolute left-0 top-0 h-full w-[65%] bg-gradient-to-r from-teal-500 to-teal-600"></div>
                        <div className="absolute left-[65%] top-0 h-full flex-1 bg-red-500"></div>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 font-normal mt-1">
                        <span>0</span>
                        <span>0.65</span>
                        <span>1.0</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* RESULTS VIEW */}
                  <div className="bg-white/25 backdrop-blur-md border border-white/40 rounded-xl p-6">
                    <AlertStatus result={result} onGenerateReport={handleGenerateReport} />
                  </div>

                  {result && (
                    <>
                      <div className="bg-white/25 backdrop-blur-md border border-white/40 rounded-xl p-6">
                        <RiskTimeline
                          hours={result.hours}
                          riskScores={result.risk_scores}
                          threshold={result.threshold}
                          alertHour={result.alert_hour}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white/25 backdrop-blur-md border border-white/40 rounded-xl p-6">
                          <SHAPChart shapValues={result.shap_values} />
                        </div>
                        <div className="bg-white/25 backdrop-blur-md border border-white/40 rounded-xl p-6 max-h-96 overflow-y-auto">
                          <VitalsTable
                            vitalsSummary={result.vitals_summary}
                            alertHour={result.alert_hour}
                          />
                        </div>
                      </div>

                      {result?.alert_triggered && (
                        <div className="bg-white/25 backdrop-blur-md border border-white/40 rounded-xl p-6">
                          <ReportPreview report={report} isLoading={isGeneratingReport} />
                        </div>
                      )}
                    </>
                  )}
                </>
              )
            } />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>

        </main>

        {/* FOOTER */}
        <footer className="border-t border-white/30 bg-white/20 backdrop-blur-sm py-4 px-8 text-center text-slate-600 text-xs">
          For professional medical use only. Use with discretion. Support: support@detector.icu
        </footer>
      </div>
      </div>

      {/* Decorative element */}
      <div
        className="fixed bottom-8 right-8 w-8 h-8 opacity-40 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #14B8A6, transparent)',
          boxShadow: '0 0 40px rgba(20, 184, 166, 0.3)',
          borderRadius: '50%',
        }}
      ></div>
    </div>
  );
}
