import { exec } from 'child_process';
import { promisify } from 'util';
import { getDb, rowsToObjects } from '../db.js';
import { loadConfig, saveConfig } from './feishuSync.js';
import { calculateStats, getLevelProgress, getTitleForLevel } from './leveling.js';

const execAsync = promisify(exec);
const NODE_EXE = 'D:\\AI tools-Wang\\node.exe';
const LARK_CLI = 'C:\\Users\\Lenovo\\AppData\\Roaming\\npm\\node_modules\\@larksuite\\cli\\scripts\\run.js';

// Resolve target feishu user from settings, fallback to env for system notifications
export async function getFeishuTarget(db, userId) {
  const row = rowsToObjects(
    db.exec('SELECT feishu_id FROM user_settings WHERE user_id = ?', [userId])
  );
  // 用户必须自己在"我的"页面填写飞书号，不设系统级回退
  const feishuId = row[0]?.feishu_id || '';
  return feishuId;
}

// ── Core: send message as Feishu post format (each paragraph = separate block) ──
// This completely avoids newline escaping issues on Windows.

function buildPostContent(paragraphs) {
  return JSON.stringify({
    zh_cn: {
      content: paragraphs.map(text => [{ tag: 'md', text }]),
    },
  });
}

export async function sendPostMessage(paragraphs, targetOpenId) {
  if (!targetOpenId) return null;
  const content = buildPostContent(paragraphs);
  const escaped = content.replace(/"/g, '\\"');
  const cmd = `"${NODE_EXE}" "${LARK_CLI}" im +messages-send --user-id "${targetOpenId}" --content "${escaped}" --msg-type post --as bot`;

  try {
    const { stdout } = await execAsync(cmd, { maxBuffer: 2 * 1024 * 1024, timeout: 30000 });
    try { return JSON.parse(stdout); } catch { return stdout; }
  } catch (err) {
    console.error('[feishu notify] send failed:', err.message.slice(0, 200));
    return null;
  }
}

// ── Activity summary ──

const ACTIVITY_FLAVORS = [
  { emoji: '✨', line: '被我逮到啦～你又偷偷变强了！' },
  { emoji: '🌿', line: '嗯，我看见了。你在认真地生活呢。' },
  { emoji: '💫', line: '叮！你的经验值又跳了一下，我帮你数着呢。' },
  { emoji: '🍃', line: '又完成了一件事～我赌你会越来越厉害。' },
  { emoji: '⭐', line: '冒险笔记更新！这一笔我帮你记下了。' },
  { emoji: '🪄', line: '悄悄告诉你：刚才那一小步，比你想的要重要。' },
  { emoji: '🔮', line: '水晶球里映出了你的身影——嗯，又成长了一点。' },
  { emoji: '🌸', line: '你今天的样子，比昨天又多了一圈小小的光环。' },
];

export async function sendActivitySummary(activity, charState, streak, levelUp, userId) {
  const db = await getDb();
  const targetId = await getFeishuTarget(db, userId);
  if (!targetId) return;

  const unit = activity.unit || '';
  const f = ACTIVITY_FLAVORS[Math.floor(Math.random() * ACTIVITY_FLAVORS.length)];
  const paragraphs = [];

  paragraphs.push(`${f.emoji} ${f.line}`);
  paragraphs.push('');
  paragraphs.push(`刚才完成了 **${activity.name_zh || '未知'}**`);
  paragraphs.push(`▸ ${activity.value ?? 0} ${unit}　+${activity.exp_earned ?? 0} EXP`);

  if (charState) {
    let statLine = '';
    try {
      const statExp = { STR: 0, INT: 0, VIT: 0, AGI: 0, WIS: 0, MOOD: 0 };
      const catScores = rowsToObjects(db.exec(
        `SELECT category, SUM(score) as total_score
         FROM weekly_tasks WHERE completed = 1 AND category != '' AND user_id = ?
         GROUP BY category`, [userId]
      ));
      const MAP = {
        '生活': { main: 'STR', sub: 'VIT' },
        '学习': { main: 'INT', sub: 'WIS' },
        '娱乐': { main: 'MOOD', sub: 'AGI' },
        '休息': { main: 'VIT', sub: 'MOOD' },
      };
      for (const row of catScores) {
        const m = MAP[row.category];
        if (m) {
          statExp[m.main] = (statExp[m.main] || 0) + row.total_score;
          statExp[m.sub] = (statExp[m.sub] || 0) + Math.round(row.total_score * 0.5);
        }
      }
      const stats = calculateStats(statExp);
      statLine = `力${stats.strength} 智${stats.intelligence} 体${stats.vitality} 敏${stats.agility} 慧${stats.wisdom} 心${stats.mood}`;
    } catch { /* ignore */ }

    paragraphs.push('');
    paragraphs.push('📊 当前状态');
    paragraphs.push(`▸ 总修为 ${charState.total_exp?.toLocaleString()} · Lv.${charState.level}`);
    if (statLine) paragraphs.push(`▸ ${statLine}`);
  }

  if (levelUp) {
    paragraphs.push('');
    paragraphs.push('🎊 **等一下——你升级了！！**');
    paragraphs.push(`Lv.${levelUp.from} → **Lv.${levelUp.to}**`);
    if (levelUp.new_title) paragraphs.push(`从此世人称你为：**${levelUp.new_title}**`);
  }

  paragraphs.push('');
  paragraphs.push(`🔥 连续 ${streak ?? '?'} 天`);

  await sendPostMessage(paragraphs, targetId);
}

// ── Achievement notification ──

const ACHIEVEMENT_FLAVORS = [
  '不得了不得了……',
  '哇！你做到了诶！',
  '历史性的一刻——',
  '我就知道会有这一天！',
  '等等等等，让我看清楚——',
  '哎哎哎你快看！！',
  '来了来了，它来了——',
];

export async function sendAchievementNotification(achievements, userId) {
  if (!achievements?.length) return;
  const db = await getDb();
  const targetId = await getFeishuTarget(db, userId);
  if (!targetId) return;

  const f = ACHIEVEMENT_FLAVORS[Math.floor(Math.random() * ACHIEVEMENT_FLAVORS.length)];
  const paragraphs = [];

  paragraphs.push(`🏆 ${f}`);
  paragraphs.push('');

  for (const ach of achievements) {
    paragraphs.push(`**${ach.icon || '🏆'} ${ach.name_zh}**`);
    if (ach.description_zh) paragraphs.push(`_${ach.description_zh}_`);
    paragraphs.push(`+${ach.reward_exp || ach.exp_reward || 0} EXP ✨`);
    paragraphs.push('');
  }

  paragraphs.push('你在变强的路上又刻下了一道印记。');

  await sendPostMessage(paragraphs, targetId);
}

// ── Daily summary ──

function renderMiniBar(current, max) {
  if (max <= 0) return '';
  const width = 8;
  const filled = Math.round((current / max) * width);
  return '▰'.repeat(filled) + '▱'.repeat(width - filled);
}

const ENCOURAGEMENTS = [
  '你猜怎么着～明天还会更好玩。',
  '我赌一枚铜币，你会一直走下去的。',
  '你已经比很多人走得更远了——虽然你自己可能没感觉。',
  '今天的你，是过去所有日子的总和。挺酷的吧？',
  '不是每个人都能坚持记录的，你做到了。',
  '我在旁边看着呢，你的故事越来越有意思了。',
  '有时候最难的只是打开这个页面。你打开了，就赢了一半。',
  '不做英雄也没关系，做你自己就很好了。',
  '悄悄说：今天的你比昨天多了一点点光。',
  '冒险还在继续，而你是主角。晚安啦。',
];

export async function sendDailySummary() {
  const config = loadConfig();
  const today = new Date().toISOString().slice(0, 10);
  if (config.lastNotifyDate === today) return;

  // Mark as sent FIRST — prevents repeat sends if anything fails below
  config.lastNotifyDate = today;
  saveConfig(config);

  try {
    const db = await getDb();

    // Find all users with feishu_id configured
    const usersWithFeishu = rowsToObjects(db.exec(
      "SELECT user_id, feishu_id FROM user_settings WHERE feishu_id IS NOT NULL AND feishu_id != ''"
    ));
    if (!usersWithFeishu.length) return;

    for (const { user_id: userId, feishu_id: targetId } of usersWithFeishu) {
      if (!targetId) continue;
      try {
        await sendDailySummaryForUser(db, userId, targetId, today);
      } catch (e) {
        console.error('[feishu] daily summary for user', userId, 'failed:', e.message);
      }
      // Push due study review cards
      try {
        await pushDueReviewCards(db, userId, targetId, today);
      } catch (e) {
        console.error('[feishu] due review cards for user', userId, 'failed:', e.message);
      }
    }
  } catch (err) {
    console.error('[feishu] daily summary error:', err.message);
  }
}

async function pushDueReviewCards(db, userId, targetId, today) {
  const dueCards = rowsToObjects(db.exec(
    `SELECT sc.id, sc.question, sc.answer, sc.difficulty, sc.review_count, sc.next_review_at, ss.title
     FROM study_step3_cards sc
     JOIN study_sessions ss ON sc.session_id = ss.id
     WHERE ss.user_id = ? AND sc.next_review_at IS NOT NULL AND sc.next_review_at <= ?
     ORDER BY sc.next_review_at`,
    [userId, today]
  ));
  if (!dueCards.length) return;

  const paragraphs = [];
  paragraphs.push(`📚 **复习提醒** · ${today}`);
  paragraphs.push('');
  paragraphs.push(`你今天有 **${dueCards.length}** 张待复习卡片：`);
  paragraphs.push('');

  for (const card of dueCards.slice(0, 8)) {
    const diff = { easy: '⭐', medium: '⭐⭐', hard: '⭐⭐⭐' };
    paragraphs.push(`**Q: ${card.question}**`);
    paragraphs.push(`A: ${card.answer}`);
    paragraphs.push(`${diff[card.difficulty] || '⭐'} | 已复习${card.review_count}次 | 📚 ${card.title || '复习'}`);
    paragraphs.push('');
  }

  if (dueCards.length > 8) {
    paragraphs.push(`...还有 ${dueCards.length - 8} 张卡片，请打开学习页面查看`);
  }

  paragraphs.push('');
  paragraphs.push('打开 RPG Tracker → 期末复习 → 进入对应会话进行复习 ✨');

  await sendPostMessage(paragraphs, targetId);

  // Update next_review_at for pushed cards (prevent re-push same day)
  for (const card of dueCards) {
    const intervals = [1, 3, 7, 14];
    const newCount = card.review_count + 1;
    const daysToAdd = intervals[Math.min(newCount - 1, intervals.length - 1)];
    const nextReview = new Date(Date.now() + daysToAdd * 86400000).toISOString().slice(0, 10);
    db.run(
      'UPDATE study_step3_cards SET review_count = ?, last_reviewed_at = ?, next_review_at = ? WHERE id = ?',
      [newCount, new Date().toISOString(), nextReview, card.id]
    );
  }
  saveDb();
}

async function sendDailySummaryForUser(db, userId, targetId, today) {
    const char = rowsToObjects(db.exec(
      'SELECT * FROM character WHERE user_id = ?', [userId]
    ))[0];
    if (!char) return;

    const paragraphs = [];

    const progress = getLevelProgress(char.total_exp);
    const nameEmoji = char.level >= 10 ? '👑' : char.level >= 5 ? '⚔️' : '🛡️';

    paragraphs.push(`🌙 **今日冒险手札** · ${today}`);
    paragraphs.push('');
    paragraphs.push(`${nameEmoji} ${char.name}  Lv.${char.level} · ${char.title}`);
    paragraphs.push('────────────────');

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const ydDate = new Date(Date.now() - 86400000);
    const ydWeekday = ydDate.getDay();

    const ydTasks = rowsToObjects(db.exec(
      'SELECT category, content, score FROM weekly_tasks WHERE user_id = ? AND weekday = ? AND completed = 1',
      [userId, ydWeekday]
    ));
    const ydExp = ydTasks.reduce((sum, t) => sum + t.score, 0);
    const ydByCat = {};
    for (const t of ydTasks) ydByCat[t.category] = (ydByCat[t.category] || 0) + 1;

    paragraphs.push('');
    paragraphs.push('📊 **昨日战报**');
    if (ydTasks.length > 0) {
      paragraphs.push(`▸ 完成 ${ydTasks.length} 项周任务，+${ydExp} EXP`);
      const catParts = Object.entries(ydByCat).map(([cat, n]) => `${cat}${n}项`);
      if (catParts.length) paragraphs.push(`▸ ${catParts.join(' · ')}`);
      for (const t of ydTasks) paragraphs.push(`  ✓ ${t.content} +${t.score}`);
    } else {
      paragraphs.push('▸ 昨天没有完成周任务～今天补上吧。');
    }

    const ydActs = rowsToObjects(db.exec(
      'SELECT COUNT(*) as cnt, SUM(exp_earned) as total_exp FROM activities WHERE user_id = ? AND logged_date = ?',
      [userId, yesterday]
    ))[0];
    if (ydActs?.cnt > 0) paragraphs.push(`▸ 活动记录 ${ydActs.cnt} 条，+${ydActs.total_exp} EXP`);

    const CATEGORY_STAT_MAP = {
      '生活': { main: 'STR', sub: 'VIT' }, '学习': { main: 'INT', sub: 'WIS' },
      '娱乐': { main: 'MOOD', sub: 'AGI' }, '休息': { main: 'VIT', sub: 'MOOD' },
    };
    const statExp = { STR: 0, INT: 0, VIT: 0, AGI: 0, WIS: 0, MOOD: 0 };
    const catScores = rowsToObjects(db.exec(
      'SELECT category, SUM(score) as total_score FROM weekly_tasks WHERE completed = 1 AND category != "" AND user_id = ? GROUP BY category',
      [userId]
    ));
    for (const row of catScores) {
      const map = CATEGORY_STAT_MAP[row.category];
      if (map) {
        statExp[map.main] = (statExp[map.main] || 0) + row.total_score;
        statExp[map.sub] = (statExp[map.sub] || 0) + Math.round(row.total_score * 0.5);
      }
    }
    const stats = calculateStats(statExp);

    paragraphs.push('');
    paragraphs.push('🎯 **属性面板**');
    paragraphs.push(`力量 ${stats.strength} · 智力 ${stats.intelligence} · 体力 ${stats.vitality}`);
    paragraphs.push(`敏捷 ${stats.agility} · 智慧 ${stats.wisdom} · 心情 ${stats.mood}`);

    paragraphs.push('');
    paragraphs.push('⚡ **升级进度**');
    paragraphs.push(`Lv.${progress.level} → Lv.${progress.level + 1}`);
    paragraphs.push(`${renderMiniBar(progress.currentExp, progress.expToNext)} ${progress.percentage}%`);
    paragraphs.push(`距升级还需 ${progress.expToNext - progress.currentExp} EXP`);

    const checkinRow = rowsToObjects(db.exec(
      'SELECT streak_count FROM daily_checkins WHERE user_id = ? AND checkin_date = ?', [userId, today]
    ))[0];
    const yesterdayCheckin = rowsToObjects(db.exec(
      'SELECT streak_count FROM daily_checkins WHERE user_id = ? AND checkin_date = ?', [userId, yesterday]
    ))[0];
    const checkinStreak = checkinRow?.streak_count || yesterdayCheckin?.streak_count || 0;
    const actStreak = getActivityStreak(db, userId);
    const streakDays = checkinStreak || actStreak;

    const titleCount = rowsToObjects(db.exec(
      'SELECT COUNT(*) as cnt FROM user_titles WHERE user_id = ?', [userId]
    ))[0]?.cnt || 0;

    paragraphs.push('');
    paragraphs.push(`🔥 连续修炼  ${streakDays} 天`);
    if (titleCount > 0) paragraphs.push(`🏅 收集称号  ${titleCount} 个`);
    paragraphs.push(`✨ 总修为    ${char.total_exp?.toLocaleString()}`);

    const questRows = rowsToObjects(db.exec(
      `SELECT uq.progress, uq.target, uq.completed, q.title_zh
       FROM user_quests uq JOIN quests q ON uq.quest_id = q.id
       WHERE uq.user_id = ? AND uq.completed = 0 AND q.quest_type = 'daily'
       ORDER BY q.display_order`, [userId]
    ));
    if (questRows.length > 0) {
      const done = questRows.filter(q => q.completed).length;
      paragraphs.push('');
      paragraphs.push(`📋 **今日任务**  ${done}/${questRows.length}`);
      for (const q of questRows) {
        const bar = renderMiniBar(q.progress, q.target);
        paragraphs.push(`${q.completed ? '✅' : '·'} ${q.title_zh} ${bar}  ${q.progress}/${q.target}`);
      }
    }

    const enc = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
    paragraphs.push('');
    paragraphs.push(enc);

    await sendPostMessage(paragraphs, targetId);
}

function getActivityStreak(db, userId) {
  const dates = db.exec(
    'SELECT DISTINCT logged_date FROM activities WHERE user_id = ? ORDER BY logged_date DESC', [userId]
  );
  if (!dates.length || !dates[0].values.length) return 0;
  const allDates = dates[0].values.map(r => r[0]);
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (allDates[0] !== today && allDates[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < allDates.length; i++) {
    const prev = new Date(allDates[i - 1]);
    const curr = new Date(allDates[i]);
    if (Math.round((prev - curr) / 86400000) === 1) streak++;
    else break;
  }
  return streak;
}
