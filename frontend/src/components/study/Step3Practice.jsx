import { useState } from 'react';
import { RotateCw, Check, RefreshCw, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const diffLabel = { easy: '简单', medium: '中等', hard: '困难' };
const diffColor = { easy: 'bg-emerald-500/10 text-emerald-400', medium: 'bg-amber-500/10 text-amber-400', hard: 'bg-rose-500/10 text-rose-400' };

function FlipCard({ card, onReview }) {
  const [flipped, setFlipped] = useState(false);

  const handleFlip = () => {
    if (!flipped) setFlipped(true);
  };

  return (
    <div className="border border-white/[0.06] rounded-xl overflow-hidden">
      {/* Front */}
      <div onClick={handleFlip}
        className={`px-5 py-4 cursor-pointer transition-all ${!flipped ? 'hover:bg-white/[0.03]' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${diffColor[card.difficulty]}`}>
            {diffLabel[card.difficulty]}
          </span>
          {card.review_count > 0 && (
            <span className="text-[10px] text-slate-600">已复习 {card.review_count} 次</span>
          )}
        </div>
        <p className="text-sm text-white/70 leading-relaxed">{card.question}</p>
        {!flipped && (
          <p className="text-[10px] text-slate-600 mt-3 italic">点击翻转查看答案</p>
        )}
      </div>

      {/* Back */}
      {flipped && (
        <div className="px-5 py-4 border-t border-white/[0.06] bg-white/[0.01]">
          <p className="text-xs text-slate-400 leading-relaxed">{card.answer}</p>

          <div className="flex items-center gap-2 mt-3">
            <button onClick={() => { onReview(card.id); setFlipped(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 hover:bg-emerald-500/20 transition-all">
              <Check size={12} /> 已掌握
            </button>
            <button onClick={() => setFlipped(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 hover:bg-amber-500/20 transition-all">
              <RefreshCw size={12} /> 再练一次
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Step3Practice({ sessionId, cards, onGenerate, onReview, onPush, generating }) {
  const [pushing, setPushing] = useState(false);

  const handlePush = async () => {
    setPushing(true);
    try {
      await onPush(sessionId);
      toast.success(`已推送 ${cards.length} 张卡片到飞书`);
    } catch (e) {
      toast.error(e.message || '推送失败');
    } finally {
      setPushing(false);
    }
  };

  const hasCards = cards.length > 0;
  const reviewed = cards.filter(c => c.review_count > 0).length;

  return (
    <div className="space-y-4">
      {/* Generate / stats */}
      <div className="flex items-center justify-between">
        <div>
          {hasCards ? (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-white/70 font-semibold">{cards.length} 道练习题</span>
              <span className="text-xs text-slate-500">已复习 {reviewed}/{cards.length}</span>
              <div className="w-24 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-violet-400 rounded-full transition-all"
                  style={{ width: `${cards.length > 0 ? (reviewed / cards.length) * 100 : 0}%` }} />
              </div>
            </div>
          ) : (
            <span className="text-sm text-slate-500">尚未生成练习题</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => onGenerate(sessionId)} disabled={generating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-30 transition-all font-medium">
            <Sparkles size={13} /> {hasCards ? '重新生成' : '生成练习题'}
          </button>
          {hasCards && (
            <button onClick={handlePush} disabled={pushing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-400 hover:bg-violet-500/20 disabled:opacity-30 transition-all font-medium">
              <Send size={13} /> {pushing ? '推送中...' : '推送到飞书'}
            </button>
          )}
        </div>
      </div>

      {/* Generating loading */}
      {generating && (
        <div className="flex items-center gap-2 py-8 justify-center">
          <div className="w-5 h-5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
          <span className="text-sm text-slate-500">AI 正在出题...</span>
        </div>
      )}

      {/* Card grid */}
      {hasCards && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {cards.map(card => (
            <FlipCard key={card.id} card={card} onReview={(cardId) => onReview(sessionId, cardId)} />
          ))}
        </div>
      )}
    </div>
  );
}
