export default function ExpBar({ current, max, percentage }) {
  const pct = Math.min(percentage, 100);

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-slate-500 tracking-wide">修为</span>
        <span className="text-white/50">
          <span className="text-cyan-400 font-semibold">{current?.toLocaleString()}</span>
          <span className="text-slate-600"> / {max?.toLocaleString()}</span>
        </span>
      </div>

      {/* Track */}
      <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.06] relative">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out relative"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #00b8ff 0%, #00e5ff 40%, #a78bfa 100%)',
          }}
        >
          {/* Sheen */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-exp-fill"
            />
          </div>
        </div>
        {/* Geometric end-cap when complete */}
        {pct >= 100 && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rotate-45 bg-violet-400" />
        )}
      </div>

      <p className="text-[10px] text-slate-600 text-right mt-1">
        {pct >= 100 ? '可突破' : `${Math.round(pct)}%`}
      </p>
    </div>
  );
}
