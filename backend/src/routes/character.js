import { Router } from 'express';
import { getDb, rowsToObjects, saveDb } from '../db.js';
import { getLevelProgress, getTitleForLevel, calculateStats, calculateStreak } from '../services/leveling.js';

const router = Router();

router.get('/', async (req, res) => {
  const db = await getDb();

  let char = rowsToObjects(db.exec('SELECT * FROM character WHERE user_id = ?', [req.userId]));
  if (!char.length) {
    db.run("INSERT INTO character (user_id, name, level, total_exp, title) VALUES (?, '勇者', 1, 0, '新手冒险者')", [req.userId]);
    saveDb();
    char = rowsToObjects(db.exec('SELECT * FROM character WHERE user_id = ?', [req.userId]));
  }

  const c = char[0];
  const progress = getLevelProgress(c.total_exp);

  const statExpResult = db.exec(`
    SELECT at.stat_contributions, SUM(a.exp_earned) as total_exp
    FROM activities a
    JOIN activity_types at ON a.activity_type_id = at.id
    WHERE a.user_id = ?
    GROUP BY at.id
  `, [req.userId]);

  const statExp = { STR: 0, INT: 0, VIT: 0, AGI: 0, WIS: 0, MOOD: 0 };
  if (statExpResult.length) {
    for (const row of rowsToObjects(statExpResult)) {
      const contributions = JSON.parse(row.stat_contributions);
      for (const [key, weight] of Object.entries(contributions)) {
        statExp[key] = (statExp[key] || 0) + row.total_exp * weight;
      }
    }
  }

  const wtExpResult = db.exec(`
    SELECT category, SUM(score) as total_score
    FROM weekly_tasks
    WHERE completed = 1 AND category != '' AND user_id = ?
    GROUP BY category
  `, [req.userId]);

  const CATEGORY_STAT_MAP = {
    '生活': { main: { key: 'STR', name: '力量', weight: 1 }, sub: { key: 'VIT', name: '体力', weight: 0.5 } },
    '学习': { main: { key: 'INT', name: '智力', weight: 1 }, sub: { key: 'WIS', name: '智慧', weight: 0.5 } },
    '娱乐': { main: { key: 'MOOD', name: '心情', weight: 1 }, sub: { key: 'AGI', name: '敏捷', weight: 0.5 } },
    '休息': { main: { key: 'VIT', name: '体力', weight: 1 }, sub: { key: 'MOOD', name: '心情', weight: 0.5 } },
  };

  const wtScores = {};
  if (wtExpResult.length) {
    for (const row of rowsToObjects(wtExpResult)) {
      wtScores[row.category] = row.total_score;
      const map = CATEGORY_STAT_MAP[row.category];
      if (map) {
        statExp[map.main.key] = (statExp[map.main.key] || 0) + row.total_score * map.main.weight;
        statExp[map.sub.key] = (statExp[map.sub.key] || 0) + row.total_score * map.sub.weight;
      }
    }
  }

  const catExpResult = db.exec(`
    SELECT at.category, SUM(a.exp_earned) as total_exp
    FROM activities a
    JOIN activity_types at ON a.activity_type_id = at.id
    WHERE a.user_id = ?
    GROUP BY at.category
  `, [req.userId]);

  const statDetail = [];
  const allCategories = new Set();
  if (catExpResult.length) {
    for (const row of rowsToObjects(catExpResult)) {
      allCategories.add(row.category);
    }
  }
  for (const cat of Object.keys(wtScores)) {
    allCategories.add(cat);
  }

  for (const category of allCategories) {
    const map = CATEGORY_STAT_MAP[category];
    if (!map) continue;
    const actExp = catExpResult.length
      ? (rowsToObjects(catExpResult).find(r => r.category === category)?.total_exp || 0)
      : 0;
    const wtExp = wtScores[category] || 0;
    const catExp = actExp + wtExp;
    const mainExp = Math.round(catExp * map.main.weight);
    const subExp = Math.round(catExp * map.sub.weight);
    statDetail.push({
      category,
      total_exp: catExp,
      wt_contrib: wtExp,
      main: { name: map.main.name, exp: mainExp, value: 1 + Math.floor(Math.sqrt(Math.max(0, statExp[map.main.key])) / 5) },
      sub: { name: map.sub.name, exp: subExp, value: 1 + Math.floor(Math.sqrt(Math.max(0, statExp[map.sub.key])) / 5) },
    });
  }

  const stats = calculateStats(statExp);
  const streak = calculateStreak(db, req.userId);
  const nextTitle = getTitleForLevel(progress.level + 1);

  // Equipped badge
  let equippedBadge = null;
  if (c.equipped_badge_id) {
    const badgeResult = rowsToObjects(
      db.exec('SELECT * FROM achievements WHERE id = ?', [c.equipped_badge_id])
    );
    if (badgeResult.length) equippedBadge = badgeResult[0];
  }

  res.json({
    id: c.user_id,
    name: c.name,
    level: progress.level,
    current_exp: progress.currentExp,
    exp_to_next: progress.expToNext,
    total_exp: c.total_exp,
    percentage: progress.percentage,
    stats,
    stat_detail: statDetail,
    title: getTitleForLevel(progress.level),
    next_title: nextTitle,
    streak_days: streak,
    equipped_badge: equippedBadge,
  });
});

router.put('/badge', async (req, res) => {
  const db = await getDb();
  const { achievement_id } = req.body;

  // Check achievement exists and is unlocked
  const ach = rowsToObjects(db.exec('SELECT * FROM achievements WHERE id = ?', [achievement_id]));
  if (!ach.length) return res.status(404).json({ error: '成就不存在' });

  const unlocked = rowsToObjects(
    db.exec('SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?', [req.userId, achievement_id])
  );
  if (!unlocked.length) return res.status(400).json({ error: '该成就尚未解锁' });

  // Toggle: if already equipped, unequip; otherwise equip
  const current = rowsToObjects(db.exec('SELECT equipped_badge_id FROM character WHERE user_id = ?', [req.userId]));
  const currentBadge = current[0]?.equipped_badge_id;
  const newBadge = currentBadge === achievement_id ? null : achievement_id;

  db.run('UPDATE character SET equipped_badge_id = ?, updated_at = datetime(\'now\') WHERE user_id = ?', [newBadge, req.userId]);
  saveDb();

  res.json({ equipped_badge_id: newBadge });
});

router.put('/', async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: '名字不能为空' });
  }

  const db = await getDb();
  db.run('UPDATE character SET name = ?, updated_at = datetime(\'now\') WHERE user_id = ?', [name.trim(), req.userId]);
  saveDb();

  const char = rowsToObjects(db.exec('SELECT user_id, name FROM character WHERE user_id = ?', [req.userId]));
  res.json(char[0]);
});

router.post('/reset', async (req, res) => {
  const db = await getDb();

  db.run('DELETE FROM activities WHERE user_id = ?', [req.userId]);
  db.run('DELETE FROM weekly_tasks WHERE user_id = ?', [req.userId]);
  db.run('DELETE FROM user_achievements WHERE user_id = ?', [req.userId]);
  db.run('DELETE FROM user_quests WHERE user_id = ?', [req.userId]);
  db.run(
    'UPDATE character SET total_exp = 0, level = 1, title = ?, equipped_badge_id = NULL, updated_at = datetime(\'now\') WHERE user_id = ?',
    ['新手冒险者', req.userId]
  );
  saveDb();

  res.json({ success: true });
});

export default router;
