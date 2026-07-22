import { useState, useMemo } from 'react';
import useSound from '../../hooks/useSound';

const catConfig = {
  '生活': { color: '#f87171', bg: 'rgba(248,113,113,0.06)', border: 'rgba(248,113,113,0.2)', icon: 'heartbeat' },
  '学习': { color: '#60a5fa', bg: 'rgba(96,165,250,0.06)', border: 'rgba(96,165,250,0.2)', icon: 'crystal' },
  '娱乐': { color: '#f472b6', bg: 'rgba(244,114,182,0.06)', border: 'rgba(244,114,182,0.2)', icon: 'starburst' },
  '休息': { color: '#34d399', bg: 'rgba(52,211,153,0.06)', border: 'rgba(52,211,153,0.2)', icon: 'moonleaf' },
};

/* ── Artistic category icons ── */
function GeoShape({ icon, color, size = 28 }) {
  const s = size;
  const cx = s / 2, cy = s / 2;
  const r = s / 2 - 2;

  return (
    <svg viewBox={`0 0 ${s} ${s}`} className="shrink-0" width={s} height={s}>
      {/* heartbeat — shield with pulse line */}
      {icon === 'heartbeat' && (
        <>
          <polygon points={`${cx},2 ${s-2},${cy-4} ${s-4},${s-6} ${cx},${s-2} 4,${s-6} 2,${cy-4}`}
            fill={`${color}18`} stroke={color} strokeWidth="1.2" opacity="0.75" />
          <polyline points={`${cx-7},${cy} ${cx-3},${cy} ${cx-1},${cy-5} ${cx+3},${cy+4} ${cx+7},${cy}`}
            fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
        </>
      )}

      {/* crystal — diamond with inner facets */}
      {icon === 'crystal' && (
        <>
          <polygon points={`${cx},2 ${s-2},${cy} ${cx},${s-2} 2,${cy}`}
            fill={`${color}18`} stroke={color} strokeWidth="1.2" opacity="0.75" />
          <line x1={cx} y1={cy-6} x2={cx} y2={cy+6} stroke={color} strokeWidth="0.7" opacity="0.45" />
          <line x1={cx-6} y1={cy} x2={cx+6} y2={cy} stroke={color} strokeWidth="0.7" opacity="0.45" />
          <line x1={cx-3} y1={cy-3} x2={cx+3} y2={cy+3} stroke={color} strokeWidth="0.5" opacity="0.3" />
          <line x1={cx+3} y1={cy-3} x2={cx-3} y2={cy+3} stroke={color} strokeWidth="0.5" opacity="0.3" />
          <circle cx={cx} cy={cy} r="2.5" fill={color} opacity="0.55" />
        </>
      )}

      {/* starburst — radiating star */}
      {icon === 'starburst' && (() => {
        const outer = [], inner = [];
        for (let i = 0; i < 6; i++) {
          const a1 = (i / 6) * Math.PI * 2 - Math.PI / 2;
          const a2 = ((i + 0.5) / 6) * Math.PI * 2 - Math.PI / 2;
          outer.push(`${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)}`);
          inner.push(`${cx + r * 0.4 * Math.cos(a2)},${cy + r * 0.4 * Math.sin(a2)}`);
        }
        const pts = [];
        for (let i = 0; i < 6; i++) { pts.push(outer[i], inner[i]); }
        return <>
          <polygon points={pts.join(' ')} fill={`${color}18`} stroke={color} strokeWidth="1.2" opacity="0.75" />
          <circle cx={cx} cy={cy} r={r * 0.25} fill={color} opacity="0.45" />
          {[0, 60, 120, 180, 240, 300].map(deg => {
            const rad = (deg * Math.PI) / 180;
            return <circle key={deg} cx={cx + r * 0.65 * Math.cos(rad)} cy={cy + r * 0.65 * Math.sin(rad)}
              r="1.5" fill={color} opacity="0.35" />;
          })}
        </>;
      })()}

      {/* moonleaf — crescent moon with leaf */}
      {icon === 'moonleaf' && (
        <>
          <circle cx={cx} cy={cy} r={r} fill={`${color}18`} stroke={color} strokeWidth="1.2" opacity="0.75" />
          <circle cx={cx + r * 0.25} cy={cy - r * 0.2} r={r * 0.7}
            fill="#0a0a14" stroke={color} strokeWidth="0.8" opacity="0.55" />
          <path d={`M${cx - r * 0.25},${cy + r * 0.3} Q${cx},${cy + r * 0.7} ${cx + r * 0.35},${cy + r * 0.25}`}
            fill="none" stroke={color} strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
          <circle cx={cx - r * 0.5} cy={cy + r * 0.65} r="1.5" fill={color} opacity="0.3" />
        </>
      )}
    </svg>
  );
}

