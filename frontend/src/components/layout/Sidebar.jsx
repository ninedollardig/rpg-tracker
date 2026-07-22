import { NavLink, useNavigate } from 'react-router-dom';
import { Sword, Activity, Trophy, Target, BarChart3, LogOut, Send, User, Flame, GraduationCap, Newspaper, Smartphone, Monitor, HelpCircle } from 'lucide-react';
import { useCharacterContext } from '../../context/CharacterContext';
import { useAuth } from '../../context/AuthContext';
import { useViewMode } from '../../context/ViewModeContext';
import { useFloatingTooltip } from '../../components/ui/FloatingTooltip';
import { getStreakFlame } from '../../lib/streak';
import useSound from '../../hooks/useSound';

const navGroups = [
  {
    label: '核心',
    items: [
      { to: '/', label: '角色面板', icon: Sword, desc: '查看角色等级、属性、签到和每日运势' },
    ],
  },
  {
    label: '修炼',
    items: [
      { to: '/activities', label: '活动记录', icon: Activity, desc: '记录日常活动，完成任务获得经验值' },
      { to: '/achievements', label: '成就徽章', icon: Trophy, desc: '达成条件解锁徽章，佩戴展示你的成就' },
      { to: '/quests', label: '任务', icon: Target, desc: '每日/每周任务，完成后获得 EXP 奖励' },
    ],
  },
  {
    label: '工具',
    items: [
      { to: '/outsource', label: '庶务外包', icon: Send, desc: 'AI 帮你将复杂任务拆解为可执行的步骤' },
      { to: '/study', label: '期末复习', icon: GraduationCap, desc: '三步学习法：结构化笔记 → 深度加工 → 间隔重复' },
      { to: '/stats', label: '数据统计', icon: BarChart3, desc: '活动数据的可视化统计与分析图表' },
      { to: '/daily-reports', label: '日报', icon: Newspaper, desc: '每日总结反思，自动或手动生成日报' },
      { to: '/guide', label: '新手指引', icon: HelpCircle, desc: '详细功能说明：输入→逻辑→输出，附具体例子' },
    ],
  },
];

