import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { catClass } from './weekTaskConfig';

export default function TaskItem({ task, onToggle, onUpdate, onDelete }) {
  const [editingScore, setEditingScore] = useState(false);
  const [editingContent, setEditingContent] = useState(false);
  const [editContent, setEditContent] = useState('');

  const submitEdit = async () => {
    const text = editContent.trim();
    if (!text || text === task.content) {
      setEditingContent(false);
      return;
    }
    await onUpdate({ content: text });
    setEditingContent(false);
  };

  const submitScore = async (newScore) => {
    await onUpdate({ score: newScore });
    setEditingScore(false);
  };

  return (
    <div
      className={`group flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs transition-all ${
        task.completed ? 'bg-emerald-500/5' : 'hover:bg-white/[0.02]'
      }`}
    >
      <button
        onClick={onToggle}
        className={`shrink-0 w-3.5 h-3.5 rounded border flex items-center justify-center transition-all duration-200 ${
          task.completed
            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
            : 'border-white/[0.1] hover:border-cyan-500/[0.03]0 text-transparent hover:text-slate-500'
        }`}
      >
        <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 6l3 3 5-6" />
        </svg>
      </button>

      {editingContent ? (
        <input
          autoFocus
          value={editContent}
          onChange={e => setEditContent(e.target.value)}
          onBlur={submitEdit}
          onKeyDown={e => {
            if (e.key === 'Enter') submitEdit();
            if (e.key === 'Escape') setEditingContent(false);
          }}
          className="flex-1 bg-transparent text-white/80 outline-none border-b border-cyan-500/30 min-w-0 text-xs"
        />
      ) : (
        <span
          className={`flex-1 cursor-pointer hover:text-cyan-400 truncate transition-colors ${
            task.completed ? 'text-slate-600 line-through' : 'text-white/60'
          }`}
          onClick={() => {
            setEditingContent(true);
            setEditContent(task.content);
          }}
          title={task.content}
        >
          {task.content}
        </span>
      )}

      {task.category && (
        <span
          className="shrink-0 w-1.5 h-1.5 rounded-sm"
          style={{ backgroundColor: catClass(task.category, 'color') || '#64748b' }}
          title={`${task.category} · ${task.subcategory}`}
        />
      )}

      {editingScore ? (
        <div className="flex items-center gap-0.5 shrink-0">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => submitScore(n)}
              className={`w-4 h-4 rounded text-[10px] font-semibold transition-colors ${
                n <= task.score
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'bg-white/[0.04] text-slate-600 hover:text-slate-400'
              }`}
            >
              {n}
            </button>
          ))}
          <button type="button" onClick={() => setEditingScore(false)} className="text-slate-600 hover:text-slate-400">
            <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 2l6 6M8 2l-6 6" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditingScore(true)}
          className="shrink-0 text-[10px] text-cyan-400/50 hover:text-cyan-400 w-5 text-center font-semibold transition-colors"
          title="点击修改分数"
        >
          +{task.score}
        </button>
      )}

      <button
        type="button"
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-400 transition-all shrink-0"
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
}
