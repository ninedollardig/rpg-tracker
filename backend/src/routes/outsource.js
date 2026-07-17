import { Router } from 'express';
import { getDb, saveDb, rowsToObjects } from '../db.js';
import { decomposeTask } from '../services/taskDecomposer.js';
import { pushStepsToFeishu } from '../services/feishuTask.js';

const router = Router();

// POST /api/outsource - Create and decompose a new task
router.post('/', async (req, res) => {
  try {
    const { task, deadline, progress, bottleneck, resources, importance, remind_mode } = req.body;

    if (!task || !task.trim()) {
      return res.status(400).json({ error: '请输入任务描述' });
    }

    // Convert deadline labels to actual dates
    let deadlineDate = deadline;
    if (deadline === 'today') {
      deadlineDate = new Date().toISOString().slice(0, 10);
    } else if (deadline === 'tomorrow') {
      const d = new Date(); d.setDate(d.getDate() + 1);
      deadlineDate = d.toISOString().slice(0, 10);
    } else if (deadline === 'this_week') {
      const d = new Date(); d.setDate(d.getDate() + (7 - d.getDay()));
      deadlineDate = d.toISOString().slice(0, 10);
    }

    const extra = { progress, bottleneck, resources, importance, remind_mode };
    const { title, steps, raw_response } = await decomposeTask(task, deadlineDate, '普通', extra, req.userId);

    const rawInput = task;

    const db = await getDb();
    db.run(
      'INSERT INTO outsource_tasks (title, raw_input, deadline, priority, status) VALUES (?, ?, ?, ?, ?)',
      [title, rawInput.trim(), deadlineDate || null, '普通', 'decomposed']
    );
    const idResult = db.exec('SELECT last_insert_rowid() as id');
    const taskId = idResult[0].values[0][0];

    for (const step of steps) {
      db.run(
        `INSERT INTO outsource_steps (task_id, step_order, title, description, estimated_minutes, trigger_time, reminder_time)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [taskId, step.step_order, step.title, step.description || '', step.estimated_minutes, step.trigger_time, step.reminder_time]
      );
    }
    saveDb();

    // Fetch the inserted steps to return with IDs
    const stepRows = db.exec('SELECT * FROM outsource_steps WHERE task_id = ? ORDER BY step_order', [taskId]);
    const savedSteps = stepRows.length ? rowsToObjects(stepRows) : [];

    res.json({
      id: taskId,
      title,
      raw_input: rawInput.trim(),
      deadline: deadlineDate || null,
      priority: '普通',
      status: 'decomposed',
      steps: savedSteps,
      raw_response,
    });
  } catch (err) {
    console.error('[outsource] decompose error:', err.message);
    res.status(500).json({ error: err.message || '任务拆解失败' });
  }
});

// GET /api/outsource - List all outsourced tasks
router.get('/', async (_req, res) => {
  try {
    const db = await getDb();
    const tasks = db.exec(
      'SELECT t.*, (SELECT COUNT(*) FROM outsource_steps WHERE task_id = t.id) as step_count FROM outsource_tasks t ORDER BY t.created_at DESC'
    );
    res.json(tasks.length ? rowsToObjects(tasks) : []);
  } catch (err) {
    console.error('[outsource] list error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/outsource/:id - Get single task with steps
router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const tasks = db.exec('SELECT * FROM outsource_tasks WHERE id = ?', [req.params.id]);
    if (!tasks.length || !tasks[0].values.length) {
      return res.status(404).json({ error: '任务不存在' });
    }
    const task = rowsToObjects(tasks)[0];
    const steps = db.exec('SELECT * FROM outsource_steps WHERE task_id = ? ORDER BY step_order', [req.params.id]);
    task.steps = steps.length ? rowsToObjects(steps) : [];
    res.json(task);
  } catch (err) {
    console.error('[outsource] get error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/outsource/:id/steps - Update steps (user edit)
router.put('/:id/steps', async (req, res) => {
  try {
    const { steps } = req.body;
    if (!Array.isArray(steps)) {
      return res.status(400).json({ error: 'steps must be an array' });
    }

    const db = await getDb();
    const taskCheck = db.exec('SELECT id FROM outsource_tasks WHERE id = ?', [req.params.id]);
    if (!taskCheck.length || !taskCheck[0].values.length) {
      return res.status(404).json({ error: '任务不存在' });
    }

    // Delete old steps and re-insert
    db.run('DELETE FROM outsource_steps WHERE task_id = ?', [req.params.id]);
    for (const step of steps) {
      db.run(
        `INSERT INTO outsource_steps (task_id, step_order, title, description, estimated_minutes, trigger_time, reminder_time)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [req.params.id, step.step_order, step.title, step.description || '', step.estimated_minutes || 20, step.trigger_time || '', step.reminder_time || '']
      );
    }
    saveDb();

    const updatedSteps = db.exec('SELECT * FROM outsource_steps WHERE task_id = ? ORDER BY step_order', [req.params.id]);
    res.json({ steps: updatedSteps.length ? rowsToObjects(updatedSteps) : [] });
  } catch (err) {
    console.error('[outsource] update steps error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/outsource/:id/push - Push steps to Feishu
router.post('/:id/push', async (req, res) => {
  try {
    const db = await getDb();
    const tasks = db.exec('SELECT * FROM outsource_tasks WHERE id = ?', [req.params.id]);
    if (!tasks.length || !tasks[0].values.length) {
      return res.status(404).json({ error: '任务不存在' });
    }
    const task = rowsToObjects(tasks)[0];
    const stepRows = db.exec('SELECT * FROM outsource_steps WHERE task_id = ? ORDER BY step_order', [req.params.id]);
    const steps = stepRows.length ? rowsToObjects(stepRows) : [];

    if (!steps.length) {
      return res.status(400).json({ error: '没有可推送的步骤' });
    }

    // Respond first, then push (fire-and-forget)
    res.json({ message: '正在推送到飞书...', taskId: task.id, stepCount: steps.length });

    const userId = req.userId;
    pushStepsToFeishu(task.title, steps, userId).then(results => {
      const successCount = results.filter(r => r.feishu_task_id).length;
      const db2 = getDb();
      db2.then(d => {
        d.run("UPDATE outsource_tasks SET status = 'pushed' WHERE id = ?", [task.id]);
        saveDb();
      });
      console.log(`[outsource] push complete: ${successCount}/${steps.length} steps pushed`);
    }).catch(err => {
      console.error('[outsource] push error:', err.message);
    });

  } catch (err) {
    console.error('[outsource] push error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/outsource/:id - Delete a task
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const check = db.exec('SELECT id FROM outsource_tasks WHERE id = ?', [req.params.id]);
    if (!check.length || !check[0].values.length) {
      return res.status(404).json({ error: '任务不存在' });
    }
    db.run('DELETE FROM outsource_steps WHERE task_id = ?', [req.params.id]);
    db.run('DELETE FROM outsource_tasks WHERE id = ?', [req.params.id]);
    saveDb();
    res.json({ success: true });
  } catch (err) {
    console.error('[outsource] delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
