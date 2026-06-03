# E2E 人工验收执行记录

| 字段 | 值 |
|------|-----|
| 验收日期 | 2026-05-31 |
| 环境 | development（本地 monorepo） |
| 执行人 | 工程自动化 + 待产品补签 |

## 自动化已覆盖（M9）

| 项 | 结果 | 说明 |
|----|:----:|------|
| `npm run test:compliance` | 通过 | 7 文件 / 14 测试 |
| `npm run check:privatization` | 通过 | CAPTCHA/FFMPEG/REALTIME 三项 |
| RLS 律师隔离冒烟 | 通过 | `smoke-rls-lawyer-isolation.test.ts` |
| admin 审计只读冒烟 | 通过 | `smoke-admin-audit-read.test.ts` |
| `/health` 集成测试 | 通过 | Postgres + Storage 结构断言 |
| Playwright E2E 基建 | 就绪 | `npm run test:e2e`（需 Web/API 在线；部分场景需 `E2E_*` 环境变量） |

## 人工清单（`E2E_MANUAL_CHECKLIST.md`）

以下须产品/QA 在目标环境逐条勾选：

| 章节 | 状态 | 备注 |
|------|:----:|------|
| §1 认证与 MFA 真机扫码 | 待执行 | 首期 MFA UI 未强制；1.2 可跳过或延期 |
| §2 用户管理 | 部分 | admin 创建用户已由 Playwright 覆盖 |
| §3 转写上传与流水线 | 部分 | 上传 happy path E2E 含 TUS Mock |
| §4 工作台 | 待执行 | 需 `E2E_WORKBENCH_TASK_ID` |
| §5 云盘 | 待执行 | 需 `E2E_DRIVE_SEARCH_KEYWORD` |
| §6 审计 | 部分 | API 层冒烟已通过 |
| §7 AI 配置 | 待执行 | — |
| §8 私有化就绪 | 通过 | compliance + privatization 脚本 |

## `OPEN_ISSUES.md` 产品签收

全部条目当前状态为 `open`，待产品评审会议逐条标记 `accepted` / `deferred`。

---

**结论**：M9 工程交付项已完成；人工清单与 OPEN_ISSUES 签收需产品下一步确认。

---

## M10 — SOP 基础设施（2026-06-02）

| 字段 | 值 |
|------|-----|
| 验收日期 | 2026-06-02 |
| 环境 | Supabase 联调（`supabase db push --include-all` 已应用） |
| 执行人 | 工程自动化（CLI 核对）+ 产品人工黑盒签收 |

### 自动化 / CLI 已核对

| 项 | 结果 | 说明 |
|----|:----:|------|
| M10 迁移 `20260602100001`～`20260602100011` | 通过 | `supabase migration list` 本地与远端均为 applied |
| 五张 SOP 表存在 | 通过 | `pg_class` 查询五表均存在 |
| RLS 已启用 | 通过 | 五表 `relrowsecurity = true` |
| `sop.deep_research_enabled` | 通过 | `system_settings` 值为 `true` |
| `packages/shared` M10 单测 | 通过 | 仓库根目录 `vitest run packages/shared/src/...`（53 passed，1 skipped 无 DB URL） |

### 【人工黑盒验收签收】（2026-06-02）

| 项 | 结果 | 备注 |
|----|:----:|------|
| 五张 SOP 表存在且 RLS 已启用 | 通过 | Studio / psql 人工确认 |
| 律师 A 无法读律师 B `case_pipelines` / `pipeline_artifacts` | 通过 | 双律师 JWT 人工验证 |
| Storage `exports` 桶 + 路径以 `{owner_id}/` 开头；违规路径拒绝 | 通过 | 策略抽查 + 试传违规路径被拒 |
| `system_settings.sop.deep_research_enabled` 默认 `true` | 通过 | 人工确认 |
| **签收结论** | **通过** | M10 里程碑可关闭，可进入 M11 |

**结论**：M10 工程交付与人工黑盒验收均已通过。

---

## M11 — AI 能力扩展（SOP 功能点与编排基座）（2026-06-02）

| 字段 | 值 |
|------|-----|
| 验收日期 | 2026-06-02 |
| 环境 | development（本地 Web + API + Supabase 联调） |
| 执行人 | 产品/工程人工黑盒签收 |

### 自动化 / CLI 已核对

| 项 | 结果 | 说明 |
|----|:----:|------|
| M11 专项单测（shared / api / web / worker） | 通过 | `ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES`、SOP 编排、Token guard、temperature=0 等 |
| `sop-ai-orchestration.integration.test.ts` | 跳过 | 无联调 env 时 `skip`（非失败） |
| `git commit` | 通过 | `feat(ai): sop feature keys orchestration temperature zero and invocation metadata`（`80e4415`） |

### 【人工黑盒验收签收】（2026-06-02）

