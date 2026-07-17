import { useState } from 'react';
import { ChevronDown, ChevronRight, Link2, Star } from 'lucide-react';

const BRANCH_COLORS = [
  { border: 'border-cyan-400/30', bg: 'bg-cyan-500/5', text: 'text-cyan-400' },
  { border: 'border-violet-400/30', bg: 'bg-violet-500/5', text: 'text-violet-400' },
  { border: 'border-amber-400/30', bg: 'bg-amber-500/5', text: 'text-amber-400' },
  { border: 'border-emerald-400/30', bg: 'bg-emerald-500/5', text: 'text-emerald-400' },
  { border: 'border-pink-400/30', bg: 'bg-pink-500/5', text: 'text-pink-400' },
];

function ConceptNode({ topic, brief, isKey, children, depth, colorIdx }) {
  const [open, setOpen] = useState(depth < 2);
  const hasKids = children?.length > 0;
  const c = BRANCH_COLORS[colorIdx % BRANCH_COLORS.length];

  return (
    <div>
      <button
        onClick={() => hasKids && setOpen(!open)}
        className={`flex items-start gap-2 w-full text-left py-2 group ${!hasKids ? 'cursor-default' : ''}`}
      >
        {hasKids ? (
          open ? <ChevronDown size={13} className={`shrink-0 mt-0.5 ${c.text}`} />
            : <ChevronRight size={13} className={`shrink-0 mt-0.5 ${c.text}`} />
        ) : (
          <span className="shrink-0 w-3 mt-1" />
        )}

        {isKey && <Star size={11} className="shrink-0 mt-0.5 text-amber-400" fill="currentColor" />}

        <div className="min-w-0">
          <span className={`text-sm font-semibold ${c.text}`}>{topic}</span>
          {brief && (
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{brief}</p>
          )}
        </div>
      </button>

      {hasKids && open && (
        <div className={`ml-5 pl-3 border-l ${c.border} my-1`}>
          {children.map((child, i) => (
            <ConceptNode
              key={i}
              topic={child.topic}
              brief={child.brief}
              isKey={child.is_key}
              children={child.children}
              depth={depth + 1}
              colorIdx={colorIdx}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function normalizeFramework(data) {
  if (!data) return null;
  if (data.branches) return data;
  if (Array.isArray(data)) {
    return {
      core_question: '',
      branches: data.map(f => ({
        topic: f.topic || '',
        brief: f.key_point || f.brief || '',
        is_key: true,
        children: (f.subtopics || []).map(s => ({
          topic: typeof s === 'string' ? s : s.topic || '',
          brief: typeof s === 'string' ? '' : s.key_point || s.brief || '',
          is_key: false,
          children: [],
        })),
      })),
      cross_links: [],
    };
  }
  return null;
}

export default function KnowledgeFramework({ data }) {
  const fw = normalizeFramework(data);
  if (!fw || !fw.branches?.length) return null;

  const { core_question, branches, cross_links } = fw;
  const keyCount = branches.filter(b => b.is_key !== false).length;

  return (
    <div className="space-y-4">
      {/* Core question */}
      {core_question && (
        <div className="text-center py-3 px-4 rounded-xl border border-cyan-400/15 bg-cyan-500/[0.03]">
          <p className="text-[10px] text-slate-500 font-mono tracking-wider mb-1.5">核心问题</p>
          <p className="text-sm text-cyan-300 font-medium leading-relaxed">{core_question}</p>
        </div>
      )}

      {/* Branches */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-600 font-mono tracking-wider">
            {branches.length} 个知识模块
          </span>
          {keyCount > 0 && (
            <span className="text-[10px] text-amber-500/70 font-mono tracking-wider flex items-center gap-1">
              <Star size={9} fill="currentColor" /> {keyCount} 个核心概念
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3">
          {branches.map((branch, i) => {
            const c = BRANCH_COLORS[i % BRANCH_COLORS.length];
            return (
              <div key={i} className={`border ${c.border} rounded-xl ${c.bg} p-4`}>
                <ConceptNode
                  topic={branch.topic}
                  brief={branch.brief}
                  isKey={branch.is_key !== false}
                  children={branch.children}
                  depth={0}
                  colorIdx={i}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Cross links */}
      {cross_links?.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <p className="text-[10px] text-slate-600 font-mono tracking-wider flex items-center gap-1.5">
            <Link2 size={10} /> 跨分支关联
          </p>
          {cross_links.map((link, i) => (
            <div key={i} className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <span className="text-cyan-400 font-medium">{link.from}</span>
              <span className="text-[10px] text-slate-500 bg-white/[0.03] px-2 py-0.5 rounded-full">{link.relation}</span>
              <span className="text-violet-400 font-medium">{link.to}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
