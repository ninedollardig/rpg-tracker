const SEGMENTS = [
  { key: 'acts', label: '活动 EXP', color: '#22d3ee', colorHex: '#22d3ee' },
  { key: 'wt', label: '周任务 EXP', color: '#a78bfa', colorHex: '#a78bfa' },
  { key: 'bonus', label: '成就奖励', color: '#fbbf24', colorHex: '#fbbf24' },
];

export default function ExpBreakdownBar({ totalExp, actExp, wtExp, bonusExp }) {
  const parts = [
    { ...SEGMENTS[0], value: actExp || 0 },
    { ...SEGMENTS[1], value: wtExp || 0 },
    { ...SEGMENTS[2], value: bonusExp || 0 },
  ];
  const total = totalExp || parts.reduce((s, p) => s + p.value, 0);

  if (total === 0) {
    return (
      <div className="text-slate-600 text-sm text-center py-8">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/[0.06] flex items-center justify-center mx-auto mb-3">
          <span className="text-[10px] font-mono">NO DATA</span>
        </div>
        暂无 EXP 数据
      </div>
    );
  }

  const pcts = parts.map(p => (total > 0 ? (p.value / total) * 100 : 0));

  // Only show segments with data (non-zero width)
  const visibleSegments = parts.map((p, i) => ({ ...p, pct: pcts[i] })).filter(p => p.pct > 0);

  return (
    <div>
      {/* Stacked bar */}
      <div className="relative h-6 rounded-full overflow-hidden bg-white/[0.04] border border-white/[0.06]">
        {visibleSegments.map((seg, i) => {
          const leftPct = visibleSegments.slice(0, i).reduce((s, p) => s + p.pct, 0);
          return (
            <div
              key={seg.key}
              className="absolute top-0 h-full transition-all duration-700 ease-out"
              style={{
                left: `${leftPct}%`,
                width: `${seg.pct}%`,
                backgroundColor: seg.color,
                opacity: 0.85,
              }}
            >
              {/* Subtle inner highlight */}
              <div
                className="absolute top-0 left-0 right-0 h-1/2 rounded-t-full"
                style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.15), transparent)' }}
              />
            </div>
          );
        })}
      </div>

      {/* Total label */}
      <div className="text-center mt-2 mb-3">
        <span className="text-lg font-bold text-white/50 font-mono tabular-nums">
          {total.toLocaleString()}
        </span>
        <span className="text-[10px] text-slate-600 tracking-widest ml-1">TOTAL EXP</span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
        {parts.map((seg, i) => (
          <div key={seg.key} className="flex items-center gap-2 text-xs">
            <span
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: seg.color, opacity: 0.85 }}
            />
            <span className="text-slate-400">{seg.label}</span>
            <span className="text-white/60 font-mono tabular-nums">{seg.value.toLocaleString()}</span>
            <span className="text-slate-600 font-mono tabular-nums">
              ({pcts[i].toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