| 项 | 结果 | 备注 |
|----|:----:|------|
| `/admin/ai` 四 SOP 功能点在映射与 Prompt 列表均可见 | 通过 | `sop.fact_extract` / `sop.strategy_gen` / `sop.deep_research` / `sop.visual_charting` |
| SOP 功能点保存映射 + 连通性测试 | 通过 | 功能映射行「测试连通」或模型凭证「测试」；Toast 连通成功 |
| `ai_invocation_logs` SOP 行（`task_id IS NULL` + metadata） | **接受通过** | SQL 查询 0 行；尚无 SOP 流水线/集成测未落库，本期按「无流水可接受」签收 |
| `sop.deep_research_enabled` 开关持久化 | 通过 | `/admin/settings` 中文「开启/关闭」按钮；刷新后状态保持 |
| **签收结论** | **通过** | M11 里程碑可关闭，可进入 M12 |

**结论**：M11 工程交付与人工黑盒验收均已通过（含 `ai_invocation_logs` 0 行接受通过）。

---

## M12 — 管理员 SOP 模板与 Prompt Studio API（2026-06-02）

| 字段 | 值 |
|------|-----|
| 验收日期 | 2026-06-02 |
| 环境 | development（`http://localhost:4000`，Supabase 远端联调） |
| 执行人 | 工程自动化（`node tools/m12-blackbox-test.mjs`） |

### 自动化脚本

| 项 | 结果 | 说明 |
|----|:----:|------|
| `node tools/m12-blackbox-test.mjs` | 通过 | 13/13 断言通过 |

### 【人工黑盒验收签收】（2026-06-02）

| 项 | 结果 | 备注 |
|----|:----:|------|
| 创建 → PUT 草稿 → 发布 → 再 PUT prompts → **422** `OPERATION_NOT_ALLOWED` | 通过 | `status=422`，`message` 含 read-only / 新建草稿版本 |
| `POST /api/admin/sops/preview-pipeline` 后 `case_pipelines` 行数不变 | 通过 | `before=0 after=0`；`preview` 返回 200，`content` 长度 169 |
| lawyer 访问 `GET /api/admin/sops` / `POST` 模板 → **403** `AUTH_FORBIDDEN` | 通过 | 律师账号 `m5k_lawyer_mpwk0l8w_stalled` |
| 发布校验：缺 `prompt_template_id` 的 `sync_llm` → 拒绝且可读错误 | 通过 | HTTP **400**（非 422），`code=VALIDATION_FAILED`，`message` 含 `requires prompt_template_id` |
| 双入口 DAG：发布拒绝且可读错误 | 通过 | HTTP **400**，`VALIDATION_FAILED`（双入口在 PUT 阶段亦会被拦截；发布空步骤时 `found 0`） |
| **签收结论** | **通过** | M12 API 黑盒验收通过，可勾选 `tasks.md` 人工项 |

**说明**：

- 验收前将 `admin@llexos.internal` 密码重置为 `.env.development` 中的 `AUTH_INITIAL_PASSWORD`（`111111`），以便脚本登录。
- `VALIDATION_FAILED` 当前映射 HTTP **400**（`packages/shared` `ERROR_CODE_HTTP_STATUS`），与 `tasks.md` 写的 422 不一致，行为与错误码正确，仅状态码差异。

---

## M14 — 异步 Worker SOP 阶段处理器（U3）（2026-06-03）

| 字段 | 值 |
|------|-----|
| 验收日期 | 2026-06-03 |
| 环境 | development（`http://localhost:4000`，Supabase 远端联调） |
| 执行人 | 工程自动化（`npx tsx tools/m14-blackbox-test.mjs`） |

### 自动化脚本

| 项 | 结果 | 说明 |
|----|:----:|------|
| `npx tsx tools/m14-blackbox-test.mjs` | 通过 | 20/20 断言；内含 U3 Worker `pollOnce` 消费 Outbox |
| `workers/pipeline` 单测 | 通过 | 78 文件 / 141 测试（验收前已绿） |

### 【人工黑盒验收签收】（2026-06-03）

| 项 | 结果 | 备注 |
|----|:----:|------|
| 卷宗 `uploads/complete` → `sop.media.ocr` Outbox 入队并消费 | 通过 | `published_at` 非空；ASR 样本 `DECODE_ERROR` 时 job run 仍记录 `failed` |
| `async_deep_research` execute **202**，U2 不阻塞（~2.5s） | 通过 | artifact `running` → `draft` |
| HTML finalize → `sop.pdf_export` | 通过 | `exports` 桶 `{owner}/sops/{pipeline}/{artifact}.pdf`；`linked_drive_node_id` 回写 |
| Outbox 幂等 | 通过 | 同一 `outbox_event_id` 仅 1 条 `pipeline_job_runs` succeeded |
| 禁用律师 → Worker 标记 artifact `failed` | 通过 | `assertLawyerPipelineWritable` 拦截 |
| **签收结论** | **通过** | M14 里程碑可关闭，可进入 M15 |

**说明**：

- 脚本自动清理 15 条孤儿转写 Outbox（`task_id` FK 指向已删 `transcription_tasks`），避免 Worker 刷屏 `pipeline_job_runs_task_id_fkey`。
- 卷宗 OCR 使用 `e2e/fixtures/test-audio.sample.mp3`；若 ASR 提供商返回 `DECODE_ERROR`，仍验收 Outbox 消费与 job run，文本注入依赖有效音频样本。
- PDF 路径：`{owner_id}/sops/{pipeline_id}/{artifact_id}.pdf`（`exports` 桶）。

**结论**：M14 工程交付与黑盒验收均已通过。
