import { useState } from 'react';
import { Sword, Activity, Trophy, Target, BarChart3, Send, GraduationCap, Newspaper, User, ChevronDown, ChevronUp, X, Lightbulb } from 'lucide-react';

const GUIDES = [
  {
    id: 'dashboard', icon: Sword,
    cardVar: 'var(--card-guide-dashboard)',
    cardText: 'text-slate-200/90',
    accent: 'text-cyan-400', accentBg: 'bg-cyan-500/10', accentBorder: 'border-cyan-500/20',
    title: '角色面板',
    brief: '你的 RPG 角色主页，查看状态、签到、运势。点击六边形等级徽章可重播升级特效。',
    input: '无需手动输入。系统自动聚合你的活动数据，每日首次访问弹出签到。',
    logic: '签到 → 计算连续天数 → 生成运势签文（AI 生成并缓存当天）。等级 = 累计 EXP 的平方根函数，属性值 = 各分类活动累加。',
    output: '角色等级、EXP 进度条、六维属性雷达图、连续修炼天数、每日 AI 运势。点击等级徽章 → 全屏播放升级动画（白色闪光 → 冲击波 → 旋转六边形 → 粒子飞散）。',
    examples: [
      { q: '签到 7 天连续', a: '连续修炼达到 7 天，解锁「生活节奏」徽章，火焰图标变色。每天运势不同，影响当天气氛。' },
      { q: 'EXP 如何升级', a: '记录活动获得 EXP，累计 100 EXP → Lv2，400 EXP → Lv3，900 EXP → Lv4。等级越高需要的 EXP 越多。' },
      { q: '升级特效没看到怎么办', a: '升级时如果卡顿跳过了动画，回到角色面板点击六边形等级徽章即可重播全屏升级特效。手机和电脑均支持全屏播放。' },
    ],
  },
  {
    id: 'activities', icon: Activity,
    cardVar: 'var(--card-guide-activities)',
    cardText: 'text-violet-100/80',
    accent: 'text-violet-400', accentBg: 'bg-violet-500/10', accentBorder: 'border-violet-500/20',
    title: '活动记录',
    brief: '记录四类日常活动，每次记录获得经验值。',
    input: '选择活动类型（如「营养素摄入」「硬技能学习」）→ 输入完成次数或数值 → 可选备注。四大分类：生活、学习、娱乐、休息。',
    logic: '提交后：① 计算 EXP = 完成值 × 该活动的基础 EXP 系数；② 更新角色总 EXP，检查是否升级；③ 检查是否达成相关任务（每日/每周）；④ 检测是否解锁成就；⑤ 若配置飞书则推送通知。',
    output: 'EXP 增量、可能的升级提示、任务进度更新、成就解锁通知。',
    examples: [
      { q: '记录「营养素摄入」1 次', a: 'EXP +1。如果当天「每日生活」任务未完成，自动计为完成，额外 +10 EXP。累计 5 次解锁「健康起步」徽章。' },
      { q: '记录「硬技能学习」3 次', a: 'EXP +3。如果本周「每周输出」任务目标为 3 次，则完成该周任务，+40 EXP。' },
      { q: '暴击机制', a: '每次记录有小概率触发暴击（EXP ×2），弹窗特效提示。同一活动连续多天记录增加暴击率。' },
    ],
  },
  {
    id: 'achievements', icon: Trophy,
    cardVar: 'var(--card-guide-achievements)',
    cardText: 'text-amber-100/80',
    accent: 'text-amber-400', accentBg: 'bg-amber-500/10', accentBorder: 'border-amber-500/20',
    title: '成就徽章',
    brief: '达成条件自动解锁徽章，可佩戴一枚展示在角色面板。',
    input: '无需手动操作。系统自动检测你的活动数据是否满足徽章条件。',
    logic: '每次记录活动后，遍历所有未解锁徽章 → 检查条件（累计次数/连续天数/等级）→ 匹配则解锁，发放 EXP 奖励。徽章分四档：铜（common）→ 银（rare）→ 金（epic）→ 传说（legendary）。',
    output: '解锁弹窗 + EXP 奖励 + 徽章收录到成就墙。可点击任一已解锁徽章「佩戴」，显示在角色面板旁。',
    examples: [
      { q: '如何获得传说徽章', a: '「完美日常」需要累计完成 300 次活动。「全知全能」需要四项分类各 50 次且等级 10。「百次征程」需要累计 500 次。' },
      { q: '佩戴徽章有什么用', a: '佩戴后在角色面板显示，纯展示作用。可以随时更换。' },
    ],
  },
  {
    id: 'quests', icon: Target,
    cardVar: 'var(--card-guide-quests)',
    cardText: 'text-rose-100/80',
    accent: 'text-rose-400', accentBg: 'bg-rose-500/10', accentBorder: 'border-rose-500/20',
    title: '任务',
    brief: '每日 4 项 + 每周 3 项固定任务，完成后获得额外 EXP 奖励。',
    input: '无需手动领取。每日/每周任务自动分配，按你的活动记录自动检测完成。',
    logic: '每日任务按分类匹配（生活/学习/娱乐/休息各 1 项）→ 当天该分类任意活动 ≥ 1 次即完成。每周任务按具体活动类型匹配 → 本周该活动累计次数达标即完成。完成自动发放 EXP。',
    output: '任务进度条、完成状态、EXP 奖励通知。每日凌晨重置，每周一重置。',
    examples: [
      { q: '每日生活任务', a: '每天完成任意 1 项生活类活动（如营养素摄入、清洁整理、日常记账等），自动完成，+10 EXP。' },
      { q: '每周输出任务', a: '一周内完成「学习输出」3 次，自动完成，+40 EXP。' },
    ],
  },
  {
    id: 'outsource', icon: Send,
    cardVar: 'var(--card-guide-outsource)',
    cardText: 'text-emerald-100/80',
    accent: 'text-emerald-400', accentBg: 'bg-emerald-500/10', accentBorder: 'border-emerald-500/20',
    title: '庶务外包',
    brief: 'AI 帮你把复杂任务拆解为具体可执行的步骤清单。',
    input: '通过 7 步问卷引导输入：① 任务描述「你想外包什么」② 当前进展 ③ 卡点 ④ 可用资源 ⑤ 任务重要性 ⑥ 截止日期及提醒频率。每步选择或填写后自动推进。',
    logic: '收集完 7 个维度的信息后调用 AI（取决于你在「我的」中配置的模型和 API Key）→ AI 根据结构化上下文拆解为 3-8 个有序步骤 → 每个步骤标注预估耗时和触发时间。步骤清单可手动增删改。',
    output: '步骤卡片列表，含标题、描述、预估时长、提醒时间。可保存编辑、推送到飞书。总耗时自动合计。',
    examples: [
      { q: '拆解一篇论文阅读', a: '输入「精读海德格尔《存在与时间》导论部分」→ AI 拆解：① 浏览目录了解结构（10min）② 读导论第 1-4 节做标注（30min）③ 整理核心概念清单（20min）④ 写 300 字读书笔记（20min）⑤ 找 2 篇二手文献对照（30min）。' },
      { q: '准备 presentation', a: '输入「准备下周古代文学 presentation，PPT+讲稿，周五前」→ AI 拆解：① 确定主题和大纲（15min）② 搜集材料整理要点（30min）③ 制作 PPT 初稿（40min）④ 写讲稿（30min）⑤ 排练并计时（20min）⑥ 根据排练修改定稿（20min）。' },
    ],
  },
  {
    id: 'study', icon: GraduationCap,
    cardVar: 'var(--card-guide-study)',
    cardText: 'text-sky-100/80',
    accent: 'text-sky-400', accentBg: 'bg-sky-500/10', accentBorder: 'border-sky-500/20',
    title: '期末复习',
    brief: '三步学习法：结构化笔记 → 深度加工 → 间隔重复。适合备考和深度学习。',
    input: 'Step 1「材料输入」：粘贴学习材料原文（课堂笔记、教材章节、论文均可），填写课程名称。',
    logic: 'Step 1（AI 结构化）：调用 AI → 生成结构化笔记 + 关键词列表 + 知识框架 + 思维导图 + 自测问答对。Step 2（深度加工）：对每个知识点选择加工方式（逻辑推演/举例说明/演绎推导/自定义），写自己的理解，AI 给出反馈。Step 3（间隔重复）：基于 Step 1 的问答对生成记忆卡片，按遗忘曲线自动排期复习。',
    output: '结构化笔记（可导出 Markdown）→ 深度加工洞察 → 间隔重复记忆卡片。每张卡片按艾宾浩斯曲线安排复习时间（1天/3天/7天/30天后）。',
    examples: [
      { q: '复习古代文学史', a: '粘贴课堂笔记 → AI 生成按朝代分类的结构化笔记 + 「建安七子」「唐宋八大家」等关键词 + 时序知识框架图 + 10 道自测题。Step 2 逐题用自己的话解释，AI 批改。Step 3 卡片按遗忘曲线提醒复习。' },
      { q: '导出到 Obsidian', a: '在「我的」中设置 vault 路径后，复习笔记和卡片自动导出为 Markdown 到 Obsidian vault。' },
    ],
  },
  {
    id: 'stats', icon: BarChart3,
    cardVar: 'var(--card-guide-stats)',
    cardText: 'text-orange-100/80',
    accent: 'text-orange-400', accentBg: 'bg-orange-500/10', accentBorder: 'border-orange-500/20',
    title: '数据统计',
    brief: '所有活动数据的可视化统计与分析。',
    input: '无需手动输入。系统自动聚合你的全部活动记录生成图表。',
    logic: '全量查询活动记录 → 按维度聚合：① 时间维度（月度趋势折线图）② 分类维度（环形占比图）③ 类型维度（EXP 来源分解柱状图）④ 年度热力图（GitHub 风格，每天一个色块）。',
    output: '四个图表：月度活动折线图、分类占比环形图、EXP 来源分解图、年度热力图。',
    examples: [
      { q: '年度热力图怎么看', a: '每个小方块代表一天，颜色越深表示当天活动越多。可以快速看到哪些月份最活跃，哪些时期有空白。9-10 月如果是灰色代表那段时间没有记录。' },
      { q: 'EXP 来源分解', a: '柱状图显示你的 EXP 来自哪些活动类型。如果「营养素摄入」柱子最高，说明健康习惯是你的主要 EXP 来源。' },
    ],
  },
  {
    id: 'daily-reports', icon: Newspaper,
    cardVar: 'var(--card-guide-reports)',
    cardText: 'text-pink-100/80',
    accent: 'text-pink-400', accentBg: 'bg-pink-500/10', accentBorder: 'border-pink-500/20',
    title: '日报',
    brief: '每日总结和反思，手动写或 AI 自动生成。',
    input: '手动模式：自由写当天的总结、收获、反思。自动模式：点击「AI 生成」按钮，系统读取当天所有活动记录和签到信息。',
    logic: '手动：纯文本编辑，自动保存。自动：调用 AI → 输入当天活动列表 + 签到信息 → 生成结构化日报（今日成绩/不足之处/明日计划）。',
    output: '按日期归档的日报列表，可随时回看历史日报。',
    examples: [
      { q: 'AI 自动生成日报', a: '点击「AI 生成」→ 读取当天活动记录（如：营养素摄入、硬技能学习、朋友聚会）→ AI 输出：「今日完成 3 项活动，生活类 1 项、学习类 1 项、娱乐类 1 项。EXP +3。亮点：坚持了健康习惯。不足：学习时间可再增加。明日建议：安排 1 小时深度学习。」' },
      { q: '日报与签到的关系', a: '签到每天一次，记录运势和连续天数。日报每天一篇，记录总结反思。两者独立，互不影响。' },
    ],
  },
  {
    id: 'profile', icon: User,
    cardVar: 'var(--card-guide-profile)',
    cardText: 'text-indigo-100/80',
    accent: 'text-indigo-400', accentBg: 'bg-indigo-500/10', accentBorder: 'border-indigo-500/20',
    title: '我的',
    brief: '个人设置中心：API Key、模型选择、飞书账号、自我画像、能力雷达。',
    input: '① 选择一个模型（海外 4 款：GPT-5.5/Claude 4.8 Opus/Gemini 3.1 Pro/Llama 4；国内 6 款：DeepSeek V4/通义千问/文心一言/Kimi K3/腾讯混元/豆包）② 填入该模型对应的 API Key ③ 可选：飞书 Open ID、Obsidian vault 路径 ④ 自我画像（一段文字描述性格和认知习惯）。',
    logic: 'API Key + 模型选择 → 庶务外包、日报生成、雷达生成使用你的 Key 调用 AI。未填 Key 则 AI 功能不可用。飞书 ID → 签到/活动/成就通知推送到飞书。自我画像 → AI 分析生成 9 维能力雷达图。Vault 路径 → 学习笔记导出到本地 Obsidian。',
    output: 'AI 生成的能力雷达图（可手动微调分数和描述）。飞书实时通知。笔记本地同步。',
    examples: [
      { q: '怎么获取 API Key', a: 'DeepSeek：platform.deepseek.com → API Keys。OpenAI：platform.openai.com → API Keys。Claude：console.anthropic.com → API Keys。Google AI Studio：aistudio.google.com → API Key。通义千问：dashscope.aliyun.com。文心一言：console.bce.baidu.com。月之暗面：platform.moonshot.cn。' },
      { q: '没有 API Key 能用吗', a: 'AI 功能（庶务外包、日报生成、雷达生成）不可用。活动记录、成就徽章、任务追踪、数据统计等不需要 AI 的功能正常使用。' },
    ],
  },
];

