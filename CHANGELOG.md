# RPG Tracker 项目日志

## 2026-06-23 — docx 上传中文显示为 HTML 实体

- **现象**：期末复习上传 .docx 文件后，中文显示为 `&#31532;&#19971;&#31456;` 等数字实体而非汉字
- **根因**：docx 内部 XML 将部分中文编码为十进制数字字符引用（`&#dddd;`），`study.js` 的文本提取正则只剥 XML 标签，未解码实体
- **修复**：`/extract-text` 路由中 docx 分支和通用出口各加一行 `replace(/&#(\d+);/g, ...)` 解码十进制和十六进制实体
- **修改文件**：`backend/src/routes/study.js`

### 期末复习飞书推送格式对齐庶务外包
- **现象**：复习卡片推送逐张发送纯文本消息（N 张卡片 = N 条消息轰炸），无格式、无汇总
- **对比**：庶务外包推送是一条富文本汇总消息，含 `**粗体**`、`_斜体_`、emoji、分隔线、来源 footer
- **修复**：
  - Step3 推送从逐张 `sendPostMessage` 改为一条汇总消息，格式完全对齐庶务外包风格（`📚 复习卡片 · 科目` / `❓ 问题` / `💡 答案` / `▸ 难度` / `───` / footer）
  - 每日复习催推送标题统一为 `📚 复习提醒 · 日期`
  - 推送改为 fire-and-forget（不去 `await`），避免阻塞前端响应
- **修改文件**：`backend/src/routes/study.js`、`backend/src/services/feishuNotify.js`

## 2026-06-22 — 每日任务联动修复 + 飞书推送修复

### 每日任务无法联动活动记录
- **现象**：用户录制了活动，但每日任务（今日任务）不显示完成。“有几个明明做了还是没有显示”
- **根因**：每日任务只绑定 5 个特定活动类型（如「每日学习」只认「硬技能学习」type_id=17），其余 30 个活动类型（如「知识梳理」type_id=16、「灵感收集」type_id=20）无法触发任何任务进度。活动记录和任务系统之间只通过 `activity_type_id` 精确匹配，缺乏分类维度。
- **修复**：
  - `quests` 表新增 `category` 列（migrateToV5），每日任务按分类匹配（生活/学习/娱乐/休息）
  - `updateQuestProgress` 改为双路径匹配：`q.activity_type_id = ?` 或 `q.category = ?`
  - 每日任务从 5 个精简为 4 个（「每日阅读」合并入「每日学习」），重命名为「每日生活/学习/娱乐/休息」
  - 每周任务保持不变（仍按特定 activity_type_id 匹配）
  - 旧数据库自动迁移：每日阅读删除，其余 4 个每日任务设为分类匹配
- **验证**：知识梳理（type_id=16）→ 每日学习完成 ✓；营养素摄入（type_id=1）→ 每日生活完成 ✓

### 庶务外包推送到飞书显示网络请求失败
- **现象**：庶务外包拆解后点击「推送飞书」失败
- **根因（两层）**：
  1. `feishuTask.js` 使用 `lark-cli task add`，该子命令不存在（正确是 `task +create --summary`）
  2. 飞书用户 ID 硬编码为 `ou_746fb898faad310f0338d5c2df3842d9`，未从用户设置读取
- **修复**：
  - lark-cli 命令改为 `task +create --summary "..." --as user --assignee "ou_xxx"`
  - `pushStepsToFeishu` 新增 `userId` 参数，从 `user_settings.feishu_id` 读取目标用户
  - lark-cli 调用改为完整路径 `node.exe + lark-cli script`，与 feishuNotify.js 一致
  - 飞书通知摘要消息改用用户配置的 feishu_id
- **修改文件**：`backend/src/services/feishuTask.js`、`backend/src/routes/outsource.js`

### 经验沉淀
- lark-cli 子命令验证纪律：调用前先用 `--help` 确认子命令存在，不凭记忆写
- SQLite NOT NULL 约束：不能用 NULL 做"不适用"语义，需用占位值（如 activity_type_id=0 或 category=''）

