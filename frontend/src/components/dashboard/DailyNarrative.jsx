import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { apiGet } from '../../api/client';

export default function DailyNarrative() {
  const [narrative, setNarrative] = useState(null);

  useEffect(() => {
    apiGet('/narrative').then(d => setNarrative(d.narrative)).catch(() => {});
  }, []);

  if (!narrative) return null;

  return (
    <div className="relative">
      {/* Speech bubble pointer */}
      <div className="absolute -top-2 left-8 w-4 h-4 rotate-45 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border-l border-t border-cyan-500/15" />

      <div className="backdrop-blur-xl bg-gradient-to-br from-cyan-500/[0.04] to-violet-500/[0.04] border border-cyan-500/8 rounded-2xl px-4 py-3">
        <div className="flex items-start gap-2.5">
          <MessageCircle size={15} className="text-cyan-400/60 shrink-0 mt-0.5" />
          <p className="text-sm text-white/60 leading-relaxed italic">
            {narrative}
          </p>
        </div>
      </div>
    </div>
  );
}
