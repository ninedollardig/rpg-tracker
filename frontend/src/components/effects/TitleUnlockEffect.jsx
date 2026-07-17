import { useEffect } from 'react';

const DURATION = 2800;

export default function TitleUnlockEffect({ show, title, onDone }) {
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(onDone, DURATION);
    return () => clearTimeout(timer);
  }, [show, onDone]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      {/* Phase 0: violet flash */}
      <div className="absolute inset-0" style={{ background: 'rgba(120,40,200,0.3)', animation: `tuFlash 0.2s ease-out forwards` }} />

      {/* Phase 1: expanding violet rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[0, 0.15, 0.3].map((delay, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              border: `${3 - i}px solid rgba(167,139,250,${0.6 - i * 0.15})`,
              animation: `tuRing 1.5s ease-out ${delay}s forwards`,
              width: 0, height: 0,
              boxShadow: `0 0 ${20 + i * 10}px rgba(167,139,250,0.4), inset 0 0 ${10 + i * 5}px rgba(167,139,250,0.2)`,
            }}
          />
        ))}
      </div>

      {/* Phase 2: rotating diamond */}
      <div className="absolute flex items-center justify-center" style={{ animation: `tuDiamond 2.5s ease-out 0.1s both` }}>
        <svg viewBox="0 0 300 300" className="w-72 h-72">
          {/* Outer rotating ring */}
          <circle cx="150" cy="150" r="140" fill="none" stroke="rgba(167,139,250,0.2)" strokeWidth="1" strokeDasharray="6 10">
            <animateTransform attributeName="transform" type="rotate" from="0 150 150" to="-360 150 150" dur="3s" repeatCount="1" />
          </circle>
          {/* Diamond layers */}
          <polygon points="150,10 260,150 150,290 40,150"
            fill="none" stroke="rgba(167,139,250,0.4)" strokeWidth="1.5" />
          <polygon points="150,35 235,150 150,265 65,150"
            fill="rgba(167,139,250,0.05)" stroke="rgba(167,139,250,0.5)" strokeWidth="1.2" />
          <polygon points="150,60 210,150 150,240 90,150"
            fill="rgba(167,139,250,0.08)" stroke="rgba(139,92,246,0.55)" strokeWidth="1" />
          {/* Inner star */}
          <polygon points="150,75 190,130 175,195 150,220 125,195 110,130"
            fill="rgba(167,139,250,0.1)" stroke="rgba(196,181,253,0.5)" strokeWidth="0.8" />
          {/* Corner diamonds */}
          {[0, 90, 180, 270].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const cx = 150 + 130 * Math.cos(rad);
            const cy = 150 + 130 * Math.sin(rad);
            return (
              <polygon key={i} points={`${cx},${cy - 8} ${cx + 6},${cy} ${cx},${cy + 8} ${cx - 6},${cy}`}
                fill="rgba(196,181,253,0.6)" stroke="#a78bfa" strokeWidth="0.5">
                <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="2" begin={`${i * 0.2}s`} />
              </polygon>
            );
          })}
        </svg>
      </div>

      {/* Phase 3: particle rain — violet/purple */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => {
          const x = 20 + Math.random() * 60;
          const delay = Math.random() * 0.6;
          const size = 1.5 + Math.random() * 3;
          const colors = ['#a78bfa', '#c4b5fd', '#8b5cf6', '#ddd6fe'];
          return (
            <div key={i} className="absolute rounded-full"
              style={{
                left: `${x}%`, top: '-5%',
                width: size, height: size,
                backgroundColor: colors[i % 4],
                animation: `tuParticleFall 2s ease-out ${delay}s both`,
              }}
            />
          );
        })}
      </div>

      {/* Horizontal light sweep */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(180deg, transparent 40%, rgba(167,139,250,0.08) 50%, transparent 60%)',
        animation: `tuSweep 1.5s ease-out 0.5s both`,
      }} />

      {/* Phase 4: text */}
      <div className="relative z-10 text-center" style={{ animation: `tuText 1s ease-out 0.6s both` }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(167,139,250,0.25) 0%, transparent 70%)', animation: `tuBreath 2s ease-in-out 0.6s both` }} />

        <div className="text-[10px] tracking-[0.5em] font-mono mb-3"
          style={{ color: '#c4b5fd', animation: `tuLabel 0.5s ease-out 0.7s both` }}>
          ◆ TITLE UNLOCKED ◆
        </div>
        <div className="text-5xl font-bold tracking-[0.15em] mb-2"
          style={{
            fontFamily: "'Orbitron', 'Space Grotesk', sans-serif",
            color: '#fff',
            textShadow: '0 0 50px rgba(167,139,250,0.9), 0 0 100px rgba(139,92,246,0.5), 0 0 150px rgba(167,139,250,0.3), 0 4px 8px rgba(0,0,0,0.6)',
            animation: `tuScale 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.8s both`,
          }}>
          {title}
        </div>
        <div className="text-sm tracking-[0.3em]"
          style={{ color: '#a78bfa', textShadow: '0 0 20px rgba(167,139,250,0.5)', animation: `tuFade 0.5s ease-out 1.2s both` }}>
          称号已收录至成就页
        </div>
      </div>

      <style>{`
        @keyframes tuFlash {
          0%   { opacity: 0; }
          40%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes tuRing {
          0%   { width: 0; height: 0; opacity: 1; }
          100% { width: 90vmax; height: 90vmax; opacity: 0; }
        }
        @keyframes tuDiamond {
          0%   { opacity: 0; transform: scale(0.05) rotate(-30deg); }
          25%  { opacity: 1; transform: scale(1) rotate(5deg); }
          100% { opacity: 0.5; transform: scale(1.08) rotate(12deg); }
        }
        @keyframes tuParticleFall {
          0%   { opacity: 0; transform: translateY(0) scale(0); }
          20%  { opacity: 1; transform: translateY(40px) scale(1.5); }
          100% { opacity: 0; transform: translateY(100vh) scale(0.3); }
        }
        @keyframes tuSweep {
          0%   { opacity: 0; transform: translateY(-100%); }
          50%  { opacity: 1; }
          100% { opacity: 0; transform: translateY(100%); }
        }
        @keyframes tuText {
          0%   { opacity: 0; transform: translateY(15px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes tuLabel {
          0%   { opacity: 0; letter-spacing: 0.8em; }
          100% { opacity: 0.8; letter-spacing: 0.5em; }
        }
        @keyframes tuScale {
          0%   { opacity: 0; transform: scale(0.3); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes tuFade {
          0%   { opacity: 0; }
          100% { opacity: 0.7; }
        }
        @keyframes tuBreath {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(0.8); }
          50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.3); }
        }
      `}</style>
    </div>
  );
}
