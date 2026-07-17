import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import { catClass, CATEGORIES } from './weekTaskConfig';

export default function AddTaskModal({ weekday, templates, onAdd, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [score, setScore] = useState(2);
  const [customCat, setCustomCat] = useState('');

  const selectTemplate = (t) => {
    setSelectedTemplate(t);
    setCustomContent(t.content);
    setScore(t.defaultScore);
    setCustomCat('');
    setSearchTerm('');
  };

  const clearTemplate = () => {
    setSelectedTemplate(null);
    setCustomContent('');
    setScore(2);
    setCustomCat('');
  };

  const submit = async () => {
    const content = customContent.trim();
    if (!content) return;
    const category = selectedTemplate?.category || customCat;
    if (!category) return;
    onAdd({ category, subcategory: selectedTemplate?.subcategory || '', content, score });
  };

  const filtered = searchTerm.trim()
    ? templates.filter(t =>
        t.content.includes(searchTerm) ||
        t.category.includes(searchTerm) ||
        t.subcategory.includes(searchTerm)
      )
    : [];

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="backdrop-blur-xl bg-[#030308] border border-white/[0.08] rounded-2xl p-5 w-[420px] max-h-[80vh] overflow-y-auto shadow-2xl shadow-cyan-500/3">
        <h3 className="text-sm font-semibold text-white/80 tracking-wide mb-4">
          添加修炼 · {weekday}
        </h3>

        <div className="relative mb-3">
          <Search size={14} className="absolute left-2.5 top-2 text-slate-600" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="搜索模板任务..."
            className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg pl-8 pr-3 py-1.5 text-sm text-white/80 outline-none focus:border-cyan-400/40 focus:shadow-[0_0_0_3px_rgba(0,229,255,0.08)] transition-all placeholder:text-slate-600"
          />
        </div>

        {searchTerm.trim() && (
          <div className="mb-3 max-h-48 overflow-y-auto space-y-0.5">
            {filtered.length === 0 ? (
              <p className="text-xs text-slate-600 py-2 text-center">无匹配模板</p>
            ) : (
              filtered.map((t, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectTemplate(t)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-all ${
                    selectedTemplate === t
                      ? 'bg-cyan-500/8 text-cyan-400 border border-cyan-500/15'
                      : 'hover:bg-white/[0.02] text-white/60'
                  }`}
                >
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded border"
                    style={{
                      backgroundColor: catClass(t.category, 'bg') || 'transparent',
                      color: catClass(t.category, 'color') || '#64748b',
                      borderColor: catClass(t.category, 'border') || 'rgba(255,255,255,0.06)',
                    }}
                  >
                    {t.subcategory}
                  </span>
                  <span className="flex-1 truncate">{t.content}</span>
                  <span className="text-slate-600">+{t.defaultScore}</span>
                </button>
              ))
            )}
          </div>
        )}

        {selectedTemplate && (
          <div className="flex items-center gap-2 mb-3 text-xs text-slate-500 bg-white/[0.03] rounded-lg px-3 py-2 border border-white/[0.06]">
            <span>已选：</span>
            <span style={{ color: catClass(selectedTemplate.category, 'color') }}>
              {selectedTemplate.category} · {selectedTemplate.subcategory}
            </span>
            <button type="button" onClick={clearTemplate} className="ml-auto text-slate-600 hover:text-white/60">
              <X size={14} />
            </button>
          </div>
        )}

        <input
          value={customContent}
          onChange={e => setCustomContent(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); }}
          placeholder={selectedTemplate ? '可修改任务名称...' : '输入任务名称...'}
          autoFocus
          className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-cyan-400/40 focus:shadow-[0_0_0_3px_rgba(0,229,255,0.08)] transition-all placeholder:text-slate-600 mb-3"
        />

        {!selectedTemplate && (
          <div className="mb-3">
            <p className="text-xs text-slate-600 mb-1.5">选择分类</p>
            <div className="flex gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCustomCat(customCat === cat ? '' : cat)}
                  className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                  style={
                    customCat === cat
                      ? {
                          backgroundColor: catClass(cat, 'bg'),
                          color: catClass(cat, 'color'),
                          border: `1px solid ${catClass(cat, 'border')}`,
                        }
                      : {
                          background: 'rgba(255,255,255,0.03)',
                          color: '#64748b',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }
                  }
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mb-4 text-xs text-slate-600">
          <span>分数：</span>
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setScore(n)}
              className={`w-8 h-7 rounded-lg font-semibold text-sm transition-all ${
                score === n
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/15'
                  : 'bg-white/[0.03] text-slate-600 hover:text-slate-400 border border-white/[0.05]'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        {customContent.trim() && !selectedTemplate && !customCat && (
          <p className="text-xs text-amber-400/70 mb-3">请先选择一个分类，再点击添加</p>
        )}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-600 hover:text-slate-400 rounded-lg hover:bg-white/[0.02] transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!customContent.trim() || (!selectedTemplate && !customCat)}
            className="px-4 py-1.5 text-xs font-semibold tracking-wide text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale-[30%]"
            style={{ background: 'linear-gradient(135deg, #00b8ff, #00d4ff)' }}
          >
            落笔
          </button>
        </div>
      </div>
    </div>
  );
  return createPortal(modal, document.body);
}
