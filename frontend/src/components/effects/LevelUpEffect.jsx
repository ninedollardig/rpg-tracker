import { useEffect } from 'react';
import useSound from '../../hooks/useSound';

const DURATION = 2500;

export default function LevelUpEffect({ show, level, title, onDone }) {
  const { playSound } = useSound();

  useEffect(() => {
    if (!show) return;
    playSound('levelup');
    const timer = setTimeout(onDone, DURATION);
    return () => clearTimeout(timer);
  }, [show, onDone]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      {/* Phase 0: instant white flash fill */}
      <div
        className="absolute inset-0 bg-white"
        style={{ animation: `lvFlash 0.15s ease-out forwards` }}
      />

      {/* Phase 1: expanding ring shockwave */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="absolute rounded-full border-2 border-cyan-400"
            style={{
              animation: `lvRing 1.2s ease-out ${i * 0.2}s forwards`,
              width: 0, height: 0,
            }}
          />
        ))}
      </div>

      {/* Phase 2: rotating nested hexagons */}
      <div className="absolute flex items-center justify-center" style={{ animation: `lvHexSpin 2.5s ease-out 0.15s both` }}>
        <svg viewBox="0 0 300 300" className="w-80 h-80">
          {/* Outer ring */}
          <circle cx="150" cy="150" r="145" fill="none" stroke="#00e5ff" strokeWidth="1.5" opacity="0.25" strokeDasharray="8 12">
            <animateTransform attributeName="transform" type="rotate" from="0 150 150" to="360 150 150" dur="3s" repeatCount="1" />
          </circle>
          {/* Outer hexagon */}
          <polygon points="150,8 274,80 274,220 150,292 26,220 26,80"
            fill="none" stroke="#00e5ff" strokeWidth="2" opacity="0.4" />
          {/* Mid hexagon */}
          <polygon points="150,30 250,88 250,212 150,270 50,212 50,88"
            fill="rgba(0,229,255,0.06)" stroke="#00e5ff" strokeWidth="1.5" opacity="0.5" />
          {/* Inner hexagon */}
          <polygon points="150,55 225,98 225,202 150,245 75,202 75,98"
            fill="rgba(0,229,255,0.08)" stroke="#a78bfa" strokeWidth="1.2" opacity="0.55" />
          {/* Core hexagon */}
          <polygon points="150,80 200,108 200,192 150,220 100,192 100,108"
            fill="rgba(0,229,255,0.1)" stroke="#00e5ff" strokeWidth="1" opacity="0.6" />
          {/* Corner accent lines */}
          {[0, 60, 120, 180, 240, 300].map(deg => {
            const rad = (deg * Math.PI) / 180;
            return (
              <line key={deg}
                x1={150 + 120 * Math.cos(rad)} y1={150 + 120 * Math.sin(rad)}
                x2={150 + 136 * Math.cos(rad)} y2={150 + 136 * Math.sin(rad)}
                stroke="#00e5ff" strokeWidth="1.5" opacity="0.5" />
            );
          })}
          {/* Floating dots */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const r = 138;
            return (
              <circle key={i} cx={150 + r * Math.cos(rad)} cy={150 + r * Math.sin(rad)} r="3"
                fill={i % 2 === 0 ? '#00e5ff' : '#a78bfa'} opacity="0.7">
                <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="2" begin={`${i * 0.15}s`} />
              </circle>
            );
          })}
        </svg>
      </div>

      {/* Phase 3: particle sparkles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 24 }).map((_, i) => {
          const x = 20 + Math.random() * 60;
          const y = 20 + Math.random() * 60;
          const delay = Math.random() * 0.5;
          const size = 2 + Math.random() * 3;
          return (
            <div
              key={i}
              className="absolute rounded-full bg-cyan-400"
              style={{
                left: `${x}%`, top: `${y}%`,
                width: size, height: size,
                animation: `lvParticle 1.8s ease-out ${delay}s both`,
              }}
            />
          );
        })}
      </div>

      {/* Phase 4: text */}
      <div className="relative z-10 text-center" style={{ animation: `lvText 1.2s ease-out 0.5s both` }}>
        {/* Glow aura behind text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-40 rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(0,229,255,0.2) 0%, transparent 70%)', animation: 'lvBreath 1.5s ease-in-out 0.5s both' }} />

        <div className="text-[10px] text-slate-500 tracking-[0.4em] font-mono mb-3" style={{ animation: `lvSub 0.6s ease-out 0.6s both` }}>
          ▸ RANK ASCENDED ◂
        </div>
        <div className="text-7xl font-bold tracking-[0.08em] mb-3"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            color: '#fff',
            textShadow: '0 0 60px rgba(0,229,255,0.8), 0 0 120px rgba(0,229,255,0.4), 0 4px 8px rgba(0,0,0,0.5)',
            animation: `lvScale 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.7s both`,
          }}>
          LV.{level}
        </div>
        {title && (
          <div className="text-2xl tracking-[0.3em]"
            style={{
              fontFamily: "'Space Grotesk', 'Noto Sans SC', sans-serif",
              color: '#a78bfa',
              textShadow: '0 0 30px rgba(167,139,250,0.6), 0 0 60px rgba(167,139,250,0.3)',
              animation: `lvScale 0.5s ease-out 0.9s both`,
            }}>
            {title}
          </div>
        )}
      </div>

      <style>{`
        @keyframes lvFlash {
          0%   { opacity: 0; }
          50%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes lvRing {
          0%   { width: 0; height: 0; opacity: 1; border-width: 4px; }
          100% { width: 80vmax; height: 80vmax; opacity: 0; border-width: 0.5px; }
        }
        @keyframes lvHexSpin {
          0%   { opacity: 0; transform: scale(0.1) rotate(0deg); }
          30%  { opacity: 1; transform: scale(1) rotate(15deg); }
          100% { opacity: 0.6; transform: scale(1.05) rotate(25deg); }
        }
        @keyframes lvParticle {
          0%   { opacity: 0; transform: translateY(0) scale(0); }
          30%  { opacity: 1; transform: translateY(-30px) scale(1.5); }
          100% { opacity: 0; transform: translateY(-100px) scale(0); }
        }
        @keyframes lvText {
          0%   { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes lvSub {
          0%   { opacity: 0; letter-spacing: 0.6em; }
          100% { opacity: 0.7; letter-spacing: 0.4em; }
        }
        @keyframes lvScale {
          0%   { opacity: 0; transform: scale(0.5); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes lvBreath {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(0.8); }
          50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.2); }
        }
      `}</style>
    </div>
  );
}
