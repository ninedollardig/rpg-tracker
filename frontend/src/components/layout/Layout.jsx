import { useState, useEffect } from 'react';
import { ArrowLeft, Monitor } from 'lucide-react';
import Sidebar from './Sidebar';
import MobileHome from './MobileHome';
import { useViewMode } from '../../context/ViewModeContext';

const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

const PHASES = [
  { label: '晨光', range: [5, 8],   color: '#2dd4bf', glow: 'rgba(45,212,191,0.3)', ring: '#14b8a6' },
  { label: '白昼', range: [8, 17],  color: '#fbbf24', glow: 'rgba(251,191,36,0.3)', ring: '#f59e0b' },
  { label: '黄昏', range: [17, 20], color: '#a78bfa', glow: 'rgba(167,139,250,0.3)', ring: '#8b5cf6' },
  { label: '静夜', range: [20, 5],  color: '#818cf8', glow: 'rgba(129,140,248,0.3)', ring: '#6366f1' },
];

function getPhase(hour) {
  for (const p of PHASES) {
    const [lo, hi] = p.range;
    if (lo < hi) { if (hour >= lo && hour < hi) return p; }
    else         { if (hour >= lo || hour < hi) return p; }
  }
  return PHASES[2]; // fallback
}

/* Circular progress ring (SVG) */
function RingProgress({ pct, ringColor, glowColor }) {
  const r = 10, circ = 2 * Math.PI * r, offset = circ * (1 - pct);
  return (
    <svg viewBox="0 0 26 26" className="w-7 h-7 shrink-0" style={{ filter: `drop-shadow(0 0 4px ${glowColor})` }}>
      <circle cx="13" cy="13" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
      <circle cx="13" cy="13" r={r} fill="none"
        stroke={ringColor} strokeWidth="2" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '13px 13px', transition: 'stroke-dashoffset 0.6s ease-out' }}
      />
    </svg>
  );
}

function DayPhaseBar() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const h = now.getHours();
  const min = now.getMinutes();
  const sec = now.getSeconds();
  const phase = getPhase(h);

  // Day progress (0–1)
  const pct = (h * 3600 + min * 60 + sec) / 86400;

  // Countdown to midnight
  const remaining = 86400 - (h * 3600 + min * 60 + sec);
  const cdH = Math.floor(remaining / 3600);
  const cdM = Math.floor((remaining % 3600) / 60);
  const cdS = remaining % 60;
  const cdStr = remaining > 3600
    ? `${String(cdH).padStart(2,'0')}:${String(cdM).padStart(2,'0')}`
    : `${String(cdM).padStart(2,'0')}:${String(cdS).padStart(2,'0')}`;

  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const w = WEEKDAY_NAMES[now.getDay()];

  return (
    <div className="mb-6 px-1 select-none">
      {/* Top row: ring + countdown + phase */}
      <div className="flex items-center gap-3">
        <RingProgress pct={pct} ringColor={phase.ring} glowColor={phase.glow} />

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500 tracking-wider font-mono uppercase">距离重置</span>
          <span className="text-sm font-bold tabular-nums tracking-tight"
            style={{ color: phase.color, fontFamily: 'Orbitron, Space Grotesk, sans-serif' }}>
            {cdStr}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: phase.color, boxShadow: `0 0 6px ${phase.glow}` }} />
          <span className="text-sm font-semibold tracking-[0.15em]"
            style={{ color: phase.color, fontFamily: 'Space Grotesk, Noto Sans SC, sans-serif' }}>
            {phase.label}
          </span>
        </div>
      </div>

      {/* Bottom row: date + weekday */}
      <div className="flex items-center gap-2 mt-1.5 pl-[34px]">
        <span className="text-[11px] text-slate-600 tracking-wider font-mono">
          {y}/{String(m).padStart(2,'0')}/{String(d).padStart(2,'0')}
        </span>
        <span className="text-[11px] text-slate-500 font-medium">周{w}</span>
      </div>
    </div>
  );
}

export default function Layout({ children }) {
  const { viewMode, mobilePage, goMobileHome, toggleViewMode } = useViewMode();
  const isMobile = viewMode === 'mobile';
  const showHome = isMobile && !mobilePage;

  if (isMobile) {
    return (
      <div className="flex h-screen overflow-hidden bg-[#030308] justify-center items-start py-4">
        {/* Phone frame */}
        <div className="w-full max-w-[430px] h-full max-h-[920px] rounded-[2.5rem] border border-white/[0.06] bg-[#060610] shadow-[0_0_80px_rgba(0,0,0,0.6),0_0_0_2px_rgba(255,255,255,0.03)] overflow-hidden flex flex-col">
          {/* Content area */}
          <div className="flex-1 overflow-y-auto">
            {showHome ? (
              <MobileHome />
            ) : (
              <>
                {/* Back button */}
                <div className="sticky top-0 z-10 bg-[#060610]/90 backdrop-blur-xl border-b border-white/[0.04] px-4 py-3 flex items-center">
                  <button
                    onClick={goMobileHome}
                    className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-all group"
                  >
                    <ArrowLeft size={18} className="drop-shadow-[0_0_8px_rgba(0,229,255,0.5)] group-hover:drop-shadow-[0_0_14px_rgba(0,229,255,0.7)] transition-all" />
                    <span className="text-xs text-cyan-400/80 group-hover:text-cyan-300">返回</span>
                  </button>
                </div>
                <div className="px-4 py-3">
                  <DayPhaseBar />
                  {children}
                </div>
              </>
            )}
          </div>

          {/* Bottom bar */}
          {showHome ? (
            <div className="shrink-0 border-t border-white/[0.04] px-4 py-3 space-y-3">
              <button
                onClick={toggleViewMode}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-500/8 border border-cyan-500/15 text-sm text-cyan-400 hover:bg-cyan-500/15 hover:border-cyan-500/25 hover:shadow-[0_0_20px_rgba(0,229,255,0.15)] transition-all group"
              >
                <Monitor size={16} className="group-hover:drop-shadow-[0_0_8px_rgba(0,229,255,0.6)] transition-all" />
                <span>退出手机模式</span>
              </button>
              <div className="flex justify-center">
                <div className="w-36 h-1.5 bg-white/[0.06] rounded-full" />
              </div>
            </div>
          ) : (
            <div className="shrink-0 flex justify-center pb-3 pt-2">
              <div className="w-36 h-1.5 bg-white/[0.06] rounded-full" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop mode
  return (
    <div className="flex h-screen overflow-hidden bg-[#030308]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-8 py-6">
        <DayPhaseBar />
        {children}
      </main>
    </div>
  );
}
