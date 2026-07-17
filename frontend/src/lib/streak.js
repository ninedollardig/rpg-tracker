/**
 * Returns flame display props based on consecutive streak days.
 * @param {number} streak
 * @returns {{ size: number, label: string, className: string } | null} null means "don't show"
 */
export function getStreakFlame(streak) {
  if (!streak || streak < 1) return null;

  if (streak >= 30) {
    return { size: 28, label: '永恒', className: 'text-rose-400 drop-shadow-[0_0_12px_#f87171]' };
  }
  if (streak >= 14) {
    return { size: 24, label: '熔岩', className: 'text-orange-400 drop-shadow-[0_0_8px_orange]' };
  }
  if (streak >= 7) {
    return { size: 20, label: '烈焰', className: 'text-amber-400' };
  }
  if (streak >= 3) {
    return { size: 16, label: '持续', className: '' };
  }
  // streak 1-2
  return { size: 12, label: '初燃', className: '' };
}
