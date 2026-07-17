export default function StudyLoading({ message = 'AI 正在处理你的学习材料...', sub = '这可能需要十几秒' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-5">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
        <div className="absolute inset-0 rounded-full border-2 border-cyan-400/40 animate-spin"
          style={{ borderTopColor: 'transparent', borderRightColor: 'transparent' }} />
      </div>
      <div className="text-center">
        <p className="text-sm text-cyan-400 font-semibold tracking-wide">{message}</p>
        <p className="text-[11px] text-slate-600 mt-1">{sub}</p>
      </div>
    </div>
  );
}
