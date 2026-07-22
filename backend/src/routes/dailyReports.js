import { Router } from 'express';
import { getDb, rowsToObjects, saveDb } from '../db.js';

const router = Router();

// GET /api/daily-reports — list all reports for current user, newest first
router.get('/', async (req, res) => {
  const db = await getDb();
  const reports = rowsToObjects(
    db.exec(
      'SELECT id, date, source, created_at, updated_at, substr(content, 1, 120) as preview FROM daily_reports WHERE user_id = ? ORDER BY date DESC',
      [req.userId]
    )
  );
  res.json({ reports });
});

// GET /api/daily-reports/:id — get single report full content
router.get('/:id', async (req, res) => {
  const db = await getDb();
  const rows = rowsToObjects(
    db.exec('SELECT * FROM daily_reports WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
  );
  if (!rows.length) return res.status(404).json({ error: '日报不存在' });
  res.json({ report: rows[0] });
});

// GET /api/daily-reports/date/:date — get report for a specific date
router.get('/date/:date', async (req, res) => {
  const db = await getDb();
  const rows = rowsToObjects(
    db.exec('SELECT * FROM daily_reports WHERE user_id = ? AND date = ?', [req.userId, req.params.date])
  );
  if (!rows.length) return res.status(404).json({ error: '该日期没有日报' });
  res.json({ report: rows[0] });
});

// POST /api/daily-reports — create a manual report
router.post('/', async (req, res) => {
  const { date, content } = req.body;
  if (!date || !content) return res.status(400).json({ error: '日期和内容不能为空' });

  const db = await getDb();

  // Check if report already exists for this date
  const existing = db.exec('SELECT id, source FROM daily_reports WHERE user_id = ? AND date = ?', [req.userId, date]);
  if (existing.length && existing[0].values.length) {
    return res.status(409).json({ error: '该日期已有日报', existing_id: existing[0].values[0][0] });
  }

  db.run(
    'INSERT INTO daily_reports (user_id, date, content, source) VALUES (?, ?, ?, ?)',
    [req.userId, date, content, 'manual']
  );
  saveDb();

  const created = rowsToObjects(
    db.exec('SELECT * FROM daily_reports WHERE user_id = ? AND date = ?', [req.userId, date])
  );
  res.status(201).json({ report: created[0] });
});

// PUT /api/daily-reports/:id — update a report (manual only)
router.put('/:id', async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: '内容不能为空' });

  const db = await getDb();
  const rows = rowsToObjects(
    db.exec('SELECT * FROM daily_reports WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
  );
  if (!rows.length) return res.status(404).json({ error: '日报不存在' });

  db.run(
    "UPDATE daily_reports SET content = ?, updated_at = datetime('now','localtime') WHERE id = ? AND user_id = ?",
    [content, req.params.id, req.userId]
  );
  saveDb();

  const updated = rowsToObjects(
    db.exec('SELECT * FROM daily_reports WHERE id = ?', [req.params.id])
  );
  res.json({ report: updated[0] });
});

