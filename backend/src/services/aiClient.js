// Shared AI API helper — gets user's custom key from user_settings, falls back to env
const DEEPSEEK_BASE = 'https://api.deepseek.com';

export async function getUserApiConfig(userId) {
  let apiKey = process.env.DEEPSEEK_API_KEY;
  let modelName = 'deepseek-chat';

  if (userId) {
    try {
      const { getDb, rowsToObjects } = await import('../db.js');
      const db = await getDb();
      const rows = rowsToObjects(
        db.exec('SELECT api_key, model_name FROM user_settings WHERE user_id = ?', [userId])
      );
      if (rows[0]?.api_key) {
        apiKey = rows[0].api_key;
        modelName = rows[0].model_name || 'deepseek-chat';
      }
    } catch { /* use defaults */ }
  }

  return { apiKey, modelName };
}

export async function aiChat(messages, userId, opts = {}) {
  const { apiKey, modelName } = await getUserApiConfig(userId);
  if (!apiKey) throw new Error('AI API Key 未配置');

  const response = await fetch(`${DEEPSEEK_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages,
      max_tokens: opts.maxTokens || 256,
      temperature: opts.temperature ?? 0.8,
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => 'unknown');
    throw new Error(`AI API error ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}
