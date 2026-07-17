const STAT_CONFIG = {
  strength:     { color: '#f87171', label: '力量', sides: 3 },
  intelligence: { color: '#60a5fa', label: '智力', sides: 4 },
  vitality:     { color: '#34d399', label: '体力', sides: 6 },
  agility:      { color: '#fbbf24', label: '敏捷', sides: 3 },
  wisdom:       { color: '#a78bfa', label: '智慧', sides: 4 },
  mood:         { color: '#f472b6', label: '心情', sides: 5 },
};

function GeoIcon({ color, sides }) {
  const points = [];
  const r = 7;
  const cx = 10, cy = 10;
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
    points.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return (
    <svg viewBox="0 0 20 20" className="w-5 h-5">
      <polygon points={points.join(' ')} fill={`${color}18`} stroke={color} strokeWidth="1" opacity="0.7" />
    </svg>
  );
}

export default function StatRow({ stat }) {
  const cfg = STAT_CONFIG[stat.key];
  if (!cfg) return null;

  const barWidth = Math.min((stat.value / 20) * 100, 100);

  return (
    <div className="flex items-center gap-2.5 py-1.5 group">
      <GeoIcon color={cfg.color} sides={cfg.sides} />

      <span className="text-slate-500 text-xs w-10 shrink-0 tracking-wide">
        {cfg.label}
      </span>

      {/* Bar */}
      <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out relative"
          style={{ width: `${barWidth}%`, backgroundColor: cfg.color }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-2.5 rounded-full opacity-50"
            style={{ backgroundColor: cfg.color }} />
        </div>
      </div>

      {/* Value */}
      <span className="font-bold text-sm w-6 text-right text-white/60 tabular-nums">
        {stat.value}
      </span>
    </div>
  );
}
