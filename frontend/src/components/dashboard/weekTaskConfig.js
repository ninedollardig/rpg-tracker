const CATEGORY_COLORS = {
  '生活': { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
  '学习': { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.2)' },
  '娱乐': { color: '#f472b6', bg: 'rgba(244,114,182,0.08)', border: 'rgba(244,114,182,0.2)' },
  '休息': { color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)' },
};

export const catClass = (cat, key) => CATEGORY_COLORS[cat]?.[key] || '';

export const CATEGORIES = ['生活', '学习', '娱乐', '休息'];

export const todayWeekday = () => (new Date().getDay() + 6) % 7;
