import { Router } from 'express';
import { getDb, rowsToObjects, saveDb } from '../db.js';

const router = Router();

const DEFAULT_DIMENSIONS = [
  { name: '视觉想象', hint: '能否在脑中生成清晰图像和动态模拟' },
  { name: '发散联想', hint: '从一点出发扩展多维网络的能力' },
  { name: '任务切换', hint: '在不同任务间切换的成本和收益' },
  { name: '深度心流', hint: '多模态反馈下能持续沉浸的时长' },
  { name: '工作记忆', hint: '同时处理和保持信息的能力' },
  { name: '语言逻辑', hint: '通过内心独白进行推理的能力' },
  { name: '情绪耦合', hint: '对情绪的敏感程度和调节能力' },
  { name: '抑制控制', hint: '压制自动反应的控制力' },
  { name: '机械执行', hint: '对线性重复操作的耐受度' },
];

// Get user settings
router.get('/', async (req, res) => {
  const db = await getDb();
  const rows = rowsToObjects(
    db.exec('SELECT * FROM user_settings WHERE user_id = ?', [req.userId])
  );
  const settings = rows[0] || { api_key: '', model_name: 'deepseek-chat', self_profile: '', radar_scores: '[]', feishu_id: '' };

  // Parse radar_scores JSON
  let radarScores = [];
  try { radarScores = JSON.parse(settings.radar_scores); } catch { radarScores = []; }

  // Don't expose full API key — only last 4 chars
  const maskedKey = settings.api_key
    ? 'sk-' + '*'.repeat(Math.max(0, settings.api_key.length - 7)) + settings.api_key.slice(-4)
    : '';

  res.json({
    api_key: settings.api_key,
    api_key_masked: maskedKey,
    model_name: settings.model_name,
    self_profile: settings.self_profile,
    feishu_id: settings.feishu_id || '',
    vault_path: settings.vault_path || '',
    radar_scores: radarScores,
  });
});

// Update user settings
router.put('/', async (req, res) => {
  const db = await getDb();
  const { api_key, model_name, self_profile, radar_scores, feishu_id, vault_path } = req.body;

  const existing = rowsToObjects(
    db.exec('SELECT user_id FROM user_settings WHERE user_id = ?', [req.userId])
  );

  if (existing.length) {
    const updates = [];
    const params = [];
    if (api_key !== undefined) { updates.push('api_key = ?'); params.push(api_key); }
    if (model_name !== undefined) { updates.push('model_name = ?'); params.push(model_name); }
    if (self_profile !== undefined) { updates.push('self_profile = ?'); params.push(self_profile); }
    if (radar_scores !== undefined) { updates.push('radar_scores = ?'); params.push(JSON.stringify(radar_scores)); }
    if (feishu_id !== undefined) { updates.push('feishu_id = ?'); params.push(feishu_id); }
    if (vault_path !== undefined) { updates.push('vault_path = ?'); params.push(vault_path); }
    if (updates.length) {
      params.push(req.userId);
      db.run(`UPDATE user_settings SET ${updates.join(', ')} WHERE user_id = ?`, params);
    }
  } else {
    db.run(
      'INSERT INTO user_settings (user_id, api_key, model_name, self_profile, radar_scores, feishu_id, vault_path) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.userId, api_key || '', model_name || 'deepseek-chat', self_profile || '', JSON.stringify(radar_scores || []), feishu_id || '', vault_path || '']
    );
  }
  saveDb();
  res.json({ success: true });
});

// Generate radar scores from self-profile using AI
router.post('/generate-radar', async (req, res) => {
  const db = await getDb();
  const settings = rowsToObjects(
    db.exec('SELECT api_key, self_profile FROM user_settings WHERE user_id = ?', [req.userId])
  )[0];

  const profileText = req.body.self_profile || settings?.self_profile || '';
  if (!profileText || profileText.trim().length < 20) {
    return res.status(400).json({ error: '请先填写至少20字的自我画像' });
  }

  const apiKey = settings?.api_key || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(400).json({ error: '请先设置 API Key' });
  }

  const dimensionsPrompt = DEFAULT_DIMENSIONS
    .map((d, i) => `${i + 1}. ${d.name}：${d.hint}`)
    .join('\n');

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: settings?.model_name || 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一位心理学评估专家。根据用户的自我描述，对其9个认知维度进行评分（0-10分，可保留一位小数）。每个维度需给出简短解释（20字以内）。

评分维度：
${dimensionsPrompt}

输出格式：严格返回 JSON 数组，每个元素包含 name、score、desc 三个字段。`,
          },
          { role: 'user', content: profileText },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => 'unknown');
      return res.status(502).json({ error: `AI 请求失败: ${err.slice(0, 200)}` });
    }

    const data = await response.json();
    const completion = data.choices?.[0]?.message?.content || '';

    // Parse JSON from response
    let scores = [];
    const jsonMatch = completion.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try { scores = JSON.parse(jsonMatch[0]); } catch { /* fall through */ }
    }

    if (!scores.length) {
      return res.status(500).json({ error: 'AI 返回格式异常，请重试', raw: completion.slice(0, 200) });
    }

    // Save radar scores
    const existing = rowsToObjects(
      db.exec('SELECT user_id FROM user_settings WHERE user_id = ?', [req.userId])
    );
    if (existing.length) {
      db.run('UPDATE user_settings SET radar_scores = ? WHERE user_id = ?', [JSON.stringify(scores), req.userId]);
    } else {
      db.run(
        'INSERT INTO user_settings (user_id, api_key, model_name, self_profile, radar_scores) VALUES (?, ?, ?, ?, ?)',
        [req.userId, '', 'deepseek-chat', '', JSON.stringify(scores)]
      );
    }
    saveDb();

    res.json({ scores });
  } catch (e) {
    res.status(500).json({ error: `生成失败: ${e.message}` });
  }
});

export default router;
