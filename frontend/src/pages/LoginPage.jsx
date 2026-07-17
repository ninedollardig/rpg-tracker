import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

/* ── Aurora background ── */
function AuroraBg() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #050510 0%, #020208 60%, #000 100%)' }}>
      <style>{`
        @keyframes aurora1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
          25%  { transform: translate(30%, -25%) rotate(8deg) scale(1.4); }
          50%  { transform: translate(-20%, 30%) rotate(-5deg) scale(0.65); }
          75%  { transform: translate(-35%, -15%) rotate(10deg) scale(1.3); }
        }
        @keyframes aurora2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
          33%  { transform: translate(-25%, 35%) rotate(-12deg) scale(1.5); }
          66%  { transform: translate(30%, -20%) rotate(8deg) scale(0.65); }
        }
        @keyframes aurora3 {
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
          50%  { transform: translate(25%, -30%) rotate(-10deg) scale(1.5); }
        }
        @keyframes aurora4 {
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
          40%  { transform: translate(-35%, -20%) rotate(15deg) scale(1.35); }
          80%  { transform: translate(25%, 25%) rotate(-10deg) scale(0.7); }
        }
        @keyframes aurora5 {
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
          30%  { transform: translate(20%, 40%) rotate(-15deg) scale(1.55); }
          70%  { transform: translate(-25%, -30%) rotate(8deg) scale(0.6); }
        }
        .aurora-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.65;
          will-change: transform;
        }

        /* Glass noise */
        .glass-noise::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 9999;
          opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 180px 180px;
        }

        /* Edge glow keyframes */
        @keyframes slide-top {
          0% { left: -40%; } 100% { left: 100%; }
        }
        @keyframes slide-right {
          0% { top: -40%; } 100% { top: 100%; }
        }
        @keyframes slide-bottom {
          0% { left: 100%; } 100% { left: -40%; }
        }
        @keyframes slide-left {
          0% { top: 100%; } 100% { top: -40%; }
        }
        @keyframes corner-breathe {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.3); }
        }

        /* Reveal stagger */
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-fade-up {
          animation: fade-in-up 0.7s cubic-bezier(0.22, 0.61, 0.36, 1) both;
        }
        .anim-d0 { animation-delay: 0s; }
        .anim-d1 { animation-delay: 0.15s; }
        .anim-d2 { animation-delay: 0.30s; }
        .anim-d3 { animation-delay: 0.45s; }
        .anim-d4 { animation-delay: 0.60s; }
        .anim-d5 { animation-delay: 0.75s; }
      `}</style>

      {/* Electric blue → cyan → ultraviolet */}
      <div className="aurora-blob w-[900px] h-[900px] -top-60 -left-40"
        style={{ background: 'radial-gradient(circle, rgba(0,112,243,0.7) 0%, rgba(0,200,255,0.4) 30%, rgba(0,80,200,0.2) 55%, transparent 70%)', animation: 'aurora1 12s ease-in-out infinite' }} />
      <div className="aurora-blob w-[750px] h-[750px] top-1/2 -right-32"
        style={{ background: 'radial-gradient(circle, rgba(120,40,255,0.7) 0%, rgba(160,80,255,0.4) 30%, rgba(60,20,180,0.2) 55%, transparent 70%)', animation: 'aurora2 14s ease-in-out infinite' }} />
      <div className="aurora-blob w-[800px] h-[800px] -bottom-40 left-1/4"
        style={{ background: 'radial-gradient(circle, rgba(0,160,255,0.65) 0%, rgba(0,220,255,0.35) 30%, rgba(0,80,160,0.2) 55%, transparent 70%)', animation: 'aurora3 10s ease-in-out infinite' }} />
      <div className="aurora-blob w-[650px] h-[650px] top-1/3 left-1/2"
        style={{ background: 'radial-gradient(circle, rgba(100,120,255,0.6) 0%, rgba(140,160,255,0.35) 30%, rgba(60,40,180,0.15) 55%, transparent 70%)', animation: 'aurora4 16s ease-in-out infinite' }} />
      <div className="aurora-blob w-[550px] h-[550px] top-2/3 left-1/5"
        style={{ background: 'radial-gradient(circle, rgba(0,240,255,0.55) 0%, rgba(0,200,240,0.3) 30%, rgba(0,100,160,0.12) 55%, transparent 70%)', animation: 'aurora5 11s ease-in-out infinite' }} />
    </div>
  );
}

