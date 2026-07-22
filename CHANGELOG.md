# RPG Tracker 项目日志

## 2026-07-20 — DESIGN.md 设计规范文件

- 项目根目录新增 `DESIGN.md`，按 Google Stitch 标准格式编写
- 内容：配色体系（含两套色彩模式 + 9 种语义色）、三字体体系、毛玻璃深度层级、圆角/间距规范、组件定义、动效规则、Do's & Don'ts
- 包含 Agent Prompt Guide：AI 写新组件时可直接参考的速查 checklist 和生图 prompt 模板
- 灵感来源：SlashZ斜杠青年Z 的"怎么才能Vibe Code出来漂亮的UI"四集系列

## 2026-07-20 — UI 点击音效 v3：主题/模式/添加任务音效

- 新增 3 个 Kenney UI Audio (CC0) 音效：
  - theme.wav（switch1）— 主题切换
  - mode.wav（switch8）— 视图模式切换
  - add.wav（click4）— 添加周任务
- `useSound.js` 新增 `playSoundGlobal(name)` 模块级导出，供 Context/非组件环境使用
- 音效插入点：
  - 主题切换（ThemeContext.toggleTheme）— theme.wav
  - 视图模式切换（ViewModeContext.toggleViewMode）— mode.wav
  - 添加周任务提交（AddTaskModal.submit）— add.wav
- 部署：https://rpg-tracker-two.vercel.app

## 2026-07-20 — UI 点击音效 v2：升级 Pixabay 音效

- levelup/success 替换为 Pixabay CC0 音效（FunWithSound 制作）：
  - levelup.mp3：Success Fanfare Trumpets（4.4s 铜管号角，118 万播放）
  - success.mp3：Short Success Glockenspiel（2.5s 钢片琴清脆叮咚）
- click/pop/unlock 保留 Kenney UI Audio (CC0) WAV
- Pixabay 程序化下载被 Cloudflare Turnstile 阻挡，后续替换需手动浏览器操作
- 部署：https://rpg-tracker-two.vercel.app

## 2026-07-20 — UI 点击音效 v1

- 新增 `useSound` hook（`frontend/src/hooks/useSound.js`），懒加载 Audio + 80ms 防抖
- 音效文件来自 Kenney UI Audio (CC0)，放在 `frontend/public/sounds/`
- 音效覆盖点：
  - 升级特效 (`LevelUpEffect`) — levelup.wav
  - 称号解锁 (`TitleUnlockEffect`) — unlock.wav
  - 签到成功 (`DailyCheckin`) — success.wav
  - 活动记录提交 (`ActivityForm`) — success.wav
  - 徽章装备 (`BadgeGrid`) — pop.wav
  - 周任务勾选 (`TaskItem`) — click.wav
  - 侧栏导航/退出 (`Sidebar`) — pop.wav / click.wav
- 部署：Vercel production — https://rpg-tracker-two.vercel.app

## 2026-07-18 — 热力悬浮框修复 + 趋势数据一致性修复

**问题 1 — 悬浮框位置偏移**：
- 根因：Tooltip 在 `backdrop-blur-xl` 卡片内部渲染，`backdrop-filter` CSS 属性创建新的 fixed 定位容器，导致 `position: fixed` 相对于卡片而非视口
- 修复：Tooltip 移到卡片 div 外面（`<>...</>` fragment），配合 `pageX/pageY` + `transform: translate(-50%, calc(-100% - 8px))` 定位在光标正上方

**问题 2 — 年度热力与修炼趋势数据不匹配**：
- 根因：`/stats/trends` 接口周任务 SQL 用 `week_start as date`，所有周任务 EXP 归到周一；而 `/stats/yearly-heatmap` 用 `week_start + weekday` 分散到每天
- 修复：`SELECT date(week_start, '+' || weekday || ' days') as date`

## 2026-07-18 — 年度热力图替换为独立 HTML 同款效果

**问题**：项目内 YearHeatmap 用 CSS 变量 + div 布局，显示效果不如独立 HTML 版。

**重写**：
- 颜色从 CSS 变量改为硬编码主题色数组（`GRADS_DARK` / `GRADS_LIGHT`），通过 `useTheme` 切换
- 渲染从 div 改为纯 SVG（`<rect>`），与独立 HTML 一致
- 新增年份 ◀▶ 切换按钮
- 新增四格统计行：年度总修为 / 修炼天数 / 当前连续 / 最长连续
- 新增悬停 Tooltip（色块 + 日期 + EXP），`fixed` 定位跟随鼠标
- 网格改为周日~周六（GitHub 惯例）

## 2026-07-18 — 年度热力图重新设计（GitHub 风格）

