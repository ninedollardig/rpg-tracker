import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useStudy } from '../hooks/useStudy';
import { toast } from 'sonner';
import { STEPS } from '../components/study/stepConfig';
import StudyLoading from '../components/study/StudyLoading';
import StudyMaterialInput from '../components/study/StudyMaterialInput';
import Step1Result from '../components/study/Step1Result';
import Step2Tools from '../components/study/Step2Tools';
import Step3Practice from '../components/study/Step3Practice';
import ErrorBoundary from '../components/study/ErrorBoundary';

export default function StudyWorkbenchPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    currentSession, step1, insights, cards, loading, processing,
    fetchSession, createSession,
    runStep2Action, toggleSaveInsight, deleteInsight,
    generateCards, reviewCard, pushCards,
  } = useStudy();

  const [activeStep, setActiveStep] = useState('step1');

  useEffect(() => { fetchSession(id); }, [id, fetchSession]);

  // Auto-advance step when data is available
  useEffect(() => {
    if (currentSession?.status === 'step2' && step1) setActiveStep('step2');
    if (currentSession?.status === 'step3' || currentSession?.status === 'completed') setActiveStep('step3');
  }, [currentSession?.status, step1]);

  const handleCreate = async (data) => {
    // For re-processing Step 1 (rare, but supported)
    try {
      await createSession(data);
    } catch (e) {
      toast.error(e.message);
    }
  };

  useEffect(() => {
    if (!loading && !processing && !currentSession) navigate('/study', { replace: true });
  }, [loading, processing, currentSession, navigate]);

  if (loading) return <StudyLoading message="加载会话..." sub="" />;
  if (!currentSession) return null;

  const stepIdx = STEPS.findIndex(s => s.key === activeStep);
  const ActiveIcon = STEPS[stepIdx].icon;

  return (
    <ErrorBoundary>
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/study')}
          className="text-slate-600 hover:text-slate-400 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-white/85 truncate">{currentSession.title || '未命名复习'}</h2>
          {currentSession.subject && (
            <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{currentSession.subject}</p>
          )}
        </div>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => {
          const done = STEPS.findIndex(s2 => s2.key === (currentSession?.status || 'step1'));
          const isActive = s.key === activeStep;
          const isPast = i < stepIdx;
          const isDone = i < done || currentSession?.status === 'completed';

          return (
            <div key={s.key} className="flex items-center flex-1">
              <button onClick={() => setActiveStep(s.key)}
                className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400' :
                  isDone ? 'text-slate-300' : 'text-slate-600'
                }`}>
                <s.icon size={16} className={isDone ? 'text-emerald-400' : ''} />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight size={14} className="text-slate-700 shrink-0 mx-0.5" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step panels */}
      <div className="border border-white/[0.06] rounded-2xl p-6"
        style={{ background: 'rgba(10,10,18,0.5)' }}>
        <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
          <ActiveIcon size={15} className="text-cyan-400" />
          {STEPS[stepIdx].label}
          <span className="text-[11px] text-slate-600 font-normal">— {STEPS[stepIdx].desc}</span>
        </h3>

        {/* Step 1 */}
        {activeStep === 'step1' && (
          <ErrorBoundary>
            {step1 ? (
              <Step1Result data={step1} onContinue={() => setActiveStep('step2')} />
            ) : (
              <StudyMaterialInput onSubmit={handleCreate} loading={processing} />
            )}
          </ErrorBoundary>
        )}

        {/* Step 2 */}
        {activeStep === 'step2' && (
          <ErrorBoundary>
            {step1 ? (
              <Step2Tools
                sessionId={currentSession.id}
              insights={insights}
              onAction={async (sid, type, prompt) => {
                try { await runStep2Action(sid, type, prompt); }
                catch (e) { toast.error(e.message); }
              }}
              onToggleSave={toggleSaveInsight}
              onDelete={deleteInsight}
              onContinue={() => setActiveStep('step3')}
            />
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">请先完成第一步 AI 预处理</div>
          )}
          </ErrorBoundary>
        )}

        {/* Step 3 */}
        {activeStep === 'step3' && (
          <ErrorBoundary>
            <Step3Practice
              sessionId={currentSession.id}
              cards={cards}
              generating={processing}
              onGenerate={async (sid) => {
                try { await generateCards(sid); }
                catch (e) { toast.error(e.message); }
              }}
              onReview={async (sid, cid) => {
                try { await reviewCard(sid, cid); }
                catch (e) { toast.error(e.message); }
              }}
              onPush={pushCards}
            />
          </ErrorBoundary>
        )}
      </div>
    </div>
    </ErrorBoundary>
  );
}
