import { Router } from 'express';
import { getDb, rowsToObjects, saveDb } from '../db.js';
import { processStudyMaterial, runDeepDive, generatePracticeCards } from '../services/studyProcessor.js';
import { sendPostMessage, getFeishuTarget } from '../services/feishuNotify.js';
import { writeFileSync, unlinkSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const router = Router();

// ── File text extraction ──
router.post('/extract-text', async (req, res) => {
  const { filename, content } = req.body; // content: base64
  if (!filename || !content) return res.status(400).json({ error: '缺少文件' });

  const ext = filename.split('.').pop()?.toLowerCase();
  const tmpDir = tmpdir();
  const tmpFile = join(tmpDir, `study_upload_${Date.now()}.${ext}`);

  try {
    // Save temp file
    const buf = Buffer.from(content, 'base64');
    writeFileSync(tmpFile, buf);

    let text = '';

    if (ext === 'txt') {
      text = readFileSync(tmpFile, 'utf-8');
    } else if (ext === 'docx') {
      // Use python ooxml unpack approach
      const unpackScript = 'D:\\AItools-Wang\\.claude\\skills\\docx\\ooxml\\scripts\\unpack.py';
      const outDir = tmpFile + '_unpacked';
      await execAsync(`python "${unpackScript}" "${tmpFile}" "${outDir}"`, { timeout: 15000 });

      // Read extracted text from document.xml
      const docXml = readFileSync(join(outDir, 'word', 'document.xml'), 'utf-8');
      const matches = docXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
      if (matches) {
        text = matches.map(m => m.replace(/<[^>]+>/g, '')).join('');
        // Decode XML/HTML numeric character entities (e.g. &#31532; → 第)
        text = text.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
        text = text.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
      }

      // Cleanup unpacked dir
      try { await execAsync(`rmdir /s /q "${outDir}"`, { timeout: 5000 }); } catch { }
    } else if (ext === 'pdf') {
      // Use python pdfplumber
      const pyCode = `
import sys
try:
    import pdfplumber
    with pdfplumber.open(r"${tmpFile.replace(/\\/g, '\\\\')}") as pdf:
        text = '\\n'.join(page.extract_text() or '' for page in pdf.pages)
        print(text)
except ImportError:
    print('PDFPLUMBER_NOT_INSTALLED')
except Exception as e:
    print(f'PDF_ERROR: {e}')
`;
      const tmpPy = tmpFile + '.py';
      writeFileSync(tmpPy, pyCode, 'utf-8');
      try {
        const { stdout } = await execAsync(`python "${tmpPy}"`, { timeout: 30000 });
        if (stdout.includes('PDFPLUMBER_NOT_INSTALLED')) {
          return res.status(500).json({ error: 'PDF 解析需要安装 pdfplumber：pip install pdfplumber' });
        }
        if (stdout.startsWith('PDF_ERROR:')) {
          return res.status(500).json({ error: stdout });
        }
        text = stdout;
      } finally {
        try { unlinkSync(tmpPy); } catch { }
      }
    } else {
      return res.status(400).json({ error: `不支持的文件格式: .${ext}` });
    }

    // Cleanup
    try { unlinkSync(tmpFile); } catch { }

    // Decode any residual XML/HTML numeric character entities (&#dddd; or &#xhhhh;)
    text = text.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
    text = text.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));

    if (!text.trim()) return res.status(400).json({ error: '未能从文件中提取到文字内容' });

    res.json({ text: text.trim(), filename });
  } catch (err) {
    try { unlinkSync(tmpFile); } catch { }
    res.status(500).json({ error: '文件处理失败: ' + err.message });
  }
});

// ── List sessions ──
router.get('/', async (req, res) => {
  const db = await getDb();
  const sessions = rowsToObjects(db.exec(
    'SELECT id, title, subject, status, created_at FROM study_sessions WHERE user_id = ? ORDER BY created_at DESC',
    [req.userId]
  ));
  res.json(sessions);
});

