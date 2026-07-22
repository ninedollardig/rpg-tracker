import { Router } from 'express';
import { getDb, rowsToObjects } from '../db.js';
import { getLevelProgress, countStreakDates } from '../services/leveling.js';

const router = Router();

router.get('/summary', async (req, res) => {
  const db = await getDb();

  // Authoritative: character table
  const charRow = rowsToObjects(db.exec('SELECT total_exp, level FROM character WHERE user_id = ?', [req.userId]));
  const charExp = charRow[0]?.total_exp || 0;

  const totalActivities = db.exec('SELECT COUNT(*) FROM activities WHERE user_id = ?', [req.userId])[0]?.values[0]?.[0] || 0;
  const actExp = db.exec('SELECT COALESCE(SUM(exp_earned), 0) FROM activities WHERE user_id = ?', [req.userId])[0]?.values[0]?.[0] || 0;

  // Also count completed weekly tasks
  const wtCount = db.exec('SELECT COUNT(*) FROM weekly_tasks WHERE user_id = ? AND completed = 1', [req.userId])[0]?.values[0]?.[0] || 0;
  const wtExp = db.exec('SELECT COALESCE(SUM(score), 0) FROM weekly_tasks WHERE user_id = ? AND completed = 1', [req.userId])[0]?.values[0]?.[0] || 0;

  const expByCategory = rowsToObjects(
    db.exec(`
      SELECT at.category, COALESCE(SUM(a.exp_earned), 0) as exp
      FROM activities a
      JOIN activity_types at ON a.activity_type_id = at.id
      WHERE a.user_id = ?
      GROUP BY at.category
    `, [req.userId])
  );

  // Merge weekly task EXP into category totals
  const wtCatRows = rowsToObjects(
    db.exec(`
      SELECT category, COALESCE(SUM(score), 0) as exp
      FROM weekly_tasks
      WHERE user_id = ? AND completed = 1 AND category != ''
      GROUP BY category
    `, [req.userId])
  );
  const catMap = {};
  for (const r of expByCategory) catMap[r.category] = (catMap[r.category] || 0) + r.exp;
  for (const r of wtCatRows) catMap[r.category] = (catMap[r.category] || 0) + r.exp;
  const mergedCategories = Object.entries(catMap).map(([category, exp]) => ({ category, exp }));

  // Merge activity dates and weekly task dates for streak calculation
  const actResult = db.exec('SELECT DISTINCT logged_date FROM activities WHERE user_id = ?', [req.userId]);
  const actDates = actResult.length ? actResult[0].values.map(r => r[0]) : [];

  const wtResult = db.exec('SELECT DISTINCT week_start, weekday FROM weekly_tasks WHERE user_id = ? AND completed = 1', [req.userId]);
  const wtDates = [];
  if (wtResult.length) {
    for (const row of wtResult[0].values) {
      const d = new Date(row[0]);
      d.setDate(d.getDate() + row[1]);
      wtDates.push(d.toISOString().slice(0, 10));
    }
  }

  const dateSet = new Set([...actDates, ...wtDates]);
  const dates = [...dateSet].sort().reverse();
  let streak = 0;
  let longestStreak = 0;
  if (dates.length > 0) {
    const today = new Date().toISOString().slice(0, 10);
    const yesterdayStr = new Date(new Date() - 86400000).toISOString().slice(0, 10);
    let startDate = null;
    if (dates[0] === today) {
      startDate = new Date();
    } else if (dates[0] === yesterdayStr) {
      startDate = new Date(new Date() - 86400000);
    }
    if (startDate) {
      const dateSet = new Set(dates);
      let current = new Date(startDate);
      while (dateSet.has(current.toISOString().slice(0, 10))) {
        streak++;
        current = new Date(current - 86400000);
      }
    }
    const sortedDates = dates.map(d => new Date(d)).sort((a, b) => a - b);
    let currentStreak = 1;
    longestStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const diff = (sortedDates[i] - sortedDates[i - 1]) / 86400000;
      if (diff === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
  }

  res.json({
    total_activities: totalActivities + wtCount,
    total_acts_only: totalActivities,
    total_wt_only: wtCount,
    total_exp: charExp,
    total_exp_acts: actExp,
    total_exp_wt: wtExp,
    total_exp_bonus: charExp - actExp - wtExp,
    exp_by_category: mergedCategories,
    current_streak: streak,
    longest_streak: longestStreak,
  });
});

router.get('/trends', async (req, res) => {
  const db = await getDb();
  const { days = '30', category } = req.query;

  const since = new Date();
  since.setDate(since.getDate() - parseInt(days));
  const sinceStr = since.toISOString().slice(0, 10);

  let sql = `
    SELECT a.logged_date as date, SUM(a.value) as value, SUM(a.exp_earned) as exp, at.category
    FROM activities a
    JOIN activity_types at ON a.activity_type_id = at.id
    WHERE a.user_id = ? AND a.logged_date >= ?
  `;
  const params = [req.userId, sinceStr];

  if (category && category !== 'all') {
    sql += ' AND at.category = ?';
    params.push(category);
  }

  sql += ' GROUP BY a.logged_date, at.category ORDER BY a.logged_date';

  const data = rowsToObjects(db.exec(sql, params));

  // Merge weekly task trends (calculate actual date = week_start + weekday)
  const wtTrendSql = `
    SELECT date(week_start, '+' || weekday || ' days') as date, SUM(score) as exp, category
    FROM weekly_tasks
    WHERE user_id = ? AND completed = 1 AND week_start >= ? AND category != ''
    GROUP BY date, category
    ORDER BY date
  `;
  const wtTrendParams = [req.userId, sinceStr];
  if (category && category !== 'all') {
    const wtTrendData = rowsToObjects(
      db.exec(wtTrendSql.replace('GROUP BY', 'AND category = ? GROUP BY'), [...wtTrendParams, category])
    );
    res.json({ data: [...data, ...wtTrendData] });
  } else {
    const wtTrendData = rowsToObjects(db.exec(wtTrendSql, wtTrendParams));
    res.json({ data: [...data, ...wtTrendData] });
  }
});

router.get('/yearly-heatmap', async (req, res) => {
  const db = await getDb();
  const year = parseInt(req.query.year) || new Date().getFullYear();
  const prefix = `${year}-`;

  // Activity daily scores
  const actDays = rowsToObjects(
    db.exec(`
      SELECT logged_date as date, SUM(exp_earned) as exp
      FROM activities
      WHERE user_id = ? AND logged_date LIKE ?
      GROUP BY logged_date
    `, [req.userId, `${prefix}%`])
  );

  // Weekly task daily scores (approximate: week_start + weekday offset)
  const wtRows = rowsToObjects(
    db.exec(`
      SELECT week_start, weekday, SUM(score) as exp
      FROM weekly_tasks
      WHERE user_id = ? AND completed = 1 AND week_start LIKE ?
      GROUP BY week_start, weekday
    `, [req.userId, `${prefix}%`])
  );

  // Merge into daily map
  const dayMap = {};
  for (const d of actDays) {
    dayMap[d.date] = (dayMap[d.date] || 0) + d.exp;
  }
  for (const w of wtRows) {
    const d = new Date(w.week_start);
    d.setDate(d.getDate() + w.weekday);
    const dateStr = d.toISOString().slice(0, 10);
    if (dateStr.startsWith(prefix)) {
      dayMap[dateStr] = (dayMap[dateStr] || 0) + w.exp;
    }
  }

  // Build 12×31 grid
  const months = [];
  for (let m = 0; m < 12; m++) {
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, date: dateStr, exp: dayMap[dateStr] || 0 });
    }
    months.push({ month: m + 1, label: `${m + 1}月`, days });
  }

  res.json({ year, months });
});

