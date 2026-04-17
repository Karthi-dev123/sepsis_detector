import { useEffect, useState } from "react";
import {
  Area, AreaChart, XAxis, YAxis, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from "recharts";

const THRESHOLD          = 0.65;
const SUMMARY_TIMEOUT_MS = 5000;

function statusColors(status = "") {
  if (status.startsWith("RED"))    return { text: "text-red-600",    border: "border-red-400"    };
  if (status.startsWith("YELLOW")) return { text: "text-yellow-600", border: "border-yellow-400" };
  return                                  { text: "text-green-600",  border: "border-green-400"  };
}

function SkeletonLines() {
  return [1, 2, 3].map((i) => (
    <div key={i} className={`h-4 bg-gray-200 rounded animate-pulse mb-2 ${i === 3 ? "w-2/3" : "w-full"}`} />
  ));
}

function VitalRow({ label, value, unit }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-200 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-mono font-semibold">
        {value != null ? `${value} ${unit}` : "—"}
      </span>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const val = payload.find((p) => p.value != null)?.value ?? 0;
  const over = val >= THRESHOLD;
  return (
    <div className="bg-white/90 border border-gray-200 rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-gray-400 mb-1">Hour {label}</p>
      <p className={`font-bold font-mono ${over ? "text-red-500" : "text-green-600"}`}>
        Risk: {(val * 100).toFixed(1)}%
      </p>
    </div>
  );
}

export default function PatientDetailModal({ patient, onClose }) {
  const [summary,  setSummary]  = useState(null);
  const [source,   setSource]   = useState(null);
  const [timedOut, setTimedOut] = useState(false);

  const bed    = patient?.meta?.bed;
  const meta   = patient?.meta             ?? {};
  const scores = patient?.scores           ?? [];
  const vitals = patient?.vitals           ?? [];
  const latest = vitals[vitals.length - 1] ?? {};
  const score  = scores[scores.length - 1] ?? 0;
  const status = patient?.currentStatus    ?? "GREEN";
  const colors = statusColors(status);

  const chartData = scores.map((s, i) => ({
    hour:  i + 1,
    safe:  s < THRESHOLD ? s : THRESHOLD,
    alert: s >= THRESHOLD ? s : null,
  }));

  useEffect(() => {
    if (!bed) return;
    setSummary(null);
    setSource(null);
    setTimedOut(false);
    const timer = setTimeout(() => setTimedOut(true), SUMMARY_TIMEOUT_MS);
    fetch(`http://localhost:8000/ward/patients/${bed}/summary`)
      .then((r) => r.json())
      .then((data) => { clearTimeout(timer); setSummary(data.summary); setSource(data.source); })
      .catch(() => { clearTimeout(timer); setTimedOut(true); });
    return () => clearTimeout(timer);
  }, [bed]);

  if (!patient) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl w-full max-w-xl shadow-2xl overflow-y-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start p-6 pb-4 border-b border-gray-200/60">
          <div>
            <h2 className="text-gray-800 text-xl font-bold">{meta.patient_id} — Bed {meta.bed}</h2>
            <p className="text-gray-500 text-sm mt-0.5">
              Room {meta.room} · Age {meta.age} · {scores.length}h monitored
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none ml-4">×</button>
        </div>

        <div className="px-6 pb-6 pt-5 space-y-5">

          {/* Risk Score */}
          <div className={`border-2 rounded-xl px-4 py-3 bg-white/60 ${colors.border}`}>
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Risk Score</p>
            <div className={`text-4xl font-mono font-bold ${colors.text}`}>{(score * 100).toFixed(1)}%</div>
            <div className={`text-xs mt-1 font-semibold ${colors.text}`}>{status}</div>
          </div>

          {/* Risk Timeline Chart */}
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-3">Risk Timeline</p>
            <div className="bg-white/60 border border-gray-200 rounded-xl p-3">
              {chartData.length < 2 ? (
                <p className="text-gray-400 text-xs text-center py-8">Waiting for data — check back after a few ticks</p>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="safeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}   />
                      </linearGradient>
                      <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="hour" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false}
                      label={{ value: "Hour", position: "insideBottomRight", offset: -4, fill: "#9ca3af", fontSize: 10 }} />
                    <YAxis domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                      tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <ReferenceLine y={THRESHOLD} stroke="#ef4444" strokeDasharray="6 3" strokeWidth={1.5}
                      label={{ value: "Alert threshold", position: "insideTopRight", fill: "#ef4444", fontSize: 9 }} />
                    <Area type="monotone" dataKey="safe"  stroke="#22c55e" strokeWidth={2}   fill="url(#safeGrad)"  dot={false} isAnimationActive={false} connectNulls />
                    <Area type="monotone" dataKey="alert" stroke="#ef4444" strokeWidth={2.5} fill="url(#alertGrad)" dot={false} isAnimationActive={false} connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
              )}
              <p className="text-gray-400 text-xs text-center mt-1">Red dashed line = 0.65 alert threshold</p>
            </div>
          </div>

          {/* Latest Vitals */}
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">Latest Vitals</p>
            <VitalRow label="Heart Rate"    value={latest.HR}    unit="bpm"  />
            <VitalRow label="Temperature"   value={latest.Temp}  unit="°C"   />
            <VitalRow label="Respiratory"   value={latest.Resp}  unit="/min" />
            <VitalRow label="O2 Saturation" value={latest.O2Sat} unit="%"    />
            <VitalRow label="Systolic BP"   value={latest.SBP}   unit="mmHg" />
          </div>

          {/* MedGemma Summary */}
          <div className="bg-blue-50/80 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-blue-600 text-xs uppercase tracking-widest font-semibold">Clinical Status Summary</span>
              {source === "medgemma" && (
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">MedGemma</span>
              )}
              {source === "template" && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Auto-generated</span>
              )}
            </div>
            {!summary && !timedOut && <SkeletonLines />}
            {!summary && timedOut && (
              <p className="text-gray-400 text-sm italic">
                MedGemma is taking longer than expected. Ensure it's running on port 11434, then re-open this card.
              </p>
            )}
            {summary && <p className="text-gray-700 text-sm leading-relaxed">{summary}</p>}
          </div>

        </div>
      </div>
    </div>
  );
}