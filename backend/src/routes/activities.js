import { Router } from 'express';
import { getDb, rowsToObjects, saveDb } from '../db.js';
import { getLevelProgress, getTitleForLevel, calculateStreak } from '../services/leveling.js';
import { checkAchievements } from '../services/achievementChecker.js';
import { checkConditionalTitles } from '../services/titleChecker.js';
import { generateDailyQuests, generateWeeklyQuests, updateQuestProgress } from '../services/questGenerator.js';
import { syncAfterCreate, syncAfterUpdate, syncAfterDelete } from '../services/feishuSync.js';
import { sendActivitySummary, sendAchievementNotification } from '../services/feishuNotify.js';

const router = Router();

router.get('/', async (req, res) => {
  const db = await getDb();
  const { category, days, limit = '20', offset = '0' } = req.query;

  let sql = `
    SELECT a.*, at.category, at.subcategory, at.name_zh, at.unit, at.icon, at.type_key
    FROM activities a
    JOIN activity_types at ON a.activity_type_id = at.id
    WHERE a.user_id = ?
  `;
  const params = [req.userId];
  let sinceStr = null;

  if (category) {
    sql += ' AND at.category = ?';
    params.push(category);
  }
  if (days) {
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));
    sinceStr = since.toISOString().slice(0, 10);
    sql += ' AND a.logged_date >= ?';
    params.push(sinceStr);
  }

  sql += ' ORDER BY a.logged_date DESC, a.created_at DESC';
  sql += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

  const activities = rowsToObjects(db.exec(sql, params));

  let countSql = 'SELECT COUNT(*) as total FROM activities a JOIN activity_types at ON a.activity_type_id = at.id WHERE a.user_id = ?';
  const countParams = [req.userId];
  if (category) { countSql += ' AND at.category = ?'; countParams.push(category); }
  if (days) { countSql += ' AND a.logged_date >= ?'; countParams.push(sinceStr); }
  const countResult = db.exec(countSql, countParams)[0];
  const total = countResult ? countResult.values[0][0] : 0;

  res.json({ activities, total });
});

router.post('/', async (req, res) => {
  const { activity_type_id, value, notes = '', logged_date } = req.body;

  if (!activity_type_id || !value || !logged_date) {
    return res.status(400).json({ error: '缺少必填字段：activity_type_id, value, logged_date' });
  }

  const db = await getDb();

  const typeResult = rowsToObjects(
    db.exec('SELECT * FROM activity_types WHERE id = ?', [activity_type_id])
  );
  if (!typeResult.length) {
    return res.status(404).json({ error: '活动类型不存在' });
  }
  const at = typeResult[0];

  const streak = calculateStreak(db, req.userId);
  const streakMultiplier = 1 + Math.min(streak * 0.05, 0.5);

  let baseExp = Math.round(at.default_exp_per_unit * value * streakMultiplier);

  generateDailyQuests(db, req.userId);
  generateWeeklyQuests(db, req.userId);

  const questUpdates = updateQuestProgress(db, activity_type_id, value, logged_date, req.userId);
  const completedQuests = questUpdates.filter(q => q.completed);

  if (completedQuests.length > 0) {
    baseExp = Math.round(baseExp * 1.5);
  }

  const expEarned = baseExp;

  db.run(
    'INSERT INTO activities (activity_type_id, value, notes, exp_earned, logged_date, user_id) VALUES (?, ?, ?, ?, ?, ?)',
    [activity_type_id, value, notes, expEarned, logged_date, req.userId]
  );
  const newActivityId = rowsToObjects(db.exec('SELECT last_insert_rowid() as id'))[0].id;

  db.run('UPDATE character SET total_exp = total_exp + ?, updated_at = datetime(\'now\') WHERE user_id = ?', [expEarned, req.userId]);

  const charResult = rowsToObjects(db.exec('SELECT total_exp, level FROM character WHERE user_id = ?', [req.userId]));
  const char = charResult[0];
  const progress = getLevelProgress(char.total_exp);
  let levelUp = null;
  if (progress.level > char.level) {
    const newTitle = getTitleForLevel(progress.level);
    db.run('UPDATE character SET level = ?, title = ?, updated_at = datetime(\'now\') WHERE user_id = ?', [progress.level, newTitle, req.userId]);
    levelUp = { from: char.level, to: progress.level, new_title: newTitle };
  }

  // Extended ops: achievements, titles — wrapped so they never block saveDb
  let newAchievements = [];
  let conditionalTitles = [];
  try {
    newAchievements = checkAchievements(db, req.userId);
    conditionalTitles = checkConditionalTitles(db, req.userId);
  } catch (e) {
    console.error('[activities] checkAchievements/titles failed:', e.message);
  }

  try {
    let questRewardExp = 0;
    for (const cq of completedQuests) {
      questRewardExp += cq.reward_exp || 0;
    }
    if (questRewardExp > 0) {
      db.run('UPDATE character SET total_exp = total_exp + ?, updated_at = datetime(\'now\') WHERE user_id = ?', [questRewardExp, req.userId]);
      const updatedChar = rowsToObjects(db.exec('SELECT total_exp, level FROM character WHERE user_id = ?', [req.userId]))[0];
      if (updatedChar) {
        const newProgress = getLevelProgress(updatedChar.total_exp);
        if (newProgress.level > updatedChar.level) {
          const newTitle = getTitleForLevel(newProgress.level);
          db.run('UPDATE character SET level = ?, title = ? WHERE user_id = ?', [newProgress.level, newTitle, req.userId]);
          levelUp = { from: updatedChar.level, to: newProgress.level, new_title: newTitle };
        }
      }
    }
  } catch (e) {
    console.error('[activities] quest reward failed:', e.message);
  }
  saveDb();

  const activity = rowsToObjects(
    db.exec('SELECT a.*, at.category, at.subcategory, at.name_zh, at.unit, at.icon FROM activities a JOIN activity_types at ON a.activity_type_id = at.id WHERE a.id = ?', [newActivityId])
  )[0];

  res.json({
    activity,
    exp_earned: expEarned,
    streak_multiplier: streakMultiplier,
    level_up: levelUp,
    new_achievements: newAchievements,
    conditional_titles: conditionalTitles,
    quest_updates: questUpdates,
  });

  // Fire-and-forget: Feishu sync & notify
  syncAfterCreate({ ...activity, unit: at.unit });
  sendActivitySummary(
    { ...activity, unit: at.unit, exp_earned: expEarned },
    { level: progress.level, total_exp: char.total_exp },
    streak,
    levelUp,
    req.userId
  );
  if (newAchievements?.length) {
    sendAchievementNotification(newAchievements, req.userId);
  }
});

