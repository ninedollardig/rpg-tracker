import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Component } from 'react';
import { UnfoldVertical, Lightbulb, BrainCircuit, Bookmark, Trash2, ChevronDown, ChevronRight, MessageSquare, Download } from 'lucide-react';

// Inline mini error boundary for individual cards
class CardErrorBoundary extends Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (this.state.err) {
      return (
        <div className="p-4 border border-rose-500/15 rounded-lg bg-rose-500/[0.03] text-xs text-rose-400">
          ⚠ 这张卡片渲染失败：{this.state.err.message}
        </div>
      );
    }
    return this.props.children;
  }
}

async function exportToObsidian(content, filename) {
  const settings = await fetch('/api/user/settings', { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } }).then(r => r.json());
  const vaultPath = settings.vault_path;
  if (!vaultPath) throw new Error('请先在「我的」页面配置 Obsidian 知识库路径');

  const res = await fetch('/api/study/export-obsidian', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
    body: JSON.stringify({ content, filename, vault_path: vaultPath }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '导出失败');
  return data;
}

const ACTIONS = [
  { key: 'logic', label: '拆解逻辑', icon: UnfoldVertical, desc: '是什么→为什么→怎么用', color: 'cyan' },
  { key: 'example', label: '举例说明', icon: Lightbulb, desc: '多角度举例加深理解', color: 'amber' },
  { key: 'deduction', label: '知识推导', icon: BrainCircuit, desc: '用旧知识推导新知识', color: 'violet' },
];

const colorMap = {
  cyan: 'border-cyan-500/20 text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10',
  amber: 'border-amber-500/20 text-amber-400 bg-amber-500/5 hover:bg-amber-500/10',
  violet: 'border-violet-500/20 text-violet-400 bg-violet-500/5 hover:bg-violet-500/10',
};

function InsightCard({ insight, onToggleSave, onDelete }) {
  const [open, setOpen] = useState(true);
  const [exporting, setExporting] = useState(false);
  const typeLabel = { logic: '拆解逻辑', example: '举例说明', deduction: '知识推导', custom: '自定义提问' };

  const handleExport = async () => {
    setExporting(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      await exportToObsidian(insight.ai_content, `深度理解_${typeLabel[insight.insight_type]}_${today}`);
    } catch (e) {
      alert(e.message);
    } finally {
      setExporting(false);
    }
  };

  const mdComponents = {
    h2: ({ children }) => <h2 className="text-sm font-semibold text-cyan-400 mt-4 mb-2 pb-1 border-b border-cyan-400/15">{children}</h2>,
    h3: ({ children }) => <h3 className="text-xs font-semibold text-cyan-300/80 mt-3 mb-1.5">{children}</h3>,
    p: ({ children }) => <p className="text-slate-300 leading-relaxed my-2 text-sm">{children}</p>,
    strong: ({ children }) => <strong className="text-amber-300 font-bold">{children}</strong>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-violet-400/40 bg-violet-500/[0.04] rounded-r-lg px-3 py-1.5 my-2 text-slate-300 italic text-sm">
        {children}
      </blockquote>
    ),
    ul: ({ children }) => <ul className="my-2 space-y-0.5">{children}</ul>,
    ol: ({ children }) => <ol className="my-2 space-y-0.5 list-decimal list-inside">{children}</ol>,
    li: ({ children }) => <li className="text-slate-300 leading-relaxed text-sm">{children}</li>,
    code: ({ children }) => <code className="text-cyan-300 bg-white/[0.04] px-1 py-0.5 rounded text-xs">{children}</code>,
    em: ({ children }) => <em className="text-pink-300/80">{children}</em>,
  };

  return (
    <div className="border border-white/[0.06] rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.02]">
        <button onClick={() => setOpen(!open)} className="text-slate-500 hover:text-slate-300">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/10 text-violet-400">{typeLabel[insight.insight_type] || '提问'}</span>
        {insight.user_prompt && <span className="text-xs text-slate-400 truncate max-w-[200px]">{insight.user_prompt}</span>}
        <button onClick={handleExport} disabled={exporting}
          className="text-[10px] px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/15 text-violet-400/70 hover:text-violet-300 hover:bg-violet-500/20 transition-colors flex items-center gap-1 ml-auto">
          <Download size={9} /> {exporting ? '...' : '导出'}
        </button>
        <button onClick={onToggleSave} className={`transition-colors ${insight.is_saved ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'}`}>
          <Bookmark size={13} fill={insight.is_saved ? 'currentColor' : 'none'} />
        </button>
        <button onClick={onDelete} className="text-slate-600 hover:text-rose-400 transition-colors">
          <Trash2 size={13} />
        </button>
      </div>
      {open && (
        <div className="px-4 py-3 border-t border-white/[0.04] text-sm">
          <ReactMarkdown components={mdComponents}>{insight.ai_content || ''}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export default function Step2Tools({ sessionId, onAction, onToggleSave, onDelete, insights, onContinue }) {
  const [acting, setActing] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');

  const handleAction = async (key) => {
    setActing(key);
    try { await onAction(sessionId, key); }
    finally { setActing(null); }
  };

  const handleCustom = async () => {
    if (!customPrompt.trim()) return;
    setActing('custom');
    try {
      await onAction(sessionId, 'custom', customPrompt.trim());
      setCustomPrompt('');
    } finally { setActing(null); }
  };

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {ACTIONS.map(a => (
          <button key={a.key} onClick={() => handleAction(a.key)} disabled={!!acting}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${colorMap[a.color]} disabled:opacity-30`}>
            <a.icon size={20} />
            <span className="text-sm font-semibold">{a.label}</span>
            <span className="text-[10px] opacity-50">{a.desc}</span>
          </button>
        ))}
      </div>

      {/* Custom question */}
      <div className="flex gap-2">
        <input type="text" value={customPrompt} onChange={e => setCustomPrompt(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleCustom(); }}
          placeholder="或输入你自己的想法/问题..."
          className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white/80 placeholder:text-slate-600 outline-none focus:border-violet-400/40 transition-all" />
        <button onClick={handleCustom} disabled={!customPrompt.trim() || !!acting}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl text-xs text-violet-400 hover:bg-violet-500/20 disabled:opacity-20 transition-all">
          <MessageSquare size={13} />提问
        </button>
      </div>

      {/* Loading indicator */}
      {acting && (
        <div className="flex items-center gap-2 py-2">
          <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
          <span className="text-xs text-slate-500">AI 深度加工中...</span>
        </div>
      )}

      {/* Insights feed */}
      {insights.length > 0 && (
        <div className="space-y-2 mt-3">
          <p className="text-[10px] text-slate-600 font-mono tracking-wider uppercase">深度理解记录</p>
          {insights.map(ins => (
            <CardErrorBoundary key={ins.id}>
              <InsightCard insight={ins}
                onToggleSave={() => onToggleSave(sessionId, ins.id)}
                onDelete={() => onDelete(sessionId, ins.id)} />
            </CardErrorBoundary>
          ))}
        </div>
      )}

      {/* Continue button */}
      <button onClick={onContinue}
        className="w-full py-3 bg-violet-500/10 border border-violet-500/20 rounded-xl text-sm text-violet-400
          hover:bg-violet-500/20 transition-all font-semibold tracking-wide">
        进入第三步：高强度输出 →
      </button>
    </div>
  );
}
