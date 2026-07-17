import { exec } from 'child_process';
import { promisify } from 'util';
import { getDb, saveDb, rowsToObjects } from '../db.js';
import { sendPostMessage } from './feishuNotify.js';

const execAsync = promisify(exec);
const NODE_EXE = 'D:\\AI tools-Wang\\node.exe';
const LARK_CLI = 'C:\\Users\\Lenovo\\AppData\\Roaming\\npm\\node_modules\\@larksuite\\cli\\scripts\\run.js';

async function execLark(args) {
  const cmd = `"${NODE_EXE}" "${LARK_CLI}" ${args}`;
  try {
    const { stdout, stderr } = await execAsync(cmd, {
      maxBuffer: 2 * 1024 * 1024,
      timeout: 30000,
    });
    if (stderr && !stderr.includes('Warning')) {
      console.warn('[feishu-task] stderr:', stderr.slice(0, 200));
    }
    try { return JSON.parse(stdout); } catch { return stdout.trim(); }
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.warn('[feishu-task] lark-cli not found');
    } else {
      console.error('[feishu-task] command failed:', err.message.slice(0, 200));
    }
    return null;
  }
}

async function getFeishuTarget(userId) {
  try {
    const db = await getDb();
    const row = rowsToObjects(
      db.exec('SELECT feishu_id FROM user_settings WHERE user_id = ?', [userId])
    );
    return row[0]?.feishu_id || null;
  } catch {
    return null;
  }
}

export async function pushStepsToFeishu(taskTitle, steps, userId) {
  const results = [];
  const targetId = await getFeishuTarget(userId);

  for (const step of steps) {
    const title = `[庶务] ${step.title}`;

    try {
      const titleEscaped = title.replace(/"/g, '\\"').replace(/\n/g, ' ');
      let cmd = `task +create --summary "${titleEscaped}" --as user`;
      if (targetId) {
        cmd += ` --assignee "${targetId}"`;
      }

      // Build description with full step details
      const descParts = [];
      if (step.description) descParts.push(step.description);
      descParts.push(`⏱ 预计 ${step.estimated_minutes || '?'} 分钟`);
      if (step.trigger_time) descParts.push(`🔔 触发时间：${step.trigger_time}`);
      const desc = descParts.join('\n');
      const descEscaped = desc.replace(/"/g, '\\"').replace(/\n/g, '\\n');
      cmd += ` --description "${descEscaped}"`;

      const result = await execLark(cmd);

      let feishuTaskId = null;
      if (result && typeof result === 'object') {
        feishuTaskId = result.id
          || result?.data?.task?.id
          || result?.data?.id
          || result?.data?.guid
          || null;
      }

      results.push({
        step_order: step.step_order,
        title: step.title,
        description: step.description,
        estimated_minutes: step.estimated_minutes,
        trigger_time: step.trigger_time,
        reminder_time: step.reminder_time,
        feishu_task_id: feishuTaskId,
        error: feishuTaskId ? null : 'no task id returned',
      });

      if (feishuTaskId) {
        console.log(`[feishu-task] created: "${step.title}" -> ${feishuTaskId}`);
      }
    } catch (err) {
      results.push({
        step_order: step.step_order,
        title: step.title,
        feishu_task_id: null,
        error: err.message,
      });
      console.error(`[feishu-task] failed to create "${step.title}":`, err.message);
    }
  }

  // Send rich post-format summary to Feishu (matching adventure notes style)
  if (targetId) {
    const paragraphs = [];
    const successCount = results.filter(r => r.feishu_task_id).length;

    paragraphs.push(`📋 **庶务外包** · ${taskTitle}`);
    paragraphs.push('');
    paragraphs.push(`已拆解为 **${steps.length}** 个步骤，成功推送 **${successCount}** 个：`);
    paragraphs.push('');

    for (const r of results) {
      const status = r.feishu_task_id ? '✅' : '⚠️';
      paragraphs.push(`${status} **${r.step_order}. ${r.title}**`);
      if (r.description) paragraphs.push(`_${r.description}_`);
      paragraphs.push(`▸ ⏱ 预计 ${r.estimated_minutes || '?'} 分钟`);
      if (r.trigger_time) paragraphs.push(`▸ 🔔 触发时间：${r.trigger_time}`);
      if (r.reminder_time) paragraphs.push(`▸ ⏰ 提醒时间：${r.reminder_time}`);
      if (!r.feishu_task_id) paragraphs.push(`▸ ❌ 推送失败：${r.error || '未知错误'}`);
      paragraphs.push('');
    }

    paragraphs.push('───');
    paragraphs.push('打开 RPG Tracker → 庶务外包 查看详情 ✨');

    sendPostMessage(paragraphs, targetId)
      .catch(err => console.error('[feishu-task] summary message failed:', err.message));
  }

  // Update database with feishu_task_ids
  const db = await getDb();
  for (const r of results) {
    const step = steps.find(s => s.step_order === r.step_order);
    if (step?.id && r.feishu_task_id) {
      db.run('UPDATE outsource_steps SET feishu_task_id = ? WHERE id = ?',
        [r.feishu_task_id, step.id]);
    }
  }
  saveDb();

  return results;
}