**问题**：亮色模式下刻度/边框不可见；原设计为"月份列 × 天数行"纵向布局，横轴混乱。

**重做**：
- 改为 GitHub 贡献图风格：7 行（周一至周日）× N 列（每周一列），每格 11×11px 小方块
- 月份标签自动定位在对应列上方（间距不足时自动省略）
- 左侧保留一/三/五/日 星期标注
- 颜色从硬编码改为 CSS 变量（`--heatmap-empty` / `--heatmap-l1~l4` / `--heatmap-today-ring`），亮色模式自动切换
- 深色：indigo 渐变；亮色：indigo 加深饱和度保证可读
- 今日方块用 outline ring 标记
- 横向溢出自动滚动

## 2026-07-18 — 移动端主题切换 + 亮色模式修复

**问题**：移动端主页面无主题切换入口；移动端亮色主题失效（MobileHome 硬编码 `bg-[#060610]` 不受 CSS 变量控制）；ActivityForm 两处 CSS 笔误 `border-cyan-500/[0.03]0`。

**修复**：
- MobileHome：`bg-[#060610]` → `bg-[var(--glass-bg)]`，顶部加主题切换按钮
- ActivityForm：两处 `[0.03]0` → `/30`
- 亮色模式下 bg/border 透明度提升（`0.03`→`0.04`、`0.04`→`0.06`），输入框边界更可见
- 新增 `text-white`（无透明度后缀）亮色覆盖 → `#1c1917`
- 新增 `focus:border-cyan-400/40` 亮色覆盖

## 2026-07-18 — 全面分色 + GuidePage 主题适配 + CSS 变量重构

**设计方向**：muted postal, monochromatic, card-based with layered elements

**改动**：
- 所有卡片改为 CSS 变量驱动（`:root` ↔ `[data-theme="light"]`），不再依赖 Tailwind 类覆盖
- Dashboard 5 张卡片各独立 muted 色系：暖灰褐/钢蓝/靛蓝/紫罗兰/鼠尾草绿
- GuidePage 9 个功能卡片各独立 muted 色系，暗→亮全适配
- GuidePage 不再硬编码 `rgba(10,10,18,0.5)`，改用 CSS 变量自动响应主题切换
- 浅色主题卡片：柔和粉彩色（樱草/长春花/蜜桃/玫瑰/薄荷/天蓝/杏色/粉红/薰衣草）

---

## 2026-07-18 — 卡片分色体系

**改动**：
- 5 个主页面卡片各自分配独立色系，不再统一使用 `bg-white/[0.03]`：
  - **角色旁白**（DailyNarrative）→ 暖琥珀/玫红 `amber-950 → rose-950`
  - **每日签到**（DailyCheckin）→ 青/墨绿 `cyan-950 → teal-950`
  - **角色卡**（CharacterSheet）→ 靛蓝/石板 `indigo-950 → slate-900`
  - **大脑雷达**（BrainRadar）→ 紫罗兰 `violet`
  - **本周修炼**（WeekTaskPanel）→ 翡翠绿 `emerald-950 → green-950`
- 卡片与背景对比度大幅提升（从 3% 透明度 → 40-50% 彩色透明度）
- 浅色主题同步适配：深色渐变 → 柔和粉彩色（蜜桃/薄荷/长春花/鼠尾草绿）

---

## 2026-07-18 — 侧边栏对比度 + 浅色主题 v2

**改动**：
- 主题切换按钮移至 DayPhaseBar 同一行，与"白昼/晨光"阶段指示器并列
- 浅色主题重设计：暖灰底色 `#e8e4de` 替代亮白，侧边栏 `#ddd8d1`，柔和层次分明
- CSS 全局覆盖 50+ 组件样式：卡片(bg-white→bg-black)、文字(slate→深灰)、边框、强调色、滚动条
- 不依赖逐个组件修改，一次覆盖全局适配

---

## 2026-07-18 — 侧边栏对比度 + 浅色主题

**改动**：
- 侧边栏底色与主内容区拉开差距：暗色模式侧边栏 `#010106`（更深黑）vs 主区 `#030308`
- 新增米白色极简主题，`ThemeContext` 管理主题状态，localStorage 持久化
- 右上角添加主题切换按钮（太阳/月亮图标）
- CSS 变量双主题体系（`:root` 暗色 + `[data-theme="light"]` 米白）
- 浅色主题配色：背景 `#faf8f5`，侧边栏 `#f0ede8`，强调色 `#0891b2`

---

## 2026-07-18 — DeepSeek 归类修正

**改动**：
- `ProfilePage.jsx`：DeepSeek V4 从"海外"组移到"国内"组，desc 从 "DeepSeek" 改为 "深度求索"
- `GuidePage.jsx`：模型数量更新（海外 4 款、国内 6 款）
- 重新构建并部署到 Vercel production

