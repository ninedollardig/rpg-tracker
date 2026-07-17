import { useState, useEffect } from 'react';
import { apiGet } from '../../api/client';

const MONTH_LABELS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

function cellColor(exp, maxExp) {
  if (exp === 0) return 'rgba(255,255,255,0.015)';
  const t = Math.min(exp / Math.max(maxExp, 1), 1);
  if (t < 0.2) return `rgba(0,229,255,${0.08 + t * 0.4})`;
  if (t < 0.5) return `rgba(0,229,255,${0.18 + t * 0.7})`;
  if (t < 0.8) return `rgba(0,229,255,${0.35 + t * 0.8})`;
  return `rgba(0,229,255,${0.55 + t * 0.45})`;
}

export default function YearHeatmap({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiGet(`/stats/yearly-heatmap${year ? `?year=${year}` : ''}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [year]);

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 animate-pulse">
        <div className="h-4 bg-white/[0.04] rounded w-24 mb-4" />
        <div className="h-40 bg-white/[0.04] rounded" />
      </div>
    );
  }

  if (!data || !data.months) return null;

  const maxExp = Math.max(1, ...data.months.flatMap(m => m.days.map(d => d.exp)));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white/70 tracking-wide">年度热力</h3>
          <p className="text-[10px] text-slate-600 mt-0.5 font-mono">{data.year}</p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-0.5">
          <span className="text-[9px] text-slate-600 mr-1">少</span>
          {[0.05, 0.015, 0.04, 0.06, 0.1].map((_, i) => {
            const sampleExp = maxExp * ((i + 1) / 5);
            return (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: cellColor(sampleExp, maxExp) }}
              />
            );
          })}
          <span className="text-[9px] text-slate-600 ml-1">多</span>
        </div>
      </div>

      {/* Grid: months as columns, days as rows */}
      <div className="flex gap-[2px]">
        {data.months.map((m, mi) => (
          <div key={mi} className="flex-1 min-w-0">
            {/* Month label */}
            <div className="text-[9px] text-slate-600 text-center mb-1.5 font-mono">
              {MONTH_LABELS[mi]}
            </div>
            {/* Day cells */}
            <div className="flex flex-col gap-[2px]">
              {m.days.map((d) => {
                const isToday = d.date === today;
                return (
                  <div
                    key={d.day}
                    className="rounded-sm transition-colors"
                    style={{
                      height: '10px',
                      backgroundColor: cellColor(d.exp, maxExp),
                      border: isToday ? '1px solid rgba(0,229,255,0.4)' : '1px solid transparent',
                      boxShadow: isToday ? '0 0 2px rgba(0,229,255,0.15)' : undefined,
                    }}
                    title={`${d.date} · ${d.exp} EXP`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* X-axis: day numbers (every 5 days) */}
      <div className="flex gap-[2px] mt-1.5">
        {data.months.map((m, mi) => (
          <div key={mi} className="flex-1 min-w-0 flex">
            {[5, 10, 15, 20, 25].map(n => (
              <div key={n} className="flex-1 text-[8px] text-slate-700 text-center font-mono">
                {n}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
