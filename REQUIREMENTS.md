# RPG Tracker 需求文档

## 项目概述
RPG 游戏化的生活追踪与知识管理系统。将日常习惯、学习、工作转化为 RPG 角色养成体验，内置 AI 驱动的庶务外包和学习复习工具。

## 技术栈
- 后端：Express (port 3001) + SQL.js（本地 SQLite）+ bcryptjs（密码哈希）
- 前端：React 18 + Vite (port 5174) + Tailwind CSS + Recharts + react-markdown + Lucide 图标
- AI：DeepSeek API（通过 aiClient.js 共享模块，支持用户自定义 Key）
- 外部集成：飞书 Lark（lark-cli 推送）、Obsidian（.md 直接写入 vault）
- 主题：暗色 RPG 风格（深蓝黑底 + cyan/violet/indigo 点缀 + 玻璃拟态卡片）
- 桌面入口：VBS 静默启动脚本 → start.bat → 浏览器自动打开

---

## 功能清单

### 1. 全局布局
- **侧边栏导航**（按功能分组）：
  - 核心：角色面板
  - 修炼：活动记录 / 成就徽章 / 任务
  - 工具：庶务外包 / 期末复习 / 数据统计
  - 「我的」独立放置在底部 footer stats 上方
- **晶体六边形标志**：侧边栏（小）+ 登录页（大），立体主义画风，3 层同心六边形 + 4 个阴影面 + 中央光点，高对比度适配深色背景
- **日相指示器**（右上角）：环形进度条 + 距每日重置倒计时 + 时段阶段（晨光/白昼/黄昏/静夜），颜色随时间自动切换
- **Footer stats**：总修为 + 连续修炼天数（火焰图标 + 称号）

### 2. 认证系统
- **登录**：用户名 + 密码，JWT token
- **注册**：用户名 + 密码（≥4 字符）
- **忘记密码**：用户名 + 新密码直接重置
- 默认管理员账号：admin / admin

### 3. 角色面板（Dashboard / 首页 `/`）
- **角色卡片**：六边形等级徽章、indigo 渐变经验条、称号
- **每日旁白气泡**：AI 根据昨日活动生成 RPG 风格角色独白（缓存一天）
- **签到卡片**：每日签到获 EXP（5 + min(streak, 10)）+ AI 生成运势预言（不可用时 10 条预设 fallback）
- **六维属性面板**：STR/INT/VIT/AGI/WIS/MOOD，几何图标替代文字
- 属性映射：生活→STR+VIT / 学习→INT+WIS / 娱乐→MOOD+AGI / 休息→VIT+MOOD
- 属性公式：`1 + floor(sqrt(statExp) / 3)`（1→2 需 9 点同类经验，确保 1-2 天内可见变化）
- **能力雷达图**：BrainRadar 自动加载用户自定义雷达数据
- **周任务面板**：7 列（周一~周日），当日高亮

### 4. 活动记录（`/activities`）
- 35 个活动项目，分为生活/学习/娱乐/休息四大板块
- 级联选择：分类 → 子分类 → 具体项目 → 填写数量日期 → 记录
- 每次记录获得 EXP = 项目加分 × 数量
- 按分类筛选查看历史
- **随机掉落**：完成任务时 15% 概率暴击（2x EXP），20% 概率掉落称号（稀有 5 个 / 普通 14 个）

### 5. 周任务面板
- 按周隔离：`week_start` 列确保每周独立，历史任务不堆积
- 任务属性：内容、分类（生活/学习/娱乐/休息）、子分类、分数（1-5）
- 35 个模板系统（搜索选择后自动填入分类和默认分数）
- 自定义任务：手动输入，自选分类和分数
- 完成勾选/取消勾选 → 角色 EXP ±分数
- 删除已完成任务 → 扣回分数
- **月度热力图**：4 周 × 7 天网格，颜色深浅反映每日完成强度

### 6. 任务系统（`/quests`）
- 每日任务（5 个）+ 每周任务（3 个），随活动记录自动推进度
- 完成自动获得 EXP 奖励
- 每日 0 点自动重新生成

### 7. 成就徽章（`/achievements`）
- 30 个分层成就（common/rare/epic/legendary），四种形状（shield/diamond/star/moon/hex）
- 条件类型：累计次数、连续天数、等级
- 四个类别：生活/学习/娱乐/休息 + 通用
- 已解锁/未解锁差异化展示（六边形 SVG 徽章）
- 可装备徽章显示在角色面板

### 8. 称号系统
- 13 个条件称号自动检测（如「初出茅庐」「麒麟才子」「效率猎手」「暴击猎手」）
- 活动随机掉落 19 个称号（5 稀有 + 14 普通）
- 全量条件审计：逐用户逐条件检查

### 9. 数据统计（`/stats`）
- 概要卡片（总经验、等级、连续天数等）
- 饼图：经验值分类占比
- 折线图：经验值趋势
- 年度热力图：全年每日活动密度

### 10. 庶务外包（`/outsource`）
- 7 步问卷向导式任务拆解
- DeepSeek API 智能生成步骤、时间、优先级
- 飞书提醒推送
- 任务列表管理（CRUD + 步骤进度）

