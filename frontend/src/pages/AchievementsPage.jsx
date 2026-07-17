import { useAchievements } from '../hooks/useAchievements';
import { useCharacterContext } from '../context/CharacterContext';
import BadgeGrid from '../components/achievements/BadgeGrid';
import { toast } from 'sonner';

export default function AchievementsPage() {
  const { achievements, titles, loading, equippedBadgeId, equipBadge } = useAchievements();
  const { refetch: refetchChar } = useCharacterContext();

  const unlocked = achievements.filter(a => a.unlocked).length;
  const total = achievements.length;

  const handleEquip = async (achievementId) => {
    const result = await equipBadge(achievementId);
    await refetchChar();
    if (result.equipped_badge_id) {
      const badge = achievements.find(a => a.id === achievementId);
      toast.success(`已佩戴「${badge?.name_zh || ''}」`);
    }
    return result;
  };

  // All conditional titles with conditions
  const ALL_CONDITIONAL = [
    { name: '初出茅庐', cond: '完成任意 1 次活动或任务' },
    { name: '晨光行者', cond: '签到连续 ≥ 7 天' },
    { name: '永夜修士', cond: '累计完成 ≥ 50 个周任务' },
    { name: '钢铁纪律', cond: '连续 30 天签到' },
    { name: '全栈旅人', cond: '四项分类成就各 ≥ 5 个' },
    { name: '暴击猎手', cond: '累计获得 ≥ 3 个随机称号' },
    { name: '麒麟才子', cond: '学习类活动 ≥ 100 次' },
    { name: '禅心居士', cond: '休息类活动 ≥ 50 次' },
    { name: '逍遥散人', cond: '娱乐类活动 ≥ 100 次' },
    { name: '铁血战士', cond: '生活类活动 ≥ 100 次' },
    { name: '破界者', cond: '角色等级 ≥ 15' },
    { name: '星海旅人', cond: '解锁 ≥ 20 个成就' },
    { name: '黎明守望者', cond: '连续 7 天签到 + 每天 ≥ 3 项活动' },
  ];
  const unlockedTitles = new Set(titles.map(t => t.title));
  const randomTitles = titles.filter(t => !ALL_CONDITIONAL.some(c => c.name === t.title));

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-white/85 tracking-[0.2em]" style={{ fontFamily: 'Orbitron, sans-serif' }}>成就徽章</h2>
        <p className="text-[10px] text-slate-500 tracking-[0.3em] uppercase mt-1 font-mono">
          ACHIEVEMENTS · {unlocked}/{total} UNLOCKED
        </p>
      </div>

      {/* Titles — all conditional + random drops */}
      <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white/60 tracking-wide mb-3">
          称号收藏 · {titles.length} / {ALL_CONDITIONAL.length}
        </h3>

        {/* Conditional titles grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-3">
          {ALL_CONDITIONAL.map(c => {
            const owned = unlockedTitles.has(c.name);
            return (
              <div
                key={c.name}
                className={`text-xs px-3 py-2 rounded-lg border text-center transition-all ${
                  owned
                    ? 'text-violet-300/80 border-violet-500/25 bg-violet-500/[0.08]'
                    : 'text-slate-700 border-white/[0.04] bg-white/[0.01]'
                }`}
                title={c.cond}
              >
                <div className={owned ? 'font-semibold' : ''}>
                  {owned && <span className="text-[9px] mr-0.5">◆</span>}
                  {c.name}
                </div>
                <div className={`text-[9px] mt-0.5 ${owned ? 'text-violet-400/50' : 'text-slate-800'}`}>
                  {c.cond}
                </div>
              </div>
            );
          })}
        </div>

        {/* Random drops */}
        {randomTitles.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-px bg-white/[0.04]" />
              <span className="text-[10px] text-slate-600 font-mono">随机掉落</span>
              <div className="flex-1 h-px bg-white/[0.04]" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {randomTitles.map(t => (
                <span key={t.id} className="text-[11px] px-2.5 py-1 rounded-md text-amber-300/60 border border-amber-500/10 bg-amber-500/[0.03]">
                  {t.title}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      <BadgeGrid
        achievements={achievements}
        loading={loading}
        equippedBadgeId={equippedBadgeId}
        onEquip={handleEquip}
      />
    </div>
  );
}
