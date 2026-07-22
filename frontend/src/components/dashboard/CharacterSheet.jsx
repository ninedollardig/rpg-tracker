import { useNavigate } from 'react-router-dom';
import { useCharacterContext } from '../../context/CharacterContext';
import LevelBadge from './LevelBadge';
import ExpBar from './ExpBar';
import StatRow from './StatRow';
import StatBreakdown from './StatBreakdown';

export default function CharacterSheet({ character, loading }) {
  const navigate = useNavigate();
  const { triggerLevelUp } = useCharacterContext();
  if (loading || !character) {
    return (
      <div className="backdrop-blur-xl rounded-2xl p-6 animate-pulse border"
        style={{ background: 'var(--card-character)', borderColor: 'var(--card-character-border)' }}>
        <div className="h-20 w-20 bg-white/[0.04] rounded-full mx-auto" />
        <div className="h-4 bg-white/[0.04] rounded mt-4 mx-auto w-24" />
        <div className="h-3 bg-white/[0.04] rounded mt-4" />
        <div className="h-6 bg-white/[0.04] rounded mt-2" />
      </div>
    );
  }

  const statEntries = [
    { key: 'strength', value: character.stats.strength },
    { key: 'intelligence', value: character.stats.intelligence },
    { key: 'vitality', value: character.stats.vitality },
    { key: 'agility', value: character.stats.agility },
    { key: 'wisdom', value: character.stats.wisdom },
    { key: 'mood', value: character.stats.mood },
  ];

  return (
    <div className="backdrop-blur-xl rounded-2xl p-6 border"
      style={{ background: 'var(--card-character)', borderColor: 'var(--card-character-border)' }}>
      {/* Level + equipped badge ornament */}
      <LevelBadge
        level={character.level}
        title={character.title}
        equippedBadge={character.equipped_badge || null}
        onClick={triggerLevelUp}
      />

      <div className="text-center mt-1 mb-5">
        <p className="text-base font-semibold text-indigo-100/80 tracking-wide">
          {character.name}
        </p>
      </div>

      {/* EXP Bar */}
      <ExpBar
        current={character.current_exp}
        max={character.exp_to_next}
        percentage={character.percentage}
      />

      {/* Section divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <span className="text-[10px] text-slate-600 tracking-widest">属性</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* Stats */}
      <div className="space-y-0.5">
        {statEntries.map(s => (
          <StatRow key={s.key} stat={s} />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <div className="flex justify-between text-xs">
        <span className="text-slate-500">
          总修为 <span className="text-cyan-400 font-semibold ml-1">{character.total_exp?.toLocaleString()}</span>
        </span>
        <button
          onClick={() => navigate('/stats')}
          title="查看连续修炼详情"
          className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer group"
        >
          连续修炼 <span className="text-rose-400 font-semibold ml-1 group-hover:text-rose-300 transition-colors">{character.streak_days} 天</span>
        </button>
      </div>

      <StatBreakdown statDetail={character.stat_detail} />
    </div>
  );
}
