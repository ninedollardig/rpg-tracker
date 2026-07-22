import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { apiGet } from '../../api/client';
import { useTheme } from '../../context/ThemeContext';

const CELL = 11;
const GAP = 2;
const STEP = CELL + GAP;
const LABEL_W = 28;
const TOP_PAD = 16;
const MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
const DAY_LABELS = ['日','一','二','三','四','五','六'];

// 深色模式绿色阶梯（GitHub 官方配色）
const GRADS_DARK  = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
// 浅色模式绿色阶梯
const GRADS_LIGHT = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];

function getLevel(exp, maxExp) {
  if (exp <= 0 || maxExp <= 0) return 0;
  const r = exp / maxExp;
  if (r < 0.25) return 1;
  if (r < 0.50) return 2;
  if (r < 0.75) return 3;
  return 4;
}

function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 周${DAY_LABELS[d.getDay()]}`;
}

/** 将 months 数组展平为 { date: exp } 并计算统计 */
function flattenAndStats(data, year) {
  const map = {};
  data.months.forEach(m => m.days.forEach(d => { if (d.exp > 0) map[d.date] = d.exp; }));

  const dates = Object.keys(map).filter(k => k.startsWith(String(year))).sort();
  const totalExp = dates.reduce((s, k) => s + map[k], 0);
  const activeDays = dates.length;

  // 当前连续（从今天往前）
  const today = new Date(); today.setHours(0,0,0,0);
  const check = new Date(today);
  let curStreak = 0;
  while (true) {
    const k = check.toISOString().slice(0, 10);
    if (map[k] > 0) { curStreak++; check.setDate(check.getDate() - 1); }
    else break;
  }

  // 最长连续
  let best = 0, run = 0;
  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);
  for (const d = new Date(jan1); d <= dec31; d.setDate(d.getDate() + 1)) {
    if (map[d.toISOString().slice(0, 10)] > 0) { run++; if (run > best) best = run; }
    else run = 0;
  }

  return { map, totalExp, activeDays, curStreak, bestStreak: best };
}

export default function YearHeatmap() {
  const { theme } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [tooltip, setTooltip] = useState(null); // { x, y, date, exp, level }
  const scrollRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setTooltip(null);
    apiGet(`/stats/yearly-heatmap?year=${year}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [year]);

  const colors = theme === 'light' ? GRADS_LIGHT : GRADS_DARK;

  const { weeks, monthCols, maxExp, stats } = useMemo(() => {
    if (!data || !data.months) return { weeks: [], monthCols: [], maxExp: 1, stats: null };

    const { map: expMap, totalExp, activeDays, curStreak, bestStreak } = flattenAndStats(data, data.year);
    const statsResult = { totalExp, activeDays, curStreak, bestStreak };

    const y = data.year;
    const jan1 = new Date(y, 0, 1);
    const dec31 = new Date(y, 11, 31);

    // Grid starts on the Sunday of the week containing Jan 1
    const gridStart = new Date(jan1);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());

    // Grid ends on the Saturday of the week containing Dec 31
    const gridEnd = new Date(dec31);
    gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

    const weeksArr = [];
    const mCols = [];
    const cur = new Date(gridStart);
    let ci = 0;

    while (cur <= gridEnd) {
      const week = [];
      for (let dow = 0; dow < 7; dow++) {
        const ds = cur.toISOString().slice(0, 10);
        const inYear = cur >= jan1 && cur <= dec31;
        week.push({ date: ds, exp: inYear ? (expMap[ds] || 0) : -1, inYear });
        if (cur.getDate() === 1 && inYear) mCols.push({ col: ci, label: MONTH_NAMES[cur.getMonth()] });
        cur.setDate(cur.getDate() + 1);
      }
      weeksArr.push(week);
      ci++;
    }

    // Filter month labels that are too close
    const filtered = mCols.filter((m, i) =>
      i === 0 || m.col - mCols[i - 1].col >= 2
    );

    const max = Math.max(1, ...weeksArr.flatMap(w => w.map(d => (d.inYear && d.exp > 0) ? d.exp : 0)));
    return { weeks: weeksArr, monthCols: filtered, maxExp: max, stats: statsResult };
  }, [data]);

  const today = new Date().toISOString().slice(0, 10);

  const handleEnter = useCallback((e, date, exp) => {
    setTooltip({ date, exp, x: e.pageX, y: e.pageY });
  }, []);

  const handleMove = useCallback((e) => {
    setTooltip(prev => prev ? { ...prev, x: e.pageX, y: e.pageY } : null);
  }, []);

  const handleLeave = useCallback(() => setTooltip(null), []);

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 animate-pulse">
        <div className="h-4 bg-white/[0.04] rounded w-24 mb-4" />
        <div className="h-36 bg-white/[0.04] rounded" />
      </div>
    );
  }

  if (!data || weeks.length === 0) return null;

  const cols = weeks.length;
  const svgW = LABEL_W + cols * STEP + 8;
  const svgH = TOP_PAD + 7 * STEP;
  const tooltipLevel = tooltip ? getLevel(tooltip.exp, maxExp) : 0;

  return (
    <>
      <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6" ref={scrollRef}>
      {/* Header: title + year nav + legend */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-white/70 tracking-wide">年度热力</h3>
          {/* Year nav */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setYear(y => y - 1)}
              className="w-6 h-6 flex items-center justify-center rounded border border-white/[0.08] text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] text-xs transition-colors"
            >◀</button>
            <span className="text-[11px] font-semibold text-white/70 font-mono min-w-[36px] text-center">{data.year}</span>
            <button
              onClick={() => setYear(y => y + 1)}
              disabled={data.year >= new Date().getFullYear()}
              className="w-6 h-6 flex items-center justify-center rounded border border-white/[0.08] text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >▶</button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-slate-600">少</span>
          {colors.map((c, i) => (
            <div key={i} className="rounded-sm" style={{ width: 10, height: 10, backgroundColor: c }} />
          ))}
          <span className="text-[9px] text-slate-600 ml-0.5">多</span>
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="flex gap-3 mb-4">
          {[
            { v: stats.totalExp.toLocaleString() + ' EXP', l: '年度总修为' },
            { v: stats.activeDays + ' 天', l: '修炼天数' },
            { v: stats.curStreak + ' 天', l: '当前连续' },
            { v: stats.bestStreak + ' 天', l: '最长连续' },
          ].map((s, i) => (
            <div key={i} className="flex-1 rounded-lg border border-white/[0.05] py-2 px-3 text-center">
              <div className="text-sm font-bold text-white/80 font-mono">{s.v}</div>
              <div className="text-[10px] text-slate-600 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Heatmap SVG */}
      <div className="overflow-x-auto -mx-1">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: svgW, height: svgH, minWidth: svgW }}>
          {/* Month labels */}
          {monthCols.map(({ col, label }) => (
            <text
              key={label}
              x={LABEL_W + col * STEP}
              y={TOP_PAD - 4}
              className="fill-slate-500"
              style={{ fontSize: 10, fontFamily: 'inherit' }}
            >{label}</text>
          ))}

          {/* Day labels */}
          {[0, 2, 4, 6].map(row => (
            <text
              key={row}
              x={LABEL_W - 6}
              y={TOP_PAD + row * STEP + CELL - 2}
              textAnchor="end"
              className="fill-slate-600"
              style={{ fontSize: 9, fontFamily: 'inherit' }}
            >{DAY_LABELS[row]}</text>
          ))}

          {/* Cells */}
          {weeks.map((week, ci) =>
            week.map((day, ri) => {
              if (!day.inYear) return null;
              const lv = getLevel(day.exp, maxExp);
              const isToday = day.date === today;
              return (
                <rect
                  key={`${ci}-${ri}`}
                  x={LABEL_W + ci * STEP}
                  y={TOP_PAD + ri * STEP}
                  width={CELL}
                  height={CELL}
                  rx={2} ry={2}
                  fill={colors[lv]}
                  className="transition-opacity hover:opacity-75 cursor-pointer"
                  stroke={isToday ? colors[4] : undefined}
                  strokeWidth={isToday ? 1.2 : undefined}
                  strokeOpacity={isToday ? 0.5 : undefined}
                  onMouseEnter={e => handleEnter(e, day.date, day.exp)}
                  onMouseMove={handleMove}
                  onMouseLeave={handleLeave}
                />
              );
            })
          )}
        </svg>
      </div>

      {/* Hint */}
      <p className="text-[9px] text-slate-600 mt-2 text-right font-mono">
        每个方块代表一天 · 颜色越深 EXP 越多 · 悬停查看详情
      </p>

    </div>

      {/* Tooltip — outside the card so backdrop-filter doesn't trap fixed positioning */}
      {tooltip && (
        <div
          className="fixed z-[9999] pointer-events-none rounded-lg border border-white/[0.1] px-3 py-2 text-xs shadow-xl backdrop-blur-xl"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, calc(-100% - 8px))',
            background: theme === 'dark' ? 'rgba(28,33,40,0.95)' : 'rgba(255,255,255,0.95)',
            color: theme === 'dark' ? '#c9d1d9' : '#24292f',
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: colors[tooltipLevel] }} />
            <span className="font-semibold">{fmtDate(tooltip.date)}</span>
          </div>
          <div className="mt-0.5" style={{ color: theme === 'dark' ? '#8b949e' : '#57606a' }}>
            {tooltip.exp} EXP
          </div>
        </div>
      )}
    </>
  );
}
