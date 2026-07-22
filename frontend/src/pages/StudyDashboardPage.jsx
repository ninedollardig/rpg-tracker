import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Plus, Trash2, Clock, ChevronRight } from 'lucide-react';
import { useStudy } from '../hooks/useStudy';
import { toast } from 'sonner';
import StudyMaterialInput from '../components/study/StudyMaterialInput';
import { STATUS_LABELS } from '../components/study/stepConfig';

const statusDot = { step1: 'bg-cyan-400', step2: 'bg-amber-400', step3: 'bg-violet-400', completed: 'bg-emerald-400' };

export default function StudyDashboardPage() {
  const navigate = useNavigate();
  const { sessions, loading, processing, fetchSessions, createSession, deleteSession } = useStudy();
  const [showNew, setShowNew] = useState(false);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleCreate = async (data) => {
    try {
      const result = await createSession(data);
      setShowNew(false);
      navigate(`/study/${result.session.id}`);
    } catch (e) {
      toast.error(e.message || '创建失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSession(id);
      toast.success('已删除');
    } catch (e) {
      toast.error('删除失败');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white/85 tracking-[0.2em]" style={{ fontFamily: 'Orbitron, sans-serif' }}>期末复习</h2>
          <p className="text-[10px] text-slate-500 tracking-[0.3em] uppercase mt-1 font-mono">3-STEP REVIEW SYSTEM</p>
        </div>
        <button onClick={() => setShowNew(!showNew)}
          className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-sm text-cyan-400 hover:bg-cyan-500/20 transition-all font-semibold">
          <Plus size={15} /> 新建复习
        </button>
      </div>

      {/* New session form */}
      {showNew && (
        <div className="border rounded-2xl p-6"
          style={{ background: 'var(--card-study)', borderColor: 'var(--card-study-border)' }}>
          <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
            <GraduationCap size={15} className="text-cyan-400" /> 新建复习会话
          </h3>
          <StudyMaterialInput onSubmit={handleCreate} loading={processing} />
        </div>
      )}

      {/* Session list */}
      {!loading && sessions.length === 0 && !processing && (
        <div className="text-center py-16">
          <GraduationCap size={40} className="text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">还没有复习会话</p>
          <p className="text-slate-500 text-xs mt-1">点击「新建复习」，粘贴学习材料开始</p>
        </div>
      )}

      {sessions.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-slate-600 font-mono tracking-wider uppercase">历史会话</p>
          {sessions.map(s => (
            <div key={s.id}
              onClick={() => navigate(`/study/${s.id}`)}
              className="flex items-center gap-4 px-5 py-4 border border-white/[0.06] rounded-xl
                bg-white/[0.01] hover:bg-white/[0.03] cursor-pointer transition-all group">
              {/* Status dot */}
              <span className={`w-2 h-2 rounded-full shrink-0 ${statusDot[s.status] || 'bg-slate-600'}`} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/70 whitespace-normal break-words">{s.title || '未命名'}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  {s.subject && <span className="text-[11px] text-slate-500">{s.subject}</span>}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusDot[s.status] ? 'bg-white/[0.03]' : ''}`}
                    style={{ color: s.status === 'step1' ? '#22d3ee' : s.status === 'step2' ? '#fbbf24' : s.status === 'step3' ? '#a78bfa' : '#34d399' }}>
                    {STATUS_LABELS[s.status] || s.status}
                  </span>
                </div>
              </div>

              {/* Time */}
              <span className="text-[10px] text-slate-600 shrink-0 flex items-center gap-1">
                <Clock size={10} /> {s.created_at?.slice(0, 10)}
              </span>

              {/* Delete */}
              <button onClick={e => { e.stopPropagation(); handleDelete(s.id); }}
                className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-400 transition-all shrink-0">
                <Trash2 size={14} />
              </button>

              <ChevronRight size={14} className="text-slate-700 shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
