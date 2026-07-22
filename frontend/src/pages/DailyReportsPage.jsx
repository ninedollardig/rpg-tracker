import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Edit3, Trash2, Plus, Sparkles, Calendar, User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import useDailyReports from '../hooks/useDailyReports';
import { toast } from 'sonner';

function formatDate(dateStr) {
  // Parse YYYY-MM-DD manually to avoid UTC interpretation of date-only strings
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${mm}-${dd} ${weekdays[date.getDay()]}`;
}

function EmptyState({ onCreate, onGenerate }) {
  return (
    <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-12 text-center">
      <div className="text-5xl mb-4 opacity-40">📰</div>
      <p className="text-slate-400 text-sm mb-2">还没有日报记录</p>
      <p className="text-slate-600 text-xs mb-6">点击上方按钮开始写日报或自动生成</p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={onCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm hover:bg-cyan-500/20 transition-colors"
        >
          <Plus size={15} />
          写日报
        </button>
        <button
          onClick={onGenerate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm hover:bg-violet-500/20 transition-colors"
        >
          <Sparkles size={15} />
          生成今日日报
        </button>
      </div>
    </div>
  );
}

function ReportCard({ report, onView }) {
  const preview = report.preview || report.content?.slice(0, 120) || '';
  return (
    <div
      onClick={() => onView(report)}
      className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 cursor-pointer group hover:border-white/[0.12] hover:bg-white/[0.05] transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <Calendar size={14} className="text-slate-500" />
          <span className="text-sm text-white/75 font-medium">{formatDate(report.date)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {report.source === 'manual' ? (
            <>
              <User size={12} className="text-cyan-400/60" />
              <span className="text-[10px] text-cyan-400/60 tracking-wide">手动</span>
            </>
          ) : (
            <>
              <Bot size={12} className="text-violet-400/60" />
              <span className="text-[10px] text-violet-400/60 tracking-wide">自动</span>
            </>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{preview}</p>
      <div className="mt-3 flex justify-end">
        <span className="text-[10px] text-slate-600 group-hover:text-cyan-400/60 transition-colors">查看 →</span>
      </div>
    </div>
  );
}

function ReportDetail({ report, onBack, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft size={14} />
          返回列表
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-600 tracking-wide">
            {report.source === 'manual' ? '手动编写' : '自动生成'}
          </span>
          <button
            onClick={() => onEdit(report)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
          >
            <Edit3 size={12} />
            编辑
          </button>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 size={12} />
              删除
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={() => { onDelete(report.id); setConfirmDelete(false); }}
                className="px-3 py-1.5 rounded-lg text-xs text-rose-400 bg-rose-500/15 border border-rose-500/25 hover:bg-rose-500/25 transition-colors"
              >
                确认删除
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                取消
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Date title */}
      <div className="flex items-center gap-2">
        <Calendar size={16} className="text-slate-500" />
        <h3 className="text-lg font-bold text-white/80">{formatDate(report.date)} 日报</h3>
      </div>

      {/* Content */}
      <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
        <div className="prose prose-invert prose-sm max-w-none
          prose-headings:text-white/80 prose-headings:font-semibold
          prose-p:text-slate-300 prose-p:leading-relaxed
          prose-li:text-slate-300
          prose-strong:text-white/70
          prose-table:border-collapse prose-th:border prose-th:border-white/[0.08] prose-th:px-3 prose-th:py-1.5 prose-th:text-white/60 prose-th:text-xs
          prose-td:border prose-td:border-white/[0.06] prose-td:px-3 prose-td:py-1.5 prose-td:text-slate-300 prose-td:text-xs
          prose-hr:border-white/[0.06]
          prose-code:text-cyan-400/80
          [&_blockquote]:border-l-2 [&_blockquote]:border-cyan-500/30 [&_blockquote]:pl-4 [&_blockquote]:text-slate-400
        ">
          <ReactMarkdown>{report.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function ReportEditor({ initialDate, initialContent, onSave, onCancel, saving }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(initialDate || today);
  const [content, setContent] = useState(initialContent || '');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft size={14} />
          取消
        </button>
        <span className="text-[10px] text-cyan-400/60 tracking-wide">编写日报</span>
      </div>

      <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">日期</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            max={today}
            className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/80 text-sm focus:outline-none focus:border-cyan-500/30 focus:bg-white/[0.06] transition-colors"
            style={{ colorScheme: 'dark' }}
          />
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1.5">
            内容 <span className="text-slate-600">(支持 Markdown)</span>
          </label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="## 今日完成&#10;&#10;- 活动1&#10;- 活动2&#10;&#10;## 今日感悟&#10;&#10;..."
            rows={14}
            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/80 text-sm focus:outline-none focus:border-cyan-500/30 focus:bg-white/[0.06] transition-colors resize-y placeholder:text-slate-600"
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => onSave(date, content)}
            disabled={!date || !content.trim() || saving}
            className="px-5 py-2 rounded-xl text-xs bg-cyan-500/15 border border-cyan-500/25 text-cyan-400 hover:bg-cyan-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? '保存中...' : '保存日报'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DailyReportsPage() {
  const { reports, loading, fetchReports, getReport, createReport, updateReport, deleteReport, generateReport } = useDailyReports();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState('list'); // 'list' | 'detail' | 'edit' | 'create'
  const [selectedReport, setSelectedReport] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const today = new Date().toISOString().slice(0, 10);

  // Check URL param for report id on mount
  useEffect(() => {
    const reportId = searchParams.get('id');
    if (reportId && reports.length > 0) {
      const found = reports.find(r => String(r.id) === reportId);
      if (found) {
        handleView(found);
      }
    }
  }, [reports, searchParams]);

  const handleView = async (report) => {
    try {
      const full = await getReport(report.id);
      setSelectedReport(full);
      setView('detail');
      setSearchParams({ id: String(report.id) });
    } catch (err) {
      toast.error('加载日报失败');
    }
  };

  const handleBack = () => {
    setView('list');
    setSelectedReport(null);
    setSearchParams({});
  };

  const handleCreate = () => {
    setSelectedReport(null);
    setView('create');
  };

  const handleGenerate = async () => {
    try {
      await generateReport(today);
      toast.success('今日日报已生成');
    } catch (err) {
      const msg = err.message || '生成失败';
      if (msg.includes('手动日报')) {
        toast.error('今天已有手动日报，请先删除后再生成');
      } else {
        toast.error('生成日报失败');
      }
    }
  };

  const handleEdit = (report) => {
    setSelectedReport(report);
    setView('edit');
  };

  const handleSaveCreate = async (date, content) => {
    setSaving(true);
    try {
      await createReport(date, content);
      toast.success('日报已保存');
      handleBack();
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('已有日报')) {
        toast.error(`${date} 已有日报记录`);
      } else {
        toast.error('保存失败');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (date, content) => {
    setSaving(true);
    try {
      await updateReport(selectedReport.id, content);
      toast.success('日报已更新');
      const full = await getReport(selectedReport.id);
      setSelectedReport(full);
      setView('detail');
    } catch (err) {
      toast.error('更新失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteReport(id);
      toast.success('日报已删除');
      handleBack();
    } catch (err) {
      toast.error('删除失败');
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        <h2 className="text-xl font-bold text-white/80 tracking-tight">日报</h2>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-white/[0.03] rounded-2xl animate-pulse border border-white/[0.05]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Title — only show in list view */}
      {view === 'list' && (
        <div>
          <h2 className="text-2xl font-bold text-white/85 tracking-[0.2em]" style={{ fontFamily: 'Orbitron, sans-serif' }}>日报</h2>
          <p className="text-[10px] text-slate-500 tracking-[0.3em] uppercase mt-1 font-mono">DAILY REPORTS</p>
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <>
          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm hover:bg-cyan-500/20 transition-colors"
            >
              <Plus size={15} />
              写日报
            </button>
            <button
              onClick={handleGenerate}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm hover:bg-violet-500/20 transition-colors"
            >
              <Sparkles size={15} />
              生成今日日报
            </button>
          </div>

          {/* Report list */}
          {reports.length === 0 ? (
            <EmptyState onCreate={handleCreate} onGenerate={handleGenerate} />
          ) : (
            <div className="space-y-3">
              {reports.map(report => (
                <ReportCard key={report.id} report={report} onView={handleView} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Detail view */}
      {view === 'detail' && selectedReport && (
        <ReportDetail
          report={selectedReport}
          onBack={handleBack}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Edit view */}
      {view === 'edit' && selectedReport && (
        <ReportEditor
          initialDate={selectedReport.date}
          initialContent={selectedReport.content}
          onSave={handleSaveEdit}
          onCancel={() => { setView('detail'); }}
          saving={saving}
        />
      )}

      {/* Create view */}
      {view === 'create' && (
        <ReportEditor
          initialDate={today}
          initialContent=""
          onSave={handleSaveCreate}
          onCancel={handleBack}
          saving={saving}
        />
      )}
    </div>
  );
}
