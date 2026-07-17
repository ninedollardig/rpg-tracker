import { readFileSync, existsSync } from 'fs';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE = 'https://api.deepseek.com';

const FALLBACK_PROMPT = `# AI任务拆解与生活安排提示词

## 角色设定
你是一位个人效率顾问，帮助拆解任务为可执行的极小行动，尊重20分钟注意力周期。

## 输出格式
请严格按照以下步骤输出：

### 3. 拆解为20分钟可完成的极小动作
- 将任务拆成若干个时间预算在20分钟以内的动作。
- 每个动作需明确：具体做什么、预期时长、启动触发（如"吃完午饭后"）。
- 格式：- 动作X：[内容]，预估[X]分钟，触发：[触发条件]`;

const TRIGGER_TIME_MAP = {
  '早饭': '08:30', '早餐': '08:30', '早饭前': '07:30', '早饭后': '08:30',
  '午休': '13:30', '午饭': '12:30', '午饭后': '13:00', '午休后': '13:30', '下午': '14:00',
  '晚饭': '19:00', '晚餐': '19:00', '晚饭后': '19:30', '晚上': '20:00',
  '明天': '09:00', '明早': '09:00', '明上午': '09:00', '明下午': '14:00', '明晚': '19:00',
  '后天': '09:00', '今天': '09:00', '现在': 'now',
};

function loadPromptTemplate() {
  const promptPath = 'D:/AItools-Wang/.claude/projects/videcoading/prompts.md';
  try {
    if (existsSync(promptPath)) {
      const content = readFileSync(promptPath, 'utf-8');
      // Extract the task decomposition template section
      const startMarker = '### 模板：任务拆解';
      const endMarker = '### 衔接：拆解结果推送飞书提醒';
      const startIdx = content.indexOf(startMarker);
      const endIdx = content.indexOf(endMarker, startIdx);
      if (startIdx !== -1 && endIdx !== -1) {
        // Skip the markdown heading and code fence
        const template = content.slice(startIdx, endIdx);
        const codeStart = template.indexOf('```\n');
        const codeEnd = template.lastIndexOf('```');
        if (codeStart !== -1 && codeEnd !== -1) {
          return template.slice(codeStart + 4, codeEnd).trim();
        }
      }
    }
  } catch (e) {
    console.warn('[decomposer] cannot load prompt template, using fallback:', e.message);
  }
  return FALLBACK_PROMPT;
}

function inferReminderTime(triggerText) {
  for (const [keyword, time] of Object.entries(TRIGGER_TIME_MAP)) {
    if (triggerText.includes(keyword)) return time;
  }
  return '09:00'; // default: next morning 9am
}

function makeShortTitle(fullText) {
  if (!fullText) return '';
  // Already short enough
  if (fullText.length <= 10) return fullText;
  // Try splitting at first separator
  const sepMatch = fullText.match(/^(.+?)[，,、。—\s](.+)$/);
  if (sepMatch && sepMatch[1].length <= 10) return sepMatch[1];
  // Truncate
  return fullText.slice(0, 10) + '…';
}

function parseStepsFromResponse(text) {
  const steps = [];
  let order = 0;

  const lines = text.split(/\n/);
  for (const line of lines) {
    const m = line.match(/^[-*]\s+(?:\*\*)?动作\s*(\d+)[：:]?\*?\*?\s*(.+)$/);
    if (!m) continue;

    order++;
    const rest = m[2].replace(/\*\*/g, '').trim();

    let fullTitle = rest;
    let minutes = 20;
    let triggerText = '';

    const minMatch = rest.match(/预估\s*(?:\[(\d+)\]|(\d+))\s*分/);
    if (minMatch) {
      minutes = parseInt(minMatch[1] || minMatch[2]) || 20;
      const idx = rest.indexOf(minMatch[0]);
      fullTitle = rest.slice(0, idx).replace(/[，,。.]$/, '').trim();
      const afterMin = rest.slice(idx + minMatch[0].length);
      const trigMatch = afterMin.match(/触发[：:]\s*(.+)/);
      if (trigMatch) {
        triggerText = trigMatch[1].replace(/^\*+|\*+$/g, '').replace(/^\[(.+)\]$/, '$1').replace(/[。,.]$/, '').trim();
      }
    }

    fullTitle = fullTitle
      .replace(/^\[(.+)\]$/, '$1')
      .replace(/^[：:\s]+/, '')
      .replace(/[。.]$/, '')
      .trim();

    if (fullTitle.length >= 2) {
      const shortTitle = makeShortTitle(fullTitle);
      const description = shortTitle !== fullTitle ? fullTitle : '';
      const reminderTime = inferReminderTime(triggerText);
      steps.push({
        step_order: order,
        title: shortTitle,
        description,
        estimated_minutes: minutes,
        trigger_time: triggerText,
        reminder_time: reminderTime,
      });
    }
  }

  return steps;
}

function extractTitle(rawInput) {
  const clean = rawInput.replace(/\n/g, ' ').trim();
  return clean.length > 30 ? clean.slice(0, 30) + '...' : clean;
}

const PROGRESS_LABELS = {
  not_started: '完全没开始',
  ideas: '有一些想法/素材',
  half_way: '做了一半',
  almost_done: '快完成了',
};

const BOTTLENECK_LABELS = {
  start: '不知道从哪开始',
  info: '信息/资料不够',
  direction: '方向不清晰',
  motivation: '就是不想动',
  fear: '怕做不好',
};

const IMPORTANCE_LABELS = {
  urgent: '紧急且重要',
  important: '重要但不紧急',
  optional: '做不做都行',
};

export async function decomposeTask(rawInput, deadline, priority, extra = {}, userId) {
  let apiKey = DEEPSEEK_API_KEY;
  let modelName = 'deepseek-chat';

  // Use user's custom API key if available
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
    } catch { /* use default */ }
  }

  if (!apiKey) {
    throw new Error('API Key 未配置，请在「我的」页面设置');
  }

  const { progress, bottleneck, resources, importance, remind_mode } = extra;

  // Build structured context
  const contextParts = [`任务：${rawInput}`];
  if (deadline) contextParts.push(`截止时间：${deadline}`);
  if (progress) contextParts.push(`当前进度：${PROGRESS_LABELS[progress] || progress}`);
  if (bottleneck) contextParts.push(`主要卡点：${BOTTLENECK_LABELS[bottleneck] || bottleneck}`);
  if (resources) contextParts.push(`已有资源/材料：${resources}`);
  if (importance) contextParts.push(`重要程度：${IMPORTANCE_LABELS[importance] || importance}`);

  const promptTemplate = loadPromptTemplate();
  const systemPrompt = `${promptTemplate}

用户通过问卷提供了以下任务信息，请严格根据这些信息进行拆解：

${contextParts.join('\n')}

特别注意：
1. 既然用户已明确卡点是"${BOTTLENECK_LABELS[bottleneck] || '未说明'}"，请在拆解时优先解决这个卡点
2. 步骤3"拆解为20分钟可完成的极小动作"中的每个动作必须包含三个要素：具体做什么、预估X分钟、触发条件
3. 每个动作格式固定为：- 动作N：[内容]，预估[N]分钟，触发：[条件]`;

  const response = await fetch(`${DEEPSEEK_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: rawInput },
      ],
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => 'unknown');
    throw new Error(`DeepSeek API error ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  const completion = data.choices?.[0]?.message?.content || '';

  const steps = parseStepsFromResponse(completion);
  const title = extractTitle(rawInput);

  return { title, steps, raw_response: completion };
}
