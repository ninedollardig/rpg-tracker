import { Trash2 } from 'lucide-react';

const CAT_COLORS = {
  '生活': '#f87171',
  '学习': '#60a5fa',
  '娱乐': '#f472b6',
  '休息': '#34d399',
};

export default function ActivityList({ activities, loading, onDelete }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 bg-white/[0.03] rounded-xl animate-pulse border border-white/[0.05]" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-slate-600">
        <p className="text-sm mb-1">还没有修炼记录</p>
        <p className="text-xs">在上方记录你的第一笔修炼吧</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map(a => (
        <div
          key={a.id}
          className="backdrop-blur-sm bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 flex items-center gap-4 hover:border-white/[0.1] hover:bg-white/[0.03] transition-all duration-200 group"
        >
          {/* Category color dot */}
          <span
            className="w-2.5 h-2.5 rounded-sm shrink-0"
            style={{ backgroundColor: CAT_COLORS[a.category] || '#64748b' }}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-white/70 font-medium text-sm">{a.name_zh}</span>
              <span className="text-cyan-400 text-sm font-semibold">+{a.exp_earned} EXP</span>
            </div>
            <div className="text-slate-600 text-xs flex items-center gap-2 mt-0.5">
              {a.category && (
                <span className="bg-white/[0.03] px-1.5 py-0.5 rounded border border-white/[0.05]">
                  {a.category} · {a.subcategory}
                </span>
              )}
              <span>{a.value} {a.unit}</span>
              {a.notes && <span className="text-slate-700">— {a.notes}</span>}
            </div>
          </div>

          <div className="text-slate-600 text-xs text-right shrink-0">
            {a.logged_date}
          </div>

          <button
            onClick={() => onDelete(a.id)}
            className="text-slate-700 hover:text-rose-400 transition-colors p-1 opacity-0 group-hover:opacity-100"
            title="删除"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
