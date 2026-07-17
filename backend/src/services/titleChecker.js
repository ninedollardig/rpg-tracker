import { rowsToObjects } from '../db.js';

/**
 * All conditional titles and their check functions.
 * Each check function receives (db, userId) and returns true/false.
 */
const CONDITIONAL_TITLES = [
  {
    title: '初出茅庐',
    check(db, userId) {
      const r = db.exec(
        'SELECT COUNT(*) as cnt FROM activities WHERE user_id = ?',
        [userId]
      );
      const actCount = r[0]?.values[0]?.[0] || 0;
      const r2 = db.exec(
        'SELECT COUNT(*) as cnt FROM weekly_tasks WHERE user_id = ? AND completed = 1',
        [userId]
      );
      const wtCount = r2[0]?.values[0]?.[0] || 0;
      return (actCount + wtCount) >= 1;
    },
  },
  {
    title: '晨光行者',
    check(db, userId) {
      const r = db.exec(
        'SELECT streak_count FROM daily_checkins WHERE user_id = ? ORDER BY checkin_date DESC LIMIT 1',
        [userId]
      );
      const streak = r[0]?.values[0]?.[0] || 0;
      return streak >= 7;
    },
  },
  {
    title: '永夜修士',
    check(db, userId) {
      const r = db.exec(
        'SELECT COUNT(*) as cnt FROM weekly_tasks WHERE user_id = ? AND completed = 1',
        [userId]
      );
      const count = r[0]?.values[0]?.[0] || 0;
      return count >= 50;
    },
  },
  {
    title: '钢铁纪律',
    check(db, userId) {
      const r = db.exec(
        'SELECT streak_count FROM daily_checkins WHERE user_id = ? ORDER BY checkin_date DESC LIMIT 1',
        [userId]
      );
      const streak = r[0]?.values[0]?.[0] || 0;
      return streak >= 30;
    },
  },
  {
    title: '全栈旅人',
    check(db, userId) {
      const rows = rowsToObjects(
        db.exec(
          `SELECT a.category, COUNT(*) as cnt
           FROM user_achievements ua
           JOIN achievements a ON ua.achievement_id = a.id
           WHERE ua.user_id = ?
           GROUP BY a.category`,
          [userId]
        )
      );
      const categories = ['生活', '学习', '娱乐', '休息'];
      return categories.every(cat => {
        const row = rows.find(r => r.category === cat);
        return (row?.cnt || 0) >= 5;
      });
    },
  },
  {
    title: '暴击猎手',
    check(db, userId) {
      const r = db.exec(
        'SELECT COUNT(*) as cnt FROM user_titles WHERE user_id = ?',
        [userId]
      );
      const count = r[0]?.values[0]?.[0] || 0;
      return count >= 3;
    },
  },
  {
    title: '麒麟才子',
    check(db, userId) {
      const r = db.exec(
        `SELECT COUNT(*) as cnt FROM activities a
         JOIN activity_types at ON a.activity_type_id = at.id
         WHERE a.user_id = ? AND at.category = '学习'`,
        [userId]
      );
      const count = r[0]?.values[0]?.[0] || 0;
      return count >= 100;
    },
  },
  {
    title: '禅心居士',
    check(db, userId) {
      const r = db.exec(
        `SELECT COUNT(*) as cnt FROM activities a
         JOIN activity_types at ON a.activity_type_id = at.id
         WHERE a.user_id = ? AND at.category = '休息'`,
        [userId]
      );
      const count = r[0]?.values[0]?.[0] || 0;
      return count >= 50;
    },
  },
  {
    title: '逍遥散人',
    check(db, userId) {
      const r = db.exec(
        `SELECT COUNT(*) as cnt FROM activities a
         JOIN activity_types at ON a.activity_type_id = at.id
         WHERE a.user_id = ? AND at.category = '娱乐'`,
        [userId]
      );
      const count = r[0]?.values[0]?.[0] || 0;
      return count >= 100;
    },
  },
  {
    title: '铁血战士',
    check(db, userId) {
      const r = db.exec(
        `SELECT COUNT(*) as cnt FROM activities a
         JOIN activity_types at ON a.activity_type_id = at.id
         WHERE a.user_id = ? AND at.category = '生活'`,
        [userId]
      );
      const count = r[0]?.values[0]?.[0] || 0;
      return count >= 100;
    },
  },
  {
    title: '破界者',
    check(db, userId) {
      const r = db.exec('SELECT level FROM character WHERE user_id = ?', [userId]);
      const level = r[0]?.values[0]?.[0] || 1;
      return level >= 15;
    },
  },
  {
    title: '星海旅人',
    check(db, userId) {
      const r = db.exec(
        'SELECT COUNT(*) as cnt FROM user_achievements WHERE user_id = ?',
        [userId]
      );
      const count = r[0]?.values[0]?.[0] || 0;
      return count >= 20;
    },
  },
  {
    title: '黎明守望者',
    check(db, userId) {
      // Must have ≥7 consecutive daily checkins
      const checkinRows = rowsToObjects(
        db.exec(
          'SELECT checkin_date FROM daily_checkins WHERE user_id = ? ORDER BY checkin_date DESC',
          [userId]
        )
      );
      if (checkinRows.length < 7) return false;

      // Verify the last 7 checkin dates are consecutive
      const dates = checkinRows.map(r => r.checkin_date).slice(0, 7);
      for (let i = 0; i < dates.length - 1; i++) {
        const curr = new Date(dates[i]);
        const prev = new Date(dates[i + 1]);
        if ((curr - prev) / 86400000 !== 1) return false;
      }

      // On each of those 7 dates, must have ≥3 distinct activity types
      for (const date of dates) {
        const r = db.exec(
          'SELECT COUNT(DISTINCT activity_type_id) as cnt FROM activities WHERE user_id = ? AND logged_date = ?',
          [userId, date]
        );
        const distinctCount = r[0]?.values[0]?.[0] || 0;
        if (distinctCount < 3) return false;
      }

      return true;
    },
  },
];

/**
 * Check all conditional titles for a user. Titles already owned are skipped.
 * Returns array of newly awarded title names.
 */
export function checkConditionalTitles(db, userId) {
  const newTitles = [];

  for (const { title, check } of CONDITIONAL_TITLES) {
    if (!check(db, userId)) continue;

    // Check if already owned
    const existing = db.exec(
      'SELECT id FROM user_titles WHERE user_id = ? AND title = ?',
      [userId, title]
    );
    if (existing.length && existing[0].values.length) continue;

    // New title — award it
    db.run(
      'INSERT OR IGNORE INTO user_titles (user_id, title) VALUES (?, ?)',
      [userId, title]
    );
    newTitles.push(title);
  }

  return newTitles;
}