router.put('/:id', async (req, res) => {
  const { value, notes } = req.body;
  const db = await getDb();

  const existing = rowsToObjects(
    db.exec('SELECT a.*, at.default_exp_per_unit FROM activities a JOIN activity_types at ON a.activity_type_id = at.id WHERE a.id = ? AND a.user_id = ?', [req.params.id, req.userId])
  );
  if (!existing.length) {
    return res.status(404).json({ error: '活动记录不存在' });
  }

  const oldExp = existing[0].exp_earned;
  const newValue = value ?? existing[0].value;
  const newNotes = notes !== undefined ? notes : existing[0].notes;
  const streak = calculateStreak(db, req.userId);
  const streakMultiplier = 1 + Math.min(streak * 0.05, 0.5);
  const newExp = Math.round(existing[0].default_exp_per_unit * newValue * streakMultiplier);

  db.run('UPDATE activities SET value = ?, notes = ?, exp_earned = ? WHERE id = ? AND user_id = ?', [newValue, newNotes, newExp, req.params.id, req.userId]);

  const diff = newExp - oldExp;
  db.run('UPDATE character SET total_exp = MAX(0, total_exp + ?), updated_at = datetime(\'now\') WHERE user_id = ?', [diff, req.userId]);

  const charResult = rowsToObjects(db.exec('SELECT total_exp, level FROM character WHERE user_id = ?', [req.userId]));
  const char = charResult[0];
  const progress = getLevelProgress(char.total_exp);
  if (progress.level !== char.level) {
    const newTitle = getTitleForLevel(progress.level);
    db.run('UPDATE character SET level = ?, title = ? WHERE user_id = ?', [progress.level, newTitle, req.userId]);
  }

  checkAchievements(db, req.userId);
  saveDb();

  const activity = rowsToObjects(
    db.exec('SELECT a.*, at.category, at.name_zh, at.unit, at.icon FROM activities a JOIN activity_types at ON a.activity_type_id = at.id WHERE a.id = ?', [req.params.id])
  )[0];

  res.json({ activity });

  // Fire-and-forget: Feishu sync
  syncAfterUpdate({ ...activity, feishu_record_id: existing[0].feishu_record_id });
});

router.delete('/:id', async (req, res) => {
  const db = await getDb();

  const existing = rowsToObjects(
    db.exec('SELECT * FROM activities WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
  );
  if (!existing.length) {
    return res.status(404).json({ error: '活动记录不存在' });
  }

  const expToDeduct = existing[0].exp_earned;
  db.run('DELETE FROM activities WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  db.run('UPDATE character SET total_exp = MAX(0, total_exp - ?), updated_at = datetime(\'now\') WHERE user_id = ?', [expToDeduct, req.userId]);

  const charResult = rowsToObjects(db.exec('SELECT total_exp, level FROM character WHERE user_id = ?', [req.userId]));
  const char = charResult[0];
  const progress = getLevelProgress(char.total_exp);
  if (progress.level < char.level) {
    const newTitle = getTitleForLevel(progress.level);
    db.run('UPDATE character SET level = ?, title = ? WHERE user_id = ?', [progress.level, newTitle, req.userId]);
  }

  saveDb();

  res.json({ deleted: true });

  // Fire-and-forget: Feishu sync
  syncAfterDelete(existing[0].feishu_record_id);
});

export default router;
