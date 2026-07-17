import { Router } from 'express';
import { getDb, rowsToObjects, saveDb } from '../db.js';
import { aiChat } from '../services/aiClient.js';

const router = Router();

function today() {
  return new Date().toISOString().slice(0, 10);
}

function yesterday() {
  return new Date(Date.now() - 86400000).toISOString().slice(0, 10);
}

// Get today's character narrative (generate if not cached)
router.get('/', async (req, res) => {
  const db = await getDb();
  const td = today();
  const yd = yesterday();

  // Check cache
  const cached = rowsToObjects(
    db.exec('SELECT * FROM daily_narratives WHERE user_id = ? AND narrative_date = ?', [req.userId, td])
  );
  if (cached.length) {
    return res.json({ narrative: cached[0].content, cached: true });
  }

  // Gather yesterday's data
  const char = rowsToObjects(db.exec('SELECT * FROM character WHERE user_id = ?', [req.userId]))[0] || {};

  // Completed weekly tasks yesterday (by weekday)
  const ydDate = new Date(Date.now() - 86400000);
  const ydWeekday = ydDate.getDay();
  const tasks = rowsToObjects(
    db.exec(
      'SELECT content, category, score FROM weekly_tasks WHERE user_id = ? AND weekday = ? AND completed = 1 ORDER BY sort_order',
      [req.userId, ydWeekday]
    )
  );

  // Activities logged yesterday
  const activities = rowsToObjects(
    db.exec(
      `SELECT at.name_zh, at.category, a.exp_earned
       FROM activities a JOIN activity_types at ON a.activity_type_id = at.id
       WHERE a.user_id = ? AND a.logged_date = ?`,
      [req.userId, yd]
    )
  );

  // Checkin yesterday
  const checkin = rowsToObjects(
    db.exec('SELECT streak_count FROM daily_checkins WHERE user_id = ? AND checkin_date = ?', [req.userId, yd])
  );

  // Build context for AI
  const taskSummary = tasks.length
    ? tasks.map(t => `${t.category}·${t.content}(+${t.score})`).join('、')
    : '无';
  const actSummary = activities.length
    ? activities.map(a => `${a.category}·${a.name_zh}(+${a.exp_earned})`).join('、')
    : '无';
  const streakDays = checkin[0]?.streak_count || 0;

  const contextParts = [];
  if (tasks.length > 0) contextParts.push(`完成了${tasks.length}项周任务：${taskSummary}`);
  if (activities.length > 0) contextParts.push(`记录了${activities.length}条活动：${actSummary}`);
  if (tasks.length === 0 && activities.length === 0) contextParts.push('昨天没有任何活动记录');
  if (streakDays > 0) contextParts.push(`已连续签到${streakDays}天`);

  const context = contextParts.join('。');

  let narrative = '';
  try {
    const messages = [
      {
        role: 'system',
        content: `你是一个RPG游戏中的角色旁白配音。你扮演冒险者的伙伴精灵，用一句话描述冒险者昨天的状态。
风格要求：
- 奇幻RPG氛围（法师塔、旅店、修炼、冒险等意象）
- 如果昨天有完成任务，用正面激励的语气
- 如果昨天什么都没做，用温和调侃的语气（像老友，不责备）
- 40字以内，一句完整的话
- 不要前缀、不要引号、不要称呼"冒险者"（用"你"）`,
      },
      {
        role: 'user',
        content: `冒险者昨天的情况：${context}`,
      },
    ];
    narrative = await aiChat(messages, req.userId, { maxTokens: 100, temperature: 0.9 });
  } catch {
    // Fallback narratives
    if (tasks.length > 0) {
      const fallbacks = [
        '昨日你在修炼塔中挥汗如雨，今天的你更强了一分。',
        '精灵的记事本上，又多了几笔漂亮的战绩。',
        '昨日的汗水化作今晨的微光，法师塔的灯火为你而明。',
      ];
      narrative = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    } else {
      const fallbacks = [
        '旅店的床太舒服了……今天要不要出门看看？',
        '水晶球里一片空白——你昨天是不是摸鱼了？',
        '鸟儿在窗外唱歌，似乎在催你起来修炼。',
      ];
      narrative = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
  }

  // Cache
  db.run(
    'INSERT INTO daily_narratives (user_id, narrative_date, content) VALUES (?, ?, ?)',
    [req.userId, td, narrative]
  );
  saveDb();

  res.json({ narrative, cached: false });
});

export default router;
