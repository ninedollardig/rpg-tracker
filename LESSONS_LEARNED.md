# RPG Tracker 踩坑全集

> 按问题类型分类，每条包含：问题现象 → 根因 → 正确做法 → 预防检查项

---

## 一、库/框架 API 兼容性

### 1. Recharts `animationEasing` 无效值导致白屏

**问题：** BrainRadar 集成到 Dashboard 后整个页面白屏，无报错。
**根因：** `animationEasing="easeInOutCubic"` 不是有效的 CSS transition-timing-function。Recharts 直接把这个字符串塞给 CSS，浏览器不认就炸。
**正确：** 只用 CSS 规范中存在的 easing 值：`"ease"`, `"ease-in"`, `"ease-out"`, `"ease-in-out"`, `"linear"`。
**预防：** 任何库的 props 如果接收 CSS 值，先确认该值是否在 CSS 规范中存在。不存在的 easing 名在浏览器 devtools 的 Computed 面板里会显示为 invalid。

### 2. Recharts `outerRadius` 不接受百分比字符串

**问题：** `outerRadius="72%"` 导致 PolarGrid 渲染异常。
**根因：** Recharts 某些版本的 `outerRadius` 只接受数字（px），不接受百分比字符串。
**正确：** 用数字像素值：`outerRadius={200}`，或动态计算 `Math.min(width, height) * 0.72`。
**预防：** 用百分比做 SVG 尺寸相关配置前，先查库文档确认类型。Recharts 中 radar/pie 的 radius 系列 props 在多数版本中只认数字。

### 3. Tailwind `animate-spin` 不能写成 inline style

**问题：** 加载图标不转。
**根因：** 写成了 `style={{ animation: 'spin 1s linear infinite' }}`，但 `@keyframes spin` 只在 Tailwind 的 `animate-spin` class 中定义，inline style 中不存在。
**正确：** 直接用 className：`className="animate-spin"`。
**预防：** Tailwind 的动画（animate-spin/ping/pulse/bounce）必须通过 class 使用，不要尝试在 inline style 中复刻。

---

## 二、React 状态管理

### 4. setTimeout + 闭包导致状态不一致

**问题：** 庶务外包问卷提交后，后端收到的答案和用户最后选择的不一致。
**根因：** `handleRadio` 在 `setTimeout` 回调中读取 state，但闭包捕获的是旧值。React 的 state 更新是异步的，setTimeout 回调中的 state 不会是最新的。
**正确：** 不用 setTimeout 延迟读取 state。用 `useEffect` 监听 state 变化后执行副作用，或用 `useRef` 保存最新值。
**预防：** 任何 `setTimeout`/`setInterval` 中读取 React state 都要警惕闭包陷阱。如果必须延迟读取，用 `useRef`。

### 5. 表单提交后不清空——组件 key 强制重挂载

**问题：** OutsourcePage 的 TaskInput 在提交成功后输入内容不消失。
**根因：** React 组件实例不变，内部 state 自然保留。
**正确：** 传入 `key={formKey}` prop，提交成功后 `setFormKey(k => k + 1)` 强制 React 销毁旧实例、创建新实例。
**预防：** 复杂表单在提交后需要完全重置时，`key` 比手动清 state 更可靠。

---

## 三、暗色主题 / CSS

### 6. 原生 `<select>` 选项白底白字不可见

**问题：** 模型选择下拉框在暗色页面中，`<option>` 文字看不见。
**根因：** HTML 原生 `<select>` 的 `<option>` 下拉菜单由操作系统渲染，使用系统主题（通常是白底黑字）。但在暗色背景下，`<option>` 文字颜色继承父元素变成了白色 = 白底白字。
**正确：** 不用原生 `<select>`，用自定义按钮/卡片网格替代。
**预防：** 暗色主题项目中，永远不要用原生 `<select>` 和 `<option>`。iOS Safari 和 Windows 的渲染行为不一致，无法可靠地通过 CSS 修复。

### 7. `type="time"` 输入框白字白底

**问题：** 时间选择器输入的文字不可见。
**根因：** 暗色页面中文字是白色，但 `type="time"` 的输入区域由浏览器渲染，默认白底。
**正确：** 给 `<input type="time">` 加 `color-scheme: dark` CSS 属性，告诉浏览器使用暗色 UI。
**预防：** 所有浏览器原生控件（date/time/datetime-local/color picker）在暗色主题中都需要 `color-scheme: dark`。

### 8. 玻璃卡片透明度过高导致不可读

**问题：** 庶务外包结果卡片用 backdrop-blur 玻璃效果，内容难以阅读。
**根因：** 卡片背景 `rgba(255,255,255,0.02)` 几乎完全透明，底层页面的颜色和文字穿透过来，干扰阅读。
**正确：** 正文内容区域用实色暗底 `#0a0a14`，玻璃效果只用于装饰性外层容器。
**预防：** 包含大量文字/数据的卡片不要用强透明背景。`< 5%` 不透明度只能用于纯装饰。

---

## 四、跨平台 / Windows 环境

### 9. cmd.exe 不支持单引号

**已沉淀到 REUSABLE_PATTERNS.md #1。**
**场景：** Node.js `child_process.exec` 传 JSON 参数，用单引号包裹在 Windows 上炸。
**正确：** 外层双引号 + 内部 `\"` 转义。

### 10. PowerShell 脚本中文编码报错

