import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronDown, ChevronRight, Network, MessageCircle, FileText, Download } from 'lucide-react';
import KnowledgeFramework from './KnowledgeFramework';

async function exportToObsidian(content, filename) {
  // Get vault path from settings
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

function Section({ icon: Icon, title, defaultOpen = false, children, actions }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-white/[0.06] rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-left">
        <Icon size={14} className="text-cyan-400" />
        <span className="text-sm font-semibold text-white/70">{title}</span>
        {actions && <span className="ml-auto flex items-center gap-1" onClick={e => e.stopPropagation()}>{actions}</span>}
        <span className="text-slate-600">{!actions && (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}</span>
      </button>
      {open && <div className="px-4 py-3 border-t border-white/[0.04]">{children}</div>}
    </div>
  );
}

export default function Step1Result({ data, onContinue }) {
  const [exporting, setExporting] = useState(false);

  if (!data) return null;

  const handleExport = async () => {
    setExporting(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      await exportToObsidian(data.structured_notes, `笔记_${today}`);
    } catch (e) {
      alert(e.message);
    } finally {
      setExporting(false);
    }
  };

  const mdComponents = {
    h2: ({ children }) => <h2 className="text-base font-semibold text-cyan-400 mt-6 mb-2 pb-1.5 border-b border-cyan-400/15">{children}</h2>,
    h3: ({ children }) => <h3 className="text-sm font-semibold text-cyan-300/80 mt-4 mb-2">{children}</h3>,
    p: ({ children }) => <p className="text-slate-300 leading-relaxed my-3">{children}</p>,
    strong: ({ children }) => <strong className="text-amber-300 font-bold">{children}</strong>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-violet-400/40 bg-violet-500/[0.04] rounded-r-lg px-4 py-2 my-3 text-slate-300 italic">
        {children}
      </blockquote>
    ),
    ul: ({ children }) => <ul className="my-2 space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="my-2 space-y-1 list-decimal list-inside">{children}</ol>,
    li: ({ children }) => <li className="text-slate-300 leading-relaxed">{children}</li>,
    code: ({ children }) => <code className="text-cyan-300 bg-white/[0.04] px-1 py-0.5 rounded text-xs">{children}</code>,
    em: ({ children }) => <em className="text-pink-300/80">{children}</em>,
    hr: () => <hr className="border-white/[0.06] my-4" />,
  };

  return (
    <div className="space-y-3">
      {/* Structured notes */}
      <Section icon={FileText} title="结构化笔记" defaultOpen
        actions={
          <button onClick={handleExport} disabled={exporting}
            className="text-[10px] px-2 py-1 rounded bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-colors flex items-center gap-1">
            <Download size={10} /> {exporting ? '导出中...' : 'Obsidian'}
          </button>
        }
      >
        <div className="text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {data.structured_notes}
          </ReactMarkdown>
        </div>
      </Section>

      {/* Framework — merged keywords + structure */}
      <Section icon={Network} title={`知识框架`} defaultOpen>
        <KnowledgeFramework data={data.framework} />
      </Section>

      {/* Q&A Pairs */}
      <Section icon={MessageCircle} title={`理解问答（${data.qa_pairs?.length || 0}道）`}>
        <div className="space-y-2">
          {(data.qa_pairs || []).map((qa, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-3">
              <p className="text-sm text-white/70 font-medium">Q{i + 1}: {qa.question}</p>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{qa.answer}</p>
              <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                {qa.difficulty === 'easy' ? '简单' : qa.difficulty === 'hard' ? '困难' : '中等'}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* Continue button */}
      <button onClick={onContinue}
        className="w-full py-3 bg-violet-500/10 border border-violet-500/20 rounded-xl text-sm text-violet-400
          hover:bg-violet-500/20 transition-all font-semibold tracking-wide">
        进入第二步：内化理解 →
      </button>
    </div>
  );
}
