import { useNavigate } from 'react-router-dom';
import { Sword, Activity, Trophy, Target, BarChart3, Send, User, GraduationCap, Newspaper, LogOut, Flame, HelpCircle, Sun, Moon } from 'lucide-react';
import { useCharacterContext } from '../../context/CharacterContext';
import { useAuth } from '../../context/AuthContext';
import { useViewMode } from '../../context/ViewModeContext';
import useSound from '../../hooks/useSound';
import { useTheme } from '../../context/ThemeContext';
import { getStreakFlame } from '../../lib/streak';

const navItems = [
  { to: '/', label: '角色面板', icon: Sword, color: 'text-cyan-400', bg: 'bg-cyan-500/8', border: 'border-cyan-500/15', desc: '查看角色等级、属性、签到和每日运势' },
  { to: '/activities', label: '活动记录', icon: Activity, color: 'text-violet-400', bg: 'bg-violet-500/8', border: 'border-violet-500/15', desc: '记录日常活动，完成任务获得经验值' },
  { to: '/achievements', label: '成就徽章', icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/8', border: 'border-amber-500/15', desc: '达成条件解锁徽章，佩戴展示你的成就' },
  { to: '/quests', label: '任务', icon: Target, color: 'text-rose-400', bg: 'bg-rose-500/8', border: 'border-rose-500/15', desc: '每日/每周任务，完成后获得 EXP 奖励' },
  { to: '/outsource', label: '庶务外包', icon: Send, color: 'text-emerald-400', bg: 'bg-emerald-500/8', border: 'border-emerald-500/15', desc: 'AI 帮你将复杂任务拆解为可执行的步骤' },
  { to: '/study', label: '期末复习', icon: GraduationCap, color: 'text-sky-400', bg: 'bg-sky-500/8', border: 'border-sky-500/15', desc: '三步学习法：结构化笔记→深度加工→间隔重复' },
  { to: '/stats', label: '数据统计', icon: BarChart3, color: 'text-orange-400', bg: 'bg-orange-500/8', border: 'border-orange-500/15', desc: '活动数据的可视化统计与分析图表' },
  { to: '/daily-reports', label: '日报', icon: Newspaper, color: 'text-pink-400', bg: 'bg-pink-500/8', border: 'border-pink-500/15', desc: '每日总结反思，自动或手动生成日报' },
  { to: '/profile', label: '我的', icon: User, color: 'text-indigo-400', bg: 'bg-indigo-500/8', border: 'border-indigo-500/15', desc: 'API Key、模型选择、飞书、自我画像等设置' },
  { to: '/guide', label: '新手指引', icon: HelpCircle, color: 'text-amber-400', bg: 'bg-amber-500/8', border: 'border-amber-500/15', desc: '详细功能说明：输入→逻辑→输出' },
];

export default function MobileHome() {
  const { character } = useCharacterContext();
  const { logout } = useAuth();
  const { goMobilePage } = useViewMode();
  const { theme, toggleTheme } = useTheme();
  const { playSound } = useSound();
  const navigate = useNavigate();

  const streakFlame = getStreakFlame(character?.streak_days || 0);

  const handleNav = (to) => {
    navigate(to);
    goMobilePage(to);
  };

  const handleLogout = () => {
    playSound('click');
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full bg-[var(--glass-bg)]">
      {/* Header */}
      <div className="px-5 pt-8 pb-4 text-center relative">
        {/* Theme toggle — top-right */}
        <button
          onClick={toggleTheme}
          className={`absolute top-8 right-5 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all duration-300 ${
            theme === 'dark'
              ? 'text-amber-400/70 hover:text-amber-300 hover:bg-amber-500/8'
              : 'text-slate-500 hover:text-slate-600 hover:bg-slate-500/8'
          }`}
        >
          {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          <span className="tracking-wider font-mono">{theme === 'dark' ? '浅色' : '深色'}</span>
        </button>
        <div className="flex justify-center mb-3">
          <svg viewBox="0 0 88 88" className="w-12 h-12">
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
        <h1 className="text-lg font-bold tracking-tight text-white/90">数值进化系统</h1>
        <p className="text-[9px] text-slate-600 tracking-[0.2em] mt-1 font-mono">NUMERIC EVOLUTION</p>
      </div>

      {/* Stats strip */}
      {character && (
        <div className="mx-5 mb-4 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex justify-between items-center">
          <div>
            <span className="text-[10px] text-slate-600">总修为</span>
            <p className="text-sm text-cyan-400 font-bold">{character.total_exp?.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-600">连续修炼</span>
            <p className="text-sm text-violet-400 font-bold flex items-center justify-end gap-1">
              {streakFlame && <Flame size={streakFlame.size} className={streakFlame.className || ''} />}
              {character.streak_days} 天
            </p>
          </div>
        </div>
      )}

      {/* Nav grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-3 gap-3">
          {navItems.map(item => (
            <button
              key={item.to}
              onClick={() => handleNav(item.to)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all duration-200 active:scale-95
                ${item.bg} ${item.border} hover:brightness-125`}
            >
              <item.icon size={22} className={item.color} />
              <span className="text-xs text-slate-300 font-medium">{item.label}</span>
              <span className="text-[9px] text-slate-600 leading-tight text-center">{item.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center justify-center gap-2 py-4 text-xs text-slate-600 hover:text-rose-400 transition-colors border-t border-white/[0.05]"
      >
        <LogOut size={13} />
        <span>退出登录</span>
      </button>
    </div>
  );
}