**问题：** 创建桌面快捷方式的 PS 脚本有 ParserError。
**根因：** PowerShell 5.1 默认用系统编码（GBK），脚本中的中文字符导致解析错误。
**正确：** PS 脚本中只用 ASCII 字符，中文描述用英文替代。或在脚本最顶部加 BOM 标记。用 `[Environment]::GetFolderPath("Desktop")` 代替中文路径名。
**预防：** Windows PowerShell 5.1 不是 PowerShell 7，编码处理完全不同。避免在 PS1 脚本中写非 ASCII 字符。

### 11. 进程残留导致端口冲突

**问题：** 修改后端代码后重启，报端口 3001 被占用。
**根因：** 之前的 `node server.js` 进程没有被杀死，一直占用端口。
**正确：** `taskkill /F /IM node.exe` 杀死所有 Node 进程后再启动。或在 start.bat 中加端口检测。
**预防：** Windows 上 Node 进程不会随终端关闭自动结束。每次重启前确认端口释放。

### 12. Vite 项目端口冲突

**问题：** rpg-tracker 和 murmur-nights 都用 5173，后启动的报端口占用。
**根因：** Vite 默认端口 5173，两个项目没有配置独立端口。
**正确：** 在 `vite.config.js` 中显式设置不同端口。rpg-tracker 用 5174。
**预防：** 新建 Vite 项目时检查 `projects/` 下已有项目的端口配置。videcoading 的 CLAUDE.md 维护了端口占用表。

---

## 五、AI 集成

### 13. AI 返回的长标题直接用了

**问题：** 庶务外包结果步骤的标题和描述是复制粘贴关系，没有概括。
**根因：** DeepSeek 返回的 step title 就是完整的描述句子，前端直接展示。
**正确：** 后端加 `makeShortTitle()` 解析器：取第一个分隔符（，、。等）之前的部分，截断到 ≤10 字符，剩余内容放到 description 字段。
**预防：** AI 输出到 UI 的文本需要后处理层。不要让 AI 的原始输出直接展示给用户。

---

## 六、桌面集成

### 14. 快捷方式弹出命令行窗口

**问题：** 双击桌面的 `数值进化系统` 快捷方式，会先弹出一个黑底 PowerShell 窗口。
**根因：** 快捷方式直接指向 `.bat` 文件，Windows 执行 bat 时默认显示控制台窗口。
**正确：** 创建 VBS 静默启动器（`start-silent.vbs`），用 `WScript.Shell.Run` 的 `0` 参数隐藏窗口。快捷方式指向 VBS 文件。
**预防：** Windows 上任何 bat/cmd 快捷方式都会弹窗。需要静默启动就用 VBS 包装。

### 15. 重复点击快捷方式启动多个服务器

**问题：** 多次点击快捷方式会启动多个 Node/Vite 实例，端口冲突。
**根因：** 没有检查服务是否已在运行。
**正确：** 在 start.bat 中用 `netstat -ano | findstr :3001` 和 `findstr :5174` 检测端口，已监听则跳过启动直接打开浏览器。
**预防：** 任何启动脚本都应该支持幂等——多次执行不会创建重复实例。

---

## 七、项目流程 / 沟通

### 16. 跳过 UI 确认导致反复返工

**问题：** Dashboard 布局、Heatmap 比例、页面元素位置多次调整才满意。
**根因：** CLAUDE.md 明确规定"UI 先行确认"——改 UI 前先用 ASCII 图画出呈现效果，确认后再写代码。这条规则被忽略了。
**正确：** 涉及布局、比例、位置的调整，先用 ASCII 图描述方案，用户确认后再写代码。
**预防：** 每次改 UI 前自问：用户看到的是什么？比例对吗？如果答案是"我觉得可以"而不是"用户确认过"，就先确认。

### 17. 文件行数超过 300 行

**问题：** TaskInput.jsx 膨胀到 300+ 行。
**根因：** 不断增加新功能而没有检查行数。
**正确：** 把 STEPS 配置抽到 `taskSteps.js`，Loading 组件抽到 `TaskInputLoading.jsx`。
**预防：** 每次改完文件检查行数。超过 250 行就要开始考虑拆分了。

### 18. 改了代码没有验证

**问题：** 多次出现"代码写了但没 build，不知道能不能跑"的情况。
**根因：** CLAUDE.md 要求"改完主动跑验证"，但执行不严格。
**正确：** 每次改完代码后立即 `npx vite build` 确认编译通过。后端改动后 `curl` 验证 API。
**预防：** 把验证作为"改完"的一部分，不是可选的附加步骤。

---

## 八、JSX 语法

### 19. JSX 注释中的花括号嵌套

**问题：** `{        {/* Week labels */}` 导致编译报错 `Expected "}" but found "className"`。
**根因：** JSX 中注释用 `{/* ... */}` 写在 JSX 子元素位置即可，不需要外层再包一个 `{}`。双重大括号被解析为嵌套表达式。
**正确：** JSX 中写注释直接 `{/* 注释内容 */}`，不要在外面再套 `{}`。
**预防：** JSX 中 `{` 开头的就是 JavaScript 表达式。`{/* */}` 本身就是一个表达式（值为 undefined），不需要再包一层。

---

## 快速检查清单

每次改代码前/后过一遍：

- [ ] 用的库 props 值是否在有效范围内？（特别是 CSS 值和百分比字符串）
- [ ] 暗色 UI 组件是否可见？（原生控件、自定义组件对比度）
- [ ] 状态更新后是否会被异步操作读到旧值？（setTimeout/setInterval 闭包）
- [ ] 表单提交后是否需要清空？key 还是手动 reset？
- [ ] 改 UI 布局前是否已让用户确认方案？
- [ ] 文件行数是否接近 300？
- [ ] 改完后是否 build 验证了？
- [ ] CHANGELOG 是否更新了？
