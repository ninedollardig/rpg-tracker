# RPG Tracker 项目规范

## 铁律
1. **需求文档同步**：所有功能改动必须同步更新 REQUIREMENTS.md，不另通知
2. **UI 先行确认**：改 UI 前先用 ASCII 图画出呈现效果，我确认后再写代码
3. **问清楚再动手**：不确定呈现效果时，先问我，不要猜

## 技术约定
- 后端 Express 端口 3001，前端 Vite 端口 5174（proxy /api → 3001）
- 数据库 SQLite，文件在 backend/data/rpg-tracker.db，通过 sql.js 操作
- 禁止直接删 .db 文件——用 API 操作数据
- 所有密钥、Token、密码必须放 `.env` 文件，严禁硬编码在源码中
- `.gitignore` 必须包含 `.env`、`*.secret`、`*.pem`

## 验证
- 改完代码后确认前端编译通过，后端 API 正常响应
- 常见验证命令：curl http://localhost:3001/api/weekly-tasks

## 飞书集成（lark-cli）
- 通过 child_process.exec 调用 lark-cli，fire-and-forget 模式，配置存 JSON 文件
- activities 表有 `feishu_record_id TEXT` 列跟踪映射
- 详细模式见全局 [REUSABLE_PATTERNS.md](../../../REUSABLE_PATTERNS.md)

## 代码规范
- 每个文件不超过 300 行，超出则拆分模块
- 组件职责单一，可复用 UI 抽成独立组件

## sql.js 安全铁律（2026-06-20 事故后建立）
- **saveDb() 是唯一持久化点**——视为事务提交，之前不能有任何裸调用可能抛异常
- **所有非核心衍生逻辑必须 try-catch 包裹**：成就检测、称号检测、通知触发、任务奖励
- **条件检测函数不抛异常**——返回空数组/空对象，不 throw
- **验证**：改完路由代码后，确认 saveDb() 在所有分支都会被调用

## 数据操作纪律
- 修数据前先 `SELECT id, username FROM users` 确认目标账号
- 修数据前先查该用户的 `COUNT(*)` 确认数据量符合预期
- 修复后用该用户的 token 调 API 验证
- 绝不假设"数据应该在哪个账号"——先查再动手

## 错误自动归档（HOOK）
每遇到一个需要调试才能解决的错误，修复完成后立即：
1. 在 `CHANGELOG.md` 追加记录（日期 + 问题 + 根因 + 修复）
2. 同步到 `D:\AItools-Wang\.claude\projects\videcoading\lessons-from-rpg.md`
3. 如果是跨项目通用模式（≥2 个项目可能遇到），同步到 `D:\AItools-Wang\.claude\REUSABLE_PATTERNS.md`

触发条件：同一问题调试 ≥3 次才定位 / 修复涉及 ≥2 文件 / 数据丢失或归属错误 / 代码架构缺陷导致
执行时机：修复完成、验证通过后，同一对话轮次内完成归档
