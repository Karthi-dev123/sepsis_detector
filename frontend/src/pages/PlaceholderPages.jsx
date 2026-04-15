import ECGBackground from '../components/ECGBackground';

const pageStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'Inter, sans-serif',
};

function ComingSoonPage({ title, icon }) {
  return (
    <div
      className="relative min-h-screen flex"
      style={{ background: 'linear-gradient(135deg, #e8f4f8 0%, #d6eaf8 50%, #e8f4f8 100%)' }}
    >
      <ECGBackground />
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-4">
        <div className="bg-white/30 backdrop-blur-md border border-white/50 rounded-2xl px-16 py-12 flex flex-col items-center gap-4 shadow-lg">
          <div className="text-5xl">{icon}</div>
          <h1 className="text-3xl font-bold text-slate-800">{title}</h1>
          <p className="text-sm font-medium text-slate-500 tracking-widest uppercase">Coming Soon</p>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsPage() {
  return <ComingSoonPage title="Analytics" icon="📈" />;
}

export function PatientsPage() {
  return <ComingSoonPage title="Patients" icon="👥" />;
}

export function SettingsPage() {
  return <ComingSoonPage title="Settings" icon="⚙️" />;
}