---

## 2026-06-21 (later 3) — 三步法渲染稳定性修复 + 知识框架重构 + Obsidian 集成

### MindMap 组件黑屏崩溃（根因：数据结构不匹配）
- **现象**：文件分析提交后整个页面黑屏，ErrorBoundary 没捕获
- **根因**：MindMap 组件假设 AI 返回 `{topic: "text", children: [...]}` markmap 格式，实际返回 `{root: "text", children: [...]}`。`node.topic` 为 undefined 在渲染时崩溃，且崩溃发生在 loading 状态渲染中，ErrorBoundary 无法捕获
- **附带问题**：markmap-view CSS 导入路径不存在、markmap + d3 打包体积 650KB
- **修复**：删除 MindMap 组件和 markmap-view/d3 依赖，结构化笔记已满足梳理需求

### 结构化笔记颜色渲染失败
- **现象**：Tailwind prose 类（`prose-strong:text-amber-300` 等）在暗色主题下不生效
- **根因**：`@tailwindcss/typography` prose 类的颜色变量在暗色主题下复用基础色板，`prose-strong:text-amber-300` 优先级不够
- **修复**：改为 ReactMarkdown 的 `components` prop 逐元素自定义渲染，直接写 Tailwind 类名。Step1Result 和 Step2Tools 各维护一套 `mdComponents` 映射

### NOT NULL 约束导致分析写入失败
- **现象**：后端 POST /api/study/analyze 返回 500
- **根因**：`study_step1_output` 表的 `mind_map_json` 列有 NOT NULL 约束，代码插入 JavaScript `null`
- **修复**：插入 `'{}'` 字符串替代 null。sql.js 不容忍 NULL 写入 NOT NULL 列

### 大文本分析失败
- **现象**：81135 字符的输入分析失败，AI 返回不完整 JSON
- **根因**：maxTokens 固定 4096，大材料的结构化输出超出限制
- **修复**：`studyProcessor.js` 自适应 maxTokens（文本 >20000 → 16384，>8000 → 8192，否则 4096）。前端 StudyMaterialInput 加实时字符计数，>20000 红色警告"建议精简"，>8000 琥珀色"处理时间可能延长"

### Step2Tools 动态渲染崩溃
- **现象**：动态添加 insight 卡片时红色错误卡片 `TypeError: Cannot read properties of undefined (reading 'length')`
- **根因**：`remark-gfm` v3 在 Vite ESM/CJS 互操作中运行时崩溃——Vite 打包后模块解析失败
- **修复**：移除 remarkGfm（表格/删除线/任务列表在 AI 输出中极少出现），新增 CardErrorBoundary 逐卡片隔离崩溃，ReactMarkdown children 加 `|| ''` fallback

### 知识框架重构
- 删除独立的关键词提取，融入知识框架
- 框架结构改为：`{core_question, branches[{topic, brief, is_key, children[...]}], cross_links[{from, to, relation}]}`
- 最少 3 层层级，复杂材料自适应更深
- 前端 KnowledgeFramework 组件：递归树渲染、关键概念星标、跨分支链接胶囊、分支颜色编码

### Obsidian Vault 集成
- 后端新增 `POST /api/study/export-obsidian`、`PUT/GET /api/user/settings/vault-path`
- 导出 .md 带 YAML frontmatter 直接写入 vault 目录
- ProfilePage 新增「文件导出位置」输入框
- Step1Result 和 Step2Tools 卡片加导出按钮

### 侧边栏重组
- 导航项按功能分三组：核心（角色面板）、修炼（活动记录/成就徽章/任务）、工具（庶务外包/期末复习/数据统计）
- 「我的」独立放置在 footer stats 上方
- 侧边栏 logo 和登录页统一为晶体六边形

### 标志重新设计
- 立体主义晶体六边形：3 层同心六边形 + 4 个阴影面 + 中央光点
- 高对比度适应深色背景，锋利明暗交界线
- 生成透明背景 .ico 文件（256/128/64/48/32/16px）
- 桌面快捷方式改为中文名「数值进化系统」，指向 start-silent.vbs
- Windows 图标缓存更新困难：多次重建快捷方式、重启 Explorer 仍不刷新，系统级缓存问题

