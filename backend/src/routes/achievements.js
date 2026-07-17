import { Router } from 'express';
import { getDb, rowsToObjects, saveDb } from '../db.js';
import { checkAchievements } from '../services/achievementChecker.js';

const router = Router();

// Force re-check all achievements for current user (catch-up for past data)
router.post('/sync', async (req, res) => {
  const db = await getDb();
  const newUnlocks = checkAchievements(db, req.userId);
  // Also sync conditional titles
  const newTitles = [];
  try {
    const { checkConditionalTitles } = await import('../services/titleChecker.js');
    newTitles.push(...(checkConditionalTitles(db, req.userId) || []));
  } catch { /* title checker may not exist yet */ }
  saveDb();
  res.json({
    new_unlocks: newUnlocks.map(a => ({ id: a.id, name_zh: a.name_zh })),
    new_titles: newTitles,
  });
});

// Get all collected titles (random drops + conditional)
router.get('/titles', async (req, res) => {
  const db = await getDb();
  const titles = rowsToObjects(
    db.exec('SELECT id, title, unlocked_at FROM user_titles WHERE user_id = ? ORDER BY unlocked_at DESC', [req.userId])
  );
  res.json({ titles });
});

router.get('/', async (req, res) => {
  const db = await getDb();

  const achievements = rowsToObjects(
    db.exec(`
      SELECT a.*,
        CASE WHEN ua.id IS NOT NULL THEN 1 ELSE 0 END as unlocked,
        ua.unlocked_at
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
      ORDER BY a.category, a.id
    `, [req.userId])
  );

  res.json({ achievements });
});

export default router;
