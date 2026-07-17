const TIER_COLORS = {
  common:   { fill: '#8B7355', stroke: '#A08060', glow: 'rgba(160,128,96,0.3)' },
  rare:     { fill: '#8090A0', stroke: '#A0B0C0', glow: 'rgba(160,176,192,0.4)' },
  epic:     { fill: '#C8A030', stroke: '#E8C040', glow: 'rgba(232,192,64,0.5)' },
  legendary:{ fill: '#00E5FF', stroke: '#A78BFA', glow: 'rgba(0,229,255,0.55)' },
};

function TierFrame({ tier, size = 64 }) {
  const c = TIER_COLORS[tier] || TIER_COLORS.common;
  const cx = size / 2, cy = size / 2, r = size / 2 - 2;

  if (tier === 'common') {
    return <circle cx={cx} cy={cy} r={r} fill="none" stroke={c.stroke} strokeWidth="1.2" opacity="0.5" />;
  }
  if (tier === 'rare') {
    return <>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={c.stroke} strokeWidth="1" opacity="0.5" />
      <circle cx={cx} cy={cy} r={r - 3} fill="none" stroke={c.stroke} strokeWidth="0.6" opacity="0.35" strokeDasharray="3 4" />
      <circle cx={cx} cy={cy} r={r + 3} fill="none" stroke={c.glow} strokeWidth="4" opacity="0.25" />
    </>;
  }
  if (tier === 'epic') {
    const triPts = `${cx},${cy - r - 2} ${cx + 6},${cy - r + 4} ${cx - 6},${cy - r + 4}`;
    return <>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={c.stroke} strokeWidth="1.3" opacity="0.55" />
      <circle cx={cx} cy={cy} r={r - 3} fill="none" stroke={c.stroke} strokeWidth="0.7" opacity="0.4" />
      <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke={c.glow} strokeWidth="5" opacity="0.3" />
      <polygon points={triPts} fill={c.stroke} opacity="0.7" />
    </>;
  }
  // legendary
  return <>
    <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke={c.glow} strokeWidth="6" opacity="0.35">
      <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="8s" repeatCount="indefinite" />
    </circle>
    <circle cx={cx} cy={cy} r={r} fill="none" stroke={c.stroke} strokeWidth="1.2" opacity="0.5" />
    <circle cx={cx} cy={cy} r={r - 4} fill="none" stroke={c.stroke} strokeWidth="0.7" opacity="0.3" strokeDasharray="5 3" />
    {/* Corner sparkles */}
    {[0, 90, 180, 270].map(deg => {
      const rad = (deg * Math.PI) / 180;
      return <circle key={deg} cx={cx + (r + 3) * Math.cos(rad)} cy={cy + (r + 3) * Math.sin(rad)}
        r="1.5" fill={deg % 180 === 0 ? '#00e5ff' : '#a78bfa'} opacity="0.7">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" begin={`${deg / 360}s`} />
      </circle>;
    })}
  </>;
}

function ShieldCore({ cx, cy, s, color, unlocked }) {
  const p = (dx, dy) => `${cx + dx * s},${cy + dy * s}`;
  return <polygon
    points={`${p(0,-0.5)} ${p(0.4,-0.2)} ${p(0.4,0.15)} ${p(0,0.45)} ${p(-0.4,0.15)} ${p(-0.4,-0.2)}`}
    fill={unlocked ? `${color.fill}30` : 'transparent'}
    stroke={unlocked ? color.stroke : 'rgba(255,255,255,0.08)'}
    strokeWidth={unlocked ? 1.2 : 0.8}
    opacity={unlocked ? 0.8 : 0.4}
  />;
}

function DiamondCore({ cx, cy, s, color, unlocked }) {
  const p = (dx, dy) => `${cx + dx * s},${cy + dy * s}`;
  return <>
    <polygon points={`${p(0,-0.55)} ${p(0.35,0)} ${p(0,0.55)} ${p(-0.35,0)}`}
      fill={unlocked ? `${color.fill}25` : 'transparent'}
      stroke={unlocked ? color.stroke : 'rgba(255,255,255,0.08)'}
      strokeWidth={unlocked ? 1.2 : 0.8} opacity={unlocked ? 0.8 : 0.4} />
    {unlocked && <line x1={cx - s * 0.2} y1={cy - s * 0.1} x2={cx + s * 0.2} y2={cy + s * 0.1}
      stroke={color.stroke} strokeWidth="0.5" opacity="0.4" />}
    {unlocked && <line x1={cx - s * 0.2} y1={cy + s * 0.1} x2={cx + s * 0.2} y2={cy - s * 0.1}
      stroke={color.stroke} strokeWidth="0.5" opacity="0.4" />}
  </>;
}