### 11. 期末复习三步法（`/study`）

#### 第一步：AI 预处理（输入）
- 粘贴文本或上传 .txt / .docx / .pdf（后端 Python 解析提取文本）
- AI 输出：
  - 结构化笔记（ReactMarkdown 自定义组件渲染，暗色主题颜色）
  - 知识框架（层级树形结构，核心问题 + 分支 + 跨分支链接，最少 3 层）
  - 理解问答对
- 导出到 Obsidian vault（YAML frontmatter .md）
- 前端实时字符计数（>20000 红色警告，>8000 琥珀色）
- 后端自适应 maxTokens（>20000→16384，>8000→8192，否则 4096）

#### 第二步：内化理解（加工）
- 三种 AI 深度加工：拆解逻辑 / 举例说明 / 知识推导
- 可选自定义提问
- 结果卡片流：可展开/折叠、收藏/删除、导出到 Obsidian
- CardErrorBoundary 逐卡片错误隔离 + ErrorBoundary 页面级兜底

#### 第三步：高强度输出（检验）
- AI 生成 8-12 道练习题卡片（难度 easy/medium/hard）
- 翻转自测 → 标记已掌握/再练一次
- 间隔复习：1/3/7/14 天后自动到期推送（飞书）
- 一键推送全部卡片

### 12. 「我的」页面（`/profile`）
- 大模型 API Key 设置（支持 DeepSeek V4/R1、GPT-5.5、Claude Opus 4.7/Sonnet 4.6）
- 飞书 Open ID 配置（附查找指南）
- **文件导出位置**：本地文件夹路径，笔记和复习卡片导出到此。Obsidian 用户填 vault 路径即自动同步
- 自我画像：描述性格特质和认知习惯
- AI 生成能力雷达：9 个认知维度，可手动调整分数，自动保存（800ms 防抖）

---

## 渲染规范

### Markdown 渲染
- 暗色主题项目**不使用 Tailwind prose**（prose 颜色修饰符在暗色主题下不生效）
- 统一使用 react-markdown 的 `components` prop 逐元素自定义，直接写 Tailwind 类名
- 不引入 remark-gfm（ESM/CJS 互操作在 Vite 打包后运行时崩溃，且表格/删除线在 AI 输出中极少出现）
- 所有 `children` 加 `|| ''` fallback

### 错误隔离
- 页面级 ErrorBoundary（最外层兜底）
- 卡片级 CardErrorBoundary（动态列表每一项单独隔离）
- 两者配合形成两层防御

### UI 组件
- 原生 `<select>` 禁用 — 暗色主题下 `<option>` 由 OS 渲染为白底白字
- `type="time"` 输入框加 `color-scheme: dark`
- 正文内容区用实色暗底 `#0a0a14`，玻璃效果只用于装饰容器

---

## 外部集成

### 飞书（Lark）
- 通过 lark-cli（child_process.exec）fire-and-forget 调用
- 签到/活动/成就通知推送到用户飞书
- 期末复习卡片到期自动推送
- 飞书 post 段落格式（Windows spawn 多行兼容方案）
- activities 表 `feishu_record_id` 列追踪映射

### Obsidian
- 直接写入 .md 文件到用户配置的 vault 路径
- YAML frontmatter（标题、日期、标签）
- 后端路径验证（目录存在 + 含 .obsidian 文件夹）

---

## API 端点

### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 注册 |
| POST | /api/auth/login | 登录（返回 JWT） |
| POST | /api/auth/reset-password | 忘记密码 |

### 角色 & 任务
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/character | 获取角色状态 |
| PUT | /api/character | 修改角色名称 |
| PUT | /api/character/badge | 装备徽章 |
| POST | /api/character/reset | 重置角色数据 |
| GET | /api/activity-types | 获取活动类型列表 |
| GET/POST | /api/activities | 活动记录 CRUD |
| PUT/DELETE | /api/activities/:id | 修改/删除活动记录 |
| GET | /api/achievements | 获取成就列表 |
| POST | /api/achievements/sync | 同步成就状态 |
| GET | /api/achievements/titles | 获取用户称号 |
| GET | /api/quests | 获取每日/每周任务 |
| POST | /api/quests/generate | 重新生成任务 |

### 日常 & 统计
| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | /api/checkin | 签到（GET 查状态 / POST 签到） |
| GET | /api/narrative | 获取今日角色旁白 |
| GET | /api/stats/summary | 统计概要 |
| GET | /api/stats/trends | 经验趋势 |
| GET | /api/stats/yearly-heatmap | 年度热力图 |
| GET | /api/stats/daily | 每日统计 |
| GET | /api/stats/weekly-report | 周报 |

### 周任务
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/weekly-tasks | 获取本周任务 + 分类积分 |
| GET | /api/weekly-tasks/templates | 获取 35 个模板 |
| GET | /api/weekly-tasks/heatmap | 月度热力图数据 |
| POST | /api/weekly-tasks | 创建任务 |
| PUT | /api/weekly-tasks/:id | 更新任务 |
| PUT | /api/weekly-tasks/:id/toggle | 切换完成状态（±EXP） |
| DELETE | /api/weekly-tasks/:id | 删除任务 |

