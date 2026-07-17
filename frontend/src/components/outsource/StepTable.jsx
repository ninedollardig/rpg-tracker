import { Plus, Trash2, Clock } from 'lucide-react';

function shortTitle(title) {
  if (!title) return '未命名';
  return title.length > 10 ? title.slice(0, 10) + '…' : title;
}

export default function StepTable({ steps, onChange }) {
  const updateStep = (index, field, value) => {
    const newSteps = steps.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    );
    onChange(newSteps);
  };

  const removeStep = (index) => {
    const newSteps = steps.filter((_, i) => i !== index).map((s, i) => ({
      ...s,
      step_order: i + 1,
    }));
    onChange(newSteps);
  };

  const addStep = () => {
    onChange([
      ...steps,
      {
        step_order: steps.length + 1,
        title: '',
        estimated_minutes: 20,
        trigger_time: '',
        reminder_time: '09:00',
        description: '',
      },
    ]);
  };

  const totalMinutes = steps.reduce((sum, s) => sum + (parseInt(s.estimated_minutes) || 0), 0);

  if (steps.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-600 text-center py-6">暂无步骤</p>
        <button
          onClick={addStep}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-400 transition-colors"
        >
          <Plus size={13} />
          添加步骤
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {steps.map((step, i) => (
          <div
            key={i}
            className="group bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden hover:border-white/[0.10] transition-all"
          >
            {/* Card header: step number + short title */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.04]">
              <span className="text-[10px] font-bold w-5 h-5 rounded flex items-center justify-center bg-cyan-500/10 text-cyan-400 shrink-0">
                {step.step_order || i + 1}
              </span>
              <input
                type="text"
                value={step.title}
                onChange={e => updateStep(i, 'title', e.target.value)}
                placeholder="动作描述"
                className="flex-1 bg-transparent text-xs text-white/80 placeholder:text-slate-600 outline-none"
              />
              <button
                onClick={() => removeStep(i)}
                className="text-slate-700 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
              >
                <Trash2 size={12} />
              </button>
            </div>

            {/* Explanation rectangle */}
            <div className="px-4 py-3">
              <p className="text-[11px] text-slate-500 leading-relaxed mb-2">
                {step.description || step.title || '无额外说明'}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-slate-600">
                <Clock size={10} />
                <span>{step.estimated_minutes || 20} 分钟</span>
                {step.reminder_time && (
                  <>
                    <span className="text-slate-700">·</span>
                    <span>{step.reminder_time}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={addStep}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-400 transition-colors"
        >
          <Plus size={13} />
          添加步骤
        </button>
        <span className="text-[11px] text-slate-600">
          合计约 {totalMinutes} 分钟
        </span>
      </div>
    </div>
  );
}