function StarCore({ cx, cy, s, color, unlocked }) {
  const pts = [];
  for (let i = 0; i < 5; i++) {
    const outer = (i * 72 - 90) * Math.PI / 180;
    const inner = ((i * 72) + 36 - 90) * Math.PI / 180;
    pts.push(`${cx + s * 0.5 * Math.cos(outer)},${cy + s * 0.5 * Math.sin(outer)}`);
    pts.push(`${cx + s * 0.2 * Math.cos(inner)},${cy + s * 0.2 * Math.sin(inner)}`);
  }
  return <polygon points={pts.join(' ')}
    fill={unlocked ? `${color.fill}30` : 'transparent'}
    stroke={unlocked ? color.stroke : 'rgba(255,255,255,0.08)'}
    strokeWidth={unlocked ? 1.2 : 0.8} opacity={unlocked ? 0.85 : 0.4} />;
}

function MoonCore({ cx, cy, s, color, unlocked }) {
  return <>
    <circle cx={cx} cy={cy} r={s * 0.4}
      fill={unlocked ? `${color.fill}25` : 'transparent'}
      stroke={unlocked ? color.stroke : 'rgba(255,255,255,0.08)'}
      strokeWidth={unlocked ? 1.2 : 0.8} opacity={unlocked ? 0.8 : 0.4} />
    {unlocked && <circle cx={cx + s * 0.12} cy={cy - s * 0.1} r={s * 0.32}
      fill="#030308" stroke={color.stroke} strokeWidth="0.6" opacity="0.6" />}
    {!unlocked && <circle cx={cx + s * 0.1} cy={cy - s * 0.08} r={s * 0.3}
      fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" opacity="0.3" />}
  </>;
}

function HexCore({ cx, cy, s, color, unlocked }) {
  const p = (dx, dy) => `${cx + dx * s},${cy + dy * s}`;
  return <>
    <polygon points={`${p(0,-0.45)} ${p(0.4,-0.22)} ${p(0.4,0.22)} ${p(0,0.45)} ${p(-0.4,0.22)} ${p(-0.4,-0.22)}`}
      fill={unlocked ? `${color.fill}30` : 'transparent'}
      stroke={unlocked ? color.stroke : 'rgba(255,255,255,0.08)'}
      strokeWidth={unlocked ? 1.2 : 0.8} opacity={unlocked ? 0.8 : 0.4} />
    {unlocked && <circle cx={cx} cy={cy} r={s * 0.1} fill={color.stroke} opacity="0.6" />}
    {unlocked && <>
      <line x1={cx - s * 0.18} y1={cy - s * 0.18} x2={cx - s * 0.06} y2={cy - s * 0.06} stroke={color.stroke} strokeWidth="0.5" opacity="0.4" />
      <line x1={cx + s * 0.06} y1={cy + s * 0.06} x2={cx + s * 0.18} y2={cy + s * 0.18} stroke={color.stroke} strokeWidth="0.5" opacity="0.4" />
    </>}
  </>;
}

const CORE_MAP = { shield: ShieldCore, diamond: DiamondCore, star: StarCore, moon: MoonCore, hex: HexCore };

export default function BadgeSVG({ shape = 'hex', tier = 'common', unlocked = false, size = 64 }) {
  const color = TIER_COLORS[tier] || TIER_COLORS.common;
  const cx = size / 2, cy = size / 2;
  const coreScale = size / 80;
  const Core = CORE_MAP[shape] || HexCore;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="mx-auto">
      <defs>
        <filter id={`glow-${tier}`}>
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background circle */}
      <circle cx={cx} cy={cy} r={size / 2 - 4} fill="rgba(255,255,255,0.02)" />

      {/* Tier frame */}
      <TierFrame tier={tier} size={size} />

      {/* Shape core */}
      <Core cx={cx} cy={cy} s={coreScale * 28} color={color} unlocked={unlocked} />

      {/* Unlocked shine */}
      {unlocked && (
        <circle cx={cx - coreScale * 8} cy={cy - coreScale * 12} r={coreScale * 5}
          fill="white" opacity="0.08" />
      )}
    </svg>
  );
}

export { TIER_COLORS };
