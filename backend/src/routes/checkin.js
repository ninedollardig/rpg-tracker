import { Router } from 'express';
import { getDb, rowsToObjects, saveDb } from '../db.js';
import { aiChat } from '../services/aiClient.js';
import { checkConditionalTitles } from '../services/titleChecker.js';

const router = Router();

function today() {
  return new Date().toISOString().slice(0, 10);
}

// Get today's checkin status
router.get('/', async (req, res) => {
  const db = await getDb();
  const td = today();

  const row = rowsToObjects(
    db.exec('SELECT * FROM daily_checkins WHERE user_id = ? AND checkin_date = ?', [req.userId, td])
  )[0];

  if (!row) {
    // Calculate current streak (check if yesterday was checked in)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const prev = rowsToObjects(
      db.exec('SELECT streak_count FROM daily_checkins WHERE user_id = ? AND checkin_date = ?', [req.userId, yesterday])
    )[0];
    return res.json({ checked_in: false, streak: prev?.streak_count || 0 });
  }

  res.json({
    checked_in: true,
    streak: row.streak_count,
    fortune: row.fortune,
    checkin_date: row.checkin_date,
  });
});

// Check in today
router.post('/', async (req, res) => {
  const db = await getDb();
  const td = today();

  // Already checked in?
  const existing = rowsToObjects(
    db.exec('SELECT id FROM daily_checkins WHERE user_id = ? AND checkin_date = ?', [req.userId, td])
  );
  if (existing.length) {
    return res.status(400).json({ error: '今日已签到' });
  }

  // Calculate streak
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const prev = rowsToObjects(
    db.exec('SELECT streak_count FROM daily_checkins WHERE user_id = ? AND checkin_date = ? ORDER BY checkin_date DESC LIMIT 1', [req.userId, yesterday])
  )[0];
  const streak = (prev?.streak_count || 0) + 1;

  // Generate daily fortune via AI
  let fortune = '';
  try {
    const messages = [
      {
        role: 'system',
        content: '你是一位冒险者公会的占卜师。根据角色当前的状态，给出一句今日运势预言。RPG奇幻风格，30字以内，要有画面感和激励性。不要引号，不要前缀。',
      },
      {
        role: 'user',
        content: `冒险者连续签到第${streak}天。请给我今日运势。`,
      },
    ];
    fortune = await aiChat(messages, req.userId, { maxTokens: 80, temperature: 1.0 });
  } catch (e) {
    // Fallback fortunes if AI unavailable
    const fallbacks = [
      '星辉洒落肩头，今日宜行动，忌犹豫。',
      '远方的龙吟预示着一场大收获。',
      '今天适合修炼新技能，事半功倍。',
      '冒险者公会传来消息：今日运势上佳。',
      '月亮女神的祝福伴你左右，幸运值+5。',
      '水晶球中映出金色的微光——今日有惊喜。',
      '风之精灵在你耳边低语：今天会很顺利。',
      '占卜牌显示「力量」正位，今日势不可挡。',
      '星盘转动，命运之轮指向你的方向。',
      '今天的小确幸藏在不经意的地方，保持敏锐。',
    ];
    fortune = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  db.run(
    'INSERT INTO daily_checkins (user_id, checkin_date, streak_count, fortune) VALUES (?, ?, ?, ?)',
    [req.userId, td, streak, fortune]
  );

  // Award check-in EXP (5 + streak bonus, max 15)
  const expBonus = Math.min(streak, 10) + 5;
  db.run(
    "UPDATE character SET total_exp = total_exp + ?, updated_at = datetime('now') WHERE user_id = ?",
    [expBonus, req.userId]
  );

  // Update yesterday's streak_count to match (if yesterday exists with lower count)
  // This handles edge case where yesterday's count was set before streak was known
  if (streak > 1) {
    db.run(
      'UPDATE daily_checkins SET streak_count = ? WHERE user_id = ? AND checkin_date = ? AND streak_count < ?',
      [streak - 1, req.userId, yesterday, streak - 1]
    );
  }

  // Check conditional titles (may be triggered by streak milestones)
  const conditionalTitles = checkConditionalTitles(db, req.userId);

  saveDb();

  res.json({
    streak,
    exp_earned: expBonus,
    fortune,
    checkin_date: td,
    conditional_titles: conditionalTitles,
  });
});

export default router;