### 经验沉淀
- REUSABLE_PATTERNS.md 新增 3 条：#19 ReactMarkdown 暗色主题渲染、#20 Vite ESM/CJS 模块崩溃、#21 CardErrorBoundary 逐卡片隔离
- 如需继续追桌面图标问题：`ie4uinit.exe -ClearIconCache` 或清除 `%localappdata%\IconCache.db`

---

## 2026-06-21 (later 2) — 期末复习三步法模块

- 新增「期末复习」模块，实现三步法学习工作流：
  - **第一步 AI预处理**：粘贴材料/上传文件 → AI 输出结构化笔记、关键词、知识框架、思维导图、理解问答
  - **第二步 内化理解**：拆解逻辑 / 举例说明 / 知识推导 / 自定义提问，结果卡片可收藏、删除
  - **第三步 高强度输出**：AI 生成8-12道练习题 → 翻转卡片自测 → 标记已掌握 → 推送全部卡片到飞书
- Markdown 渲染：所有 AI 输出内容（结构化笔记、深度理解结果）使用 react-markdown + remark-gfm 渲染
- 思维导图：AI 根据内容逻辑自动生成 3 层树形思维导图，SVG 可视化展示，可展开缩放
- 文件上传支持 .txt / .docx / .pdf（base64 上传 + 后端 python 解析提取文本）
- 间隔复习：复习后自动计算下次复习时间（1/3/7/14天），每日启动时自动推送到期卡片到飞书
- 新增4张数据库表 + 1列迁移；新增后端 `routes/study.js`（11个端点）+ `services/studyProcessor.js`
- 新增前端 2 页面 + 5 组件 + MindMap + `useStudy` hook；侧栏新增「期末复习」入口

## 2026-06-21 (later) — 假数据清理 + 时间栏强化 + 忘记密码

- 清理 6/1~6/18 批量回填的假活动数据（101 条，同一秒创建），保留 6/19~6/20 真实活动
- 重算 EXP（5910→4594）、等级（15→12）、成就（16→7）、连胜（20天→2天）
- 右上角时间栏重构为「日相指示器」：环形进度条 + 距每日重置倒计时 + 时段阶段（晨光/白昼/黄昏/静夜），颜色随时间自动切换
- 新增忘记密码功能：登录页点击「忘记密码」，输入用户名 + 新密码即可重置
  - 后端 `POST /api/auth/reset-password`，前端登录页增加 reset 模式（紫色按钮区区分）

## 2026-06-21 — 修复无法登录（IPv4/IPv6 双栈绑定）

- **问题**：双击桌面快捷方式后浏览器无法打开登录页面，或页面白屏无法加载
- **根因**：Vite 默认在某些 Windows 系统上只绑定 IPv6 地址 `[::1]`，不绑定 IPv4 `127.0.0.1`。部分浏览器解析 `localhost` 时优先走 IPv4，导致连接被拒绝
- **修复**：`vite.config.js` 显式添加 `host: '0.0.0.0'`，强制 Vite 绑定所有接口（IPv4 + IPv6）
- **验证**：`curl 127.0.0.1:5174` 返回 200，登录 API 通过 IPv4 正常响应

## 2026-06-20 (later) — 数据归属修正 + 错误归档体系建立

- 数据归属修正：王星博(user 3) 全部数据迁移至 admin(user 1)，重算 EXP/等级/成就/称号
  - 活动 129 条、周任务 12 条归入 admin，user 3 重置
  - Admin 成就 8→13，称号 2→3（初出茅庐、麒麟才子、效率猎手），等级按实际 EXP 重算 Lv.10
- CLAUDE.md 新增 sql.js 安全铁律（4 条）+ 数据操作纪律（4 条）+ 错误自动归档 Hook
- 错误经验同步至 videcoading `lessons-from-rpg.md`（5 条新条目 #19-#23）
- 全局 `REUSABLE_PATTERNS.md` 新增第 18 条 sql.js saveDb 异常不安全

