import { useState } from 'react';
import { toast } from 'sonner';
import BadgeSVG from './BadgeSVG';
import { useViewMode } from '../../context/ViewModeContext';

const TIER_LABELS = {
  common: '铜',
  rare: '银',
  epic: '金',
  legendary: '传说',
};

const TIER_BORDER = {
  common: 'border-amber-700/30',
  rare: 'border-slate-400/30',
  epic: 'border-yellow-500/30',
  legendary: 'border-cyan-400/40',
};

const CAT_COLORS = {
  '生活': '#f87171',
  '学习': '#60a5fa',
  '娱乐': '#f472b6',
  '休息': '#34d399',
};

export default function BadgeGrid({ achievements, loading, equippedBadgeId, onEquip }) {
  const [equipping, setEquipping] = useState(null);
  const { viewMode } = useViewMode();
  const isMobile = viewMode === 'mobile';

  // Group by tier
  const tiers = { legendary: [], epic: [], rare: [], common: [] };
  for (const ach of achievements) {
    if (tiers[ach.tier]) tiers[ach.tier].push(ach);
  }

  if (loading) {
    return (
      <div className={`grid ${isMobile ? 'grid-cols-3 gap-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'}`}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className={`${isMobile ? 'h-28' : 'h-44'} bg-white/[0.03] rounded-2xl animate-pulse border border-white/[0.05]`} />
        ))}
      </div>
    );
  }

  if (achievements.length === 0) {
    return <p className="text-slate-600 text-center py-12 text-sm">暂无成就</p>;
  }

  const handleEquip = async (ach) => {
    if (!ach.unlocked) return;
    setEquipping(ach.id);
    try {
      await onEquip(ach.id);
    } catch {
      toast.error('操作失败');
    } finally {
      setEquipping(null);
    }
  };

  return (
    <div className="space-y-10">
      {['legendary', 'epic', 'rare', 'common'].map(tierName => {
        const list = tiers[tierName];
        if (!list.length) return null;

        return (
          <div key={tierName}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[11px] text-slate-600 tracking-widest font-mono uppercase">
                {TIER_LABELS[tierName]} · {list.length}
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-white/[0.04] to-transparent" />
            </div>

            <div className={`grid ${isMobile ? 'grid-cols-3 gap-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'}`}>
              {list.map(ach => {
                const isEquipped = equippedBadgeId === ach.id;
                const catColor = CAT_COLORS[ach.category] || '#00e5ff';
                const badgeSize = isMobile ? 36 : 52;
                const padding = isMobile ? 'p-2.5' : 'p-4';

                return (
                  <div
                    key={ach.id}
                    onClick={() => handleEquip(ach)}
                    className={`relative rounded-2xl border ${padding} text-center transition-all duration-300 cursor-pointer group ${
                      ach.unlocked
                        ? isEquipped
                          ? `backdrop-blur-xl bg-white/[0.05] border-cyan-400/40 shadow-[0_0_20px_rgba(0,229,255,0.1)]`
                          : `backdrop-blur-xl bg-white/[0.02] ${TIER_BORDER[tierName]} hover:border-white/[0.12] hover:bg-white/[0.04]`
                        : 'bg-white/[0.01] border-white/[0.03] opacity-35 cursor-default'
                    }`}
                  >
                    {/* Category dot */}
                    {ach.unlocked && (
                      <span className={`absolute top-2 left-2 w-1.5 h-1.5 rounded-full ${isMobile ? 'w-1.5 h-1.5 top-1.5 left-1.5' : 'top-3 left-3 w-2 h-2'}`} style={{ backgroundColor: catColor }} />
                    )}

                    {/* Equipped indicator */}
                    {isEquipped && (
                      <span className={`absolute top-3 right-3 text-[9px] text-cyan-400 font-mono tracking-wider ${isMobile ? 'top-1.5 right-1.5 text-[8px]' : 'top-3 right-3'}`}>
                        佩戴中
                      </span>
                    )}

                    {/* Badge */}
                    <div className={equipping === ach.id ? 'animate-pulse' : ''}>
                      <BadgeSVG
                        shape={ach.shape || 'hex'}
                        tier={ach.tier || 'common'}
                        unlocked={ach.unlocked}
                        size={badgeSize}
                      />
                    </div>

                    {/* Name */}
                    <div className={`font-semibold tracking-wide ${isMobile ? 'text-[11px] mt-1.5' : 'text-sm mt-2.5'} ${
                      ach.unlocked ? 'text-white/70' : 'text-slate-700'
                    }`}>
                      {isMobile ? ach.name_zh.slice(0, 4) : ach.name_zh}
                    </div>

                    {/* Description */}
                    {!isMobile && (
                      <div className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                        {ach.description_zh}
                      </div>
                    )}

                    {/* EXP reward */}
                    <div className="text-[10px] text-slate-700 mt-1.5">
                      +{ach.exp_reward} EXP
                    </div>

                    {/* Equip hint on hover */}
                    {ach.unlocked && !isEquipped && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs text-cyan-400 font-mono">点击佩戴</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