/* ── Edge glow strips ── */
function EdgeGlow() {
  return (
    <>
      {/* Edge strips — cyan dominant */}
      {['top','right','bottom','left'].map((edge, i) => {
        const isH = edge === 'top' || edge === 'bottom';
        const delay = [0, 0.875, 1.75, 2.625][i];
        const dir  = edge === 'bottom' ? 'slide-bottom' : edge === 'left' ? 'slide-left' : edge === 'right' ? 'slide-right' : 'slide-top';
        const anchor = edge === 'bottom' ? 'bottom-0 left-0 right-0' : edge === 'left' ? 'top-0 left-0 bottom-0' : edge === 'right' ? 'top-0 right-0 bottom-0' : 'top-0 left-0 right-0';
        return (
          <div key={edge}
            className={`absolute ${anchor} overflow-hidden pointer-events-none`}
            style={{ [isH ? 'height' : 'width']: '2px' }}>
            <div className={`absolute ${isH ? 'top-0 left-0 right-0' : 'top-0 right-0 bottom-0'} h-full w-full`}
              style={{ background: isH
                ? 'linear-gradient(90deg, transparent 30%, rgba(0,200,255,0.2) 50%, transparent 70%)'
                : 'linear-gradient(0deg, transparent 30%, rgba(100,140,255,0.2) 50%, transparent 70%)' }} />
            <div className={`absolute ${isH ? 'h-full' : 'w-full'}`}
              style={{
                [isH ? 'width' : 'height']: '38%',
                animation: `${dir}_3.5s_linear_infinite`,
                animationDelay: `${delay}s`,
                background: isH
                  ? 'linear-gradient(90deg, transparent, rgba(0,220,255,0.6), transparent)'
                  : 'linear-gradient(0deg, transparent, rgba(120,160,255,0.6), transparent)',
                filter: 'blur(1px)',
              }} />
          </div>
        );
      })}

      {/* TL corner — electric cyan */}
      <div className="absolute -top-[5px] -left-[5px] w-[7px] h-[7px] rounded-sm bg-cyan-400
        animate-[corner-breathe_2.5s_ease-in-out_infinite]"
        style={{ boxShadow: '0 0 10px #00e5ff, 0 0 35px rgba(0,229,255,0.5)' }} />
      <div className="absolute top-0.5 left-[8px] w-12 h-[2px] bg-gradient-to-r from-cyan-400/80 to-transparent pointer-events-none rounded-r-full" />
      <div className="absolute top-[8px] left-0.5 h-12 w-[2px] bg-gradient-to-b from-cyan-400/80 to-transparent pointer-events-none rounded-b-full" />

      {/* BR corner — electro violet */}
      <div className="absolute -bottom-[5px] -right-[5px] w-[7px] h-[7px] rounded-sm bg-violet-400
        animate-[corner-breathe_2.5s_ease-in-out_infinite_1.25s]"
        style={{ boxShadow: '0 0 10px #a78bfa, 0 0 35px rgba(140,120,255,0.5)' }} />
      <div className="absolute bottom-0.5 right-[8px] w-12 h-[2px] bg-gradient-to-l from-violet-400/80 to-transparent pointer-events-none rounded-l-full" />
      <div className="absolute bottom-[8px] right-0.5 h-12 w-[2px] bg-gradient-to-t from-violet-400/80 to-transparent pointer-events-none rounded-t-full" />
    </>
  );
}