## 2026-06-20 — 数据持久化安全加固 + 全量称号/成就追回

### 问题根因：sql.js 内存 DB + 异常不安全的 saveDb

**现象**：成就徽章全部无法触发、条件称号（含麒麟才子等 12 个）全部缺失、连"初出茅庐"都没激活。

**根因（三层叠加）**：

1. **异常不安全**（直接原因）：`activities.js` POST 和 `weeklyTasks.js` PUT toggle 里，`checkAchievements()` / `checkConditionalTitles()` 在 `saveDb()` 之前调用。如果它们或后续代码抛异常，`saveDb()` 被跳过，内存中的 INSERT 全部丢失。因为 sql.js 是纯内存 DB，写文件只在 `saveDb()` 那一刻发生。

2. **迁移检测脆弱**：`db.js` 里检测旧成就数据的逻辑只匹配 6 个特定 `name_key`。当旧成就已被清过一次后，检测永远不会再触发。但后续种子数据改了（28 个 tiered 成就），旧 DB 里的成就条件仍是旧版（如 `perfect_day` 在 DB 里是 `level_reached: 4`，代码里已是 `total_count: 300`）。

3. **飞书回退泄露**：`getFeishuTarget()` 在用户未填飞书号时回退到 `.env` 的 `FEISHU_OPEN_ID`，导致所有用户的通知全发到管理员手机。

### 修复清单

- `activities.js` POST：成就/称号检测 + 任务奖励逻辑用 try-catch 包裹，`saveDb()` 一定执行
- `weeklyTasks.js` PUT toggle：同上
- `db.js` migrateToV4：改成就数据结构校验——检查 `perfect_day` 实际条件是否匹配，不匹配则全表重刷
- `feishuNotify.js` `getFeishuTarget()`：移除 `.env` 回退，用户必须自己填飞书号才推送
- 手动追回：王星博账号成就 6→11 个，称号 1→4 个（效率猎手、初出茅庐、麒麟才子、暴击猎手）
- 全量条件称号审计：13 个称号逐用户逐条件检查，确认无遗漏

### 备档

此模式已沉淀为全局经验 [[sqljs-inmemory-savedb]]，详见 REUSABLE_PATTERNS.md。

---

## 2026-06-19 (later 5) — 激励系统
- 新增每日签到系统：签到获 EXP + 连胜追踪 + AI 生成今日运势预言
  - 新表 `daily_checkins`，API `/api/checkin`（GET/POST）
  - 连胜加成：EXP 奖励 5 + min(streak, 10)
  - AI 不可用时 fallback 10 条预设运势
- 新增角色每日旁白：根据昨日数据生成 RPG 风格独白
  - 新表 `daily_narratives`，API `/api/narrative`（GET，按天缓存）
  - 聚合昨日完成的任务+活动，AI 生成一句角色旁白
  - 有完成事项→正面激励，无完成→温和调侃
- 新增随机掉落：完成任务时 15% 概率暴击（2x EXP），20% 概率掉落称号
  - 新表 `user_titles` 收集已获得称号
  - 稀有称号 5 个（5%），普通称号 14 个（15%）
  - 暴击和称号掉落均有 toast 动画提示
- 新增 `aiClient.js` 共享 AI 调用模块（从 user_settings 读自定义 API Key）
- Dashboard 页面重组：旁白气泡 → 签到卡片 → 角色面板+雷达

## 2026-06-19 (later 4)
- 新增「我的」页面（/profile）：自定义大模型 API Key + 模型选择，自我画像填写，AI 生成个人能力雷达
- 侧边栏新增"我的"入口（User 图标），路由 /profile
- BrainRadar 支持 customDimensions 属性，Dashboard 自动加载用户雷达数据
- 庶务外包自动使用用户自定义 API Key，无需单独配置
- 「我的」页面改为全自动保存（800ms 防抖），移除手动保存按钮，标题栏显示保存状态