// DELETE /api/daily-reports/:id — delete a report
router.delete('/:id', async (req, res) => {
  const db = await getDb();
  const rows = rowsToObjects(
    db.exec('SELECT id FROM daily_reports WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
  );
  if (!rows.length) return res.status(404).json({ error: '日报不存在' });

  db.run('DELETE FROM daily_reports WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  saveDb();
  res.json({ success: true });
});

// POST /api/daily-reports/generate — auto-generate today's report from data
router.post('/generate', async (req, res) => {
  const { date } = req.body;
  const reportDate = date || new Date().toISOString().slice(0, 10);
  const db = await getDb();

  // Check existing
  const existing = db.exec('SELECT id, source FROM daily_reports WHERE user_id = ? AND date = ?', [req.userId, reportDate]);
  if (existing.length && existing[0].values.length) {
    const existingId = existing[0].values[0][0];
    const existingSource = existing[0].values[0][1];
    if (existingSource === 'manual') {
      return res.status(409).json({ error: '该日期已有手动日报，生成会覆盖。请先删除或确认覆盖', existing_id: existingId, source: 'manual' });
    }
    // Auto-generated exists — overwrite silently
    db.run('DELETE FROM daily_reports WHERE id = ?', [existingId]);
  }

  // Gather data for the report date
  const charRow = rowsToObjects(db.exec('SELECT * FROM character WHERE user_id = ?', [req.userId]))[0];

  // Activities on that date
  const activities = rowsToObjects(
    db.exec(`
      SELECT at.name_zh, at.icon, at.category, a.value, a.exp_earned
      FROM activities a
      JOIN activity_types at ON a.activity_type_id = at.id
      WHERE a.user_id = ? AND a.logged_date = ?
      ORDER BY a.created_at
    `, [req.userId, reportDate])
  );

  // Weekly tasks for the week containing reportDate
  const dateObj = new Date(reportDate);
  const dayOfWeek = dateObj.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(dateObj);
  monday.setDate(dateObj.getDate() - daysFromMonday);
  const mondayStr = monday.toISOString().slice(0, 10);

  const weeklyTasks = rowsToObjects(
    db.exec(`
      SELECT content, category, subcategory, score, completed
      FROM weekly_tasks
      WHERE user_id = ? AND week_start = ?
      ORDER BY sort_order
    `, [req.userId, mondayStr])
  );

  // New achievements earned on this date
  const newAchievements = rowsToObjects(
    db.exec(`
      SELECT a.name_zh, a.icon, a.description_zh, a.tier
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = ? AND date(ua.unlocked_at) = ?
      ORDER BY ua.unlocked_at
    `, [req.userId, reportDate])
  );

  // Streak calculation
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
  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (uniqueDates[0] === today || uniqueDates[0] === yesterday || uniqueDates[0] === reportDate) {
    const dateSet = new Set(uniqueDates);
    let current = new Date(reportDate);
    while (dateSet.has(current.toISOString().slice(0, 10))) {
      streak++;
      current = new Date(current - 86400000);
    }
  }

  // Build markdown content
  const lines = [];
  lines.push('## 📊 今日数据概览');
  lines.push('');
  lines.push('| 维度 | 数值 |');
  lines.push('|------|------|');
  lines.push(`| 等级 | Lv.${charRow?.level || 1} |`);
  lines.push(`| 总修为 | ${(charRow?.total_exp || 0).toLocaleString()} EXP |`);
  lines.push(`| 修炼连续 | ${streak} 天 |`);
  lines.push('');

  if (activities.length > 0) {
    const totalExp = activities.reduce((s, a) => s + a.exp_earned, 0);
    lines.push(`## ✅ 今日活动 (${activities.length}项 / +${totalExp} EXP)`);
    lines.push('');
    for (const a of activities) {
      lines.push(`- ${a.icon} ${a.name_zh} ×${a.value} (+${a.exp_earned} EXP)`);
    }
    lines.push('');
  } else {
    lines.push('## ✅ 今日活动');
    lines.push('');
    lines.push('今日暂无活动记录。');
    lines.push('');
  }

  if (weeklyTasks.length > 0) {
    const done = weeklyTasks.filter(t => t.completed).length;
    lines.push(`## 📋 每周任务 (${done}/${weeklyTasks.length} 完成)`);
    lines.push('');
    for (const t of weeklyTasks) {
      const mark = t.completed ? '✅' : '⬜';
      lines.push(`- ${mark} ${t.content || t.subcategory} (${t.category})`);
    }
    lines.push('');
  }

  if (newAchievements.length > 0) {
    lines.push('## 🏆 新成就');
    lines.push('');
    for (const a of newAchievements) {
      lines.push(`- ${a.icon} **${a.name_zh}** — ${a.description_zh}`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  const now = new Date();
  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  lines.push(`*由系统自动生成于 ${reportDate} ${timeStr}*`);

  const content = lines.join('\n');

  db.run(
    'INSERT INTO daily_reports (user_id, date, content, source) VALUES (?, ?, ?, ?)',
    [req.userId, reportDate, content, 'auto']
  );
  saveDb();

  const created = rowsToObjects(
    db.exec('SELECT * FROM daily_reports WHERE user_id = ? AND date = ?', [req.userId, reportDate])
  );
  res.status(201).json({ report: created[0] });
});

export default router;
