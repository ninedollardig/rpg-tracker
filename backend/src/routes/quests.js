import { Router } from 'express';
import { getDb, rowsToObjects, saveDb } from '../db.js';
import { generateDailyQuests, generateWeeklyQuests } from '../services/questGenerator.js';

const router = Router();

router.get('/', async (req, res) => {
  const db = await getDb();
  const { quest_type } = req.query;

  generateDailyQuests(db, req.userId);
  generateWeeklyQuests(db, req.userId);
  saveDb();

  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  const weekKey = `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;

  let dateFilter = '';
  if (quest_type === 'daily') {
    dateFilter = `AND uq.assigned_date = '${today}'`;
  } else if (quest_type === 'weekly') {
    dateFilter = `AND uq.assigned_date = '${weekKey}'`;
  }

  const quests = rowsToObjects(
    db.exec(`
      SELECT uq.id, q.id as quest_id, q.title_zh, q.description_zh, q.quest_type,
        uq.progress, uq.target, uq.completed, q.reward_exp, uq.assigned_date
      FROM user_quests uq
      JOIN quests q ON uq.quest_id = q.id
      WHERE uq.user_id = ? ${dateFilter}
      ORDER BY q.display_order
    `, [req.userId])
  );

  res.json({ quests });
});

router.post('/generate', async (req, res) => {
  const db = await getDb();
  const { quest_type } = req.body;

  if (quest_type === 'daily') {
    generateDailyQuests(db, req.userId);
  } else if (quest_type === 'weekly') {
    generateWeeklyQuests(db, req.userId);
  }
  saveDb();

  res.json({ success: true });
});

export default router;
