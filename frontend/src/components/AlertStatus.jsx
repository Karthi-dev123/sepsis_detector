import { AlertCircle, CheckCircle } from 'lucide-react';

export default function AlertStatus({ result, onGenerateReport }) {
  // If no result yet, show neutral state
  if (!result) {
    return (
      <div className="w-full">
        <h2 className="text-teal-400 uppercase tracking-widest text-xs font-semibold mb-4">Alert Status</h2>
        <div className="bg-slate-700/50 rounded-lg p-6 text-center">
          <p className="text-slate-400">Upload a patient file to begin analysis</p>
        </div>
      </div>
    );
  }

  // Alert triggered - red pulsing banner
  if (result.alert_triggered) {
    return (
      <div className="w-full">
        <h2 className="text-xl font-semibold mb-4 text-slate-100">Alert Status</h2>
        <div className="animate-pulse bg-red-600 rounded-lg p-6 border-2 border-red-500 shadow-lg shadow-red-600/50">
          <div className="flex items-start gap-4 mb-4">
            <AlertCircle className="w-8 h-8 text-red-100 flex-shrink-0 mt-1" strokeWidth={2} />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1">
                SEPSIS ALERT — Immediate Attention Required
              </h3>
              <p className="text-red-100 text-sm">High-risk patient detected</p>
            </div>
          </div>

          {/* Risk score and alert hour in large bold text */}
          <div className="grid grid-cols-2 gap-4 mb-6 bg-red-700/30 rounded-lg p-4">
            <div>
              <p className="text-red-100 text-sm font-medium uppercase tracking-wide">Risk Score</p>
              <p className="text-3xl font-bold text-white">
                {result.risk_scores[result.alert_hour].toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-red-100 text-sm font-medium uppercase tracking-wide">Alert Hour</p>
              <p className="text-3xl font-bold text-white">{result.alert_hour}</p>
            </div>
          </div>

          {/* Send Report button */}
          <button
            onClick={onGenerateReport}
            className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded-lg transition duration-200 active:scale-95"
          >
            Send Report to Doctor
          </button>
        </div>
      </div>
    );
  }

  // No alert - green badge
  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-4 text-slate-100">Alert Status</h2>
      <div className="bg-emerald-600/20 rounded-lg p-6 border-2 border-emerald-600 flex items-start gap-4">
        <CheckCircle className="w-8 h-8 text-emerald-400 flex-shrink-0 mt-1" strokeWidth={2} />
        <div>
          <h3 className="text-lg font-bold text-emerald-300 mb-1">No Sepsis Risk Detected</h3>
          <p className="text-emerald-200 text-sm">Patient vitals are within normal parameters</p>
        </div>
      </div>
    </div>
  );
}
