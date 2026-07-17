import { useState, useEffect } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';

const defaultDimensions = [
  { name: '视觉想象', score: 0, desc: '能否在脑中生成清晰图像和动态模拟' },
  { name: '发散联想', score: 0, desc: '从一点出发扩展多维网络的能力' },
  { name: '任务切换', score: 0, desc: '在不同任务间切换的成本和收益' },
  { name: '深度心流', score: 0, desc: '多模态反馈下能持续沉浸的时长' },
  { name: '工作记忆', score: 0, desc: '同时处理和保持信息的能力' },
  { name: '语言逻辑', score: 0, desc: '通过内心独白进行推理的能力' },
  { name: '情绪耦合', score: 0, desc: '对情绪的敏感程度和调节能力' },
  { name: '抑制控制', score: 0, desc: '压制自动反应的控制力' },
  { name: '机械执行', score: 0, desc: '对线性重复操作的耐受度' },
];

const tierColors = {
  high: { stroke: '#00e5ff', fill: '#00b8ff', bg: 'rgba(99,102,241,0.08)', border: 'rgba(0,229,255,0.2)' },
  mid: { stroke: '#a78bfa', fill: '#00d4ff', bg: 'rgba(139,92,246,0.06)', border: 'rgba(167,139,250,0.15)' },
  low: { stroke: '#c4b5fd', fill: '#a78bfa', bg: 'rgba(167,139,250,0.04)', border: 'rgba(196,181,253,0.1)' },
};

function getTier(score) {
  if (score >= 8) return 'high';
  if (score >= 5) return 'mid';
  return 'low';
}

function getTierLabel(tier) {
  if (tier === 'high') return '优势能力';
  if (tier === 'mid') return '一般能力';
  return '待提升';
}

function getScoreColor(score) {
  if (score >= 9) return '#00e5ff';
  if (score >= 7) return '#a78bfa';
  return '#c4b5fd';
}

export default function BrainRadar({ compact, customDimensions }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const hasCustom = customDimensions?.length;
  const dims = hasCustom ? customDimensions : defaultDimensions;
  const allZero = dims.every(d => d.score === 0);
  const tierGroups = { high: [], mid: [], low: [] };
  dims.forEach(d => tierGroups[getTier(d.score)].push(d));

  const chartData = dims.map(d => ({ name: d.name, score: d.score }));
  const chartW = compact ? 320 : 640;
  const chartH = compact ? 240 : 460;
  const outerR = compact ? 100 : 200;

  return (
    <div
      className="rounded-2xl p-5 sm:p-6 relative"
      style={{
        background: 'rgba(10,10,18,0.5)',
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="text-center mb-4">
        <h3 style={{
          color: 'rgba(255,255,255,0.85)',
          fontSize: compact ? '0.9rem' : '1.1rem',
          fontWeight: 700,
        }}>
          我的大脑能力雷达图
        </h3>
        <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.2rem' }}>
          {hasCustom ? 'AI 基于自我画像生成' : '基于自我实验绘制'}
        </p>
      </div>

      {/* Empty state overlay */}
      {allZero && (
        <div className="absolute inset-0 flex items-center justify-center z-10 rounded-2xl" style={{ background: 'rgba(3,3,8,0.6)' }}>
          <div className="text-center px-6">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/[0.08] flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🧠</span>
            </div>
            <p className="text-sm text-slate-400 mb-1">尚未生成能力雷达</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              前往「我的」页面填写自我画像<br />AI 将分析你的 9 个认知维度
            </p>
          </div>
        </div>
      )}

      {mounted ? (
        <div style={{ width: '100%', maxWidth: chartW, margin: '0 auto' }}>
          <RadarChart
            width={chartW}
            height={chartH}
            data={chartData}
            cx="50%" cy="50%" outerRadius={outerR}
            style={{ width: '100%', height: 'auto', maxWidth: '100%' }}
          >
            <PolarGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="name"
              tick={{ fill: '#94a3b8', fontSize: compact ? 9 : 12, fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 10]}
              tick={{ fill: '#475569', fontSize: compact ? 8 : 10 }}
              axisLine={false}
              stroke="rgba(255,255,255,0.04)"
            />
            <Radar
              name="自测得分"
              dataKey="score"
              stroke="#00e5ff"
              strokeWidth={2}
              fill="#00b8ff"
              fillOpacity={0.18}
              animationDuration={1800}
              animationEasing="ease-in-out"
            />
          </RadarChart>
        </div>
      ) : (
        <div className="flex items-center justify-center" style={{ height: chartH }}>
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
        </div>
      )}

      {/* Tier groups */}
      {['high', 'mid', 'low'].map(tier => (
        <div key={tier} className={compact ? 'mt-3' : 'mt-4'}>
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: tierColors[tier].stroke }}
            />
            <span className="text-xs font-semibold" style={{ color: tierColors[tier].stroke }}>
              {getTierLabel(tier)}
            </span>
            <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${tierColors[tier].border}, transparent)` }} />
          </div>
          <div className={compact ? 'grid grid-cols-2 gap-1.5' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2'}>
            {tierGroups[tier].map((d) => (
              <div
                key={d.name}
                className="rounded-xl p-3"
                style={{
                  background: tierColors[tier].bg,
                  border: `1px solid ${tierColors[tier].border}`,
                }}
              >
                <div className="flex justify-between mb-1">
                  <span style={{ color: '#cbd5e1', fontSize: '0.75rem', fontWeight: 600 }}>{d.name}</span>
                  <span style={{ color: getScoreColor(d.score), fontSize: '0.75rem', fontWeight: 700 }}>{d.score}</span>
                </div>
                <div
                  style={{
                    width: '100%', height: 4, borderRadius: 2,
                    background: 'rgba(255,255,255,0.04)', marginBottom: '0.5rem',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{
                    width: `${d.score * 10}%`, height: '100%',
                    backgroundColor: getScoreColor(d.score), opacity: 0.35,
                    transition: 'width 1s ease',
                  }} />
                </div>
                {!compact && (
                  <p style={{ color: '#64748b', fontSize: '0.7rem', lineHeight: 1.4 }}>{d.desc}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
