const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];
const CELL_SIZE = 22;
const CELL_GAP = 3;

function cellColor(score) {
  if (score === 0) return 'rgba(255,255,255,0.02)';
  if (score <= 2) return 'rgba(99,102,241,0.15)';
  if (score <= 5) return 'rgba(99,102,241,0.30)';
  if (score <= 8) return 'rgba(99,102,241,0.50)';
  return 'rgba(99,102,241,0.70)';
}

function formatWeekLabel(weekStart) {
  const d = new Date(weekStart);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function MonthHeatmap({ weeks, currentWeekStart }) {
  if (!weeks || weeks.length === 0) return null;

  const maxScore = Math.max(1, ...weeks.flatMap(w => w.dailyScores));

  return (
    <div
      className="rounded-xl p-3 w-fit"
      style={{
        background: 'var(--glass-surface)',
        border: '1px solid var(--glass-border)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <h4 className="text-[10px] font-medium text-white/50 tracking-wide">月度热力</h4>
        <div className="flex items-center gap-px">
          {[0.02, 0.15, 0.30, 0.50, 0.70].map((alpha) => (
            <div
              key={alpha}
              className="w-2 h-2 rounded-sm"
              style={{ backgroundColor: `rgba(99,102,241,${alpha})` }}
            />
          ))}
        </div>
      </div>

      <div className="flex" style={{ gap: CELL_GAP }}>
        {/* Week labels */}
        <div className="flex flex-col shrink-0" style={{ gap: CELL_GAP, paddingTop: 14 }}>
          {weeks.map((w) => (
            <div
              key={w.weekStart}
              className="text-[9px] text-slate-600 flex items-center justify-end"
              style={{ width: 30, height: CELL_SIZE }}
            >
              {formatWeekLabel(w.weekStart)}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div>
          {/* Day headers */}
          <div className="flex" style={{ gap: CELL_GAP, marginBottom: CELL_GAP }}>
            {DAY_LABELS.map((label) => (
              <div
                key={label}
                className="text-[9px] text-slate-600 flex items-center justify-center"
                style={{ width: CELL_SIZE, height: 14 }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Cells */}
          {weeks.map((w) => (
            <div key={w.weekStart} className="flex" style={{ gap: CELL_GAP, marginBottom: CELL_GAP }}>
              {w.dailyScores.map((score, i) => {
                const isToday =
                  w.weekStart === currentWeekStart &&
                  i === (new Date().getDay() + 6) % 7;

                return (
                  <div
                    key={i}
                    className="rounded-sm"
                    style={{
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      backgroundColor: cellColor(score),
                      border: isToday
                        ? '1px solid rgba(0,229,255,0.5)'
                        : '1px solid transparent',
                      boxShadow: isToday
                        ? '0 0 3px rgba(0,229,255,0.2)'
                        : undefined,
                    }}
                    title={`${w.weekStart} · ${score}分`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
