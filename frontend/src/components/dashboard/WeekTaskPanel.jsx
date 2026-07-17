import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { todayWeekday } from './weekTaskConfig';
import CategoryScoreBar from './CategoryScoreBar';
import TaskItem from './TaskItem';
import AddTaskModal from './AddTaskModal';
import { useViewMode } from '../../context/ViewModeContext';

const CAT_COLORS = {
  '生活': 'text-red-400/60',
  '学习': 'text-blue-400/60',
  '娱乐': 'text-pink-400/60',
  '休息': 'text-emerald-400/60',
};

export default function WeekTaskPanel({
  tasksByDay, templates, categoryScores, WEEKDAYS,
  weekInfo, leftoverTasks,
  addTask, updateTask, toggleTask, deleteTask,
}) {
  const [dialogDay, setDialogDay] = useState(null);
  const today = todayWeekday();

  const handleAdd = async ({ category, subcategory, content, score }) => {
    try {
      await addTask(dialogDay, category, subcategory, content, score);
      toast.success('任务已添加');
    } catch {
      toast.error('添加失败');
    }
    setDialogDay(null);
  };

  const handleUpdate = (task) => async (data) => {
    try {
      await updateTask(task.id, data);
      toast.success(data.score !== undefined ? `分数已改为 ${data.score}` : '已更新');
    } catch {
      toast.error('更新失败');
    }
  };

  const handleToggle = (task) => async () => {
    try {
      const result = await toggleTask(task.id);
      if (result?.crit) {
        toast.success(
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-amber-400">⚡ 暴击！EXP ×2</span>
            <span className="text-xs text-slate-400">+{result.expDelta} EXP</span>
          </div>,
          { duration: 3500 }
        );
      }
      if (result?.titleDrop) {
        toast(
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-violet-400">🏅 获得称号</span>
            <span className="text-sm text-white/80">{result.titleDrop}</span>
          </div>,
          { duration: 5000 }
        );
      }
    } catch { toast.error('操作失败'); }
  };

  const handleDelete = (task) => async () => {
    try {
      await deleteTask(task.id);
      toast.success('已删除');
    } catch {
      toast.error('删除失败');
    }
  };

  const handleLeftoverToggle = (task) => async () => {
    try {
      const result = await toggleTask(task.id);
      if (result?.crit) {
        toast.success(
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-amber-400">⚡ 暴击！EXP ×2</span>
            <span className="text-xs text-slate-400">补签·+{result.expDelta} EXP</span>
          </div>,
          { duration: 3500 }
        );
      }
      if (result?.titleDrop) {
        toast(
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-violet-400">🏅 获得称号</span>
            <span className="text-sm text-white/80">{result.titleDrop}</span>
          </div>,
          { duration: 5000 }
        );
      }
    } catch { toast.error('操作失败'); }
  };

  const { viewMode } = useViewMode();
  const isMobile = viewMode === 'mobile';

  return (
    <>
    <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline gap-2">
          <h3 className="text-sm font-semibold text-white/80 tracking-wide">本周修炼</h3>
          {weekInfo && (
            <span className="text-xs text-slate-500">
              · {weekInfo.month}月 第{weekInfo.weekOfMonth}周
            </span>
          )}
        </div>
        <CategoryScoreBar categoryScores={categoryScores} />
      </div>

      <div className={isMobile ? 'flex gap-2 overflow-x-auto pb-2 -mx-1 px-1' : 'grid grid-cols-7 gap-2'}>
        {WEEKDAYS.map((name, i) => (
          <div key={i} className={isMobile ? 'flex flex-col shrink-0 w-[120px]' : 'flex flex-col min-h-0'}>
            <div
              className={`text-center text-xs font-medium py-1.5 mb-2 tracking-wide rounded-lg transition-colors ${
                i === today
                  ? 'bg-cyan-500/8 text-cyan-400 border border-cyan-500/15'
                  : 'bg-white/[0.02] text-slate-500 border border-white/[0.04]'
              }`}
            >
              {name}
            </div>

            <div className={isMobile ? 'space-y-1.5 flex-1' : 'space-y-1 flex-1'}>
              {(tasksByDay[i] || []).map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={handleToggle(task)}
                  onUpdate={handleUpdate(task)}
                  onDelete={handleDelete(task)}
                  mobile={isMobile}
                />
              ))}
            </div>

            <button
              onClick={() => setDialogDay(i)}
              className="mt-1.5 flex items-center justify-center gap-1 text-xs text-slate-600 hover:text-cyan-400 transition-colors py-1 rounded-lg hover:bg-white/[0.02]"
            >
              <Plus size={11} />
            </button>
          </div>
        ))}
      </div>

      {leftoverTasks && leftoverTasks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/[0.04]">
          <p className="text-xs text-slate-500 mb-2 tracking-wide">上周遗留</p>
          <div className="space-y-1">
            {leftoverTasks.map(task => (
              <div
                key={task.id}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.05]"
              >
                <span className="text-[10px] font-medium text-slate-500">
                  {task.category}
                </span>
                <span className="text-xs text-slate-500">{task.content}</span>
                <span className="ml-auto text-[10px] text-slate-600 mr-1">{task.score}分</span>
                <button
                  onClick={handleLeftoverToggle(task)}
                  className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-[10px] text-slate-600 hover:text-cyan-400 hover:bg-cyan-500/8 border border-white/[0.04] hover:border-cyan-500/20 transition-colors"
                  title="完成"
                >
                  ✓
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {dialogDay !== null && (
        <AddTaskModal
          weekday={WEEKDAYS[dialogDay]}
          templates={templates}
          onAdd={handleAdd}
          onClose={() => setDialogDay(null)}
        />
      )}
    </div>
    </>
  );
}