export default function Sidebar() {
  const { character } = useCharacterContext();
  const { logout } = useAuth();
  const { viewMode, toggleViewMode } = useViewMode();
  const { show, move, hide, TooltipOverlay } = useFloatingTooltip();
  const navigate = useNavigate();
  const { playSound } = useSound();

  const streakFlame = getStreakFlame(character?.streak_days || 0);

  const handleLogout = () => {
    playSound('click');
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-56 flex flex-col shrink-0 border-r border-white/[0.05] bg-[var(--sidebar-bg)] backdrop-blur-2xl">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        {/* Crystalline mark */}
        <div className="flex justify-center mb-3">
          <svg viewBox="0 0 88 88" className="w-10 h-10">
            <polygon points="44,6 74,26 44,46" fill="#030308" stroke="#0f1a2e" strokeWidth="0.8" />
            <polygon points="44,46 74,26 74,62" fill="#050510" stroke="#0f1a2e" strokeWidth="0.8" />
            <polygon points="44,46 74,62 44,82 14,62" fill="#060612" stroke="#0f1a2e" strokeWidth="0.8" />
            <polygon points="14,26 44,6 44,46 14,62" fill="#04040c" stroke="#0f1a2e" strokeWidth="0.8" />
            <polygon points="44,20 66,34 66,54 44,68 22,54 22,34" fill="#0a1420" stroke="#1e4a78" strokeWidth="1.4" />
            <polygon points="44,28 58,38 58,50 44,60 30,50 30,38" fill="#143058" stroke="#2a7ab8" strokeWidth="1.6" />
            <polygon points="44,34 52,40 52,48 44,54 36,48 36,40" fill="#1e4a78" stroke="#48b8ee" strokeWidth="1.8" />
            <circle cx="44" cy="44" r="2.5" fill="#88ddff" />
          </svg>
        </div>
        <h1 className="text-base font-bold tracking-tight text-white/90 text-center">
          数值进化系统
        </h1>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
          <span className="text-[9px] text-slate-600 tracking-[0.2em] shrink-0 font-mono">NUMERIC EVOLUTION</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto">
        {navGroups.map(group => (
          <div key={group.label} className="space-y-0.5">
            <p className="text-[10px] text-slate-600 font-mono tracking-[0.15em] px-3 mb-1">{group.label}</p>
            {group.items.map(item => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => playSound('pop')}>
                {({ isActive }) => (
                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-cyan-500/8 text-cyan-400 border border-cyan-500/15'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02] border border-transparent'
                    }`}
                    onMouseEnter={e => show(e, item.desc)}
                    onMouseMove={move}
                    onMouseLeave={hide}
                  >
                    <item.icon size={16} className={isActive ? 'opacity-100' : 'opacity-30'} />
                    <span>{item.label}</span>
                  </div>
                )}
              </NavLink>
            ))}
          </div>
        ))}

        {/* Profile — standalone above footer */}
        <div className="pt-2 border-t border-white/[0.04]">
          <NavLink to="/profile">
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-500/8 text-cyan-400 border border-cyan-500/15'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02] border border-transparent'
                }`}
                onMouseEnter={e => show(e, 'API Key、模型选择、飞书、自我画像等个人设置')}
                onMouseMove={move}
                onMouseLeave={hide}
              >
                <User size={16} className={isActive ? 'opacity-100' : 'opacity-30'} />
                <span>我的</span>
              </div>
            )}
          </NavLink>
        </div>
      </nav>

      {/* View Mode Toggle */}
      <div className="px-5 py-3 border-t border-white/[0.05]">
        <button
          onClick={toggleViewMode}
          className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl text-xs transition-all duration-200 ${
            viewMode === 'mobile'
              ? 'bg-emerald-500/8 text-emerald-400 border border-emerald-500/15'
              : 'text-slate-600 hover:text-slate-400 hover:bg-white/[0.02] border border-transparent'
          }`}
        >
          {viewMode === 'mobile' ? <Smartphone size={14} /> : <Monitor size={14} />}
          <div className="flex-1 text-left">
            <div className="text-[11px] leading-tight">{viewMode === 'mobile' ? '手机界面' : '桌面界面'}</div>
            <div className="text-[9px] text-slate-600 leading-tight">点击切换</div>
          </div>
          <div
            className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${
              viewMode === 'mobile' ? 'bg-emerald-500/30' : 'bg-white/[0.08]'
            }`}
          >
            <div
              className={`absolute top-0.5 w-3 h-3 rounded-full bg-white/80 transition-all duration-200 ${
                viewMode === 'mobile' ? 'left-[18px] bg-emerald-400' : 'left-0.5'
              }`}
            />
          </div>
        </button>
      </div>

      {/* Footer stats */}
      {character && (
        <div className="px-5 py-4 border-t border-white/[0.05] space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-600">总修为</span>
            <span className="text-cyan-400 font-semibold">{character.total_exp?.toLocaleString()}</span>
          </div>
          <button
            onClick={() => navigate('/')}
            title="前往签到"
            className="w-full flex justify-between items-center text-xs group cursor-pointer hover:bg-white/[0.02] rounded px-1 py-0.5 -mx-1 transition-colors"
          >
            <span className="text-slate-600 group-hover:text-slate-400 transition-colors">连续修炼</span>
            <span className="text-violet-400 font-semibold flex items-center gap-1">
              {streakFlame && (
                <Flame size={streakFlame.size} className={streakFlame.className || ''} />
              )}
              {character.streak_days} 天
              {streakFlame && (
                <span className="text-[10px] text-slate-500 ml-0.5">{streakFlame.label}</span>
              )}
            </span>
          </button>
        </div>
      )}

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-5 py-3 text-xs text-slate-600 hover:text-rose-400 transition-colors border-t border-white/[0.05]"
      >
        <LogOut size={13} />
        <span>退出</span>
      </button>
      {TooltipOverlay}
    </aside>
  );
}
