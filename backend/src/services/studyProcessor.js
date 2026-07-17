import { aiChat } from './aiClient.js';

// ── Step 1: Process raw material into structured study content ──

export async function processStudyMaterial(material, subject, userId) {
  const system = `你是一位资深学习教练，擅长将原始学习材料加工成结构化知识体系。

请对用户提供的学习材料进行以下处理，严格输出JSON格式，不要有任何JSON之外的内容：

{
  "structured_notes": "Markdown格式的结构化笔记",
  "knowledge_framework": {
    "core_question": "这个知识体系要回答的核心问题，一句话说清楚",
    "branches": [
      {
        "topic": "一级模块名（核心概念，3-6字）",
        "brief": "大白话解释这个模块是什么",
        "is_key": true,
        "children": [
          {
            "topic": "二级知识点",
            "brief": "大白话解释",
            "is_key": false,
            "children": [
              {
                "topic": "三级具体概念",
                "brief": "大白话解释",
                "is_key": false,
                "children": [
                  {"topic": "四级细节（复杂材料继续挖）", "brief": "大白话解释", "is_key": false, "children": []}
                ]
              }
            ]
          }
        ]
      }
    ],
    "cross_links": [
      {"from": "概念A", "to": "概念B", "relation": "A是B的基础"}
    ]
  },
  "qa_pairs": [
    {"question": "理解型问题", "answer": "参考答案", "difficulty": "easy|medium|hard"}
  ]
}

要求：
- structured_notes 使用 Markdown 格式：
  - 用 ## 和 ### 做层级标题
  - 用 - 做无序列表
  - 用 **加粗** 标记关键术语和核心概念
  - 用 > 引用块标记需要重点记忆的结论
  - 段落之间留空行，保持呼吸感
- knowledge_framework 层级深度规则（最重要）：
  - 最少 3 层（一级模块 → 二级知识点 → 三级具体概念），缺一不可
  - 根据材料复杂度自适应加深：概念多、逻辑链长、细节丰富的材料挖到 4-5 层；简单材料 3 层即可
  - 每层节点都必须有 topic（简短概念名）和 brief（大白话解释），不允许有空节点或占位符
  - children 为叶节点时设为空数组 []
- knowledge_framework 内容规则：
  - core_question：整份材料要回答的核心问题，用一句话说清楚"学了这些能理解什么"
  - branches 拆 3-5 个一级知识模块，topic 必须是关键词级概念，is_key 都设为 true
  - 每个一级模块下展开 2-4 个二级知识点
  - 每个二级下展开 1-4 个三级概念（根据实际内容决定，不要凑数）
  - 三级下如果内容够复杂，继续展开四级（1-4 个）
  - brief 必须用白话，不要术语堆砌，目标是让完全没学过的人也能听懂
  - is_key：一级模块全 true，二级中最重要的 1-2 个标 true，三级及以下标 false
  - cross_links 找 2-4 组跨分支关联，from/to 必须是在 branches 中出现过的 topic，relation 用通俗关系词
- qa_pairs 生成5-8个理解型问答对，覆盖不同难度`;

  const user = subject
    ? `科目：${subject}\n\n材料内容：\n${material}`
    : `材料内容：\n${material}`;

  // Scale maxTokens based on material length
  const materialLen = material.length;
  const maxTokens = materialLen > 20000 ? 16384 : materialLen > 8000 ? 8192 : 4096;

  const messages = [{ role: 'system', content: system }, { role: 'user', content: user }];
  const raw = await aiChat(messages, userId, { maxTokens, temperature: 0.7 });

  return parseStudyOutput(raw);
}

function parseStudyOutput(raw) {
  try {
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const data = JSON.parse(cleaned);

    // Normalize framework
    let framework = data.knowledge_framework;
    if (!framework || typeof framework !== 'object') {
      framework = { core_question: '', branches: [], cross_links: [] };
    }
    if (Array.isArray(framework)) {
      // Legacy flat format → tree
      framework = {
        core_question: '',
        branches: framework.map(f => ({
          topic: f.topic || '',
          brief: f.key_point || '',
          is_key: true,
          children: (f.subtopics || []).map(s => ({ topic: s, brief: '', is_key: false, children: [] })),
        })),
        cross_links: [],
      };
    }
    // Recursively normalize children to arbitrary depth
    function normalizeNode(node) {
      return {
        topic: node.topic || '',
        brief: node.brief || node.key_point || '',
        is_key: node.is_key !== false,
        children: (node.children || []).map(normalizeNode),
      };
    }
    framework.branches = (framework.branches || []).map(normalizeNode);
    framework.cross_links = framework.cross_links || [];
    framework.core_question = framework.core_question || framework.root || '';

    return {
      structured_notes: data.structured_notes || '',
      framework,
      qa_pairs: data.qa_pairs || [],
      raw_response: raw,
    };
  } catch {
    return {
      structured_notes: raw,
      framework: { core_question: '', branches: [], cross_links: [] },
      qa_pairs: [],
      raw_response: raw,
    };
  }
}

