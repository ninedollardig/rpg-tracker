import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { apiGet, apiPost } from '../../api/client';
import { getStreakFlame } from '../../lib/streak';
import TitleUnlockEffect from '../effects/TitleUnlockEffect';

export default function DailyCheckin() {
  const [checkin, setCheckin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();
  const [newTitle, setNewTitle] = useState(null);
  const streakFlame = getStreakFlame(checkin?.streak || 0);

  const fetchStatus = async () => {
    try {
      const d = await apiGet('/checkin');
      setCheckin(d);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleCheckin = async () => {
    setChecking(true);
    try {
      const result = await apiPost('/checkin', {});
      setCheckin({ checked_in: true, ...result });
      if (result.conditional_titles?.length) {
        setNewTitle(result.conditional_titles[0]);
      }
      toast.success(
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold">签到成功！连胜 {result.streak} 天 🔥</span>
          <span className="text-xs text-slate-400">EXP +{result.exp_earned}</span>
        </div>,
        { duration: 3000 }
      );
    } catch (e) {
      toast.error(e.message || '签到失败');
    } finally {
      setChecking(false);
    }
  };

  if (loading) return null;

  return (<>
    <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
      {checkin?.checked_in ? (
        /* Checked in — show streak + fortune */
        <div className="flex items-start gap-4">
          {/* Streak badge — click to view streak details */}
          <button
            onClick={() => navigate('/stats')}
            title="查看连续修炼详情"
            className="shrink-0 flex flex-col items-center gap-1 group cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center group-hover:border-amber-500/50 group-hover:shadow-[0_0_12px_rgba(251,191,36,0.15)] transition-all duration-200">
              {streakFlame ? (
                <Flame size={streakFlame.size} className={streakFlame.className || 'text-amber-400'} />
              ) : (
                <Flame size={22} className="text-amber-400" />
              )}
            </div>
            <span className="text-[10px] text-amber-400/80 font-semibold tracking-wider group-hover:text-amber-300 transition-colors">
              连胜 {checkin.streak} 天
              {streakFlame && (
                <span className="ml-0.5">{streakFlame.label}</span>
              )}
            </span>
          </button>

          {/* Fortune */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles size={13} className="text-cyan-400" />
              <span className="text-xs text-cyan-400/80 font-medium tracking-wide">今日运势</span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed italic">
              {checkin.fortune || '星盘静默，今日宜按自己的节奏前行。'}
            </p>
          </div>
        </div>
      ) : (
        /* Not checked in — show checkin button */
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/10 to-violet-500/20 border border-cyan-500/15 flex items-center justify-center">
              <Sparkles size={18} className="text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white/80">新的一天，冒险者</p>
              <p className="text-xs text-slate-500">
                签到获取运势预言 + EXP 奖励
                {checkin?.streak > 0 && (
                  <span className="text-amber-400/80 ml-1 inline-flex items-center gap-0.5">
                    {streakFlame && <Flame size={10} className={streakFlame.className || 'text-amber-400'} />}
                    （连胜 {checkin.streak} 天）
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleCheckin}
            disabled={checking}
            className="shrink-0 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-[0_0_30px_rgba(0,229,255,0.15)]"
          >
            {checking ? '签到中...' : '签 到'}
          </button>
        </div>
      )}
    </div>
    <TitleUnlockEffect
      show={!!newTitle}
      title={newTitle}
      onDone={() => setNewTitle(null)}
    />
  </>);
}
