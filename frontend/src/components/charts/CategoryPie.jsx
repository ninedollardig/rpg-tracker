import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const CATEGORIES = {
  '生活': { color: '#f87171', label: '生活', icon: 'shield' },
  '学习': { color: '#60a5fa', label: '学习', icon: 'diamond' },
  '娱乐': { color: '#f472b6', label: '娱乐', icon: 'star' },
  '休息': { color: '#34d399', label: '休息', icon: 'moon' },
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
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
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
        <span className="font-semibold">{d.name}</span>
      </div>
      <span style={{ color: d.color, fontWeight: 600 }}>{d.value.toLocaleString()} EXP</span>
    </div>
  );
}

export default function CategoryPie({ data }) {
  const chartData = data
    .filter(d => d.exp > 0)
    .map(d => ({
      name: CATEGORIES[d.category]?.label || d.category,
      value: d.exp,
      color: CATEGORIES[d.category]?.color || '#64748b',
    }));

  if (chartData.length === 0) {
    return (
      <div className="text-slate-600 text-sm text-center py-10">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/[0.06] flex items-center justify-center mx-auto mb-3">
          <span className="text-[10px] font-mono">NO DATA</span>
        </div>
        暂无数据
      </div>
    );
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <defs>
            {chartData.map((entry, i) => (
              <filter key={i} id={`pie-glow-${i}`}>
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            ))}
          </defs>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={100}
            paddingAngle={4}
            dataKey="value"
            stroke="transparent"
            cornerRadius={3}
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} opacity={0.88} filter={`url(#pie-glow-${i})`} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="text-2xl font-bold text-white/60 font-mono">
            {chartData.reduce((s, d) => s + d.value, 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-600 tracking-widest mt-0.5">TOTAL EXP</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-5 mt-3">
        {chartData.map(d => (
          <div key={d.name} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: d.color }} />
            <span className="text-[11px] text-slate-500">{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
