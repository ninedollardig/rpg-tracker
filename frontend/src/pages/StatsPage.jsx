import { useStats } from '../hooks/useStats';
import ProgressChart from '../components/charts/ProgressChart';
import CategoryPie from '../components/charts/CategoryPie';
import ExpBreakdownBar from '../components/charts/ExpBreakdownBar';
import YearHeatmap from '../components/charts/YearHeatmap';
import Dropdown from '../components/ui/Dropdown';
import { useState } from 'react';

function SummaryCard({ label, value, color = '#00e5ff', index = 0 }) {
  const decor = [
    'M4,28 L28,4',                                                                          // diagonal slash
    'M2,2 L8,2 L8,8 Z M22,22 L28,22 L28,28 Z',                                            // corner brackets
    'M14,2 L18,2 L16,8 Z M14,28 L18,28 L16,22 Z M2,14 L2,18 L8,16 Z M28,14 L28,18 L22,16 Z', // crosshair
    'M2,15 Q15,2 28,15',                                                                    // arc
  ][index % 4];

  return (
    <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 relative overflow-hidden group hover:border-white/[0.1] transition-colors">
      {/* Geometric decoration */}
      <svg viewBox="0 0 30 30" className="absolute top-2 right-2 w-12 h-12 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity">
        <path d={decor} fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="text-2xl font-bold text-white/70 tabular-nums font-mono">{value}</div>
      <div className="text-xs text-slate-500 mt-1.5 tracking-wide flex items-center gap-1.5 relative z-10">
        <span className="w-1.5 h-1.5 rotate-45" style={{ backgroundColor: color, opacity: 0.7 }} />
        {label}
      </div>
    </div>
  );
}

export default function StatsPage() {
  const { summary, trends, loading, fetchTrends } = useStats();
  const [days, setDays] = useState(30);
  const [category, setCategory] = useState('all');

  if (loading || !summary) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <h2 className="text-xl font-bold text-white/80 tracking-tight">数据统计</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-24 bg-white/[0.03] rounded-2xl animate-pulse border border-white/[0.05]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-white/85 tracking-[0.2em]" style={{ fontFamily: 'Orbitron, sans-serif' }}>数据统计</h2>
        <p className="text-[10px] text-slate-500 tracking-[0.3em] uppercase mt-1 font-mono">STATISTICS</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="总修炼次数" value={summary.total_activities} color="#00e5ff" index={0} />
        <SummaryCard label="总修为" value={summary.total_exp} color="#a78bfa" index={1} />
        <SummaryCard label="当前连续" value={`${summary.current_streak} 天`} color="#fbbf24" index={2} />
        <SummaryCard label="最长连续" value={`${summary.longest_streak} 天`} color="#f87171" index={3} />
      </div>

      <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white/70 tracking-wide mb-4">修为分类占比</h3>
        <CategoryPie data={summary.exp_by_category} />
      </div>

      <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white/70 tracking-wide mb-4">EXP 来源拆解</h3>
        <ExpBreakdownBar
          totalExp={summary.total_exp}
          actExp={summary.total_exp_acts}
          wtExp={summary.total_exp_wt}
          bonusExp={summary.total_exp_bonus}
        />
      </div>

      <YearHeatmap />

      <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white/70 tracking-wide">修炼趋势</h3>
          <div className="flex gap-2">
            <Dropdown
              value={String(days)}
              options={[
                { value: '7', label: '7天' },
                { value: '30', label: '30天' },
                { value: '90', label: '90天' },
              ]}
              onChange={v => { setDays(Number(v)); fetchTrends(Number(v), category); }}
            />
            <Dropdown
              value={category}
              options={[
                { value: 'all', label: '全部' },
                { value: '生活', label: '生活' },
                { value: '学习', label: '学习' },
                { value: '娱乐', label: '娱乐' },
                { value: '休息', label: '休息' },
              ]}
              onChange={v => { setCategory(v); fetchTrends(days, v); }}
            />
          </div>
        </div>
        <ProgressChart data={trends} />
      </div>
    </div>
  );
}
