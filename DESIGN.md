---
version: 1.0
name: rpg-tracker-design
description: >
  RPG Tracker（数值进化系统）的暗色水晶科技美学。以极深冷调黑 #030308 为画布，
  青色 #00e5ff 为唯一品牌主色，辅以 violet/emerald/amber/rose 等语义色。
  毛玻璃（backdrop-blur）作为核心空间语言，所有表面通过 rgba(255,255,255, 0.01-0.12)
  的半透明层叠来建立层级深度。Space Grotesk 正文 + Share Tech Mono 数据 + Orbitron 展示标题。
  支持暗色/亮色双模式，通过 data-theme 属性 + CSS 变量无缝切换。

colors:
  canvas: "#030308"
  surface-1: "rgba(255,255,255,0.03)"
  surface-2: "rgba(255,255,255,0.04)"
  surface-3: "rgba(255,255,255,0.06)"
  surface-4: "rgba(255,255,255,0.08)"
  border: "rgba(255,255,255,0.06)"
  border-active: "rgba(0,229,255,0.35)"
  accent: "#00e5ff"
  accent-glow: "rgba(0,229,255,0.12)"
  accent-secondary: "#a78bfa"
  ink: "#e2e8f0"
  ink-secondary: "#94a3b8"
  ink-muted: "#64748b"
  sidebar-bg: "#010106"
  semantic-success: "#34d399"
  semantic-danger: "#f87171"
  semantic-warning: "#fbbf24"
  toast-bg: "rgba(15,15,25,0.9)"
  modal-overlay: "rgba(0,0,0,0.6)"

typography:
  display:
    fontFamily: "'Orbitron', 'Space Grotesk', 'Noto Sans SC', sans-serif"
    fontSize: 24px
    fontWeight: 600
    letterSpacing: 0.2em
  body:
    fontFamily: "'Space Grotesk', 'Noto Sans SC', system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
  body-lg:
    fontFamily: "'Space Grotesk', 'Noto Sans SC', system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: "'Space Grotesk', 'Noto Sans SC', system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
  mono:
    fontFamily: "'Share Tech Mono', 'Noto Sans SC', monospace"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
  eyebrow:
    fontFamily: "'Share Tech Mono', 'Noto Sans SC', monospace"
    fontSize: 10px
    fontWeight: 400
    letterSpacing: 0.3em
  button:
    fontFamily: "'Space Grotesk', 'Noto Sans SC', system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 600
    letterSpacing: 0.025em
  caption:
    fontFamily: "'Space Grotesk', 'Noto Sans SC', system-ui, sans-serif"
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.4

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  xxl: 40px
  full: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  xxl: 24px

components:
  card-standard:
    backgroundColor: "{colors.surface-1}"
    borderColor: "{colors.border}"
    rounded: "{rounded.xl}"
    padding: 20px
    backdropBlur: 20px
  card-hover:
    backgroundColor: "{colors.surface-3}"
    borderColor: "rgba(255,255,255,0.1)"
  button-primary:
    backgroundColor: "rgba(0,229,255,0.1)"
    textColor: "{colors.accent}"
    borderColor: "rgba(0,229,255,0.2)"
    rounded: "{rounded.lg}"
    padding: 8px 20px
  button-primary-hover:
    backgroundColor: "rgba(0,229,255,0.15)"
    boxShadow: "0 0 20px {colors.accent-glow}"
  button-secondary:
    backgroundColor: "rgba(167,139,250,0.08)"
    textColor: "{colors.accent-secondary}"
    borderColor: "rgba(167,139,250,0.15)"
    rounded: "{rounded.lg}"
    padding: 8px 20px
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    borderColor: "transparent"
    rounded: "{rounded.lg}"
    padding: 8px 20px
  text-input:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    borderColor: "{colors.border}"
    rounded: "{rounded.md}"
    padding: 8px 12px
  text-input-focus:
    borderColor: "{colors.border-active}"
    boxShadow: "0 0 0 3px {colors.accent-glow}"
  nav-item-active:
    backgroundColor: "rgba(0,229,255,0.08)"
    textColor: "{colors.accent}"
    borderColor: "rgba(0,229,255,0.15)"
    rounded: "{rounded.lg}"
  nav-item-default:
    textColor: "{colors.ink-muted}"
  modal:
    backgroundColor: "{colors.canvas}"
    borderColor: "{colors.border}"
    rounded: "{rounded.xl}"
    padding: 20px
    backdropBlur: 20px
    boxShadow: "0 25px 50px -12px rgba(0,229,255,0.03)"
  sidebar:
    backgroundColor: "{colors.sidebar-bg}"
    borderColor: "{colors.border}"
    backdropBlur: 40px
  toast:
    backgroundColor: "rgba(15,15,25,0.9)"
    borderColor: "{colors.border}"
    rounded: "{rounded.lg}"
    backdropBlur: 12px
  badge-tag:
    rounded: "{rounded.sm}"
    padding: 2px 8px
    fontSize: 11px
