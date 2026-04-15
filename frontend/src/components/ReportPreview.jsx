import { CheckCircle } from 'lucide-react';

export default function ReportPreview({ report, isLoading }) {
  // Render nothing if no report and not generating
  if (!report && !isLoading) {
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex flex-col items-center justify-center py-12 bg-slate-700/50 rounded-lg">
          <div className="animate-spin mb-4">
            <div className="w-10 h-10 border-4 border-slate-600 border-t-teal-500 rounded-full"></div>
          </div>
          <p className="text-slate-200 font-medium">Generating clinical summary...</p>
        </div>
      </div>
    );
  }

  // Show report when available
  if (report) {
    return (
      <div className="w-full">
        <div className="bg-white rounded-lg p-8 shadow-lg border-l-4 border-teal-600">
          {/* Header */}
          <h2 className="text-teal-400 uppercase tracking-widest text-xs font-semibold mb-6 border-b border-slate-200 pb-4">
            Clinical Summary Report
          </h2>

          {/* Clinical summary text */}
          <div className="mb-6">
            <p className="text-slate-700 leading-relaxed font-serif text-base">
              {report.clinical_summary}
            </p>
          </div>

          {/* Email confirmation */}
          {report.email_sent && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" strokeWidth={2} />
              <p className="text-emerald-900">
                <span className="font-semibold">Email sent</span> to{' '}
                <code className="bg-emerald-100 px-2 py-1 rounded text-sm">
                  {report.email_recipient}
                </code>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
