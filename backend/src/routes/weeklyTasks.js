import { Router } from 'express';
import { getDb, rowsToObjects, saveDb } from '../db.js';
import { updateQuestProgress, generateDailyQuests, generateWeeklyQuests } from '../services/questGenerator.js';
import { checkAchievements } from '../services/achievementChecker.js';
import { checkConditionalTitles } from '../services/titleChecker.js';

const router = Router();

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

const TEMPLATES = [
  ['生活', '健康管理', '营养素摄入', 1],
  ['生活', '健康管理', '工作日备餐', 2],
  ['生活', '健康管理', '日常活动量', 2],
  ['生活', '健康管理', '专项训练', 2],
  ['生活', '健康管理', '清洁整理', 1],
  ['生活', '健康管理', '睡眠管理', 2],
  ['生活', '健康管理', '情绪日记', 1],
  ['生活', '健康管理', '疾病预防', 2],
  ['生活', '形象管理', '皮肤护理', 2],
  ['生活', '形象管理', '胶囊衣橱', 1],
  ['生活', '财务管理', '日常记账', 1],
  ['生活', '财务管理', '应急储备金', 2],
  ['生活', '财务管理', '定投增值', 2],
  ['生活', '财务管理', '账户优化', 2],
  ['学习', '知识输入', '月度阅读', 1],
  ['学习', '知识输入', '知识梳理', 1],
  ['学习', '技能习得', '硬技能学习', 1],
  ['学习', '技能习得', '学习输出', 2],
  ['学习', '考试认证', '备考管理', 2],
  ['学习', '灵感捕捉', '灵感收集', 1],
  ['娱乐', '优质影音', '主题观影单', 1],
  ['娱乐', '优质影音', '私人歌单', 1],
  ['娱乐', '兴趣探索', '新体验尝试', 2],
  ['娱乐', '兴趣探索', '快乐小事清单', 2],
  ['娱乐', '社交娱乐', '朋友聚会', 1],
  ['娱乐', '社交娱乐', '文化活动', 1],
  ['娱乐', '数字娱乐', '游戏时间管理', 1],
  ['娱乐', '数字娱乐', '短视频清理', 2],
  ['休息', '睡眠修复', '卧室环境优化', 1],
  ['休息', '睡眠修复', '睡前仪式', 1],
  ['休息', '日间微休息', '工作间隙', 1],
  ['休息', '日间微休息', '饭后养神', 1],
  ['休息', '周末放空', '留白半日', 3],
  ['休息', '周末放空', '正念散步', 2],
  ['休息', '数字斋戒', '半天离线', 2],
];

router.get('/templates', (_req, res) => {
  const items = TEMPLATES.map(([category, subcategory, content, score]) => ({
    category, subcategory, content, defaultScore: score,
  }));
  res.json({ templates: items });
});

router.get('/heatmap', async (req, res) => {
  const db = await getDb();
  const weekStart = getMonday(new Date());

  // Get last 4 weeks of completed task scores, grouped by week_start and weekday
  const rows = rowsToObjects(
    db.exec(
      `SELECT week_start, weekday, SUM(score) as total
       FROM weekly_tasks
       WHERE completed = 1 AND user_id = ? AND week_start != ''
       GROUP BY week_start, weekday
       ORDER BY week_start`,
      [req.userId]
    )
  );

  // Build weeks array (last 4 weeks including current)
  const weeks = [];
  for (let w = 3; w >= 0; w--) {
    const d = new Date();
    d.setDate(d.getDate() - w * 7);
    const ws = getMonday(d);
    const dailyScores = [0, 0, 0, 0, 0, 0, 0];
    for (const r of rows) {
      if (r.week_start === ws) {
        dailyScores[r.weekday] = r.total;
      }
    }
    weeks.push({ weekStart: ws, dailyScores });
  }

  res.json({ weeks, currentWeekStart: weekStart });
});

function getWeekInfo(mondayStr) {
  const monday = new Date(mondayStr);
  const month = monday.getMonth() + 1;
  const weekOfMonth = Math.ceil(monday.getDate() / 7);
  return { year: monday.getFullYear(), month, weekOfMonth, monday: mondayStr };
}

function getPrevMonday(mondayStr) {
  const d = new Date(mondayStr);
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

router.get('/', async (req, res) => {
  const db = await getDb();
  const weekStart = getMonday(new Date());
  const weekInfo = getWeekInfo(weekStart);

  const tasks = rowsToObjects(
    db.exec(
      'SELECT * FROM weekly_tasks WHERE user_id = ? AND week_start = ? ORDER BY weekday, sort_order, id',
      [req.userId, weekStart]
    )
  );

  const scores = rowsToObjects(
    db.exec(
      "SELECT category, SUM(score) as total FROM weekly_tasks WHERE completed = 1 AND user_id = ? AND week_start = ? GROUP BY category",
      [req.userId, weekStart]
    )
  );
  const categoryScores = {};
  for (const s of scores) categoryScores[s.category] = s.total;

  // Leftover: uncompleted tasks from previous week
  const prevMonday = getPrevMonday(weekStart);
  const leftoverTasks = rowsToObjects(
    db.exec(
      'SELECT * FROM weekly_tasks WHERE user_id = ? AND week_start = ? AND completed = 0 ORDER BY weekday, sort_order, id',
      [req.userId, prevMonday]
    )
  );

  res.json({ tasks, categoryScores, weekInfo, leftoverTasks });
});

router.post('/', async (req, res) => {
  const db = await getDb();
  const { weekday, category, subcategory, content, score } = req.body;
  if (weekday === undefined || weekday < 0 || weekday > 6) {
    return res.status(400).json({ error: 'weekday 必须为 0-6' });
  }
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'content 不能为空' });
  }
  const weekStart = getMonday(new Date());
  db.run(
    'INSERT INTO weekly_tasks (weekday, category, subcategory, content, score, week_start, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [weekday, category || '', subcategory || '', content, score || 2, weekStart, req.userId]
  );
  const id = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
  saveDb();
  res.json({ id });
});

