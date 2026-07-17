import { CheckCircle2, Circle, Target } from 'lucide-react';

export default function QuestList({ quests, title, loading }) {
  return (
    <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-white/70 tracking-wide mb-4 flex items-center gap-2">
        <Target size={16} className="text-cyan-400/60" />
        {title}
      </h3>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-white/[0.04] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : quests.length === 0 ? (
        <p className="text-slate-600 text-xs py-6 text-center">暂无任务，去记录活动吧</p>
      ) : (
        <div className="space-y-2">
          {quests.map(q => (
            <div
              key={q.id}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                q.completed ? 'bg-emerald-500/[0.04] border border-emerald-500/[0.08]' : 'bg-white/[0.02]'
              }`}
            >
              {q.completed ? (
                <CheckCircle2 size={16} className="text-emerald-400/60 shrink-0" />
              ) : (
                <Circle size={16} className="text-slate-700 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <span className={`text-sm ${q.completed ? 'text-emerald-400/50 line-through' : 'text-white/60'}`}>
                  {q.title_zh}
                </span>
                <div className="w-full h-1 bg-white/[0.04] rounded-full mt-1.5">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((q.progress / q.target) * 100, 100)}%`,
                      background: q.completed
                        ? 'linear-gradient(90deg, #34d399, #22c55e)'
                        : 'linear-gradient(90deg, #00e5ff, #a78bfa)',
                    }}
                  />
                </div>
              </div>
              <span className="text-xs text-slate-600 shrink-0 tabular-nums">
                {q.progress}/{q.target}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
