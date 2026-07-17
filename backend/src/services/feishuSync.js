import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getDb, saveDb, rowsToObjects } from '../db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = join(__dirname, '..', '..', 'data', 'feishu-config.json');
const execAsync = promisify(exec);

const DEFAULT_CONFIG = {
  baseToken: '',
  tableId: '',
  setupCompleted: false,
  lastSyncAt: null,
  lastNotifyDate: null,
};

function loadConfig() {
  try {
    if (existsSync(CONFIG_PATH)) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(readFileSync(CONFIG_PATH, 'utf-8')) };
    }
  } catch { /* corrupted, use defaults */ }
  return { ...DEFAULT_CONFIG };
}

function saveConfig(config) {
  const dir = dirname(CONFIG_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

async function execLark(args) {
  const cmd = `lark-cli ${args}`;
  try {
    const { stdout, stderr } = await execAsync(cmd, {
      maxBuffer: 2 * 1024 * 1024,
      timeout: 30000,
    });
    if (stderr && !stderr.includes('Warning')) {
      console.warn('[feishu] stderr:', stderr.slice(0, 200));
    }
    try { return JSON.parse(stdout); } catch { return stdout.trim(); }
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.warn('[feishu] lark-cli not found, integration disabled');
    } else {
      console.error('[feishu] command failed:', err.message.slice(0, 200));
    }
    return null;
  }
}

export async function setupFeishuBase() {
  const config = loadConfig();
  if (config.setupCompleted && config.baseToken && config.tableId) return config;

  console.log('[feishu] Setting up Base...');

  const createResult = await execLark(
    'base +base-create --name "RPG Tracker 修炼数据" --time-zone "Asia/Shanghai" --as user'
  );
  if (!createResult) {
    console.error('[feishu] Failed to create Base');
    return config;
  }

  const baseToken = createResult.base_token
    || createResult?.result?.base?.base_token
    || createResult?.data?.base?.base_token
    || createResult?.data?.base_token;
  if (!baseToken) {
    console.error('[feishu] Could not extract base_token from response:', JSON.stringify(createResult).slice(0, 300));
    return config;
  }

  console.log('[feishu] Base created:', baseToken);

  const fields = JSON.stringify([
    { field_name: '本地ID', type: 'number' },
    { field_name: '活动类型', type: 'text' },
    { field_name: '分类', type: 'text' },
    { field_name: '子分类', type: 'text' },
    { field_name: '数量', type: 'number' },
    { field_name: '笔记', type: 'text' },
    { field_name: '获得经验', type: 'number' },
    { field_name: '记录日期', type: 'text' },
  ]);

  const tableResult = await execLark(
    `base +table-create --base-token "${baseToken}" --name "活动记录" --fields "${fields.replace(/"/g, '\\"')}" --as user`
  );
  if (!tableResult) {
    console.error('[feishu] Failed to create table');
    return config;
  }

  const tableId = tableResult.table_id
    || tableResult?.result?.table?.table_id
    || tableResult?.data?.table?.table_id
    || tableResult?.data?.table?.id
    || tableResult?.data?.table_id;
  if (!tableId) {
    console.error('[feishu] Could not extract table_id from response:', JSON.stringify(tableResult).slice(0, 300));
    return config;
  }

  console.log('[feishu] Table created:', tableId);

  config.baseToken = baseToken;
  config.tableId = tableId;
  config.setupCompleted = true;
  saveConfig(config);

  return config;
}

async function upsertFeishuRecord(activity) {
  const config = loadConfig();
  if (!config.setupCompleted) return null;

  const fields = {
    '本地ID': activity.localId || activity.id,
    '活动类型': activity.name_zh || '',
    '分类': activity.category || '',
    '子分类': activity.subcategory || '',
    '数量': activity.value ?? 0,
    '笔记': activity.notes || '',
    '获得经验': activity.exp_earned ?? 0,
    '记录日期': activity.logged_date || '',
  };

  const jsonStr = JSON.stringify(fields).replace(/"/g, '\\"');

  let args = `base +record-upsert --base-token "${config.baseToken}" --table-id "${config.tableId}" --json "${jsonStr}" --as user`;
  if (activity.feishu_record_id) {
    args += ` --record-id "${activity.feishu_record_id}"`;
  }

  const result = await execLark(args);
  if (!result) return null;

  const recordId = result.record_id
    || result?.result?.record?.record_id
    || result?.data?.record?.record_id
    || result?.data?.record?.record_id_list?.[0];

  if (recordId && !activity.feishu_record_id) {
    const db = await getDb();
    db.run('UPDATE activities SET feishu_record_id = ? WHERE id = ?', [recordId, activity.localId || activity.id]);
    saveDb();
  }

  return recordId;
}

async function deleteFeishuRecord(feishuRecordId) {
  if (!feishuRecordId) return;
  const config = loadConfig();
  if (!config.setupCompleted) return;

  await execLark(
    `base +record-delete --base-token "${config.baseToken}" --table-id "${config.tableId}" --record-id "${feishuRecordId}" --yes --as user`
  );
}

async function fullSync(userId) {
  const config = loadConfig();
  if (!config.setupCompleted) return;

  const db = await getDb();
  const records = rowsToObjects(db.exec(
    `SELECT a.id, a.value, a.notes, a.exp_earned, a.logged_date, a.feishu_record_id,
            at.name_zh, at.category, at.subcategory
     FROM activities a
     JOIN activity_types at ON a.activity_type_id = at.id
     WHERE a.feishu_record_id IS NULL AND a.user_id = ?`,
    [userId]
  ));

  if (!records.length) {
    console.log('[feishu] All records synced, nothing to do');
    return;
  }

  console.log(`[feishu] Syncing ${records.length} unsynced records...`);

  for (const row of records) {
    await upsertFeishuRecord({
      localId: row.id,
      name_zh: row.name_zh,
      category: row.category,
      subcategory: row.subcategory,
      value: row.value,
      notes: row.notes,
      exp_earned: row.exp_earned,
      logged_date: row.logged_date,
      feishu_record_id: row.feishu_record_id,
    });
  }

  const config2 = loadConfig();
  config2.lastSyncAt = new Date().toISOString();
  saveConfig(config2);
  console.log('[feishu] Full sync complete');
}

// Public API (fire-and-forget, never throws)
export function syncAfterCreate(activity) {
  upsertFeishuRecord(activity).catch(err =>
    console.error('[feishu] sync create error:', err.message)
  );
}

export function syncAfterUpdate(activity) {
  upsertFeishuRecord(activity).catch(err =>
    console.error('[feishu] sync update error:', err.message)
  );
}

export function syncAfterDelete(feishuRecordId) {
  deleteFeishuRecord(feishuRecordId).catch(err =>
    console.error('[feishu] sync delete error:', err.message)
  );
}

export async function initFeishuSync() {
  try {
    const config = await setupFeishuBase();
    if (config.setupCompleted) {
      // Sync for all users (typically just userId=1)
      await fullSync(1);
    }
  } catch (err) {
    console.error('[feishu] init error:', err.message);
  }
}

export { loadConfig, saveConfig };