// ── Create session + run Step 1 AI processing ──
router.post('/', async (req, res) => {
  const { title, subject, raw_material } = req.body;
  if (!raw_material || !raw_material.trim()) {
    return res.status(400).json({ error: '请输入学习材料' });
  }

  const db = await getDb();

  // Run AI processing first (may throw, handled by Express error middleware)
  let step1Result;
  try {
    step1Result = await processStudyMaterial(raw_material.trim(), subject || '', req.userId);
  } catch (e) {
    return res.status(500).json({ error: 'AI 处理失败：' + e.message });
  }

  // Persist session
  db.run(
    'INSERT INTO study_sessions (user_id, title, subject, raw_material, status) VALUES (?, ?, ?, ?, ?)',
    [req.userId, title || '', subject || '', raw_material.trim(), 'step1']
  );
  const sessionId = rowsToObjects(db.exec('SELECT last_insert_rowid() as id'))[0].id;

  // Persist Step 1 output
  db.run(
    'INSERT INTO study_step1_output (session_id, structured_notes, keywords_json, framework_json, mind_map_json, qa_pairs_json, raw_response) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [sessionId, step1Result.structured_notes, '[]',
     JSON.stringify(step1Result.framework), '{}',
     JSON.stringify(step1Result.qa_pairs), step1Result.raw_response]
  );

  saveDb();

  const session = rowsToObjects(db.exec('SELECT * FROM study_sessions WHERE id = ?', [sessionId]))[0];

  res.status(201).json({
    session,
    step1: {
      structured_notes: step1Result.structured_notes,
      framework: step1Result.framework,
      mind_map: step1Result.mind_map,
      qa_pairs: step1Result.qa_pairs,
    },
  });
});

// ── Get single session with all step data ──
router.get('/:id', async (req, res) => {
  const db = await getDb();
  const session = rowsToObjects(db.exec(
    'SELECT * FROM study_sessions WHERE id = ? AND user_id = ?', [req.params.id, req.userId]
  ))[0];
  if (!session) return res.status(404).json({ error: '会话不存在' });

  const step1 = rowsToObjects(db.exec(
    'SELECT structured_notes, keywords_json, framework_json, mind_map_json, qa_pairs_json FROM study_step1_output WHERE session_id = ?', [session.id]
  ))[0];

  const insights = rowsToObjects(db.exec(
    'SELECT id, insight_type, user_prompt, ai_content, is_saved, created_at FROM study_step2_insights WHERE session_id = ? ORDER BY created_at DESC', [session.id]
  ));

  const cards = rowsToObjects(db.exec(
    'SELECT id, question, answer, difficulty, review_count, last_reviewed_at, next_review_at FROM study_step3_cards WHERE session_id = ? ORDER BY difficulty, id', [session.id]
  ));

  res.json({
    session,
    step1: step1 ? {
      structured_notes: step1.structured_notes,
      framework: safeJson(step1.framework_json),
      qa_pairs: safeJson(step1.qa_pairs_json),
    } : null,
    insights,
    cards,
  });
});

// ── Step 2: Run deep-dive action ──
router.post('/:id/step2', async (req, res) => {
  const { action_type, user_prompt } = req.body;
  if (!action_type || !['logic', 'example', 'deduction', 'custom'].includes(action_type)) {
    return res.status(400).json({ error: '请选择有效的加工类型：logic/example/deduction/custom' });
  }

  const db = await getDb();
  const session = rowsToObjects(db.exec(
    'SELECT * FROM study_sessions WHERE id = ? AND user_id = ?', [req.params.id, req.userId]
  ))[0];
  if (!session) return res.status(404).json({ error: '会话不存在' });

  const step1 = rowsToObjects(db.exec(
    'SELECT structured_notes FROM study_step1_output WHERE session_id = ?', [session.id]
  ))[0];
  const context = step1?.structured_notes || session.raw_material;

  let aiContent;
  try {
    aiContent = await runDeepDive(context, action_type, user_prompt || '', req.userId);
  } catch (e) {
    return res.status(500).json({ error: 'AI 处理失败：' + e.message });
  }

  db.run(
    'INSERT INTO study_step2_insights (session_id, insight_type, user_prompt, ai_content) VALUES (?, ?, ?, ?)',
    [session.id, action_type, user_prompt || '', aiContent]
  );
  db.run('UPDATE study_sessions SET status = ?, updated_at = datetime(\'now\',\'localtime\') WHERE id = ?', ['step2', session.id]);
  saveDb();

  const insight = rowsToObjects(db.exec('SELECT * FROM study_step2_insights WHERE id = (SELECT last_insert_rowid())'))[0];
  res.status(201).json({ insight });
});

