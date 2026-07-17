import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(3,3,8,0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
      padding: '10px 14px',
      color: '#e2e8f0',
      fontSize: '12px',
    }}>
      <div className="text-[10px] text-slate-500 font-mono mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="font-semibold" style={{ color: p.color }}>{p.value?.toLocaleString()} EXP</span>
        </div>
      ))}
    </div>
  );
}

export default function ProgressChart({ data }) {
  const dateMap = {};
  for (const d of data) {
    if (!dateMap[d.date]) {
      dateMap[d.date] = { date: d.date, exp: 0 };
    }
    dateMap[d.date].exp += Number(d.exp) || 0;
  }
  const chartData = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[250px] text-slate-600 text-sm">
        <svg viewBox="0 0 40 40" className="w-10 h-10 mb-3 opacity-20">
          <polyline points="4,30 18,15 26,22 36,6" fill="none" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        暂无数据，去记录活动吧
      </div>
    );
  }

  // Compute gradient stop based on data
  const maxVal = Math.max(...chartData.map(d => d.exp), 1);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#00e5ff" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
          </linearGradient>
          <filter id="lineGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />

        <XAxis
          dataKey="date"
          tick={{ fill: '#475569', fontSize: 11, fontFamily: 'monospace' }}
          axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
          tickLine={false}
        />

        <YAxis
          tick={{ fill: '#475569', fontSize: 11, fontFamily: 'monospace' }}
          axisLine={false}
          tickLine={false}
          width={45}
        />

        <Tooltip content={<CustomTooltip />} />

        <Area
          type="monotone"
          dataKey="exp"
          stroke="#00e5ff"
          strokeWidth={2}
          fill="url(#areaGrad)"
          dot={false}
          activeDot={{
            r: 4,
            fill: '#030308',
            stroke: '#00e5ff',
            strokeWidth: 2,
            filter: 'url(#lineGlow)',
          }}
          filter="url(#lineGlow)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
