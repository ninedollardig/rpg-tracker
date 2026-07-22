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
      <div className="absolute -top-2 left-8 w-4 h-4 rotate-45 border-l border-t rounded-sm"
        style={{ background: 'var(--card-narrative)', borderColor: 'var(--card-narrative-border)' }} />

      <div className="backdrop-blur-xl rounded-2xl px-4 py-3 border"
        style={{ background: 'var(--card-narrative)', borderColor: 'var(--card-narrative-border)' }}>
        <div className="flex items-start gap-2.5">
          <MessageCircle size={15} className="text-amber-400/60 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-100/70 leading-relaxed italic">
            {narrative}
          </p>
        </div>
      </div>
    </div>
  );
}