router.get('/daily', async (req, res) => {
  const db = await getDb();
  const { year, month } = req.query;

  const y = parseInt(year) || new Date().getFullYear();
  const m = parseInt(month) || new Date().getMonth() + 1;
  const prefix = `${y}-${String(m).padStart(2, '0')}`;

  const days = rowsToObjects(
    db.exec(`
      SELECT logged_date as date, COUNT(*) as count, SUM(exp_earned) as exp
      FROM activities
      WHERE user_id = ? AND logged_date LIKE ?
      GROUP BY logged_date
      ORDER BY logged_date
    `, [req.userId, `${prefix}%`])
  );

  res.json({ days });
});

router.get('/weekly-report', async (req, res) => {
  const db = await getDb();

  // Calculate this week's Monday 00:00 and next Monday 00:00
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);

  const mondayStr = monday.toISOString().slice(0, 10);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const sundayStr = sunday.toISOString().slice(0, 10);

  // Character data
  const charRow = rowsToObjects(db.exec('SELECT total_exp, level FROM character WHERE user_id = ?', [req.userId]));
  const char = charRow[0];
  if (!char) return res.json({ error: '角色不存在' });
  const progress = getLevelProgress(char.total_exp);

  // Activities this week
  const actResult = db.exec(
    'SELECT COUNT(*) as cnt, COALESCE(SUM(exp_earned), 0) as exp FROM activities WHERE user_id = ? AND logged_date >= ? AND logged_date < ?',
    [req.userId, mondayStr, nextMonday.toISOString().slice(0, 10)]
  );
  const actData = rowsToObjects(actResult)[0];
  const activitiesCount = actData?.cnt || 0;
  const actExp = actData?.exp || 0;

  // Weekly tasks this week
  const wtResult = db.exec(
    'SELECT COUNT(*) as total, SUM(completed) as done_cnt, COALESCE(SUM(CASE WHEN completed = 1 THEN score ELSE 0 END), 0) as exp FROM weekly_tasks WHERE user_id = ? AND week_start = ?',
    [req.userId, mondayStr]
  );
  const wtData = rowsToObjects(wtResult)[0];
  const tasksCompleted = wtData?.done_cnt || 0;
  const tasksTotal = wtData?.total || 0;
  const wtExp = wtData?.exp || 0;

  const totalExp = actExp + wtExp;

  // New achievements this week
  const newAchievements = rowsToObjects(
    db.exec(
      `SELECT a.name_zh, a.icon, a.description_zh
       FROM user_achievements ua
       JOIN achievements a ON ua.achievement_id = a.id
       WHERE ua.user_id = ? AND ua.unlocked_at >= ?
       ORDER BY ua.unlocked_at`,
      [req.userId, mondayStr]
    )
  );

  // Top category by exp
  let topCategory = null;
  const catResult = db.exec(
    `SELECT at.category, COALESCE(SUM(a.exp_earned), 0) as exp
     FROM activities a
     JOIN activity_types at ON a.activity_type_id = at.id
     WHERE a.user_id = ? AND a.logged_date >= ? AND a.logged_date < ?
     GROUP BY at.category
     ORDER BY exp DESC
     LIMIT 1`,
    [req.userId, mondayStr, nextMonday.toISOString().slice(0, 10)]
  );
  const catData = rowsToObjects(catResult);
  if (catData.length && catData[0].exp > 0) topCategory = catData[0].category;

  // Also check weekly_tasks category contributions for top category
  const wtCatResult = db.exec(
    `SELECT category, COALESCE(SUM(score), 0) as exp
     FROM weekly_tasks
     WHERE user_id = ? AND completed = 1 AND category != '' AND week_start = ?
     GROUP BY category
     ORDER BY exp DESC`,
    [req.userId, mondayStr]
  );
  const wtCatData = rowsToObjects(wtCatResult);
  const catMap = {};
  if (catData.length) catMap[catData[0].category] = catData[0].exp;
  for (const r of wtCatData) catMap[r.category] = (catMap[r.category] || 0) + r.exp;
  if (Object.keys(catMap).length > 0) {
    topCategory = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0][0];
  }

  // Streak: reuse activity dates approach (include weekly_tasks dates too)
  const actDatesResult = db.exec('SELECT DISTINCT logged_date FROM activities WHERE user_id = ? ORDER BY logged_date DESC', [req.userId]);
  const actDates = actDatesResult.length ? actDatesResult[0].values.map(r => r[0]) : [];

  const wtDatesResult = db.exec(
    'SELECT DISTINCT week_start, weekday FROM weekly_tasks WHERE user_id = ? AND completed = 1',
    [req.userId]
  );
  const allDates = [...actDates];
  if (wtDatesResult.length) {
    for (const row of wtDatesResult[0].values) {
      const d = new Date(row[0]);
      d.setDate(d.getDate() + row[1]);
      allDates.push(d.toISOString().slice(0, 10));
    }
  }
  const uniqueDates = [...new Set(allDates)].sort().reverse();
  const streakDays = countStreakDates(uniqueDates);

  // Level up detection: check if exp before this week would yield a lower level
  const expBeforeWeek = char.total_exp - totalExp;
  const prevProgress = getLevelProgress(Math.max(0, expBeforeWeek));
  const levelUp = progress.level > prevProgress.level;

  res.json({
    week_start: mondayStr,
    week_end: sundayStr,
    total_exp: totalExp,
    tasks_completed: tasksCompleted,
    tasks_total: tasksTotal,
    activities_logged: activitiesCount,
    new_achievements: newAchievements,
    top_category: topCategory,
    streak_days: streakDays,
    level: progress.level,
    level_up: levelUp,
  });
});

export default router;
