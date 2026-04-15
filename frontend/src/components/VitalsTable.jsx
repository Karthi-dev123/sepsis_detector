export default function VitalsTable({ vitalsSummary, alertHour }) {
  // If no data, show message
  if (!vitalsSummary) {
    return (
      <div className="w-full">
        <h2 className="text-teal-400 uppercase tracking-widest text-xs font-semibold mb-4">Patient Vitals</h2>
        <div className="bg-slate-700/50 rounded-lg p-6 text-center">
          <p className="text-slate-400">Upload patient data to view vitals</p>
        </div>
      </div>
    );
  }

  const hours = Array.from({ length: vitalsSummary.HR.length }, (_, i) => i);
  const hrValues = vitalsSummary.HR || [];
  const tempValues = vitalsSummary.Temp || [];
  const respValues = vitalsSummary.Resp || [];

  // Normal ranges
  const normalRanges = {
    HR: { min: 60, max: 100 },
    Temp: { min: 36.1, max: 37.2 },
    Resp: { min: 12, max: 20 },
  };

  function isOutOfRange(value, key) {
    const range = normalRanges[key];
    return value < range.min || value > range.max;
  }

  function ValueCell({ value, dataKey, isAlert }) {
    const outOfRange = isOutOfRange(value, dataKey);
    return (
      <td
        className={`px-4 py-2 text-center ${
          isAlert ? 'bg-red-600/40' : ''
        } ${outOfRange ? 'font-bold text-red-300' : 'text-slate-100'}`}
      >
        {typeof value === 'number' ? value.toFixed(1) : value}
      </td>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-teal-400 uppercase tracking-widest text-xs font-semibold mb-4">Patient Vitals</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-700 border-b border-slate-600">
              <th className="px-4 py-2 text-left text-slate-200">Hour</th>
              <th className="px-4 py-2 text-center text-slate-200">HR (60-100)</th>
              <th className="px-4 py-2 text-center text-slate-200">Temp (36.1-37.2)</th>
              <th className="px-4 py-2 text-center text-slate-200">Resp (12-20)</th>
            </tr>
          </thead>
          <tbody>
            {hours.map((hour, idx) => {
              const isAlert = hour === alertHour;
              const bgColor = isAlert
                ? 'bg-red-900/30'
                : idx % 2 === 0
                ? 'bg-slate-800/50'
                : 'bg-slate-700/30';

              return (
                <tr
                  key={hour}
                  className={`${bgColor} border-b border-slate-700 ${
                    isAlert ? 'border-red-600' : ''
                  }`}
                >
                  <td
                    className={`px-4 py-2 font-medium ${
                      isAlert ? 'text-red-300' : 'text-slate-200'
                    }`}
                  >
                    {hour}
                    {isAlert && <span className="ml-2 text-red-400 font-bold">🚨</span>}
                  </td>
                  <ValueCell
                    value={hrValues[idx]}
                    dataKey="HR"
                    isAlert={isAlert}
                  />
                  <ValueCell
                    value={tempValues[idx]}
                    dataKey="Temp"
                    isAlert={isAlert}
                  />
                  <ValueCell
                    value={respValues[idx]}
                    dataKey="Resp"
                    isAlert={isAlert}
                  />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
