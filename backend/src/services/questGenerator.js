import { getDb, rowsToObjects } from '../db.js';

export function generateDailyQuests(db, userId) {
  const today = new Date().toISOString().slice(0, 10);

  const existing = db.exec(
    'SELECT uq.id FROM user_quests uq JOIN quests q ON uq.quest_id = q.id WHERE q.quest_type = ? AND uq.assigned_date = ? AND uq.user_id = ?',
    ['daily', today, userId]
  );
  if (existing.length && existing[0].values.length > 0) return;

  const quests = rowsToObjects(
    db.exec("SELECT * FROM quests WHERE quest_type = 'daily' AND is_active = 1 ORDER BY display_order")
  );

  const stmt = db.prepare(
    'INSERT INTO user_quests (quest_id, user_id, progress, target, assigned_date) VALUES (?, ?, 0, ?, ?)'
  );
  for (const q of quests) {
    stmt.run([q.id, userId, q.target_value, today]);
  }
  stmt.free();
}

export function generateWeeklyQuests(db, userId) {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  const weekKey = `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;

  const existing = db.exec('SELECT id FROM user_quests WHERE assigned_date = ? AND user_id = ?', [weekKey, userId]);
  if (existing.length && existing[0].values.length > 0) return;

  const quests = rowsToObjects(
    db.exec("SELECT * FROM quests WHERE quest_type = 'weekly' AND is_active = 1 ORDER BY display_order")
  );

  const stmt = db.prepare(
    'INSERT INTO user_quests (quest_id, user_id, progress, target, assigned_date) VALUES (?, ?, 0, ?, ?)'
  );
  for (const q of quests) {
    stmt.run([q.id, userId, q.target_value, weekKey]);
  }
  stmt.free();
}

export function updateQuestProgress(db, activityTypeId, value, loggedDate, userId) {
  const updates = [];

  // Get activity category for category-based quest matching
  const atRows = rowsToObjects(
    db.exec('SELECT category FROM activity_types WHERE id = ?', [activityTypeId])
  );
  const activityCategory = atRows[0]?.category || '';

  const loggedDateObj = new Date(loggedDate);
  const startOfYear = new Date(loggedDateObj.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((loggedDateObj - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  const weekKey = `${loggedDateObj.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;

  // Match quests by either specific activity_type_id or by category
  const activeQuests = rowsToObjects(
    db.exec(`
      SELECT uq.*, q.reward_exp, q.title_zh, q.quest_type
      FROM user_quests uq
      JOIN quests q ON uq.quest_id = q.id
      WHERE (q.activity_type_id = ? OR (q.category != '' AND q.category = ?))
        AND uq.user_id = ?
        AND uq.completed = 0
        AND (uq.assigned_date = ? OR uq.assigned_date = ?)
    `, [activityTypeId, activityCategory, userId, loggedDate, weekKey])
  );

  for (const uq of activeQuests) {
    const newProgress = uq.progress + value;
    const completed = newProgress >= uq.target;
    db.run(
      'UPDATE user_quests SET progress = ?, completed = ?, completed_at = CASE WHEN ? THEN datetime(\'now\') ELSE NULL END WHERE id = ?',
      [newProgress, completed ? 1 : 0, completed ? 1 : 0, uq.id]
    );
    updates.push({
      quest_id: uq.quest_id,
      title_zh: uq.title_zh,
      progress: newProgress,
      target: uq.target,
      completed,
      reward_exp: completed ? uq.reward_exp : 0,
    });
  }

  return updates;
}