export default function ActivityForm({ types, loading, onSubmit }) {
  const { playSound } = useSound();
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [value, setValue] = useState(1);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const grouped = useMemo(() => {
    const g = {};
    for (const t of types) {
      if (!g[t.category]) g[t.category] = {};
      if (!g[t.category][t.subcategory]) g[t.category][t.subcategory] = [];
      g[t.category][t.subcategory].push(t);
    }
    return g;
  }, [types]);

  const catCounts = useMemo(() => {
    const c = {};
    for (const t of types) {
      c[t.category] = (c[t.category] || 0) + 1;
    }
    return c;
  }, [types]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedType || !value) return;
    playSound('success');
    onSubmit({
      activity_type_id: selectedType.id,
      value: parseFloat(value),
      notes,
      logged_date: date,
    });
    setStep(1);
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedType(null);
    setValue(1);
    setNotes('');
  };

  const goToCategory = () => { setStep(1); setSelectedCategory(null); setSelectedSubcategory(null); setSelectedType(null); };
  const goToSubcategory = (cat) => { setSelectedCategory(cat); setStep(2); setSelectedSubcategory(null); setSelectedType(null); };
  const goToConfirm = (subcat) => { setSelectedSubcategory(subcat); setStep(3); setSelectedType(null); };
  const selectType = (t) => { setSelectedType(t); };

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 animate-pulse">
        <div className="h-5 bg-white/[0.04] rounded w-20 mb-4" />
        <div className="h-24 bg-white/[0.04] rounded" />
      </div>
    );
  }

  const catList = Object.keys(grouped).sort();

  return (
    <form onSubmit={handleSubmit} className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
      <h3 className="text-base font-semibold text-white/80 tracking-wide mb-4">记录修炼</h3>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6 text-xs">
        {['择类', '择项', '落笔'].map((label, i) => {
          const active = step > i;
          const current = step === i + 1;
          return (
            <span key={label} className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-semibold transition-all ${
                active
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : current
                  ? 'border border-cyan-500/30 text-cyan-400'
                  : 'bg-white/[0.03] text-slate-600 border border-white/[0.05]'
              }`}>
                {i + 1}
              </span>
              <span className={current ? 'text-white/60' : 'text-slate-600'}>{label}</span>
              {i < 2 && <span className="text-slate-700">·</span>}
            </span>
          );
        })}
      </div>

      {/* Step 1: Category */}
      {step === 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {catList.map(cat => {
            const cfg = catConfig[cat] || {};
            return (
              <button
                key={cat}
                type="button"
                onClick={() => goToSubcategory(cat)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 hover:shadow-[0_0_24px_rgba(0,229,255,0.06)]"
                style={{
                  backgroundColor: cfg.bg,
                  borderColor: cfg.border,
                }}
              >
                <GeoShape icon={cfg.icon} color={cfg.color} size={28} />
                <span className="text-sm font-semibold" style={{ color: cfg.color }}>{cat}</span>
                <span className="text-xs text-slate-600">{catCounts[cat]} 项</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Step 2: Subcategory */}
      {step === 2 && selectedCategory && (
        <div>
          <button type="button" onClick={goToCategory} className="text-slate-500 hover:text-white/60 text-sm mb-3 flex items-center gap-1 transition-colors">
            ← 重选分类
          </button>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.keys(grouped[selectedCategory] || {}).map(subcat => {
              const items = grouped[selectedCategory][subcat];
              const cfg = catConfig[selectedCategory] || {};
              return (
                <button
                  key={subcat}
                  type="button"
                  onClick={() => goToConfirm(subcat)}
                  className="text-left p-3.5 rounded-xl border transition-all duration-200"
                  style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
                >
                  <div className="text-sm font-semibold" style={{ color: cfg.color }}>{subcat}</div>
                  <div className="text-xs text-slate-600 mt-0.5">{items.length} 个项目</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Items + confirm */}
      {step === 3 && selectedCategory && selectedSubcategory && (
        <div>
          <button type="button" onClick={() => goToSubcategory(selectedCategory)} className="text-slate-500 hover:text-white/60 text-sm mb-3 flex items-center gap-1 transition-colors">
            ← 重选子分类
          </button>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {(grouped[selectedCategory]?.[selectedSubcategory] || []).map(t => {
              const cfg = catConfig[selectedCategory] || {};
              const isSelected = selectedType?.id === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectType(t)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left ${
                    isSelected
                      ? 'border-cyan-500/30 bg-cyan-500/[0.04] shadow-[0_0_16px_rgba(0,229,255,0.1)]'
                      : 'hover:border-white/[0.1]'
                  }`}
                  style={!isSelected ? { backgroundColor: cfg.bg, borderColor: cfg.border } : {}}
                >
                  <GeoShape icon={cfg.icon} color={cfg.color} size={24} />
                  <span className="flex-1 text-sm text-white/70">{t.name_zh}</span>
                  <span className="text-xs text-cyan-400 font-semibold">+{t.default_exp_per_unit}</span>
                  {isSelected && (
                    <span className="w-2 h-2 rotate-45 bg-cyan-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {selectedType && (
            <div className="border-t border-white/[0.05] pt-4 mt-2">
              <div className="flex items-center gap-2 mb-3 text-sm">
                <GeoShape sides={catConfig[selectedCategory]?.icon || 'heartbeat'} color={catConfig[selectedCategory]?.color || '#64748b'} size={18} />
                <span className="text-white/50">
                  {selectedCategory} <span className="text-slate-600">·</span> {selectedSubcategory} <span className="text-slate-600">·</span> {selectedType.name_zh}
                </span>
                <span className="text-cyan-400 font-semibold ml-auto">
                  +{selectedType.default_exp_per_unit} EXP/次
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-600 block mb-1">数量</label>
                  <input
                    type="number"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-white/80 text-sm outline-none focus:border-cyan-400/40 transition-all"
                    min="1"
                    step="1"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 block mb-1">日期</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-white/80 text-sm outline-none focus:border-cyan-400/40 transition-all"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2 rounded-lg text-sm font-semibold text-white transition-all"
                    style={{ background: 'linear-gradient(135deg, #00b8ff, #00d4ff)' }}
                  >
                    落笔 +{selectedType.default_exp_per_unit * value} EXP
                  </button>
                </div>
              </div>
              <input
                type="text"
                placeholder="备注（可选）"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="mt-3 w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-white/80 text-sm outline-none focus:border-cyan-400/40 transition-all placeholder:text-slate-600"
              />
              <button
                type="button"
                onClick={goToCategory}
                className="mt-2 text-xs text-slate-600 hover:text-slate-400 transition-colors"
              >
                重新选择活动
              </button>
            </div>
          )}

          {!selectedType && (
            <div className="text-center text-slate-600 text-sm py-4">
              请从上方选择一个修炼项目
            </div>
          )}
        </div>
      )}
    </form>
  );
}