// ── Step 2: Deep-dive actions ──

const STEP2_PROMPTS = {
  logic: (context, userPrompt) => `基于以下学习材料，对"${userPrompt || '核心概念'}"进行逻辑拆解。

请按照「是什么 → 为什么 → 怎么用」三段式拆解：
1. **是什么**：用一句话定义核心概念，让没学过的人也能听懂
2. **为什么**：解释它成立的原因、背后的原理、与其他概念的关联
3. **怎么用**：实际应用场景、注意事项、常见误区

学习材料：
${context}`,

  example: (context, userPrompt) => `基于以下学习材料，为"${userPrompt || '核心内容'}"生成多个理解角度。

请从以下至少3个不同角度举例说明：
1. **日常类比**：用一个生活场景类比
2. **学科案例**：学科内的具体应用
3. **知识关联**：与其他已学知识的对比/关联

每个例子包含：具体场景 → 体现的知识点 → 如何帮助记忆

学习材料：
${context}`,

  deduction: (context, userPrompt) => `基于以下学习材料，用更基础的知识推导"${userPrompt || '这个概念'}"。

请使用「如果…那么…」的推导链：
1. 从最简单的前置知识开始（初高中水平即可理解）
2. 逐步推导到目标概念
3. 每一步标注推导依据

目标是让一个已经掌握基础知识的同学能完全跟上推导过程。

学习材料：
${context}`,

  custom: (context, userPrompt) => `基于以下学习材料，回答用户的提问。

用户提问：${userPrompt}

请结合材料内容，给出清晰、深入的回答。如果问题涉及材料外的知识，请标注。

学习材料：
${context}`,
};

export async function runDeepDive(context, actionType, userPrompt, userId) {
  const builder = STEP2_PROMPTS[actionType];
  if (!builder) throw new Error(`未知的深加工类型: ${actionType}`);

  const system = `你是一位耐心的学习导师，擅长用通俗易懂的方式解释复杂概念。

回复要求：
- 使用Markdown格式，结构清晰，段落之间留空行
- 用 **加粗** 标记关键概念和核心术语
- 用 > 引用块标记最重要的结论或记忆要点
- 标题层级使用 ## 和 ###`;
  const user = builder(context, userPrompt);

  const messages = [{ role: 'system', content: system }, { role: 'user', content: user }];
  const content = await aiChat(messages, userId, { maxTokens: 2048, temperature: 0.7 });

  return content;
}

// ── Step 3: Generate practice cards ──

export async function generatePracticeCards(material, qaPairs, userId) {
  const qaContext = qaPairs.length
    ? `\n\n已有的问答对供参考：\n${qaPairs.map((q, i) => `Q${i + 1}: ${q.question}\nA${i + 1}: ${q.answer}`).join('\n\n')}`
    : '';

  const system = `你是一位严格的出题老师。基于学习材料生成用于自我测试的练习题。

要求：
1. 生成8-12道练习题
2. 覆盖 easy/medium/hard 三个难度
3. 题型多样化：定义题、应用题、辨析题、填空题
4. 重点考察理解深度而非机械记忆
5. 每道题包含完整的参考答案

严格输出JSON数组格式，不要有任何JSON之外的内容：
[
  {"question": "题目", "answer": "参考答案", "difficulty": "easy|medium|hard"}
]`;

  const user = `学习材料：\n${material}${qaContext}`;

  const messages = [{ role: 'system', content: system }, { role: 'user', content: user }];
  const raw = await aiChat(messages, userId, { maxTokens: 4096, temperature: 0.8 });

  return parseCardsOutput(raw);
}

function parseCardsOutput(raw) {
  try {
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const arr = JSON.parse(cleaned);
    if (!Array.isArray(arr)) return [];
    return arr.map(c => ({
      question: c.question || '',
      answer: c.answer || '',
      difficulty: ['easy', 'medium', 'hard'].includes(c.difficulty) ? c.difficulty : 'medium',
    }));
  } catch {
    return [];
  }
}