// ── Step 2: Toggle bookmark ──
router.put('/:id/step2/:insightId/save', async (req, res) => {
  const db = await getDb();
  const insight = rowsToObjects(db.exec(
    'SELECT id, is_saved FROM study_step2_insights WHERE id = ? AND session_id = ?',
    [req.params.insightId, req.params.id]
  ))[0];
  if (!insight) return res.status(404).json({ error: '洞察不存在' });

  const newVal = insight.is_saved ? 0 : 1;
  db.run('UPDATE study_step2_insights SET is_saved = ? WHERE id = ?', [newVal, insight.id]);
  saveDb();
  res.json({ id: insight.id, is_saved: !!newVal });
});

// ── Step 2: Delete insight ──
router.delete('/:id/step2/:insightId', async (req, res) => {
  const db = await getDb();
  db.run('DELETE FROM study_step2_insights WHERE id = ? AND session_id = ?', [req.params.insightId, req.params.id]);
  saveDb();
  res.json({ deleted: true });
});

// ── Step 3: Generate practice cards ──
router.post('/:id/step3', async (req, res) => {
  const db = await getDb();
  const session = rowsToObjects(db.exec(
    'SELECT * FROM study_sessions WHERE id = ? AND user_id = ?', [req.params.id, req.userId]
  ))[0];
  if (!session) return res.status(404).json({ error: '会话不存在' });

  const step1 = rowsToObjects(db.exec(
    'SELECT qa_pairs_json FROM study_step1_output WHERE session_id = ?', [session.id]
  ))[0];
  const qaPairs = step1 ? safeJson(step1.qa_pairs_json) : [];

  let cards;
  try {
    cards = await generatePracticeCards(session.raw_material, qaPairs, req.userId);
  } catch (e) {
    return res.status(500).json({ error: 'AI 生成题目失败：' + e.message });
  }

  if (!cards.length) {
    return res.status(500).json({ error: 'AI 未能生成有效题目，请重试' });
  }

  // Clear old cards and insert new ones
  db.run('DELETE FROM study_step3_cards WHERE session_id = ?', [session.id]);
  for (const c of cards) {
    db.run(
      'INSERT INTO study_step3_cards (session_id, question, answer, difficulty) VALUES (?, ?, ?, ?)',
      [session.id, c.question, c.answer, c.difficulty]
    );
  }
  db.run('UPDATE study_sessions SET status = ?, updated_at = datetime(\'now\',\'localtime\') WHERE id = ?', ['step3', session.id]);
  saveDb();

  const allCards = rowsToObjects(db.exec(
    'SELECT id, question, answer, difficulty, review_count FROM study_step3_cards WHERE session_id = ? ORDER BY difficulty, id', [session.id]
  ));
  res.status(201).json({ cards: allCards, count: allCards.length });
});

// ── Step 3: Review a card ──
router.put('/:id/step3/:cardId/review', async (req, res) => {
  const db = await getDb();
  const card = rowsToObjects(db.exec(
    'SELECT * FROM study_step3_cards WHERE id = ? AND session_id = ?', [req.params.cardId, req.params.id]
  ))[0];
  if (!card) return res.status(404).json({ error: '卡片不存在' });

  const now = new Date().toISOString();
  const newCount = card.review_count + 1;
  const intervals = [1, 3, 7, 14];
  const daysToAdd = intervals[Math.min(newCount - 1, intervals.length - 1)];
  const nextReview = new Date(Date.now() + daysToAdd * 86400000).toISOString().slice(0, 10);

  db.run(
    'UPDATE study_step3_cards SET review_count = ?, last_reviewed_at = ?, next_review_at = ? WHERE id = ?',
    [newCount, now, nextReview, card.id]
  );
  saveDb();

  const updated = rowsToObjects(db.exec('SELECT * FROM study_step3_cards WHERE id = ?', [card.id]))[0];
  res.json({ card: updated });
});