## 2026-06-19 (later 3)
- 本周修炼改为按周隔离：weekly_tasks 表新增 week_start 列，API 只返回本周任务，历史任务不再堆积
- 新增月度修炼热力图（MonthHeatmap）：4周×7天网格，颜色深浅反映每日完成强度
- 热力图数据由 GET /api/weekly-tasks/heatmap 聚合返回

## 2026-06-19 (later 2)
- 修复桌面快捷方式每次弹出命令行窗口：新增 VBS 静默启动器，start.bat 增加端口检测避免重复启动
- 桌面快捷方式指向 start-silent.vbs，双击无窗口直接打开浏览器

## 2026-06-19 (later)
- 修复 BrainRadar 集成到 Dashboard 后白屏：animationEasing 改为有效 CSS 值、outerRadius 改数值、加载动画改用 Tailwind animate-spin
- 大脑雷达维度按分数分层（优势能力/一般能力/待提升），每层独立配色
- TaskInput.jsx 拆分：STEPS 配置抽为 taskSteps.js，Loading 态抽为 TaskInputLoading.jsx，主文件从 300 行降至 214 行
- 全项目文件行数合规检查：所有文件均在 300 行以内

## 2026-06-19
- 新增大脑能力雷达图页面（/brain），用 recharts 绘制九维自评雷达图 + 维度解读卡片
- 侧边栏新增"大脑雷达"导航项（Radar 图标）
- 桌面快捷方式：生成六边形赛博风图标（icon.ico/icon.svg）

## 2026-06-09
- 前端端口从 5173 改为 5174，避免与 murmur-nights（小世界）冲突（两个 Vite 项目不能用同一端口）

## 2026-06-07
- 六芒星标志：登录页和侧边栏 logo 改为双层三角六芒星 + outer ring + 渐变填充
- 庶务外包步骤表格：从横向表格改为两栏卡片网格，解决长内容溢出问题
- 时间选择器修复：type="time" 输入框加 color-scheme: dark，白字暗底可见
- 庶务外包结果卡片：bg 从透明玻璃改为实色暗底 #0a0a14
- OutsourcePage 配色：从 rpg-gold/rpg-ink 迁移到 indigo/slate 统一色系

## 2026-06-06 (later 2)
- 全局组件视觉升级（web-design-engineer 驱动）：去除所有 emoji，统一几何多边形图标系统
- CharacterSheet：六边形等级徽标 + indigo 渐变 EXP 条 + 几何属性图标替代文字
- WeekTaskPanel/TaskItem：玻璃卡片化 + indigo 主色调 + 颜色点替代分类标签
- ActivityForm：几何形状替代 emoji 分类图标，三步向导玻璃化
- BadgeGrid：六边形 SVG 徽章替代 emoji，差异化解锁/未解锁态
- QuestList：indigo-violet 渐变进度条 + 玻璃卡片
- 图表：tooltip 统一玻璃风格，折线图 indigo 配色
- 所有页面标题区域统一：Lucide 图标 + 副标题说明

## 2026-06-06 (later)
- 项目更名为「数值进化系统」
- 登录页重设计：canvas 几何图形动效 + 立体主义多边形徽标 + faceted 表单卡片
- 路由调整：角色面板为首页 `/`，庶务外包移至 `/outsource`
- Sidebar 更新导航顺序与标题

## 2026-06-06
- 新增「庶务外包」功能：7步问卷向导式任务拆解 + DeepSeek API + 飞书提醒
- 全局 UI 翻新为毛玻璃现代风格（indigo 主色调、backdrop-blur、暗色玻璃卡片）
- 修复问卷提交后结果不显示的 bug（handleRadio 闭包 + setTimeout 状态不一致）
- 后端新增 taskDecomposer.js、feishuTask.js、outsource 路由和新数据库表
- 前端新增 OutsourcePage、TaskInput（问卷向导）、StepTable、useOutsource hook
- 路由变更：庶务外包为首页 `/`，角色面板移至 `/dashboard`
