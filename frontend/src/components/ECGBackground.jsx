import React from 'react';

const ECG_PATH =
  'M0,60 L120,60 L140,60 L150,20 L160,100 L170,10 L180,110 L190,60 L210,60 ' +
  'L330,60 L350,60 L360,20 L370,100 L380,10 L390,110 L400,60 L420,60 ' +
  'L540,60 L560,60 L570,20 L580,100 L590,10 L600,110 L610,60 L630,60 ' +
  'L750,60 L770,60 L780,20 L790,100 L800,10 L810,110 L820,60 L840,60 ' +
  'L960,60 L980,60 L990,20 L1000,100 L1010,10 L1020,110 L1030,60 L1050,60 ' +
  'L1170,60 L1190,60 L1200,20 L1210,100 L1220,10 L1230,110 L1240,60 L1260,60 ' +
  'L1440,60';

export default function ECGBackground() {
  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #e8f4f8 0%, #d6eaf8 50%, #e8f4f8 100%)',
      }}
    >
      {/* Grid overlay for ECG paper look */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(100,160,200,0.12) 1px, transparent 1px), ' +
            'linear-gradient(90deg, rgba(100,160,200,0.12) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Upper ECG line */}
      <svg
        className="absolute w-full"
        style={{ top: '25%', animation: 'moveECG 4s linear infinite' }}
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d={ECG_PATH}
          fill="none"
          stroke="rgba(255,255,255,0.65)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>

      {/* Lower ECG line (offset by half a cycle) */}
      <svg
        className="absolute w-full"
        style={{
          top: '62%',
          animation: 'moveECG 4s linear infinite',
          animationDelay: '-2s',
        }}
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d={ECG_PATH}
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