// ── Step 3: Push cards to Feishu (fire-and-forget) ──
router.post('/:id/step3/push', async (req, res) => {
  const db = await getDb();
  const session = rowsToObjects(db.exec(
    'SELECT * FROM study_sessions WHERE id = ? AND user_id = ?', [req.params.id, req.userId]
  ))[0];
  if (!session) return res.status(404).json({ error: '会话不存在' });

  const targetId = await getFeishuTarget(db, req.userId);
  if (!targetId) return res.status(400).json({ error: '请先在「我的」页面填写飞书 Open ID' });

  const cards = rowsToObjects(db.exec(
    'SELECT id, question, answer, difficulty FROM study_step3_cards WHERE session_id = ? ORDER BY id', [session.id]
  ));
  if (!cards.length) return res.status(400).json({ error: '没有可推送的卡片，请先生成练习题' });

  // Respond first, then push
  res.json({ message: '正在推送到飞书...', cardCount: cards.length });

  // Fire-and-forget: one rich post summary (matching outsource push style)
  const subjectLabel = session.subject || session.title || '复习';
  const difficultyStars = { easy: '⭐', medium: '⭐⭐', hard: '⭐⭐⭐' };

  const paragraphs = [];
  paragraphs.push(`📚 **复习卡片** · ${subjectLabel}`);
  paragraphs.push('');
  paragraphs.push(`已生成 **${cards.length}** 张练习卡片：`);
  paragraphs.push('');

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    paragraphs.push(`───`);
    paragraphs.push(`❓ **${i + 1}. ${card.question}**`);
    paragraphs.push('');
    paragraphs.push(`💡 _${card.answer}_`);
    paragraphs.push(`▸ 难度：${difficultyStars[card.difficulty] || '⭐'}`);
    paragraphs.push('');
  }

  paragraphs.push('───');
  paragraphs.push('打开 RPG Tracker → 期末复习 查看详情 ✨');

  sendPostMessage(paragraphs, targetId).catch(err =>
    console.error('[study] push cards failed:', err.message?.slice(0, 200))
  );

  // Mark session completed
  try {
    const db2 = await getDb();
    db2.run('UPDATE study_sessions SET status = ?, updated_at = datetime(\'now\',\'localtime\') WHERE id = ?', ['completed', session.id]);
    saveDb();
  } catch { /* ignore */ }
});

// ── Delete session ──
router.delete('/:id', async (req, res) => {
  const db = await getDb();
  const session = rowsToObjects(db.exec(
    'SELECT id FROM study_sessions WHERE id = ? AND user_id = ?', [req.params.id, req.userId]
  ))[0];
  if (!session) return res.status(404).json({ error: '会话不存在' });

  db.run('DELETE FROM study_sessions WHERE id = ?', [session.id]);
  saveDb();
  res.json({ deleted: true });
});

// ── Export to Obsidian ──
router.post('/export-obsidian', async (req, res) => {
  const { content, filename, vault_path } = req.body;
  if (!content || !filename || !vault_path) {
    return res.status(400).json({ error: '缺少内容、文件名或 vault 路径' });
  }

  try {
    const { mkdirSync, writeFileSync, existsSync } = await import('fs');
    const { join } = await import('path');

    // Ensure target directory exists (e.g. vault/study/)
    const targetDir = join(vault_path, 'RPG学习导出');
    if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });

    const safeName = filename.replace(/[<>:"/\\|?*]/g, '_');
    const filepath = join(targetDir, `${safeName}.md`);

    // Add YAML frontmatter for Obsidian
    const md = `---
created: ${new Date().toISOString().slice(0, 10)}
source: RPG Tracker 期末复习
---

${content}`;

    writeFileSync(filepath, md, 'utf-8');
    res.json({ success: true, path: filepath });
  } catch (e) {
    res.status(500).json({ error: '导出失败: ' + e.message });
  }
});

// ── Save vault path ──
router.put('/vault-path', async (req, res) => {
  const { vault_path } = req.body;
  if (!vault_path) return res.status(400).json({ error: '请输入 vault 路径' });

  try {
    const { existsSync } = await import('fs');
    if (!existsSync(vault_path)) return res.status(400).json({ error: '路径不存在' });
    if (!existsSync(vault_path + '\\.obsidian')) return res.status(400).json({ error: '该目录不是 Obsidian vault（缺少 .obsidian 文件夹）' });
  } catch {
    return res.status(400).json({ error: '路径校验失败' });
  }

  const db = await getDb();
  const exists = db.exec('SELECT user_id FROM user_settings WHERE user_id = ?', [req.userId]);
  if (exists.length && exists[0].values.length) {
    db.run('UPDATE user_settings SET vault_path = ? WHERE user_id = ?', [vault_path, req.userId]);
  } else {
    db.run('INSERT INTO user_settings (user_id, vault_path) VALUES (?, ?)', [req.userId, vault_path]);
  }
  saveDb();
  res.json({ vault_path });
});

// ── Get vault path ──
router.get('/vault-path', async (req, res) => {
  const db = await getDb();
  const row = rowsToObjects(db.exec('SELECT vault_path FROM user_settings WHERE user_id = ?', [req.userId]))[0];
  res.json({ vault_path: row?.vault_path || '' });
});

// ── Helper ──
function safeJson(str) {
  try { return JSON.parse(str); } catch { return []; }
}

export default router;
