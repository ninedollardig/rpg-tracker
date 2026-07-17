import { getDb, rowsToObjects } from '../db.js';
import { countStreakDates } from './leveling.js';

const CATEGORY_NAMES = ['生活', '学习', '娱乐', '休息'];

function isCategoryFilter(val) {
  return val && CATEGORY_NAMES.includes(val);
}

export function checkAchievements(db, userId) {
  const newUnlocks = [];

  const achievements = rowsToObjects(
    db.exec(`
      SELECT a.* FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
      WHERE ua.id IS NULL
    `, [userId])
  );

  for (const ach of achievements) {
    let met = false;

    switch (ach.condition_type) {
      case 'total_count': {
        let actCount = 0, wtCount = 0;
        // Count from activities
        let actSql = 'SELECT COUNT(*) as cnt FROM activities a JOIN activity_types at ON a.activity_type_id = at.id WHERE a.user_id = ?';
        const actParams = [userId];
        if (ach.condition_activity_type) {
          if (isCategoryFilter(ach.condition_activity_type)) {
            actSql += ' AND at.category = ?';
          } else {
            actSql += ' AND at.type_key = ?';
          }
          actParams.push(ach.condition_activity_type);
        }
        const actR = db.exec(actSql, actParams);
        actCount = actR[0]?.values[0]?.[0] || 0;

        // Count from completed weekly tasks
        let wtSql = 'SELECT COUNT(*) as cnt FROM weekly_tasks WHERE user_id = ? AND completed = 1';
        const wtParams = [userId];
        if (ach.condition_activity_type) {
          if (isCategoryFilter(ach.condition_activity_type)) {
            wtSql += ' AND category = ?';
          } else {
            // For specific activity type key, match by content name
            const atName = db.exec('SELECT name_zh FROM activity_types WHERE type_key = ?', [ach.condition_activity_type]);
            const name = atName[0]?.values[0]?.[0];
            if (name) {
              wtSql += ' AND content = ?';
              wtParams.push(name);
            }
          }
          if (!isCategoryFilter(ach.condition_activity_type) && !wtParams[1]) {
            // No name matched, keep counting but result will be 0
            wtSql += ' AND 1=0';
          } else if (isCategoryFilter(ach.condition_activity_type)) {
            wtParams.push(ach.condition_activity_type);
          }
        }
        const wtR = db.exec(wtSql, wtParams);
        wtCount = wtR[0]?.values[0]?.[0] || 0;

        const count = actCount + wtCount;
        met = count >= ach.condition_target;
        break;
      }
      case 'total_value': {
        let sql = 'SELECT COALESCE(SUM(a.value), 0) as total FROM activities a JOIN activity_types at ON a.activity_type_id = at.id WHERE a.user_id = ?';
        const params = [userId];
        if (ach.condition_activity_type) {
          if (isCategoryFilter(ach.condition_activity_type)) {
            sql += ' AND at.category = ?';
          } else {
            sql += ' AND at.type_key = ?';
          }
          params.push(ach.condition_activity_type);
        }
        const r = db.exec(sql, params);
        const total = r[0]?.values[0]?.[0] || 0;
        met = total >= ach.condition_target;
        break;
      }
      case 'streak_days': {
        // Collect dates from activities
        let actQuery;
        const actParams = [];
        if (ach.condition_activity_type) {
          if (isCategoryFilter(ach.condition_activity_type)) {
            actQuery = 'SELECT DISTINCT logged_date FROM activities a JOIN activity_types at ON a.activity_type_id = at.id WHERE a.user_id = ? AND at.category = ? ORDER BY logged_date DESC';
          } else {
            actQuery = 'SELECT DISTINCT logged_date FROM activities a JOIN activity_types at ON a.activity_type_id = at.id WHERE a.user_id = ? AND at.type_key = ? ORDER BY logged_date DESC';
          }
          actParams.push(userId, ach.condition_activity_type);
        } else {
          actQuery = 'SELECT DISTINCT logged_date FROM activities WHERE user_id = ? ORDER BY logged_date DESC';
          actParams.push(userId);
        }
        const actResult = db.exec(actQuery, actParams);
        const actDates = actResult.length ? actResult[0].values.map(r => r[0]) : [];

        // Collect dates from weekly tasks (week_start + weekday offset)
        let wtQuery;
        const wtParams = [];
        if (ach.condition_activity_type) {
          if (isCategoryFilter(ach.condition_activity_type)) {
            wtQuery = 'SELECT DISTINCT week_start, weekday FROM weekly_tasks WHERE user_id = ? AND completed = 1 AND category = ?';
            wtParams.push(userId, ach.condition_activity_type);
          } else {
            // For specific type_key, match by content name
            const atName = db.exec('SELECT name_zh FROM activity_types WHERE type_key = ?', [ach.condition_activity_type]);
            const name = atName[0]?.values[0]?.[0];
            if (name) {
              wtQuery = 'SELECT DISTINCT week_start, weekday FROM weekly_tasks WHERE user_id = ? AND completed = 1 AND content = ?';
              wtParams.push(userId, name);
            } else {
              wtQuery = 'SELECT DISTINCT week_start, weekday FROM weekly_tasks WHERE user_id = ? AND completed = 1 AND 1=0';
              wtParams.push(userId);
            }
          }
        } else {
          wtQuery = 'SELECT DISTINCT week_start, weekday FROM weekly_tasks WHERE user_id = ? AND completed = 1';
          wtParams.push(userId);
        }
        const wtResult = db.exec(wtQuery, wtParams);
        const wtDates = [];
        if (wtResult.length) {
          for (const row of wtResult[0].values) {
            const d = new Date(row[0]);
            d.setDate(d.getDate() + row[1]);
            wtDates.push(d.toISOString().slice(0, 10));
          }
        }

        // Merge, deduplicate, sort descending
        const dateSet = new Set([...actDates, ...wtDates]);
        const dates = [...dateSet].sort().reverse();
        met = countStreakDates(dates) >= ach.condition_target;
        break;
      }
      case 'level_reached': {
        const r = db.exec('SELECT level FROM character WHERE user_id = ?', [userId]);
        const level = r[0]?.values[0]?.[0] || 1;
        met = level >= ach.condition_target;
        break;
      }
    }

    if (met) {
      db.run('INSERT OR IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)', [userId, ach.id]);
      newUnlocks.push({
        id: ach.id,
        name_zh: ach.name_zh,
        description_zh: ach.description_zh,
        icon: ach.icon,
        exp_reward: ach.exp_reward,
      });
      db.run('UPDATE character SET total_exp = total_exp + ?, updated_at = datetime(\'now\') WHERE user_id = ?', [ach.exp_reward, userId]);
    }
  }

  return newUnlocks;
}
