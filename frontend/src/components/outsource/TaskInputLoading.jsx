import { Sparkles } from 'lucide-react';

export default function TaskInputLoading() {
  return (
    <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
      <div className="p-12 text-center space-y-4">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/15 animate-ping" />
          <div className="absolute inset-0 rounded-full border-2 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          <Sparkles size={24} className="absolute inset-0 m-auto text-cyan-400" />
        </div>
        <p className="text-slate-400 text-sm">AI 正在拆解你的任务...</p>
        <p className="text-slate-600 text-xs">这可能需要十几秒</p>
      </div>
    </div>
  );
}
