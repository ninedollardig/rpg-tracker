import { CATEGORIES, catClass } from './weekTaskConfig';

export default function CategoryScoreBar({ categoryScores }) {
  return (
    <div className="flex gap-3 text-[11px]">
      {CATEGORIES.map(cat => (
        <span key={cat} className="flex items-center gap-1 text-slate-500">
          <span
            className="w-1.5 h-1.5 rounded-sm"
            style={{ backgroundColor: catClass(cat, 'color') || '#64748b' }}
          />
          {cat}
          <span className="text-slate-600">{categoryScores[cat] || 0}分</span>
        </span>
      ))}
    </div>
  );
}