router.put('/:id', async (req, res) => {
  const db = await getDb();
  const { content, score } = req.body;
  if (content !== undefined) db.run('UPDATE weekly_tasks SET content = ? WHERE id = ? AND user_id = ?', [content, req.params.id, req.userId]);
  if (score !== undefined) db.run('UPDATE weekly_tasks SET score = ? WHERE id = ? AND user_id = ?', [score, req.params.id, req.userId]);
  saveDb();
  res.json({ success: true });
});

const RARE_TITLES = [
  '稀有·灵感迸发者', '传说·任务粉碎机', '史诗·自律之星',
  '稀有·时间的旅人', '传说·命运之轮', '史诗·星辰使者',
];

const COMMON_TITLES = [
  '晨光行者', '夜读修士', '效率猎手', '卷轴收藏家',
  '补刀高手', '禅定大师', '整理狂魔', '深度工作者',
  '碎片收割者', '早起鸟', '极简主义者', '拖延症克星',
  '行动派', '专注力掌控者',
];

function rollLoot() {
  const rand = Math.random();
  // 15% crit (2x EXP)
  const crit = rand < 0.15;
  // 5% rare title, 15% common title (independent of crit)
  const titleRoll = Math.random();
  let titleDrop = null;
  if (titleRoll < 0.05) {
    titleDrop = RARE_TITLES[Math.floor(Math.random() * RARE_TITLES.length)];
  } else if (titleRoll < 0.20) {
    titleDrop = COMMON_TITLES[Math.floor(Math.random() * COMMON_TITLES.length)];
  }
  return { crit, titleDrop };
}

router.put('/:id/toggle', async (req, res) => {
  const db = await getDb();

  const task = rowsToObjects(
    db.exec('SELECT completed, score, content, subcategory FROM weekly_tasks WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
  )[0];
  if (!task) return res.status(404).json({ error: '任务不存在' });

  const isCompleting = !task.completed;

  db.run(
    'UPDATE weekly_tasks SET completed = CASE WHEN completed THEN 0 ELSE 1 END WHERE id = ? AND user_id = ?',
    [req.params.id, req.userId]
  );

  let expDelta = isCompleting ? task.score : -task.score;
  let crit = false;
  let titleDrop = null;

  if (isCompleting) {
    const loot = rollLoot();
    crit = loot.crit;
    titleDrop = loot.titleDrop;

    if (crit) expDelta = expDelta * 2;

    // Award title if dropped
    if (titleDrop) {
      try {
        db.run(
          'INSERT OR IGNORE INTO user_titles (user_id, title) VALUES (?, ?)',
          [req.userId, titleDrop]
        );
      } catch { /* duplicate, ignore */ }
    }

    // Quest progress
    const atResult = rowsToObjects(
      db.exec('SELECT id FROM activity_types WHERE name_zh = ? AND subcategory = ? LIMIT 1', [task.content, task.subcategory])
    );
    if (atResult.length) {
      const today = new Date().toISOString().slice(0, 10);
      generateDailyQuests(db, req.userId);
      generateWeeklyQuests(db, req.userId);
      updateQuestProgress(db, atResult[0].id, 1, today, req.userId);
    }
  }

  db.run(
    'UPDATE character SET total_exp = MAX(0, total_exp + ?), updated_at = datetime(\'now\') WHERE user_id = ?',
    [expDelta, req.userId]
  );

  // Check achievements & conditional titles — wrapped so they never block saveDb
  let achievementResults = [];
  let conditionalTitles = [];
  try {
    achievementResults = checkAchievements(db, req.userId);
    conditionalTitles = checkConditionalTitles(db, req.userId);
  } catch (e) {
    console.error('[weeklyTasks] checkAchievements/titles failed:', e.message);
  }

  saveDb();
  res.json({ success: true, expDelta, crit, titleDrop, conditional_titles: conditionalTitles, new_achievements: achievementResults });
});

router.delete('/:id', async (req, res) => {
  const db = await getDb();
  const task = rowsToObjects(
    db.exec('SELECT completed, score FROM weekly_tasks WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
  )[0];
  if (!task) return res.status(404).json({ error: '任务不存在' });
  if (task.completed) {
    db.run('UPDATE character SET total_exp = MAX(0, total_exp - ?), updated_at = datetime(\'now\') WHERE user_id = ?', [task.score, req.userId]);
  }
  db.run('DELETE FROM weekly_tasks WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  saveDb();
  res.json({ success: true });
});

export default router;
