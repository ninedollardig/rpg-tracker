import { useState } from 'react';
import { ArrowRight, ArrowLeft, Send, Check } from 'lucide-react';
import STEPS from './taskSteps';
import TaskInputLoading from './TaskInputLoading';

export default function TaskInput({ onSubmit, loading }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [customDate, setCustomDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  const setAnswer = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const canNext = () => {
    const val = answers[current.key];
    if (current.type === 'text' || current.type === 'textarea') {
      return val && val.trim().length > 0;
    }
    if (current.key === 'deadline' && val === 'custom') {
      return !!customDate;
    }
    return !!val;
  };

  const handleSubmitForm = () => {
    setAnswers(prev => {
      const payload = { ...prev };
      if (payload.deadline === 'custom') payload.deadline = customDate;
      setSubmitted(true);
      onSubmit(payload);
      return prev;
    });
  };

  const handleNext = () => {
    if (!canNext()) return;
    if (isLast) {
      handleSubmitForm();
    } else {
      if (current.key === 'deadline' && answers.deadline === 'custom') {
        setShowDatePicker(false);
      }
      setStep(s => s + 1);
    }
  };

  const handlePrev = () => setStep(s => Math.max(0, s - 1));

  const handleRadio = (key, value) => {
    setAnswer(key, value);
    if (key === 'deadline' && value === 'custom') {
      setShowDatePicker(true);
      return;
    }
    if (key === 'deadline' && value !== 'custom') {
      setShowDatePicker(false);
    }
    if (!isLast) {
      setTimeout(() => setStep(s => s + 1), 200);
    }
  };

  const progressPct = ((step + 1) / STEPS.length) * 100;

  if (submitted && loading) {
    return <TaskInputLoading />;
  }

  return (
    <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden transition-all duration-300">
      {/* Progress bar */}
      <div className="h-0.5 bg-white/[0.04]">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-500 ease-out rounded-r-full"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="p-6 sm:p-8">
        {/* Step cards row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-8">
          {STEPS.map((s, i) => {
            const isCurrent = i === step;
            const isPast = i < step;
            return (
              <button
                key={s.key}
                onClick={() => { if (isPast || answers[s.key]) setStep(i); }}
                className={`text-left rounded-xl p-3 transition-all duration-200 cursor-pointer ${
                  isCurrent
                    ? 'bg-cyan-500/8 border border-cyan-500/15 shadow-[0_0_12px_rgba(0,229,255,0.1)]'
                    : isPast
                    ? 'bg-white/[0.02] border border-white/[0.04] opacity-60 hover:opacity-80'
                    : 'bg-white/[0.01] border border-white/[0.03] opacity-40'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className={`text-[10px] font-bold w-4 h-4 rounded flex items-center justify-center ${
                      isCurrent
                        ? 'bg-cyan-500/10 text-cyan-400'
                        : isPast
                        ? 'bg-cyan-500/8 text-cyan-400/60'
                        : 'bg-white/[0.04] text-slate-600'
                    }`}
                  >
                    {isPast ? <Check size={9} /> : i + 1}
                  </span>
                  <span
                    className={`text-[11px] font-semibold ${
                      isCurrent ? 'text-cyan-400' : 'text-slate-500'
                    }`}
                  >
                    {s.shortTitle}
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed">{s.explain}</p>
              </button>
            );
          })}
        </div>

        {/* Current question */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white/90 mb-1">{current.title}</h3>
          <p className="text-sm text-slate-500">{current.subtitle}</p>
        </div>

        {/* Input area */}
        <div className="min-h-[120px]">
          {(current.type === 'text' || current.type === 'textarea') && (
            <div className="space-y-4">
              {current.type === 'text' ? (
                <input
                  type="text"
                  value={answers[current.key] || ''}
                  onChange={e => setAnswer(current.key, e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleNext(); }}
                  placeholder={current.placeholder}
                  autoFocus
                  className="w-full bg-transparent border-0 border-b border-white/[0.08] focus:border-cyan-500/30 px-1 py-3 text-lg text-white/90 placeholder:text-slate-600 outline-none transition-colors"
                />
              ) : (
                <textarea
                  value={answers[current.key] || ''}
                  onChange={e => setAnswer(current.key, e.target.value)}
                  placeholder={current.placeholder}
                  autoFocus
                  rows={4}
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-500/20 focus:shadow-[0_0_0_3px_rgba(0,229,255,0.08)] resize-none transition-all"
                />
              )}
              <button
                onClick={handleNext}
                disabled={!canNext()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-500/8 border border-cyan-500/15 rounded-xl text-sm text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              >
                继续 <ArrowRight size={15} />
              </button>
            </div>
          )}

          {current.type === 'radio' && (
            <div className="space-y-2">
              {current.options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleRadio(current.key, opt.value)}
                  className={`w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 ${
                    answers[current.key] === opt.value
                      ? 'border-cyan-500/20 bg-cyan-500/[0.04] shadow-[0_0_20px_rgba(0,229,255,0.06)]'
                      : 'border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${
                      answers[current.key] === opt.value ? 'text-cyan-400' : 'text-slate-300'
                    }`}>
                      {opt.label}
                    </span>
                    {answers[current.key] === opt.value && (
                      <Check size={16} className="text-cyan-400" />
                    )}
                  </div>
                  {opt.desc && (
                    <span className="text-[12px] text-slate-500 mt-0.5 block">{opt.desc}</span>
                  )}
                </button>
              ))}

              {current.key === 'deadline' && showDatePicker && (
                <div className="pt-3 pl-2">
                  <input
                    type="date"
                    value={customDate}
                    onChange={e => { setCustomDate(e.target.value); setAnswer('deadline', 'custom'); }}
                    className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500/20"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-white/[0.05]">
          {!isFirst ? (
            <button
              onClick={handlePrev}
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              <ArrowLeft size={14} /> 上一步
            </button>
          ) : (
            <div />
          )}

          {isLast && answers.remind_mode && (
            <button
              onClick={handleSubmitForm}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-cyan-500/10 border border-cyan-500/15 rounded-xl text-sm font-medium text-cyan-400 hover:bg-cyan-500/15 hover:shadow-[0_0_24px_rgba(0,229,255,0.15)] transition-all"
            >
              <Send size={15} />
              提交拆解
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