/* ── Crystalline mark — high contrast for dark backgrounds ── */
function Emblem({ className = '' }) {
  return (
    <div className={`text-center mb-10 ${className}`}>
      <div className="relative w-[88px] h-[88px] mx-auto mb-6">
        <svg viewBox="0 0 88 88" className="w-full h-full">
          {/* Shadow planes — deep void */}
          <polygon points="44,6 74,26 44,46" fill="#030308" stroke="#0f1a2e" strokeWidth="1" />
          <polygon points="44,46 74,26 74,62" fill="#050510" stroke="#0f1a2e" strokeWidth="1" />
          <polygon points="44,46 74,62 44,82 14,62" fill="#060612" stroke="#0f1a2e" strokeWidth="1" />
          <polygon points="14,26 44,6 44,46 14,62" fill="#04040c" stroke="#0f1a2e" strokeWidth="1" />

          {/* Outer hex — dark, defined edge */}
          <polygon points="44,20 66,34 66,54 44,68 22,54 22,34"
            fill="#0a1420" stroke="#1e4a78" strokeWidth="1.6" />
          {/* Mid hex — light-struck face */}
          <polygon points="44,28 58,38 58,50 44,60 30,50 30,38"
            fill="#143058" stroke="#2a7ab8" strokeWidth="1.8" />
          {/* Core hex — brightest face, sharp chiaroscuro */}
          <polygon points="44,34 52,40 52,48 44,54 36,48 36,40"
            fill="#1e4a78" stroke="#48b8ee" strokeWidth="2" />
          {/* Center point */}
          <circle cx="44" cy="44" r="2.5" fill="#88ddff" />
        </svg>
      </div>

      <h1 className="font-mono text-2xl font-bold tracking-[0.5em] text-slate-300 mb-3">
        NUMERIC EVOLUTION
      </h1>
      <div className="flex items-center gap-3 mb-1.5">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
        <span className="text-xs text-slate-500 tracking-[0.3em] font-mono">· 数 值 进 化 系 统 ·</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setSubmitting(true);

    // Reset password path: no auth context needed
    if (mode === 'reset') {
      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.trim(), new_password: password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '重置失败');
        toast.success(data.message || '密码已重置');
        setPassword('');
        setMode('login');
      } catch (err) {
        toast.error(err.message);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Login / Register
    try {
      if (mode === 'login') {
        await login(username.trim(), password);
      } else {
        if (password.length < 4) {
          toast.error('密码至少4个字符');
          setSubmitting(false);
          return;
        }
        await register(username.trim(), password);
      }
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = (next) => {
    setMode(next);
    setPassword('');
  };

  const inputClass =
    'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 ' +
    'text-white text-sm font-mono outline-none ' +
    'focus:border-cyan-400/50 focus:bg-white/8 focus:shadow-[0_0_20px_rgba(0,229,255,0.1)] ' +
    'transition-all placeholder:text-white/15';

  const isReset = mode === 'reset';
  const btnAccent = isReset
    ? 'border-violet-400/20 text-violet-300/70 bg-violet-500/[0.04] hover:border-violet-400/50 hover:text-violet-200 hover:bg-violet-500/[0.08] hover:shadow-[0_0_28px_rgba(167,139,250,0.12)]'
    : 'border-cyan-400/20 text-cyan-300/70 bg-cyan-500/[0.04] hover:border-cyan-400/50 hover:text-cyan-200 hover:bg-cyan-500/[0.08] hover:shadow-[0_0_28px_rgba(0,229,255,0.12)]';

  const btnLabel = submitting ? '···'
    : mode === 'login' ? '进 入 系 统'
    : mode === 'register' ? '创 建 账 号'
    : '重 置 密 码';

  const pwdLabel = isReset ? '新密码' : 'Password';
  const pwdPlaceholder = isReset ? '输入新密码（至少4位）' : '输入密码';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: '#030308' }}>
      <AuroraBg />

      <div className="w-full max-w-md relative z-10">
        <Emblem className="anim-fade-up anim-d0" />

        {/* Glassmorphism card */}
        <form onSubmit={handleSubmit}
          className="anim-fade-up anim-d1 glass-noise relative overflow-hidden rounded-2xl p-7 space-y-5"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(40px) saturate(1.6)',
            WebkitBackdropFilter: 'blur(40px) saturate(1.6)',
            border: '1.5px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 48px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.04)',
          }}
        >
          <EdgeGlow />

          {/* Username */}
          <div className="relative z-10 anim-fade-up anim-d2">
            <label className="text-[11px] text-slate-500 block mb-1.5 tracking-widest font-mono uppercase">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="输入用户名"
              autoFocus
              className={inputClass}
            />
          </div>

          {/* Password / New password */}
          <div className="relative z-10 anim-fade-up anim-d3">
            <label className="text-[11px] text-slate-500 block mb-1.5 tracking-widest font-mono uppercase">
              {pwdLabel}
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={pwdPlaceholder}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(e); }}
              className={inputClass}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !username.trim() || !password}
            className={'anim-fade-up anim-d4 relative z-10 w-full py-3 rounded-lg font-mono text-sm tracking-widest '
              + 'border active:scale-[0.98] transition-all disabled:opacity-20 disabled:cursor-not-allowed '
              + btnAccent}
          >
            {btnLabel}
          </button>

          {/* Toggle row */}
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-600 font-mono relative z-10 anim-fade-up anim-d5">
            {mode !== 'login' && (
              <button type="button" onClick={() => toggleMode('login')} className="hover:text-cyan-400 transition-colors">
                ← 登录
              </button>
            )}
            {mode !== 'register' && (
              <button type="button" onClick={() => toggleMode('register')} className="hover:text-cyan-400 transition-colors">
                注册
              </button>
            )}
            {mode !== 'reset' && (
              <button type="button" onClick={() => toggleMode('reset')} className="hover:text-violet-400 transition-colors">
                忘记密码
              </button>
            )}
          </div>
        </form>

        <p className="text-center text-white/10 text-[11px] mt-6 font-mono">
          default · admin / admin
        </p>
      </div>
    </div>
  );
}