---

## Overview

RPG Tracker（数值进化系统）的视觉语言是**暗色水晶科技**（Dark Crystal Tech）。
以极深冷调黑 `{colors.canvas}` (#030308) 为画布，青色 `{colors.accent}` (#00e5ff) 作为唯一品牌主色。

核心空间语言是**毛玻璃层叠**——所有卡片/面板通过 `backdrop-blur` + `rgba(255,255,255, 0.01–0.12)` 的半透明表面来建立层级深度，而非依赖传统阴影。光晕（glow）取代阴影成为"浮现"的视觉信号。

**关键特征：**
- **玻璃态深度**：表面层级通过 `rgba(255,255,255, x)` 透明度+ `backdrop-blur` 来区分，不是 box-shadow
- **青色唯一主色**：`{colors.accent}` 是唯一的品牌色——用于按钮、链接、边框聚焦、光晕。绝不用青色做背景底色
- **多语义色体系**：violet（学习/飞书）、emerald（成功/任务）、amber（成就/警告）、rose（删除）、sky/ orange/ pink/ indigo 各司其职
- **三字体体系**：Space Grotesk（正文）+ Share Tech Mono（数据/代码/标签）+ Orbitron（展示标题）
- **暗色/亮色双模式**：CSS 变量 + `[data-theme]` 属性切换，亮色模式通过大规模 CSS 覆盖实现，组件代码无需改动

## Colors

### 品牌色

- **Cyan** (`{colors.accent}` #00e5ff)：唯一品牌主色——主按钮、链接高亮、聚焦环、导航激活态、光晕。在亮色模式下映射为 teal-700 (#0f766e)
- **Violet** (`{colors.accent-secondary}` #a78bfa)：辅助色——副按钮、学习模块、飞书集成。绝不同时与 cyan 争夺同一元素的注意力

### 表面层级（暗色模式）

暗色模式使用 `rgba(255,255,255, x)` 的半透明层叠来建立空间深度。层级从 0.01 → 0.12，每级 0.02：

| 层级 | Token | 值 | 用途 |
|------|-------|-----|------|
| 0 | — | `rgba(255,255,255,0.01)` | 不活跃区域 |
| 1 | — | `rgba(255,255,255,0.02)` | 次表面 hover |
| 2 | `{colors.surface-1}` | `rgba(255,255,255,0.03)` | **标准卡片背景** |
| 3 | `{colors.surface-2}` | `rgba(255,255,255,0.04)` | 输入框背景 |
| 4 | `{colors.surface-3}` | `rgba(255,255,255,0.06)` | 卡片 hover / 分隔线 |
| 5 | `{colors.surface-4}` | `rgba(255,255,255,0.08)` | 强 hover / 按下态 |
| 6 | — | `rgba(255,255,255,0.10–0.12)` | 下拉菜单边框 |

**亮色模式自动翻转**：所有 `rgba(255,255,255,x)` → `rgba(0,0,0,x)`，由 CSS 变量和 `[data-theme="light"]` 选择器驱动。

### 边框

- **标准边框** (`{colors.border}`)：`rgba(255,255,255,0.06)` — 所有卡片、分隔线
- **激活边框** (`{colors.border-active}`)：`rgba(0,229,255,0.35)` — 输入框聚焦、导航激活态
- **边框从不使用纯白色**——最亮不过 0.12

### 画布

- **主画布** (`{colors.canvas}` #030308)：极深冷调黑，略带蓝
- **侧边栏** (`{colors.sidebar-bg}` #010106)：比画布更深，接近纯黑
- 页面有两个 `body::before` 伪元素光晕：顶部 cyan `rgba(0,229,255,0.04)` + 右下 violet `rgba(167,139,250,0.03)`

### 文字层级

| Token | Tailwind class | 暗色值 | 用途 |
|-------|---------------|--------|------|
| `{colors.ink}` | `text-white/90` `text-slate-200` | #e2e8f0 | 主文字、标题、强调正文 |
| `{colors.ink-secondary}` | `text-white/60` `text-slate-400` | #94a3b8 | 次要文字、描述 |
| `{colors.ink-muted}` | `text-slate-500` `text-slate-600` | #64748b | 弱文字、占位符、导航默认态 |

### 语义色

| Token | 色值 | 用途 |
|-------|------|------|
| `{colors.semantic-success}` | #34d399 (emerald-400) | 签到成功、任务完成 |
| `{colors.semantic-danger}` | #f87171 (rose-400) | 删除确认、错误状态 |
| `{colors.semantic-warning}` | #fbbf24 (amber-400) | 警告、成就徽章 |

### 导航模块专属配色

九个导航模块各有独立语义色，匹配其功能气质：

| 模块 | 色系 | 用途 |
|------|------|------|
| 角色面板 | cyan | 品牌主色 |
| 活动记录 | violet | 副强调 |
| 成就徽章 | amber | 荣誉感 |
| 任务 | rose | 紧迫感 |
| 庶务外包 | emerald | 完成/交付 |
| 期末复习 | sky | 学习/冷静 |
| 数据统计 | orange | 数据活力 |
| 日报 | pink | 个人/温暖 |
| 个人设置 | indigo | 沉稳 |

### 卡片专属渐变

每种功能卡片在暗色模式下有独立的 `linear-gradient` 背景，而非纯色。亮色模式下渐变切换为柔和的马卡龙风格。以下为暗色模式示例：

- **签到卡片**：`linear-gradient(135deg, rgba(15,23,42,0.7), rgba(22,78,99,0.2))` — 深蓝到 cyan
- **角色卡片**：`linear-gradient(135deg, rgba(30,27,75,0.65), rgba(15,23,42,0.25))` — 靛蓝到深蓝
- **任务卡片**：`linear-gradient(135deg, rgba(6,48,38,0.55), rgba(5,36,22,0.2))` — 深绿
- **学习卡片**：`linear-gradient(135deg, rgba(12,35,52,0.55), rgba(22,55,82,0.25))` — 深海蓝
- **叙事卡片**：`linear-gradient(135deg, rgba(41,37,36,0.7), rgba(69,26,3,0.2))` — 暖中性
- **外包卡片**：`linear-gradient(135deg, rgba(69,26,3,0.5), rgba(113,63,18,0.2))` — 暖橙

## Typography

### 字体体系

| Token | 字体栈 | 使用场景 |
|-------|--------|---------|
| `{typography.body}` | `'Space Grotesk', 'Noto Sans SC', system-ui, sans-serif` | 所有正文、按钮、标签 |
| `{typography.display}` | `'Orbitron', 'Space Grotesk', 'Noto Sans SC', sans-serif` | 页面主标题（24px，间距 0.2em） |
| `{typography.mono}` | `'Share Tech Mono', 'Noto Sans SC', monospace` | 数据数字、时间戳、状态码、分类标签 |
| `{typography.eyebrow}` | `'Share Tech Mono', 'Noto Sans SC', monospace` | 侧边栏 section label（10px，0.15–0.3em 间距） |

三字体体系的意图：
- **Space Grotesk**：几何感现代无衬线，承载产品的主体阅读和交互
- **Share Tech Mono**：等宽科技感，标记"这是数据/系统信息"——与正文形成视觉断层
- **Orbitron**：科幻几何展示字体，仅用于页面主标题——出现即"这是 RPG HUD 界面"

### 设计原则

- **Orbitron 仅用于页面级标题**（24px，tracking 0.2em）——不要用在卡片标题、按钮或正文
- **Mono 字体仅用于数据/系统信息**——数字统计、时间戳、分类标签、sidebar section label。不要用在正文或按钮
- **Space Grotesk 是默认**——没有特殊理由就用它
- **中文回退到 Noto Sans SC**——所有字体栈末尾都要有
- **tracking 是重要的视觉信号**——mono 标签用 0.15–0.3em，显示标题用 0.2em，按钮用 tracking-wide

## Layout

### 间距

基础单位 4px。常用间距（Tailwind 对应值）：

| Token | 值 | 用途 |
|-------|-----|------|
| `{spacing.xs}` | 4px | 微型间隙 |
| `{spacing.sm}` | 8px | 紧凑间距 |
| `{spacing.md}` | 12px | 中等间距 |
| `{spacing.lg}` | 16px | 标准内边距 |
| `{spacing.xl}` | 20px | 卡片 padding |
| `{spacing.xxl}` | 24px | 宽松 padding |

实际编码中的典型值：
- 卡片容器：`p-5` (20px) 或 `p-6` (24px)
- 主按钮：`px-5 py-2.5`
- 输入框：`px-4 py-2.5` 或 `px-3 py-1.5`（紧凑）
- flex/grid 间距：`gap-2`、`gap-3`、`gap-4`

### 圆角

| Token | Tailwind | 值 | 用途 |
|-------|----------|-----|------|
| `{rounded.xs}` | `rounded` / `rounded-sm` | 2–4px | 极小元素 |
| `{rounded.sm}` | `rounded-md` | 6px | Badge 标签 |
| `{rounded.md}` | `rounded-lg` | 8px | 输入框、小按钮 |
| `{rounded.lg}` | `rounded-xl` | 12px | 卡片内元素、下拉菜单 |
| **`{rounded.xl}`** | **`rounded-2xl`** | **16px** | **主力卡片容器** |
| `{rounded.xxl}` | `rounded-[2.5rem]` | 40px | 手机框架 mockup |
| `{rounded.full}` | `rounded-full` | 9999px | 头像、开关 toggle、签到按钮 |

**`rounded-2xl` (16px) 是贯穿整个应用的标准卡片圆角**——新建任何卡片容器时优先使用它。

### 毛玻璃卡片公式

标准卡片的完整 CSS 组合（写在 Tailwind 里）：
```
backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5
```

这是 RPG Tracker 最基础的视觉单元。变体：
- Hover：`bg-white/[0.06]` + `border-white/[0.1]`
- 输入框：`bg-white/[0.04]` + `rounded-lg`
- Modal：标准卡片 + `shadow-2xl shadow-cyan-500/3`

## Elevation & Depth

RPG Tracker **不使用传统 box-shadow 来表达层级深度**。深度通过三个维度建立：

### 1. 表面透明度层级（主力）
`rgba(255,255,255, x)` 从 0.01 到 0.12 的递进。每提升一级透明度加 0.02。

### 2. Backdrop-blur 层级
| 效果 | 值 | 位置 |
|------|-----|------|
| 背景模糊（大） | `backdrop-blur-2xl` (~40px) | 侧边栏 |
| 标准毛玻璃 | `backdrop-blur-xl` (~20px) | 所有卡片 |
| 微弱模糊 | `backdrop-blur-sm` (~4px) | Modal overlay |

### 3. 光晕（Glow）
青色光晕是"该元素正处于交互焦点"的视觉信号：
- 主按钮 hover：`box-shadow: 0 0 20px rgba(0,229,255,0.15)`
- 输入框 focus：`box-shadow: 0 0 0 3px rgba(0,229,255,0.08)`
- 签到按钮：`box-shadow: 0 0 30px rgba(0,229,255,0.15)`
- Modal：`shadow-2xl shadow-cyan-500/3`（极微弱的青色投影）

原则：**光晕越大 = 交互权重越高**。普通 hover 用 20px，签到（核心行为）用 30px。

## Components

### 按钮

**`button-primary`** — 青色玻璃主按钮
- `bg: rgba(0,229,255,0.1)` + `border: 1px solid rgba(0,229,255,0.2)` + `text: {colors.accent}`
- Hover：bg 加深到 0.15 + `box-shadow: 0 0 20px {colors.accent-glow}`
- 圆角 `{rounded.lg}` (8px)，padding `px-5 py-2.5`
- 用于：主要操作（签到、提交、确认）

**`button-secondary`** — Violet 玻璃副按钮
- `bg: rgba(167,139,250,0.08)` + `border: 1px solid rgba(167,139,250,0.15)` + `text: {colors.accent-secondary}`
- 用于：次要操作（取消、返回）

**`button-ghost`** — 透明幽灵按钮
- `bg: transparent` + `border: transparent` + `text: {colors.ink-muted}`
- Hover 时显示文字和微弱背景
- 用于：极低优先级的操作

### 卡片

**`card-standard`** — 毛玻璃卡片（最常用）
```
backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5
```
页面上绝大多数容器都是这个模式。特定功能卡片可有独立的 `linear-gradient` 背景覆盖 bg-white/[0.03]。

### 导航

**`nav-item-active`** — 当前激活的导航项
- `bg: rgba(0,229,255,0.08)` + `border: 1px solid rgba(0,229,255,0.15)` + `text: {colors.accent}`

**`nav-item-default`** — 默认导航项
- `text: {colors.ink-muted}` + `border: transparent`
- Hover：`text: {colors.ink-secondary}` + `bg: rgba(255,255,255,0.02)`

### 输入框

**`text-input`** — 标准输入
- `bg: rgba(255,255,255,0.04)` + `border: 1px solid rgba(255,255,255,0.06)` + `rounded-lg`
- Focus：`border: {colors.border-active}` + `box-shadow: 0 0 0 3px {colors.accent-glow}`

### Modal

**`modal`** — 弹窗（Portal 渲染到 body）
- 标准卡片样式 + `shadow-2xl shadow-cyan-500/3`
- Overlay：`bg-black/60 backdrop-blur-sm`
- 宽 420px（桌面），自适应（移动端）

### Toast

**`toast`** — 通知提示
- `bg: rgba(15,15,25,0.9)` + `backdrop-blur-md` + `rounded-lg`
- 从顶部滑入，3 秒后自动消失

## Iconography

| 属性 | 值 |
|------|-----|
| 图标库 | lucide-react |
| 标准尺寸 | `size={16}`（内联/标签）、`size={18}`（标准）、`size={20}`（标题级） |
| 移动端微型 | `size={12–13}` |
| 颜色 | 通过父元素 Tailwind `text-*` class 继承 |

图标颜色遵循导航模块的语义色映射（见 Colors 章节）。

## Motion

### 过渡

- 所有交互过渡统一 `duration-200`，easing 默认 `ease-out`
- 导航切换、按钮 hover、边框 color 变化都用 `transition-all duration-200`
- 颜色变化用 `transition-colors`

### 关键帧动画

| 动画 | 时长 | 说明 |
|------|------|------|
| `fadeInUp` | 0.5s ease-out | 淡入 + 上移 12px，用于页面元素入场 |
| `shimmer` | 2s infinite | 扫描光条扫过卡片表面，用于加载态或特殊强调 |
| `exp-fill` | 0.8s ease-out | 经验条填充动画 |
| `bounce-in` | 0.5s ease-out | 弹入，用于徽章弹出 |
| `ink-reveal` | 0.6s ease-out | 墨迹显现（translateY(8px) + blur(4px) → 0），用于内容首次加载 |
| `badgeParticle` | — | 徽章点击粒子扩散（多个方向） |

### 原则
- 所有入场动画不超过 0.8 秒
- 过渡统一用 200ms — 不更快也不更慢
- 没有动画应该循环播放（shimmer 除外）
- 如果用户开启了 `prefers-reduced-motion`，跳过所有动画

## Do's and Don'ts

### Do

- ✅ 所有卡片统一 `backdrop-blur-xl rounded-2xl` + `bg-white/[0.03]` + `border border-white/[0.06]`
- ✅ 用 `rgba(255,255,255, x)` 透明度建立深度——不靠 box-shadow
- ✅ Cyan 只用作交互强调色（按钮、链接、聚焦、光晕），绝不用作背景
- ✅ 导航模块使用各自的语义色——角色面板 cyan、活动 violet、成就 amber 等
- ✅ Orbitron 字体仅用于页面主标题（24px, tracking 0.2em）
- ✅ Mono 字体仅用于数据/代码/系统标签
- ✅ 中文使用 Noto Sans SC，所有字体栈末尾加它作为 fallback
- ✅ 亮色模式通过 CSS 变量 + `[data-theme="light"]` 覆盖实现，组件代码不改动
- ✅ 光晕大小与交互权重成正比（主按钮 20px > 普通 hover 12px）

### Don't

- ❌ 不要用纯黑 `#000000` 做背景——用 `#030308`（带蓝调的暗色）
- ❌ 不要给卡片加 box-shadow（Modal 除外）
- ❌ 不要用 cyan 做 section 背景或大面积底色
- ❌ 不要让 cyan 和 violet 在同一元素上争夺注意力
- ❌ 不要用 Orbitron 在卡片标题、按钮或正文
- ❌ 不要用 Share Tech Mono 在正文或按钮
- ❌ 不要在 `[data-theme="light"]` 下硬编码颜色——始终通过 CSS 变量或 Tailwind class（会被自动覆盖）
- ❌ 不要引入新的品牌色——现有 cyan + 9 语义色已覆盖所有场景
- ❌ 不要用 `rounded-full` 做卡片圆角——那是头像和 toggle 的专属形状

## Responsive Behavior

### 断点

| 名称 | 宽度 | 变化 |
|------|------|------|
| Desktop | ≥1280px | 侧边栏 224px + 主内容区 |
| Tablet | 768–1279px | 同 Desktop 布局，间距缩小 |
| Mobile | <768px | 侧边栏隐藏，底部 TabBar 导航，单列卡片 |

### 视图模式切换

应用支持 `desktop` / `mobile` 两种视图模式（ViewModeContext），独立于屏幕尺寸断点：
- Desktop 模式：侧边栏 + 主内容区
- Mobile 模式：全宽内容 + 底部 TabBar，模拟手机界面（380px 框架 mockup）

### 触控目标

- 按钮最小高度 ≥36px
- 输入框最小高度 ≥40px
- 底部 TabBar 图标区域 ≥44px

## Agent Prompt Guide

### 快速配色速查

```
画布:    #030308 (极深冷黑)
侧边栏:  #010106 (近纯黑)
卡片:    rgba(255,255,255,0.03) + backdrop-blur(20px)
边框:    rgba(255,255,255,0.06)
边框亮:  rgba(0,229,255,0.35)
品牌青:  #00e5ff (唯一主色)
文字:    #e2e8f0 / #94a3b8 / #64748b (三级)
```

### 生图 Prompt 模板

> "设计一个暗色水晶科技风格的 RPG 游戏化仪表盘。画布使用极深冷调黑 #030308，所有卡片使用毛玻璃效果（backdrop-blur + 半透明白色表面）。青色 #00e5ff 是唯一强调色，仅用于按钮、链接和聚焦光晕。字体使用 Space Grotesk（正文）+ Orbitron（标题，24px，0.2em 间距）+ Share Tech Mono（数据）。16px 圆角卡片，渐变背景区分功能模块。无传统阴影，用光晕替代。整体氛围：冷静、精确、未来感，像一个 RPG 角色的 HUD 状态面板。"

### AI 写代码时的约束速查

写新组件时，用这个 checklist：
1. 容器：`backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5`
2. 按钮主色：`bg-cyan-400/10 border border-cyan-400/20 text-cyan-400`
3. 文字：`text-white/90`（主）、`text-slate-400`（次）、`text-slate-600`（弱）
4. 标题字体：`font-['Orbitron'] tracking-[0.2em]`（仅页面级标题）
5. 数据/标签字体：`font-mono`（Share Tech Mono）
6. 输入框：`bg-white/[0.04] border-white/[0.06] rounded-lg focus:border-cyan-400/40 focus:shadow-[0_0_0_3px_rgba(0,229,255,0.08)]`
7. 图标：`lucide-react`，`size={16}` 或 `size={18}`
8. 过渡：`transition-all duration-200`
9. 不考虑亮色模式——CSS 变量会自动处理

### 迭代指南

1. 新建组件时先决定它属于哪个模块 → 确定语义色
2. 卡片容器复制标准公式，再根据需要调 bg 透明度
3. 交互状态按层级递进：default(0.03) → hover(0.06) → active(0.08)
4. 写完后在亮色模式下检查一遍——如果颜色没自动切换，说明用了硬编码值
