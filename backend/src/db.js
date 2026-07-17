import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Vercel only allows writes to /tmp; bundled .db is read from backend/data/
const BUNDLED_DB = join(__dirname, '..', 'data', 'rpg-tracker.db');
const DB_PATH = process.env.VERCEL === '1' ? '/tmp/rpg-tracker.db' : BUNDLED_DB;

let db = null;

export async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs({
    locateFile: file => join(__dirname, '..', 'data', file)
  });

  // Vercel: try /tmp first (previous warm invocation), fall back to bundled db
  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else if (DB_PATH !== BUNDLED_DB && existsSync(BUNDLED_DB)) {
    const buffer = readFileSync(BUNDLED_DB);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA journal_mode=WAL');
  db.run('PRAGMA foreign_keys=ON');

  initializeDatabase(db);
  return db;
}

export function saveDb() {
  if (!db) return;
  const data = db.export();
  const dir = dirname(DB_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(DB_PATH, Buffer.from(data));
}

function initializeDatabase(db) {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Character — uses user_id as PK (each user has exactly one character)
  db.run(`
    CREATE TABLE IF NOT EXISTS character (
      user_id          INTEGER PRIMARY KEY REFERENCES users(id),
      name             TEXT    NOT NULL DEFAULT '勇者',
      level            INTEGER NOT NULL DEFAULT 1,
      total_exp        INTEGER NOT NULL DEFAULT 0,
      title            TEXT    NOT NULL DEFAULT '新手冒险者',
      created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS activity_types (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      category            TEXT    NOT NULL,
      type_key            TEXT    NOT NULL UNIQUE,
      name_zh             TEXT    NOT NULL,
      subcategory         TEXT    NOT NULL DEFAULT '',
      unit                TEXT    NOT NULL,
      default_exp_per_unit INTEGER NOT NULL,
      stat_contributions  TEXT    NOT NULL,
      icon                TEXT    NOT NULL DEFAULT '📋',
      display_order       INTEGER NOT NULL DEFAULT 0
    )
  `);

  const atCols = db.exec('PRAGMA table_info(activity_types)');
  if (atCols.length > 0) {
    const atColNames = atCols[0].values.map(r => r[1]);
    if (!atColNames.includes('subcategory')) {
      db.run("ALTER TABLE activity_types ADD COLUMN subcategory TEXT NOT NULL DEFAULT ''");
    }
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS activities (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_type_id  INTEGER NOT NULL REFERENCES activity_types(id),
      value             REAL    NOT NULL,
      notes             TEXT    DEFAULT '',
      exp_earned        INTEGER NOT NULL DEFAULT 0,
      logged_date       TEXT    NOT NULL,
      user_id           INTEGER REFERENCES users(id),
      created_at        TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run('CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(logged_date)');
  db.run('CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(activity_type_id)');

  db.run(`
    CREATE TABLE IF NOT EXISTS achievements (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      name_key            TEXT    NOT NULL UNIQUE,
      name_zh             TEXT    NOT NULL,
      description_zh      TEXT    NOT NULL,
      icon                TEXT    NOT NULL DEFAULT '🏆',
      category            TEXT    NOT NULL,
      condition_type      TEXT    NOT NULL,
      condition_target    INTEGER NOT NULL,
      condition_activity_type TEXT,
      exp_reward          INTEGER NOT NULL DEFAULT 50
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS user_achievements (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER NOT NULL REFERENCES users(id),
      achievement_id  INTEGER NOT NULL REFERENCES achievements(id),
      unlocked_at     TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, achievement_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS quests (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      title_zh        TEXT    NOT NULL,
      description_zh  TEXT    NOT NULL,
      quest_type      TEXT    NOT NULL CHECK(quest_type IN ('daily','weekly')),
      activity_type_id INTEGER NOT NULL REFERENCES activity_types(id),
      target_value    REAL    NOT NULL,
      reward_exp      INTEGER NOT NULL,
      is_active       INTEGER NOT NULL DEFAULT 1,
      display_order   INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS user_quests (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      quest_id        INTEGER NOT NULL REFERENCES quests(id),
      user_id         INTEGER REFERENCES users(id),
      progress        REAL    NOT NULL DEFAULT 0,
      target          REAL    NOT NULL,
      completed       INTEGER NOT NULL DEFAULT 0,
      assigned_date   TEXT    NOT NULL,
      completed_at    TEXT
    )
  `);

  db.run('CREATE INDEX IF NOT EXISTS idx_userquests_date ON user_quests(assigned_date)');

  db.run(`
    CREATE TABLE IF NOT EXISTS weekly_tasks (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      weekday       INTEGER NOT NULL CHECK(weekday BETWEEN 0 AND 6),
      category      TEXT    NOT NULL DEFAULT '',
      subcategory   TEXT    NOT NULL DEFAULT '',
      content       TEXT    NOT NULL DEFAULT '',
      score         INTEGER NOT NULL DEFAULT 2 CHECK(score BETWEEN 1 AND 5),
      completed     INTEGER NOT NULL DEFAULT 0,
      user_id       INTEGER REFERENCES users(id),
      sort_order    INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Migration: add feishu_record_id to activities (Feishu sync)
  const actCols2 = db.exec('PRAGMA table_info(activities)');
  if (actCols2.length > 0) {
    const actColNames2 = actCols2[0].values.map(r => r[1]);
    if (!actColNames2.includes('feishu_record_id')) {
      db.run("ALTER TABLE activities ADD COLUMN feishu_record_id TEXT");
    }
  }

  // Migration: add missing columns to weekly_tasks (existing DBs)
  const cols = db.exec('PRAGMA table_info(weekly_tasks)');
  if (cols.length > 0) {
    const colNames = cols[0].values.map(r => r[1]);
    const addCol = (name, def) => {
      if (!colNames.includes(name)) db.run(`ALTER TABLE weekly_tasks ADD COLUMN ${name} ${def}`);
    };
    addCol('completed', 'INTEGER NOT NULL DEFAULT 0');
    addCol('category', "TEXT NOT NULL DEFAULT ''");
    addCol('subcategory', "TEXT NOT NULL DEFAULT ''");
    addCol('score', 'INTEGER NOT NULL DEFAULT 2 CHECK(score BETWEEN 1 AND 5)');
    addCol('weekday', 'INTEGER NOT NULL DEFAULT 0 CHECK(weekday BETWEEN 0 AND 6)');
    addCol('user_id', 'INTEGER REFERENCES users(id)');
    addCol('week_start', "TEXT NOT NULL DEFAULT ''");
  }

  // Backfill week_start for existing tasks
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(monday.getDate() + diff);
  const currentMonday = monday.toISOString().slice(0, 10);
  db.run("UPDATE weekly_tasks SET week_start = ? WHERE week_start = ''", [currentMonday]);

  // Outsource tasks (庶务外包)
  db.run(`
    CREATE TABLE IF NOT EXISTS outsource_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      raw_input TEXT NOT NULL,
      deadline TEXT,
      priority TEXT DEFAULT '普通',
      status TEXT DEFAULT 'draft',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS outsource_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER REFERENCES outsource_tasks(id) ON DELETE CASCADE,
      step_order INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      estimated_minutes INTEGER DEFAULT 20,
      trigger_time TEXT DEFAULT '',
      reminder_time TEXT,
      feishu_task_id TEXT,
      completed INTEGER DEFAULT 0
    )
  `);
  db.run('PRAGMA foreign_keys=ON');

  // User settings (profile, API key, radar scores)
  db.run(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id     INTEGER PRIMARY KEY REFERENCES users(id),
      api_key     TEXT NOT NULL DEFAULT '',
      model_name  TEXT NOT NULL DEFAULT 'deepseek-chat',
      self_profile TEXT NOT NULL DEFAULT '',
      radar_scores TEXT NOT NULL DEFAULT '[]'
    )
  `);

  // Daily check-ins (streak tracking + AI fortune)
  db.run(`
    CREATE TABLE IF NOT EXISTS daily_checkins (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       INTEGER NOT NULL REFERENCES users(id),
      checkin_date  TEXT    NOT NULL,
      streak_count  INTEGER NOT NULL DEFAULT 1,
      fortune       TEXT    NOT NULL DEFAULT '',
      created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, checkin_date)
    )
  `);

  // Daily character narratives (cached per day)
  db.run(`
    CREATE TABLE IF NOT EXISTS daily_narratives (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER NOT NULL REFERENCES users(id),
      narrative_date  TEXT    NOT NULL,
      content         TEXT    NOT NULL,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, narrative_date)
    )
  `);

  // User titles (collected from random drops)
  db.run(`
    CREATE TABLE IF NOT EXISTS user_titles (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id),
      title       TEXT    NOT NULL,
      unlocked_at TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, title)
    )
  `);

  // Study workflow tables (期末复习三步法)
  db.run(`
    CREATE TABLE IF NOT EXISTS study_sessions (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       INTEGER NOT NULL REFERENCES users(id),
      title         TEXT    NOT NULL DEFAULT '',
      subject       TEXT    NOT NULL DEFAULT '',
      raw_material  TEXT    NOT NULL DEFAULT '',
      status        TEXT    NOT NULL DEFAULT 'step1' CHECK(status IN ('step1','step2','step3','completed')),
      created_at    TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at    TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS study_step1_output (
      session_id       INTEGER PRIMARY KEY REFERENCES study_sessions(id) ON DELETE CASCADE,
      structured_notes TEXT    NOT NULL DEFAULT '',
      keywords_json    TEXT    NOT NULL DEFAULT '[]',
      framework_json   TEXT    NOT NULL DEFAULT '[]',
      mind_map_json    TEXT    NOT NULL DEFAULT 'null',
      qa_pairs_json    TEXT    NOT NULL DEFAULT '[]',
      raw_response     TEXT    NOT NULL DEFAULT '',
      created_at       TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    )
  `);
  // Migration: add mind_map_json to existing step1_output
  const s1Cols = db.exec('PRAGMA table_info(study_step1_output)');
  if (s1Cols.length > 0) {
    const s1Names = s1Cols[0].values.map(r => r[1]);
    if (!s1Names.includes('mind_map_json')) {
      db.run("ALTER TABLE study_step1_output ADD COLUMN mind_map_json TEXT NOT NULL DEFAULT 'null'");
    }
  }
  db.run(`
    CREATE TABLE IF NOT EXISTS study_step2_insights (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id  INTEGER NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
      insight_type TEXT   NOT NULL CHECK(insight_type IN ('logic','example','deduction','custom')),
      user_prompt TEXT    NOT NULL DEFAULT '',
      ai_content  TEXT    NOT NULL DEFAULT '',
      is_saved    INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS study_step3_cards (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id        INTEGER NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
      question          TEXT    NOT NULL DEFAULT '',
      answer            TEXT    NOT NULL DEFAULT '',
      difficulty        TEXT    NOT NULL DEFAULT 'medium' CHECK(difficulty IN ('easy','medium','hard')),
      review_count      INTEGER NOT NULL DEFAULT 0,
      last_reviewed_at  TEXT,
      next_review_at    TEXT,
      created_at        TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    )
  `);
  db.run('CREATE INDEX IF NOT EXISTS idx_study3_next_review ON study_step3_cards(next_review_at)');

  // Run migrations for existing databases
  migrateToV2(db);
  migrateToV3(db);
  migrateToV4(db);
  migrateToV5(db);
  migrateToV6(db);

  // Add index after migration ensures user_id column exists
  db.run('CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id)');

  seedData(db);
}

function migrateToV2(db) {
  const checkNew = db.exec("SELECT id FROM activity_types WHERE category IN ('生活', '学习', '娱乐', '休息') LIMIT 1");
  const checkId1 = db.exec('SELECT id FROM activity_types WHERE id = 1');
  if (checkNew.length && checkNew[0].values.length && checkId1.length && checkId1[0].values.length) return;

  db.run('DELETE FROM user_quests');
  db.run('DELETE FROM quests');
  db.run('DELETE FROM activities');
  db.run('DELETE FROM activity_types');
  db.run('DELETE FROM user_achievements');
  db.run('DELETE FROM achievements');
  db.run('DELETE FROM sqlite_sequence WHERE name IN (\'activity_types\', \'achievements\', \'quests\')');
  db.run("UPDATE character SET total_exp = 0, level = 1, title = '新手冒险者', updated_at = datetime('now') WHERE user_id = 1");
  saveDb();
}

function migrateToV3(db) {
  // Check if users table exists and has the default admin user
  const userCheck = db.exec('SELECT id FROM users WHERE id = 1');
  if (userCheck.length && userCheck[0].values.length) return; // already migrated

  db.run('PRAGMA foreign_keys=OFF');

  // Create default admin user
  const hash = bcrypt.hashSync('admin', 10);
  db.run('INSERT INTO users (id, username, password_hash) VALUES (1, ?, ?)', ['admin', hash]);

  // Check if character table still uses old schema (has 'id' column instead of 'user_id')
  const charCols = db.exec('PRAGMA table_info(character)');
  if (charCols.length > 0) {
    const charColNames = charCols[0].values.map(r => r[1]);
    if (charColNames.includes('id') && !charColNames.includes('user_id')) {
      // Rebuild character table
      db.run('ALTER TABLE character RENAME TO character_old');
      db.run(`
        CREATE TABLE character (
          user_id          INTEGER PRIMARY KEY REFERENCES users(id),
          name             TEXT    NOT NULL DEFAULT '勇者',
          level            INTEGER NOT NULL DEFAULT 1,
          total_exp        INTEGER NOT NULL DEFAULT 0,
          title            TEXT    NOT NULL DEFAULT '新手冒险者',
          created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
          updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
        )
      `);
      db.run(`INSERT INTO character (user_id, name, level, total_exp, title, created_at, updated_at)
              SELECT 1, COALESCE(name, '勇者'), COALESCE(level, 1), COALESCE(total_exp, 0),
                     COALESCE(title, '新手冒险者'), COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
              FROM character_old`);
      db.run('DROP TABLE character_old');
    }
  }

  // Add user_id to activities if missing
  const actCols = db.exec('PRAGMA table_info(activities)');
  if (actCols.length > 0) {
    const actColNames = actCols[0].values.map(r => r[1]);
    if (!actColNames.includes('user_id')) {
      db.run('ALTER TABLE activities ADD COLUMN user_id INTEGER REFERENCES users(id)');
      db.run('UPDATE activities SET user_id = 1 WHERE user_id IS NULL');
    }
  }

  // Rebuild user_achievements if still using old UNIQUE(achievement_id) constraint
  const uaCreate = db.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name='user_achievements'");
  if (uaCreate.length && uaCreate[0].values.length) {
    const createSQL = uaCreate[0].values[0][0];
    if (!createSQL.includes('user_id')) {
      db.run('ALTER TABLE user_achievements RENAME TO ua_old');
      db.run(`
        CREATE TABLE user_achievements (
          id              INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id         INTEGER NOT NULL REFERENCES users(id),
          achievement_id  INTEGER NOT NULL REFERENCES achievements(id),
          unlocked_at     TEXT    NOT NULL DEFAULT (datetime('now')),
          UNIQUE(user_id, achievement_id)
        )
      `);
      db.run('INSERT INTO user_achievements (id, user_id, achievement_id, unlocked_at) SELECT id, 1, achievement_id, unlocked_at FROM ua_old');
      db.run('DROP TABLE ua_old');
    }
  }

  // Add user_id to user_quests if missing
  const uqCols = db.exec('PRAGMA table_info(user_quests)');
  if (uqCols.length > 0) {
    const uqColNames = uqCols[0].values.map(r => r[1]);
    if (!uqColNames.includes('user_id')) {
      db.run('ALTER TABLE user_quests ADD COLUMN user_id INTEGER REFERENCES users(id)');
      db.run('UPDATE user_quests SET user_id = 1 WHERE user_id IS NULL');
    }
  }

  db.run('PRAGMA foreign_keys=ON');
  saveDb();
}

function migrateToV4(db) {
  // Add equipped_badge_id to character
  const charCols = db.exec('PRAGMA table_info(character)');
  if (charCols.length > 0) {
    const charColNames = charCols[0].values.map(r => r[1]);
    if (!charColNames.includes('equipped_badge_id')) {
      db.run('ALTER TABLE character ADD COLUMN equipped_badge_id INTEGER');
    }
  }
  // Add tier & shape columns to achievements
  const achCols = db.exec('PRAGMA table_info(achievements)');
  if (achCols.length > 0) {
    const achColNames = achCols[0].values.map(r => r[1]);
    if (!achColNames.includes('tier')) {
      db.run("ALTER TABLE achievements ADD COLUMN tier TEXT NOT NULL DEFAULT 'common'");
    }
    if (!achColNames.includes('shape')) {
      db.run("ALTER TABLE achievements ADD COLUMN shape TEXT NOT NULL DEFAULT 'hex'");
    }
  }
  // Add feishu_id to user_settings
  const usCols = db.exec('PRAGMA table_info(user_settings)');
  if (usCols.length > 0) {
    const usColNames = usCols[0].values.map(r => r[1]);
    if (!usColNames.includes('feishu_id')) {
      db.run("ALTER TABLE user_settings ADD COLUMN feishu_id TEXT NOT NULL DEFAULT ''");
    }
    if (!usColNames.includes('vault_path')) {
      db.run("ALTER TABLE user_settings ADD COLUMN vault_path TEXT NOT NULL DEFAULT ''");
    }
  }
  // Validate achievement data integrity: check that a known achievement has correct condition
  // This catches stale/corrupted achievements from old seed versions
  const achValid = db.exec("SELECT id FROM achievements WHERE name_key = 'perfect_day' AND condition_type = 'total_count' AND condition_target = 300 LIMIT 1");
  const achExists = db.exec("SELECT COUNT(*) as cnt FROM achievements");
  const achCount = achExists[0]?.values[0]?.[0] || 0;
  const needsReseed = achCount > 0 && (!achValid.length || !achValid[0].values.length);
  if (needsReseed) {
    console.log('[migration] Achievement data stale, reseeding...');
    db.run('DELETE FROM user_achievements');
    db.run('DELETE FROM achievements');
    db.run("DELETE FROM sqlite_sequence WHERE name = 'achievements'");
  }
  saveDb();
}

function migrateToV5(db) {
  // Add category column to quests (for category-based daily quest matching)
  const qCols = db.exec('PRAGMA table_info(quests)');
  if (qCols.length > 0) {
    const qColNames = qCols[0].values.map(r => r[1]);
    if (!qColNames.includes('category')) {
      db.run("ALTER TABLE quests ADD COLUMN category TEXT NOT NULL DEFAULT ''");
    }
  }

  // Update existing daily quests: set category for category-based matching
  // Merge 每日阅读 into 每日学习 (both are 学习 category)
  db.run("DELETE FROM user_quests WHERE quest_id IN (SELECT id FROM quests WHERE title_zh = '每日阅读')");
  db.run("DELETE FROM quests WHERE title_zh = '每日阅读'");

  // Update remaining daily quests: set category (activity_type_id kept for backward compat, category takes precedence in matching)
  db.run("UPDATE quests SET category = '生活' WHERE title_zh = '每日训练' AND category = ''");
  db.run("UPDATE quests SET category = '学习' WHERE title_zh = '每日学习' AND category = ''");
  db.run("UPDATE quests SET category = '娱乐' WHERE title_zh = '每日放松' AND category = ''");
  db.run("UPDATE quests SET category = '休息' WHERE title_zh = '每日休息' AND category = ''");

  // Update quest titles to reflect category-based design
  db.run("UPDATE quests SET title_zh = '每日生活', description_zh = '完成任意1项生活类活动' WHERE title_zh = '每日训练' AND category = '生活'");
  db.run("UPDATE quests SET title_zh = '每日学习', description_zh = '完成任意1项学习类活动' WHERE title_zh = '每日学习' AND category = '学习'");
  db.run("UPDATE quests SET title_zh = '每日娱乐', description_zh = '完成任意1项娱乐类活动' WHERE title_zh = '每日放松' AND category = '娱乐'");
  db.run("UPDATE quests SET title_zh = '每日休息', description_zh = '完成任意1项休息类活动' WHERE title_zh = '每日休息' AND category = '休息'");

  saveDb();
  console.log('[migration] V5: quest category column added, daily quests migrated to category-based matching');
}

function migrateToV6(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS daily_reports (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id),
      date       TEXT    NOT NULL,
      content    TEXT    NOT NULL DEFAULT '',
      source     TEXT    NOT NULL DEFAULT 'manual' CHECK(source IN ('manual','auto')),
      created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      UNIQUE(user_id, date)
    )
  `);
  saveDb();
}

function seedData(db) {
  // Seed character for users that don't have one
  const users = db.exec('SELECT id FROM users');
  if (users.length && users[0].values.length) {
    for (const [userId] of users[0].values) {
      const char = db.exec('SELECT user_id FROM character WHERE user_id = ?', [userId]);
      if (!char.length || !char[0].values.length) {
        db.run('INSERT OR IGNORE INTO character (user_id, name, level, total_exp, title) VALUES (?, \'勇者\', 1, 0, \'新手冒险者\')', [userId]);
      }
    }
  }

  // Seed activity types if not exists
  const types = db.exec('SELECT id FROM activity_types');
  if (types.length === 0 || types[0].values.length === 0) {
    const activitySeeds = [
      ['生活', 'shenghuo_jiankang_1', '营养素摄入', '健康管理', '次', 1, '{"STR":1,"VIT":0.5}', '🥗', 1],
      ['生活', 'shenghuo_jiankang_2', '工作日备餐', '健康管理', '次', 2, '{"STR":1,"VIT":0.5}', '🍱', 2],
      ['生活', 'shenghuo_jiankang_3', '日常活动量', '健康管理', '次', 2, '{"STR":1,"VIT":0.5}', '🚶', 3],
      ['生活', 'shenghuo_jiankang_4', '专项训练', '健康管理', '次', 2, '{"STR":1,"VIT":0.5}', '🏋️', 4],
      ['生活', 'shenghuo_jiankang_5', '清洁整理', '健康管理', '次', 1, '{"STR":1,"VIT":0.5}', '🧹', 5],
      ['生活', 'shenghuo_jiankang_6', '睡眠管理', '健康管理', '次', 2, '{"STR":1,"VIT":0.5}', '😴', 6],
      ['生活', 'shenghuo_jiankang_7', '情绪日记', '健康管理', '次', 1, '{"STR":1,"VIT":0.5}', '📝', 7],
      ['生活', 'shenghuo_jiankang_8', '疾病预防', '健康管理', '次', 2, '{"STR":1,"VIT":0.5}', '🛡️', 8],
      ['生活', 'shenghuo_xingxiang_1', '皮肤护理', '形象管理', '次', 2, '{"STR":1,"VIT":0.5}', '💆', 9],
      ['生活', 'shenghuo_xingxiang_2', '胶囊衣橱', '形象管理', '次', 1, '{"STR":1,"VIT":0.5}', '👔', 10],
      ['生活', 'shenghuo_caiwu_1', '日常记账', '财务管理', '次', 1, '{"STR":1,"VIT":0.5}', '📒', 11],
      ['生活', 'shenghuo_caiwu_2', '应急储备金', '财务管理', '次', 2, '{"STR":1,"VIT":0.5}', '🏦', 12],
      ['生活', 'shenghuo_caiwu_3', '定投增值', '财务管理', '次', 2, '{"STR":1,"VIT":0.5}', '📈', 13],
      ['生活', 'shenghuo_caiwu_4', '账户优化', '财务管理', '次', 2, '{"STR":1,"VIT":0.5}', '💳', 14],
      ['学习', 'xuexi_zhishi_1', '月度阅读', '知识输入', '次', 1, '{"INT":1,"WIS":0.5}', '📖', 15],
      ['学习', 'xuexi_zhishi_2', '知识梳理', '知识输入', '次', 1, '{"INT":1,"WIS":0.5}', '🗂️', 16],
      ['学习', 'xuexi_jineng_1', '硬技能学习', '技能习得', '次', 1, '{"INT":1,"WIS":0.5}', '💻', 17],
      ['学习', 'xuexi_jineng_2', '学习输出', '技能习得', '次', 2, '{"INT":1,"WIS":0.5}', '✍️', 18],
      ['学习', 'xuexi_kaoshi_1', '备考管理', '考试认证', '次', 2, '{"INT":1,"WIS":0.5}', '📝', 19],
      ['学习', 'xuexi_linggan_1', '灵感收集', '灵感捕捉', '次', 1, '{"INT":1,"WIS":0.5}', '💡', 20],
      ['娱乐', 'yule_yingyin_1', '主题观影单', '优质影音', '次', 1, '{"MOOD":1,"AGI":0.5}', '🎬', 21],
      ['娱乐', 'yule_yingyin_2', '私人歌单', '优质影音', '次', 1, '{"MOOD":1,"AGI":0.5}', '🎵', 22],
      ['娱乐', 'yule_xingqu_1', '新体验尝试', '兴趣探索', '次', 2, '{"MOOD":1,"AGI":0.5}', '🔍', 23],
      ['娱乐', 'yule_xingqu_2', '快乐小事清单', '兴趣探索', '次', 2, '{"MOOD":1,"AGI":0.5}', '😊', 24],
      ['娱乐', 'yule_shejiao_1', '朋友聚会', '社交娱乐', '次', 1, '{"MOOD":1,"AGI":0.5}', '👥', 25],
      ['娱乐', 'yule_shejiao_2', '文化活动', '社交娱乐', '次', 1, '{"MOOD":1,"AGI":0.5}', '🎭', 26],
      ['娱乐', 'yule_shuzi_1', '游戏时间管理', '数字娱乐', '次', 1, '{"MOOD":1,"AGI":0.5}', '🎮', 27],
      ['娱乐', 'yule_shuzi_2', '短视频清理', '数字娱乐', '次', 2, '{"MOOD":1,"AGI":0.5}', '📱', 28],
      ['休息', 'xiuxi_shuimian_1', '卧室环境优化', '睡眠修复', '次', 1, '{"VIT":1,"MOOD":0.5}', '🛏️', 29],
      ['休息', 'xiuxi_shuimian_2', '睡前仪式', '睡眠修复', '次', 1, '{"VIT":1,"MOOD":0.5}', '🌙', 30],
      ['休息', 'xiuxi_rijian_1', '工作间隙', '日间微休息', '次', 1, '{"VIT":1,"MOOD":0.5}', '☕', 31],
      ['休息', 'xiuxi_rijian_2', '饭后养神', '日间微休息', '次', 1, '{"VIT":1,"MOOD":0.5}', '🧘', 32],
      ['休息', 'xiuxi_zhoumo_1', '留白半日', '周末放空', '次', 3, '{"VIT":1,"MOOD":0.5}', '🌿', 33],
      ['休息', 'xiuxi_zhoumo_2', '正念散步', '周末放空', '次', 2, '{"VIT":1,"MOOD":0.5}', '🚶', 34],
      ['休息', 'xiuxi_shuzi_1', '半天离线', '数字斋戒', '次', 2, '{"VIT":1,"MOOD":0.5}', '📵', 35],
    ];
    const stmt = db.prepare(
      'INSERT INTO activity_types (category, type_key, name_zh, subcategory, unit, default_exp_per_unit, stat_contributions, icon, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    for (const row of activitySeeds) stmt.run(row);
    stmt.free();
  }

  // Seed achievements — tiered 30 badges
  const ach = db.exec('SELECT id FROM achievements');
  if (ach.length === 0 || ach[0].values.length === 0) {
    // [name_key, name_zh, description_zh, icon, category, condition_type, condition_target, condition_activity_type, exp_reward, tier, shape]
    const achievementSeeds = [
      // ── 生活 (7) ──
      ['life_first', '初次记录', '完成 1 次生活类活动', '🛡️', '生活', 'total_count', 1, '生活', 30, 'common', 'shield'],
      ['health_start', '健康起步', '营养素摄入 5 次', '🥗', '生活', 'total_count', 5, 'shenghuo_jiankang_1', 50, 'common', 'shield'],
      ['life_streak', '生活节奏', '连续 7 天记录生活活动', '🔥', '生活', 'streak_days', 7, '生活', 100, 'rare', 'shield'],
      ['finance_discipline', '财务自律', '日常记账 20 次', '📒', '生活', 'total_count', 20, 'shenghuo_caiwu_1', 120, 'rare', 'shield'],
      ['life_master', '生活达人', '完成 100 次生活类活动', '💪', '生活', 'total_count', 100, '生活', 200, 'epic', 'shield'],
      ['iron_body', '钢铁之躯', '专项训练 50 次', '🏋️', '生活', 'total_count', 50, 'shenghuo_jiankang_4', 200, 'epic', 'shield'],
      ['perfect_day', '完美日常', '累计完成 300 次活动', '🌈', '生活', 'total_count', 300, null, 300, 'legendary', 'shield'],

      // ── 学习 (7) ──
      ['study_first', '初次学习', '完成 1 次学习类活动', '📖', '学习', 'total_count', 1, '学习', 30, 'common', 'diamond'],
      ['read_start', '阅读起步', '月度阅读 3 次', '📚', '学习', 'total_count', 3, 'xuexi_zhishi_1', 50, 'common', 'diamond'],
      ['study_streak', '学无止境', '连续 7 天记录学习活动', '📝', '学习', 'streak_days', 7, '学习', 100, 'rare', 'diamond'],
      ['skill_adept', '技能精进', '硬技能学习 30 次', '💻', '学习', 'total_count', 30, 'xuexi_jineng_1', 120, 'rare', 'diamond'],
      ['scholar_heart', '学者之心', '完成 100 次学习类活动', '🎓', '学习', 'total_count', 100, '学习', 200, 'epic', 'diamond'],
      ['knowledge_deep', '知识渊博', '知识梳理 20 次', '🗂️', '学习', 'total_count', 20, 'xuexi_zhishi_2', 200, 'epic', 'diamond'],
      ['omniscience', '全知全能', '四项分类各完成 50 次且等级 10', '🌟', '学习', 'level_reached', 10, null, 400, 'legendary', 'diamond'],

      // ── 娱乐 (6) ──
      ['fun_first', '初次娱乐', '完成 1 次娱乐类活动', '🎬', '娱乐', 'total_count', 1, '娱乐', 30, 'common', 'star'],
      ['explorer', '兴趣探索者', '新体验尝试 5 次', '🔍', '娱乐', 'total_count', 5, 'yule_xingqu_1', 80, 'rare', 'star'],
      ['social_butterfly', '社交达人', '朋友聚会 10 次', '👥', '娱乐', 'total_count', 10, 'yule_shejiao_1', 100, 'rare', 'star'],
      ['mood_master', '心情大师', '完成 50 次娱乐类活动', '🎉', '娱乐', 'total_count', 50, '娱乐', 180, 'epic', 'star'],
      ['joy_spring', '快乐源泉', '完成 200 次娱乐类活动', '✨', '娱乐', 'total_count', 200, '娱乐', 350, 'legendary', 'star'],

      // ── 休息 (6) ──
      ['rest_first', '初次休息', '完成 1 次休息类活动', '😴', '休息', 'total_count', 1, '休息', 30, 'common', 'moon'],
      ['sleep_guardian', '睡眠守护者', '睡前仪式 15 次', '🌙', '休息', 'total_count', 15, 'xiuxi_shuimian_2', 100, 'rare', 'moon'],
      ['micro_rest', '微休息专家', '工作间隙 20 次', '☕', '休息', 'total_count', 20, 'xiuxi_rijian_1', 100, 'rare', 'moon'],
      ['rest_expert', '休息专家', '完成 50 次休息类活动', '🧘', '休息', 'total_count', 50, '休息', 180, 'epic', 'moon'],
      ['zen_master', '禅定大师', '留白半日 30 次', '🌿', '休息', 'total_count', 30, 'xiuxi_zhoumo_1', 350, 'legendary', 'moon'],

      // ── 通用 (4) ──
      ['first_step', '初次启程', '记录第一条活动', '⚡', 'general', 'total_count', 1, null, 50, 'common', 'hex'],
      ['level_five', '五级勇者', '达到等级 5', '⭐', 'general', 'level_reached', 5, null, 150, 'rare', 'hex'],
      ['level_ten', '十级传奇', '达到等级 10', '👑', 'general', 'level_reached', 10, null, 300, 'epic', 'hex'],
      ['total_500', '百次征程', '累计完成 500 次活动', '🏆', 'general', 'total_count', 500, null, 500, 'legendary', 'hex'],
    ];
    const stmt = db.prepare(
      'INSERT INTO achievements (name_key, name_zh, description_zh, icon, category, condition_type, condition_target, condition_activity_type, exp_reward, tier, shape) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    for (const row of achievementSeeds) stmt.run(row);
    stmt.free();
  }

  // Seed quests
  const q = db.exec('SELECT id FROM quests');
  if (q.length === 0 || q[0].values.length === 0) {
    const getTypeId = (key) => {
      const r = db.exec('SELECT id FROM activity_types WHERE type_key = ?', [key]);
      return r[0]?.values[0]?.[0];
    };
    // Daily quests: category-based (match any activity in the category)
    // Weekly quests: activity_type_id-based (match specific activities)
    const questSeeds = [
      { title_zh: '每日生活', description_zh: '完成任意1项生活类活动', quest_type: 'daily', activity_type_id: 1, category: '生活', target_value: 1, reward_exp: 10, display_order: 1 },
      { title_zh: '每日学习', description_zh: '完成任意1项学习类活动', quest_type: 'daily', activity_type_id: 15, category: '学习', target_value: 1, reward_exp: 10, display_order: 2 },
      { title_zh: '每日娱乐', description_zh: '完成任意1项娱乐类活动', quest_type: 'daily', activity_type_id: 21, category: '娱乐', target_value: 1, reward_exp: 10, display_order: 3 },
      { title_zh: '每日休息', description_zh: '完成任意1项休息类活动', quest_type: 'daily', activity_type_id: 29, category: '休息', target_value: 1, reward_exp: 10, display_order: 4 },
      { title_zh: '每周输出', description_zh: '完成学习输出3次', quest_type: 'weekly', activity_type_id: getTypeId('xuexi_jineng_2'), category: '', target_value: 3, reward_exp: 40, display_order: 1 },
      { title_zh: '每周快乐', description_zh: '完成快乐小事清单3次', quest_type: 'weekly', activity_type_id: getTypeId('yule_xingqu_2'), category: '', target_value: 3, reward_exp: 30, display_order: 2 },
      { title_zh: '每周放空', description_zh: '完成正念散步2次', quest_type: 'weekly', activity_type_id: getTypeId('xiuxi_zhoumo_2'), category: '', target_value: 2, reward_exp: 30, display_order: 3 },
    ];
    const stmt = db.prepare(
      'INSERT INTO quests (title_zh, description_zh, quest_type, activity_type_id, category, target_value, reward_exp, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    for (const q of questSeeds) stmt.run([q.title_zh, q.description_zh, q.quest_type, q.activity_type_id, q.category, q.target_value, q.reward_exp, q.display_order]);
    stmt.free();
  }

  saveDb();
}

export function rowsToObjects(result) {
  if (!result || result.length === 0) return [];
  const [{ columns, values }] = result;
  return values.map(row => {
    const obj = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}