### 庶务外包
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/outsource | 任务列表 |
| POST | /api/outsource | 创建任务（AI 拆解） |
| GET | /api/outsource/:id | 任务详情 + 步骤 |
| PUT | /api/outsource/:id/steps | 更新步骤 |
| POST | /api/outsource/:id/push | 推送步骤到飞书 |
| DELETE | /api/outsource/:id | 删除任务 |

### 期末复习
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/study | 会话列表 |
| POST | /api/study | 创建会话 + AI 分析（第一步） |
| POST | /api/study/extract-text | 文件文本提取 |
| GET | /api/study/:id | 获取会话详情（含全部产出） |
| POST | /api/study/:id/step2 | AI 深度理解（第二步） |
| PUT | /api/study/:id/step2/:insightId/save | 收藏/取消收藏 |
| DELETE | /api/study/:id/step2/:insightId | 删除深度理解卡片 |
| POST | /api/study/:id/step3 | AI 生成练习题（第三步） |
| PUT | /api/study/:id/step3/:cardId/review | 标记复习结果 |
| POST | /api/study/:id/step3/push | 推送卡片到飞书 |
| DELETE | /api/study/:id | 删除会话 |
| POST | /api/study/export-obsidian | 导出 .md 到 Obsidian |
| PUT | /api/study/vault-path | 设置 Obsidian 路径 |
| GET | /api/study/vault-path | 获取 Obsidian 路径 |

### 用户设置
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/user/settings | 获取用户设置 |
| PUT | /api/user/settings | 更新用户设置（自动保存） |
| POST | /api/user/settings/generate-radar | AI 生成能力雷达 |

---

## 数据库表

| 表名 | 说明 |
|------|------|
| users | 用户认证（id, username, password_hash） |
| character | 角色（user_id=PK, name, level, total_exp, title, equipped_badge_id） |
| activity_types | 活动类型定义（35 项，category/subcategory/unit/exp/stat_contributions） |
| activities | 活动记录日志（含 feishu_record_id） |
| achievements | 成就定义（30 个分层，tier/shape 列） |
| user_achievements | 用户已解锁成就 |
| quests | 任务定义（每日/每周） |
| user_quests | 用户任务进度 |
| weekly_tasks | 周任务（week_start 列隔离周期） |
| user_settings | 用户配置（api_key, model_name, self_profile, radar_scores, feishu_id, vault_path） |
| daily_checkins | 每日签到（日期 + 连胜 + AI 运势） |
| daily_narratives | 角色旁白（按天缓存） |
| user_titles | 用户获得的称号（收集系统） |
| outsource_tasks | 庶务外包任务 |
| outsource_steps | 庶务外包步骤（含飞书 task_id） |
| study_sessions | 期末复习会话 |
| study_step1_output | 第一步 AI 产出（结构化笔记/知识框架/问答） |
| study_step2_insights | 第二步深度理解卡片 |
| study_step3_cards | 第三步练习卡片（含间隔复习计划） |

---

## 变更记录

| 日期 | 变更内容 |
|------|---------|
| 2026-06-21 | 需求文档全面更新至当前实现状态 |
| 2026-06-21 | 期末复习三步法：MindMap 删除→结构化笔记替代；知识框架重构（3 层树形 + 跨分支链接）；Obsidian vault 导出；ReactMarkdown 自定义组件替代 prose；remark-gfm 移除；CardErrorBoundary 模式；自适应 maxTokens；字符计数警告 |
| 2026-06-21 | 侧边栏重组（核心/修炼/工具 三组）；「我的」移至 footer stats 上方；晶体六边形标志重新设计（立体主义）；桌面快捷方式中文名 |
| 2026-06-20 | sql.js 安全加固：saveDb 异常不安全修复（成就/称号全部追回）；迁移检测脆弱 → 数据完整性校验；飞书推送移除 env 回退；数据操作纪律建立 |
| 2026-06-19 | 每日签到系统 + 连胜 + AI 运势；角色每日旁白；随机掉落（暴击 + 称号）；「我的」页面（API Key/模型/自我画像/雷达/飞书/导出位置）；忘记密码；BrainRadar 修复 |
| 2026-06-19 | 周任务按周隔离（week_start 列）；月度热力图；VBS 静默启动器 + 端口检测；称号系统（13 条件 + 19 掉落） |
| 2026-06-09 | 前端端口从 5173 改为 5174 |
| 2026-06-07 | 庶务外包模块（7 步问卷 + AI 拆解 + 飞书推送）；全局 UI 翻新毛玻璃风格；六芒星标志 |
| 2026-06-02 | 活动系统 v2：替换为 35 项活动（生活/学习/娱乐/休息四板块），新增心情属性，级联选择，属性贡献映射 |
| 2026-06-01 | 初始版本：角色面板、活动记录、成就、任务、统计、周任务面板 |