const SECTION_LABELS = [
  { key: 'input', emoji: '📥', label: '输入 Input', color: 'text-cyan-400' },
  { key: 'logic', emoji: '⚙️', label: '逻辑 Logic', color: 'text-amber-400' },
  { key: 'output', emoji: '📤', label: '输出 Output', color: 'text-emerald-400' },
];

export default function GuidePage() {
  const [expanded, setExpanded] = useState(null);
  const [dismissed, setDismissed] = useState({});

  const toggle = (id) => setExpanded(prev => prev === id ? null : id);
  const dismissExample = (guideId, idx) => {
    setDismissed(prev => ({ ...prev, [`${guideId}-${idx}`]: true }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-12">
      <div className="pt-2">
        <h2 className="text-2xl font-bold text-white/85 tracking-[0.2em]" style={{ fontFamily: 'Orbitron, sans-serif' }}>新手指引</h2>
        <p className="text-[10px] text-slate-500 tracking-[0.3em] uppercase mt-1 font-mono">BEGINNER'S GUIDE</p>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        以下介绍每个功能的「输入 → 处理逻辑 → 输出结果」，并附带具体例子。点击标题展开详情。
      </p>

      {GUIDES.map(guide => {
        const isOpen = expanded === guide.id;
        return (
          <div
            key={guide.id}
            className="rounded-2xl border backdrop-blur-xl transition-all duration-200"
            style={{ background: guide.cardVar, borderColor: 'var(--card-guide-border)' }}
          >
            {/* Header */}
            <button
              onClick={() => toggle(guide.id)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left"
            >
              <div className={`p-2 rounded-xl border ${guide.accentBg} ${guide.accentBorder}`}>
                <guide.icon size={18} className={guide.accent} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-semibold ${guide.cardText}`}>{guide.title}</h3>
                <p className="text-[11px] text-slate-500 line-clamp-2">{guide.brief}</p>
              </div>
              {isOpen ? <ChevronUp size={16} className="text-slate-500 shrink-0" /> : <ChevronDown size={16} className="text-slate-500 shrink-0" />}
            </button>

            {/* Expanded */}
            {isOpen && (
              <div className="px-5 pb-5 space-y-4 border-t border-white/[0.06] pt-4">
                {SECTION_LABELS.map(sec => (
                  <div key={sec.key}>
                    <span className={`text-[10px] ${sec.color} font-mono tracking-wider uppercase`}>
                      {sec.emoji} {sec.label}
                    </span>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{guide[sec.key]}</p>
                  </div>
                ))}

                {guide.examples.length > 0 && (
                  <div>
                    <span className="text-[10px] text-violet-400 font-mono tracking-wider uppercase flex items-center gap-1">
                      <Lightbulb size={11} /> 例子 Examples
                    </span>
                    <div className="mt-2 space-y-2">
                      {guide.examples.map((ex, idx) => {
                        const key = `${guide.id}-${idx}`;
                        if (dismissed[key]) return null;
                        return (
                          <div
                            key={key}
                            className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] group"
                          >
                            <span className="text-[10px] text-slate-600 font-mono shrink-0 mt-0.5">例{idx + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] text-amber-400/80 font-medium">{ex.q}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{ex.a}</p>
                            </div>
                            <button
                              onClick={() => dismissExample(guide.id, idx)}
                              className="shrink-0 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
