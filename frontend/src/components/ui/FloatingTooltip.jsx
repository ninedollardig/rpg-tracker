import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

let activeTimer = null;
let hideTimer = null;

export function useFloatingTooltip() {
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });

  const show = useCallback((e, text) => {
    if (!text) return;
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    // small delay so quick mouse passes don't flash tooltip
    activeTimer = setTimeout(() => {
      setTooltip({ show: true, text, x: e.clientX + 14, y: e.clientY - 8 });
    }, 300);
  }, []);

  const move = useCallback((e) => {
    setTooltip(prev => prev.show ? { ...prev, x: e.clientX + 14, y: e.clientY - 8 } : prev);
  }, []);

  const hide = useCallback(() => {
    if (activeTimer) { clearTimeout(activeTimer); activeTimer = null; }
    hideTimer = setTimeout(() => {
      setTooltip(prev => ({ ...prev, show: false }));
    }, 100);
  }, []);

  const TooltipOverlay = tooltip.show
    ? createPortal(
        <div
          className="fixed pointer-events-none z-[9999] px-3 py-2 rounded-xl text-xs text-slate-200 leading-relaxed max-w-[220px] whitespace-pre-wrap"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            background: 'rgba(10,10,24,0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,229,255,0.08)',
          }}
        >
          {tooltip.text}
        </div>,
        document.body
      )
    : null;

  return { show, move, hide, TooltipOverlay };
}
