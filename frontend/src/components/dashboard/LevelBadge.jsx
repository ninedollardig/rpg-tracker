const TIER_GLOW = {
  common:   'rgba(160,128,96,0.25)',
  rare:     'rgba(160,176,192,0.3)',
  epic:     'rgba(232,192,64,0.35)',
  legendary:'rgba(0,229,255,0.4)',
};

const TIER_ACCENT = {
  common:   '#A08060',
  rare:     '#A0B0C0',
  epic:     '#E8C040',
  legendary:'#00e5ff',
};

export default function LevelBadge({ level, title, equippedBadge }) {
  const badgeColor = equippedBadge ? (TIER_ACCENT[equippedBadge.tier] || '#00e5ff') : '#00e5ff';
  const badgeGlow = equippedBadge ? (TIER_GLOW[equippedBadge.tier] || 'rgba(0,229,255,0.4)') : 'rgba(0,229,255,0.25)';

  return (
    <div className="flex flex-col items-center">
      {/* Hexagon frame with badge or level */}
      <div className="relative w-20 h-20 select-none flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
          {/* Outer hexagon ring */}
          <polygon
            points="50,8 88,30 88,70 50,92 12,70 12,30"
            fill="none"
            stroke={badgeColor}
            strokeWidth="1.5"
            opacity="0.35"
          />
          {/* Inner hexagon */}
          <polygon
            points="50,18 78,34 78,66 50,82 22,66 22,34"
            fill={equippedBadge ? `${badgeColor}0D` : 'rgba(0,229,255,0.06)'}
            stroke={badgeColor}
            strokeWidth="0.8"
            opacity="0.25"
          />
          {/* Corner accent lines */}
          <line x1="50" y1="8" x2="50" y2="36" stroke={badgeColor} strokeWidth="0.5" opacity="0.18" />
          <line x1="12" y1="30" x2="37" y2="40" stroke={badgeColor} strokeWidth="0.5" opacity="0.12" />
          <line x1="88" y1="30" x2="63" y2="40" stroke={badgeColor} strokeWidth="0.5" opacity="0.12" />
          <line x1="12" y1="70" x2="37" y2="60" stroke={badgeColor} strokeWidth="0.5" opacity="0.12" />
          <line x1="88" y1="70" x2="63" y2="60" stroke={badgeColor} strokeWidth="0.5" opacity="0.12" />

          {/* Badge glow behind the level/badge */}
          {equippedBadge && (
            <circle cx="50" cy="54" r="20" fill={badgeGlow} opacity="0.6" filter="url(#lvl-glow)" />
          )}

          {/* Badge shape inside hexagon */}
          {equippedBadge ? (
            <g transform="translate(50,56) scale(0.55)">
              {/* Small version of badge core */}
              {equippedBadge.shape === 'shield' && (
                <polygon points="0,-14 10,-6 10,5 0,13 -10,5 -10,-6"
                  fill={`${badgeColor}25`} stroke={badgeColor} strokeWidth="1.5" opacity="0.8" />
              )}
              {equippedBadge.shape === 'diamond' && (
                <polygon points="0,-15 10,0 0,15 -10,0"
                  fill={`${badgeColor}20`} stroke={badgeColor} strokeWidth="1.5" opacity="0.8" />
              )}
              {equippedBadge.shape === 'star' && (() => {
                const pts = [];
                for (let i = 0; i < 5; i++) {
                  const o = (i * 72 - 90) * Math.PI / 180;
                  const inner = ((i * 72) + 36 - 90) * Math.PI / 180;
                  pts.push(`${14*Math.cos(o)},${14*Math.sin(o)} ${5*Math.cos(inner)},${5*Math.sin(inner)}`);
                }
                return <polygon points={pts.join(' ')} fill={`${badgeColor}20`} stroke={badgeColor} strokeWidth="1.2" opacity="0.8" />;
              })()}
              {equippedBadge.shape === 'moon' && (
                <>
                  <circle cx="0" cy="0" r="12" fill={`${badgeColor}20`} stroke={badgeColor} strokeWidth="1.2" opacity="0.8" />
                  <circle cx="4" cy="-3" r="9" fill="#030308" stroke={badgeColor} strokeWidth="0.6" opacity="0.5" />
                </>
              )}
              {equippedBadge.shape === 'hex' && (
                <polygon points="0,-13 11,-6 11,6 0,13 -11,6 -11,-6"
                  fill={`${badgeColor}20`} stroke={badgeColor} strokeWidth="1.2" opacity="0.8" />
              )}
            </g>
          ) : (
            <text x="50" y="58" textAnchor="middle" fill="#00e5ff" fontSize="28" fontWeight="bold" opacity="0.9">
              {level}
            </text>
          )}

          {/* Level number overlay when badge is shown — small, top-right corner */}
          {equippedBadge && (
            <text x="78" y="30" textAnchor="middle" fill={badgeColor} fontSize="22" fontWeight="bold" opacity="0.85">
              {level}
            </text>
          )}

          <defs>
            <filter id="lvl-glow">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>
        </svg>
      </div>

      {/* Badge name when equipped */}
      {equippedBadge && (
        <span className="text-[10px] font-mono tracking-wide mt-1" style={{ color: badgeColor }}>
          {equippedBadge.name_zh}
        </span>
      )}

      {/* Title */}
      <span className="text-sm font-semibold text-white/70 tracking-wide mt-1.5">
        {title}
      </span>

      {/* Geometric accent line */}
      <div className="flex items-center gap-1.5 mt-1.5">
        <svg viewBox="0 0 20 2" className="w-5 h-0.5">
          <polygon points="0,0 20,0 18,2 2,2" fill={badgeColor} opacity="0.3" />
        </svg>
        <span className="w-1 h-1 rotate-45" style={{ backgroundColor: badgeColor, opacity: 0.4 }} />
        <svg viewBox="0 0 20 2" className="w-5 h-0.5">
          <polygon points="2,0 20,0 18,2 0,2" fill={badgeColor} opacity="0.3" />
        </svg>
      </div>
    </div>
  );
}
