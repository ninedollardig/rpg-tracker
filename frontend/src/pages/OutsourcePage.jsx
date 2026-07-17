import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { SendHorizontal, History, ChevronRight, Clock, Flag, Trash2, Sparkles, RefreshCw } from 'lucide-react';
import { useOutsource } from '../hooks/useOutsource';
import TaskInput from '../components/outsource/TaskInput';
import StepTable from '../components/outsource/StepTable';

const STATUS_LABELS = {
  draft: '草稿',
  decomposed: '已拆解',
  pushed: '已推送',
};

const STATUS_STYLE = {
  pushed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  decomposed: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  draft: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export default function OutsourcePage() {
  const {
    tasks, currentTask, loading, decomposing, error,
    fetchTasks, createTask, fetchTask, updateSteps, pushToFeishu, deleteTask,
    setCurrentTask,
  } = useOutsource();
  const [showResult, setShowResult] = useState(false);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    if (currentTask?.steps?.length > 0) {
      setShowResult(true);
    }
  }, [currentTask]);

  const handleSubmit = async (formData) => {
    try {
      setShowResult(false);
      const { task, deadline, priority, progress, bottleneck, resources, importance, remind_mode } = formData;
      await createTask(task, deadline, priority, { progress, bottleneck, resources, importance, remind_mode });
      toast.success('拆解完成，' + currentTask?.steps?.length + ' 个步骤');
      setFormKey(k => k + 1);
    } catch {
      // error handled in hook
    }
  };

  const handlePushToFeishu = async (id) => {
    try {
      await pushToFeishu(id);
      toast.success('已推送到飞书');
    } catch {
      toast.error('推送失败');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除这个任务？')) return;
    try {
      await deleteTask(id);
      toast.success('已删除');
    } catch {
      toast.error('删除失败');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="text-center pt-4 pb-2">
        <h2 className="text-2xl font-bold text-white/85 tracking-[0.2em] mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          庶务外包
        </h2>
        <p className="text-[10px] text-slate-500 tracking-[0.3em] uppercase font-mono">TASK DECOMPOSER</p>
      </div>

      {/* Questionnaire */}
      <TaskInput key={formKey} onSubmit={handleSubmit} loading={decomposing} />

      {/* AI Result */}
      {currentTask && currentTask.steps && currentTask.steps.length > 0 && (
        <div
          className={`bg-[#0a0a14] border border-white/[0.08] rounded-2xl overflow-hidden transition-all duration-500 ${
            showResult ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {/* Result header */}
          <div className="px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles size={15} className="text-cyan-400" />
                  <h3 className="text-white/80 font-semibold truncate">{currentTask.title}</h3>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {currentTask.deadline && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-white/[0.03] border border-white/[0.05] px-2 py-0.5 rounded">
                      <Clock size={10} />
                      {currentTask.deadline}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-white/[0.03] border border-white/[0.05] px-2 py-0.5 rounded">
                    <Flag size={10} />
                    {currentTask.priority || '普通'}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_STYLE[currentTask.status] || STATUS_STYLE.decomposed}`}>
                    {STATUS_LABELS[currentTask.status] || currentTask.status}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {currentTask.steps.length} 个步骤
                  </span>
                </div>
              </div>

              {currentTask.status !== 'pushed' && (
                <button
                  onClick={() => {
                    updateSteps(currentTask.id, currentTask.steps).then(() =>
                      handlePushToFeishu(currentTask.id)
                    );
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/15 rounded-lg text-sm hover:bg-cyan-500/15 hover:shadow-[0_0_20px_rgba(0,229,255,0.15)] shrink-0 transition-all"
                >
                  <SendHorizontal size={15} />
                  推送飞书
                </button>
              )}
            </div>
          </div>

          {/* Steps table */}
          <div className="px-6 py-4">
            <StepTable
              steps={currentTask.steps}
              onChange={(newSteps) => {
                setCurrentTask(prev => prev ? { ...prev, steps: newSteps } : prev);
              }}
            />
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-white/[0.06] flex items-center justify-between">
            <button
              onClick={() => {
                updateSteps(currentTask.id, currentTask.steps).then(() =>
                  toast.success('步骤已保存')
                );
              }}
              className="text-xs text-slate-500 hover:text-cyan-400 transition-colors"
            >
              保存编辑
            </button>
          </div>
        </div>
      )}

      {/* Raw response (collapsed by default) */}
      {currentTask?.raw_response && (
        <details className="bg-white/[0.02] border border-white/[0.06] rounded-2xl">
          <summary className="px-5 py-3 text-xs text-slate-500 cursor-pointer hover:text-slate-300 select-none">
            AI 完整拆解过程
          </summary>
          <div className="px-5 pb-4">
            <pre className="text-[11px] text-slate-400 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
              {currentTask.raw_response}
            </pre>
          </div>
        </details>
      )}

      {/* History */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h3 className="flex items-center gap-2 text-sm text-white/70 font-medium">
            <History size={16} className="text-slate-500" />
            历史记录
            {tasks.length > 0 && (
              <span className="text-[11px] text-slate-600 ml-1">({tasks.length})</span>
            )}
          </h3>
        </div>

        {tasks.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-slate-600">还没有外包记录</p>
            <p className="text-xs text-slate-700 mt-1">填写上方问卷开始第一个任务拆解</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {tasks.map(task => (
              <div
                key={task.id}
                onClick={() => fetchTask(task.id)}
                className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-all group ${
                  currentTask?.id === task.id
                    ? 'bg-cyan-500/[0.04]'
                    : 'hover:bg-white/[0.01]'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  task.status === 'pushed' ? 'bg-emerald-400' : 'bg-amber-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/70 truncate">{task.title}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-600">
                    <span>{task.created_at?.slice(0, 10)}</span>
                    <span>{task.step_count} 步骤</span>
                    <span className={`${task.status === 'pushed' ? 'text-emerald-400/70' : 'text-amber-400/70'}`}>
                      {STATUS_LABELS[task.status] || task.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleDelete(task.id);
                    }}
                    className="p-1.5 text-slate-600 hover:text-rose-400 transition-colors rounded"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <ChevronRight size={15} className="text-slate-600 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
