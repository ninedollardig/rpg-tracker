export function expForLevel(level) {
  if (level <= 1) return 0;
  return Math.round(100 * Math.pow(level, 1.5));
}

export function getLevelProgress(totalExp) {
  let level = 1;
  while (expForLevel(level + 1) <= totalExp) {
    level++;
  }
  const currentLevelExp = expForLevel(level);
  const nextLevelExp = expForLevel(level + 1);
  const progress = totalExp - currentLevelExp;
  const needed = nextLevelExp - currentLevelExp;
  return {
    level,
    currentExp: progress,
    expToNext: needed,
    percentage: Math.round((progress / needed) * 100),
  };
}

export function getTitleForLevel(level) {
  if (level >= 20) return '神话冒险者';
  if (level >= 15) return '传奇冒险者';
  if (level >= 11) return '英雄冒险者';
  if (level >= 8) return '精英冒险者';
  if (level >= 5) return '熟练冒险者';
  if (level >= 3) return '见习冒险者';
  return '新手冒险者';
}

const STAT_KEYS = {
  STR: 'strength',
  INT: 'intelligence',
  VIT: 'vitality',
  AGI: 'agility',
  WIS: 'wisdom',
  MOOD: 'mood',
};

export function calculateStats(statExp) {
  const stats = { strength: 1, intelligence: 1, vitality: 1, agility: 1, wisdom: 1, mood: 1 };
  for (const [key, jsKey] of Object.entries(STAT_KEYS)) {
    const exp = statExp[key] || 0;
    stats[jsKey] = 1 + Math.floor(Math.sqrt(exp) / 3);
  }
  return stats;
}

export function calculateStreak(db, userId) {
  // Use daily_checkins as the canonical streak source (same as check-in flame)
  const result = db.exec(
    'SELECT checkin_date FROM daily_checkins WHERE user_id = ? ORDER BY checkin_date DESC',
    [userId]
  );
  if (!result.length || !result[0].values.length) return 0;
  const dates = result[0].values.map(r => r[0]);
  return countStreakDates(dates);
}

export function countStreakDates(dates) {
  if (!dates.length) return 0;

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const yesterdayStr = new Date(today - 86400000).toISOString().slice(0, 10);

  let expected = null;
  if (dates[0] === todayStr) {
    expected = new Date(today);
  } else if (dates[0] === yesterdayStr) {
    expected = new Date(today - 86400000);
  } else {
    return 0;
  }

  let streak = 0;
  const dateSet = new Set(dates);
  while (true) {
    const s = expected.toISOString().slice(0, 10);
    if (dateSet.has(s)) {
      streak++;
      expected = new Date(expected - 86400000);
    } else {
      break;
    }
  }
  return streak;
}