---

## 2026-07-18 — 密钥泄露事故

### 事故经过
- Vercel 部署时把 `DEEPSEEK_API_KEY` 设为环境变量，导致任何用户不填自己的 Key 也能用系统 Key 调用 AI，消耗账户余额
- **暴露时间**：约 2 小时
- **影响范围**：Vercel production + preview 环境
- **修复**：
  - `vercel env rm DEEPSEEK_API_KEY production/preview` 立即删除
  - 本地 `.env` 中删除该 Key
  - 全局记忆沉淀 [deployment_key_audit](../../../memory/deployment_key_audit.md)：「部署前必须审计平台环境变量，绝不在公开部署中设系统默认 API Key」
- **教训**：`.env` gitignored ≠ 安全。部署平台环境变量是新的泄露面

### 模型列表重构
- 「我的」页面模型选择从 5 个旧列表替换为 10 个新模型（海外 5 + 国内 5）
- 删除"不填则使用系统默认"的提示，改为"未设置则 AI 功能不可用"
- 删除国旗 emoji

### 庶务外包手机版布局修复
- 7 步问卷卡片从 2 列网格 → 横向可滑动列表（每张 130px 宽）
- 结果卡片头部从并排 → 上下堆叠，推送按钮全宽
- 整体内边距缩减

---

## 2026-07-17 — Vercel 部署 + 手机模式 + 新手指引

### Vercel 部署（sql.js WASM 四轮修复）
- **第一次**：`ENOENT: sql-wasm.wasm` — Vercel 自动裁剪 node_modules 中的 `.wasm` 文件
- **第二次**：CDN URL → sql.js `locateFile` 只接受本地路径，不支持 URL fetch
- **第三次**：手动下载的 WASM 文件与 node_modules 的 JS wrapper 版本不匹配 → `TypeError: y is not a function at onRuntimeInitialized`
- **第四次（成功）**：从 `backend/node_modules/sql.js/dist/sql-wasm.wasm` 复制匹配的 WASM 到 `backend/data/`，commit 到 Git（653KB），`locateFile` 指向本地路径
- **部署配置**：root `package.json` + `vercel.json`（`includeFiles: "backend/**"` + rewrites）+ `api/index.js` 作为 serverless handler + `/tmp` 读写数据库
- **冷启动耗时**：~3 秒（加载 660KB WASM），热调用正常

### AddTaskModal z-index 修复
- **现象**：添加任务弹窗卡在每日任务卡片下面，看不见
- **根因**：`backdrop-blur` 创建新 stacking context，`z-index` 在内部无意义
- **修复**：`createPortal` 渲染到 `document.body`，彻底绕过父容器 stacking context
- 新增分类未选择时的提示文字：「请先选择一个分类，再点击添加」
- 禁用态 opacity 从 0.3 提高到 0.5

### 手机/桌面界面切换
- 侧边栏底部新增切换按钮（带滑动开关动画）
- **桌面模式**：正常侧边栏 + 内容区
- **手机模式**：
  - 侧边栏隐藏，主区域显示 430px 宽手机框
  - 默认显示导航主页（9 宫格菜单 + 角色统计）
  - 点击功能进入对应页面，左上角发光青色返回键
  - 底部 home indicator 条
  - 首页底部显示「退出手机模式」按钮（其他页面不显示）
- 选择持久化到 localStorage

### 手机版组件适配
- **本周修炼**：7 天从挤在一起的 7 列 → 横向可滑动，每列 120px 宽，任务名完整显示不截断
- **成就徽章**：手机模式 3 列紧凑排列，徽章 SVG 从 52px 缩小到 36px，隐藏描述文字
- **新手指引导航主页**：每项下方标注一行说明文字

### 侧边栏悬浮提示重构
- **旧方案**：每个 NavLink 内嵌 `group-hover` 绝对定位 tooltip，被侧边栏边界裁剪，滚动条冗余
- **新方案**：`FloatingTooltip` 组件，通过 React Portal 渲染到 `document.body`
  - 半透明毛玻璃样式（`backdrop-blur: 16px`）
  - 跟随鼠标移动，300ms 延迟避免闪烁
  - 不受侧边栏 overflow/z-index 限制

### 新手指引独立页面
- 新增 `/guide` 路由 + GuidePage + 侧边栏入口
- 涵盖全部 9 个功能，每项展开后分四区：📥 输入 → ⚙️ 逻辑 → 📤 输出 → 💡 例子
- 例子可点 ✕ 关闭
- 「我的」页面中原有简略介绍替换为跳转卡片

### 侧边栏切换按钮位置调整
- 桌面/手机切换从「总修为」下方移到上方（紧接导航区后面）

---


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
