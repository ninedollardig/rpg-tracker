import { useState, useEffect } from 'react';
import { apiGet } from '../../api/client';

const categoryLabels = { '学习': '学习', '生活': '生活', '娱乐': '娱乐', '休息': '休息' };
const categoryColors = { '学习': '#60a5fa', '生活': '#f87171', '娱乐': '#f472b6', '休息': '#34d399' };

function getMonday() {
  const now = new Date();
  const day = now.getDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  return monday.toISOString().slice(0, 10);
}

export default function WeeklyReport() {
  const [data, setData] = useState(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().getDay();
    // Only attempt on Sunday
    if (today !== 0) {
      setLoading(false);
      return;
    }

    const thisMonday = getMonday();
    const lastShown = localStorage.getItem('lastReportWeek');

    if (lastShown === thisMonday) {
      setLoading(false);
      return;
    }

    apiGet('/stats/weekly-report')
      .then(d => {
        setData(d);
        setVisible(true);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleClose = () => {
    setVisible(false);
    const thisMonday = getMonday();
    localStorage.setItem('lastReportWeek', thisMonday);
  };

  if (loading || !visible || !data) return null;

  const taskRate = data.tasks_total > 0
    ? Math.round((data.tasks_completed / data.tasks_total) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* Card */}
      <div className="relative w-full max-w-lg mx-4 bg-black/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in">
        {/* Decorative corner */}
        <svg
          className="absolute top-3 right-3 w-6 h-6 text-white/[0.06]"
          viewBox="0 0 24 24" fill="currentColor"
        >
          <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" />
        </svg>

        {/* Title */}
        <h2
          className="text-xl font-bold text-white/90 tracking-[0.15em] text-center"
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          本周修炼报告
        </h2>
        <p className="text-[10px] text-slate-500 tracking-[0.25em] uppercase text-center mt-1 font-mono">
          {data.week_start} ~ {data.week_end}
        </p>

        <div className="border-t border-white/[0.05] my-4" />

        {/* EXP */}
        <div className="text-center mb-4">
          <div className="text-4xl font-bold text-white/90 tabular-nums font-mono tracking-tight">
            +{data.total_exp}
          </div>
          <p className="text-[10px] text-slate-500 tracking-[0.25em] uppercase mt-0.5 font-mono">
            TOTAL EXP EARNED
          </p>
        </div>

        {/* Level up banner */}
        {data.level_up && (
          <div className="text-center mb-4 py-2 px-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <p
              className="text-2xl font-bold text-amber-400 tracking-[0.2em]"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              LEVEL UP!
            </p>
            <p className="text-xs text-amber-400/60 mt-0.5">
              当前等级 Lv.{data.level}
            </p>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Task completion */}
          <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
            <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase font-mono">
              任务完成率
            </p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-xl font-bold text-white/85 tabular-nums font-mono">
                {taskRate}%
              </span>
              <span className="text-xs text-white/40 pb-0.5">
                {data.tasks_completed}/{data.tasks_total}
              </span>
            </div>
            <div className="mt-2 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${taskRate}%`,
                  background: 'linear-gradient(90deg, #60a5fa, #34d399)',
                }}
              />
            </div>
          </div>

          {/* Activities */}
          <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
            <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase font-mono">
              活动次数
            </p>
            <span className="text-xl font-bold text-white/85 tabular-nums font-mono mt-1 block">
              {data.activities_logged}
            </span>
          </div>

          {/* Top category */}
          <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
            <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase font-mono">
              最高频分类
            </p>
            <span
              className="text-xl font-bold tabular-nums font-mono mt-1 block"
              style={{ color: categoryColors[data.top_category] || '#94a3b8' }}
            >
              {categoryLabels[data.top_category] || data.top_category || '--'}
            </span>
          </div>

          {/* Streak */}
          <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
            <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase font-mono">
              连胜天数
            </p>
            <span className="text-xl font-bold text-white/85 tabular-nums font-mono mt-1 block">
              {data.streak_days} 天
            </span>
          </div>
        </div>

        {/* New achievements */}
        {data.new_achievements.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase font-mono mb-2">
              新解锁成就
            </p>
            <div className="space-y-1.5">
              {data.new_achievements.map((ach, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-amber-500/[0.06] border border-amber-500/[0.12] rounded-lg px-3 py-2"
                >
                  <span className="text-sm">{ach.icon || '?'}</span>
                  <span className="text-sm text-white/80">{ach.name_zh}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={handleClose}
          className="w-full py-2.5 mt-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/70 text-sm font-medium hover:bg-white/[0.08] transition-colors tracking-wide"
        >
          关闭
        </button>
      </div>
    </div>
  );
}
