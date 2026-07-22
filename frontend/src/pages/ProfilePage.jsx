import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Brain, Sparkles, Eye, EyeOff, Check, HelpCircle } from 'lucide-react';
import { apiGet, apiPut, apiPost } from '../api/client';

function useDebouncedSave(delay = 800) {
  const timer = useRef(null);
  const [saved, setSaved] = useState(true);

  const save = useCallback((data) => {
    setSaved(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await apiPut('/user/settings', data);
        setSaved(true);
      } catch { /* silently fail, will retry on next change */ }
    }, delay);
  }, [delay]);

  return { save, saved };
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('deepseek-chat');
  const [selfProfile, setSelfProfile] = useState('');
  const [feishuId, setFeishuId] = useState('');
  const [vaultPath, setVaultPath] = useState('');
  const [radarScores, setRadarScores] = useState([]);
  const [showKey, setShowKey] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { save, saved } = useDebouncedSave();

  useEffect(() => {
    apiGet('/user/settings').then(d => {
      setApiKey(d.api_key || '');
      setModelName(d.model_name || 'deepseek-chat');
      setSelfProfile(d.self_profile || '');
      setFeishuId(d.feishu_id || '');
      setVaultPath(d.vault_path || '');
      setRadarScores(d.radar_scores || []);
    }).catch(() => {});
  }, []);

  const autoSave = (patch) => save(patch);

  const handleApiKeyChange = (val) => {
    setApiKey(val);
    autoSave({ api_key: val });
  };

  const handleModelChange = (val) => {
    setModelName(val);
    autoSave({ model_name: val });
  };

  const handleProfileChange = (val) => {
    setSelfProfile(val);
    autoSave({ self_profile: val });
  };

  const handleRadarScoresChange = (newScores) => {
    setRadarScores(newScores);
    autoSave({ radar_scores: newScores });
  };

  const handleGenerateRadar = async () => {
    if (selfProfile.trim().length < 20) return;
    setGenerating(true);
    try {
      const data = await apiPost('/user/settings/generate-radar', {
        self_profile: selfProfile,
      });
      setRadarScores(data.scores || []);
      await apiPut('/user/settings', { radar_scores: data.scores || [] });
      setSaved(true); // immediately mark saved since we explicitly saved
    } catch (e) {
      // error shown via toast in parent
    } finally {
      setGenerating(false);
    }
  };

  const updateScore = (idx, field, value) => {
    const newScores = radarScores.map((s, i) =>
      i === idx ? { ...s, [field]: value } : s
    );
    handleRadarScoresChange(newScores);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between pt-2">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white/85 tracking-[0.2em]" style={{ fontFamily: 'Orbitron, sans-serif' }}>我的</h2>
          <p className="text-[10px] text-slate-500 tracking-[0.3em] uppercase mt-1 font-mono">PROFILE</p>
        </div>
        <span className={`text-[11px] transition-colors ${saved ? 'text-emerald-500/60' : 'text-amber-400/60'}`}>
          {saved ? '已保存' : '保存中...'}
        </span>
      </div>

      {/* Beginner's Guide — link to full guide page */}
      <button
        onClick={() => navigate('/guide')}
        className="w-full text-left rounded-2xl p-4 bg-amber-500/[0.04] border border-amber-500/10 hover:border-amber-500/20 hover:bg-amber-500/[0.06] transition-all group cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <HelpCircle size={18} className="text-amber-400 group-hover:drop-shadow-[0_0_6px_rgba(251,191,36,0.4)] transition-all" />
          <div className="flex-1">
            <span className="text-sm text-amber-400/90 font-semibold">新手指引</span>
            <p className="text-[11px] text-slate-500 mt-0.5">每个功能的输入→逻辑→输出详解，附带具体例子 →</p>
          </div>
        </div>
      </button>

      {/* API Key */}
      <div
        className="rounded-2xl p-5 border"
        style={{ background: 'var(--card-profile-apikey)', borderColor: 'var(--card-profile-apikey-border)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Key size={15} className="text-cyan-400" />
          <h3 className="text-sm font-semibold text-white/70">大模型 API Key</h3>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => handleApiKeyChange(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2.5 pr-10 text-sm text-white/80 placeholder:text-slate-600 outline-none focus:border-cyan-400/40 transition-all"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
            >
              {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <p className="text-[10px] text-slate-600 font-mono tracking-wider uppercase">海外</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'gpt-5.5', label: 'GPT-5.5', desc: 'OpenAI' },
                { id: 'claude-opus-4-8', label: 'Claude 4.8 Opus', desc: 'Anthropic' },
                { id: 'gemini-3.1-pro', label: 'Gemini 3.1 Pro', desc: 'Google' },
                { id: 'llama-4', label: 'Llama 4', desc: 'Meta' },
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleModelChange(m.id)}
                  className={`text-left px-4 py-3 rounded-xl border transition-all duration-200 ${
                    modelName === m.id
                      ? 'border-cyan-500/20 bg-cyan-500/[0.06] shadow-[0_0_12px_rgba(0,229,255,0.08)]'
                      : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${
                      modelName === m.id ? 'text-cyan-400' : 'text-slate-300'
                    }`}>
                      {m.label}
                    </span>
                    {modelName === m.id && <Check size={14} className="text-cyan-400" />}
                  </div>
                  <span className="text-[11px] text-slate-600 mt-0.5 block">{m.desc}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-600 font-mono tracking-wider uppercase">国内</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'deepseek-chat', label: 'DeepSeek V4', desc: '深度求索' },
                { id: 'qwen3.5-max', label: 'Qwen3.5 Max', desc: '通义千问' },
                { id: 'ernie-bot-4.0', label: 'ERNIE Bot 4.0', desc: '文心一言' },
                { id: 'kimi-k3', label: 'Kimi K3', desc: '月之暗面' },
                { id: 'hunyuan-hy3', label: '腾讯混元Hy3', desc: '腾讯' },
                { id: 'doubao', label: '豆包Doubao', desc: '字节跳动' },
              ].map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleModelChange(m.id)}
                className={`text-left px-4 py-3 rounded-xl border transition-all duration-200 ${
                  modelName === m.id
                    ? 'border-cyan-500/20 bg-cyan-500/[0.06] shadow-[0_0_12px_rgba(0,229,255,0.08)]'
                    : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${
                    modelName === m.id ? 'text-cyan-400' : 'text-slate-300'
                  }`}>
                    {m.label}
                  </span>
                  {modelName === m.id && <Check size={14} className="text-cyan-400" />}
                </div>
                <span className="text-[11px] text-slate-600 mt-0.5 block">{m.desc}</span>
              </button>
            ))}
          </div>

          <p className="text-[11px] text-slate-600">
            设置后庶务外包、日报生成、雷达生成将使用你的 Key。未设置则 AI 功能不可用。
          </p>
        </div>
      </div>

      {/* Feishu / Lark ID */}
      <div
        className="rounded-2xl p-5 border"
        style={{ background: 'var(--card-profile-feishu)', borderColor: 'var(--card-profile-feishu-border)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base">📨</span>
          <h3 className="text-sm font-semibold text-white/70">飞书账号</h3>
        </div>
        <input
          type="text"
          value={feishuId}
          onChange={e => { setFeishuId(e.target.value); autoSave({ feishu_id: e.target.value }); }}
          placeholder="输入你的飞书 Open ID（如 ou_xxxx）"
          className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white/80 placeholder:text-slate-600 outline-none focus:border-cyan-400/40 transition-all"
        />
        <p className="text-[11px] text-slate-600 mt-2">
          填写后签到/活动/成就通知将推送到你的飞书。
        </p>

        {/* How to find */}
        <details className="mt-3 group">
          <summary className="text-[11px] text-violet-400/60 hover:text-violet-400 cursor-pointer transition-colors list-none">
            💡 怎么找到我的 Open ID？
          </summary>
          <div className="mt-3 pl-2 space-y-2 text-[11px] text-slate-500 leading-relaxed">
            <div className="flex gap-2">
              <span className="text-violet-400 shrink-0">📱</span>
              <span><b className="text-slate-400">手机端</b>：飞书 App → 头像 → 设置 → 个人信息 → 滑到底部「Open ID」</span>
            </div>
            <div className="flex gap-2">
              <span className="text-violet-400 shrink-0">💻</span>
              <span><b className="text-slate-400">电脑端</b>：飞书 → 左上角头像 → 设置 → 个人资料 → 最下方「Open ID」</span>
            </div>
            <div className="flex gap-2">
              <span className="text-violet-400 shrink-0">👥</span>
              <span><b className="text-slate-400">管理后台</b>：需要管理员权限，飞书管理后台 → 组织架构 → 成员 → 点你的名字 → 查看详情</span>
            </div>
          </div>
        </details>
      </div>

      {/* Export Location */}
      <div className="rounded-2xl p-5 border" style={{ background: 'var(--card-profile-export)', borderColor: 'var(--card-profile-export-border)' }}>
        <div className="flex items-center gap-2 mb-4">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          <h3 className="text-sm font-semibold text-white/70">文件导出位置</h3>
        </div>
        <p className="text-[11px] text-slate-500 mb-3">设置本地文件夹路径，笔记和复习卡片将导出到此目录。Obsidian 用户填写 vault 路径即可自动同步</p>
        <input type="text"
          value={vaultPath}
          onChange={e => { setVaultPath(e.target.value); autoSave({ vault_path: e.target.value }); }}
          placeholder="D:\我的笔记  或  D:\知识库\知识（Obsidian vault）"
          className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white/80 placeholder:text-slate-600 outline-none focus:border-violet-400/40 transition-all" />
      </div>

      {/* Self Profile */}
      <div
        className="rounded-2xl p-5 border"
        style={{ background: 'var(--card-profile-self)', borderColor: 'var(--card-profile-self-border)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Brain size={15} className="text-cyan-400" />
          <h3 className="text-sm font-semibold text-white/70">自我画像</h3>
        </div>

        <textarea
          value={selfProfile}
          onChange={e => handleProfileChange(e.target.value)}
          placeholder="描述你的性格特质、认知习惯、心理状态。例如：我喜欢视觉化思考，容易进入心流状态，但启动新任务时需要外力推动。我对重复性工作缺乏耐心，擅长联想和创意发散..."
          rows={8}
          className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-400/40 focus:shadow-[0_0_0_3px_rgba(0,229,255,0.08)] resize-none transition-all"
        />

        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={handleGenerateRadar}
            disabled={generating || selfProfile.trim().length < 20}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/15 rounded-xl text-sm text-cyan-400 hover:bg-cyan-500/15 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Sparkles size={14} />
            {generating ? '生成中...' : 'AI 生成能力雷达'}
          </button>
          <span className="text-[11px] text-slate-600">
            AI 将根据你的画像分析9个认知维度
          </span>
        </div>
      </div>

      {/* Radar Scores */}
      {radarScores.length > 0 && (
        <div
          className="rounded-2xl p-5 border"
          style={{ background: 'var(--card-profile-radar)', borderColor: 'var(--card-profile-radar-border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white/70">能力雷达数据</h3>
            <span className="text-[11px] text-slate-600">可手动调整，自动保存</span>
          </div>

          <div className="space-y-2">
            {radarScores.map((s, i) => (
              <div
                key={s.name || i}
                className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.04] rounded-xl px-4 py-3"
              >
                <span className="text-xs text-slate-500 w-16 shrink-0">{s.name}</span>
                <input
                  type="number"
                  value={s.score}
                  onChange={e => updateScore(i, 'score', parseFloat(e.target.value) || 0)}
                  min={0}
                  max={10}
                  step={0.1}
                  className="w-14 bg-white/[0.04] border border-white/[0.06] rounded-lg px-2 py-1 text-xs text-cyan-400 text-center outline-none focus:border-cyan-400/40 transition-all"
                />
                <input
                  type="text"
                  value={s.desc || ''}
                  onChange={e => updateScore(i, 'desc', e.target.value)}
                  placeholder="简短解释"
                  className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-1 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-cyan-400/40 transition-all"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
