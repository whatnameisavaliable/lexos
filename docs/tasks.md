# LexOS 开发里程碑（Milestones）

| 字段 | 内容 |
|------|------|
| 文档版本 | **2.0**（SOP 落地里程碑 · 2026-06-02） |
| 粒度 | **仅模块级大纲**；原子任务在各 Milestone **启动时**再拆解 |
| 全局基准 | `docs/CONTEXT_SUMMARY.md` v2.0 · `prd.md` v0.8.1 · `architecture.md` v1.5 · `database.md` v1.6.1 · `ui_design.md` v1.1 |
| 执行约束 | 根目录 `.cursorrules`（读摘要 → 子模块规范 → 测试 → `git commit` 后方可下一子任务） |

---

## 使用说明

1. 开发任意代码前**必须**先读 `docs/CONTEXT_SUMMARY.md`，再读当前 Milestone 对应的 `architecture.md` / `database.md` / `ui_design.md` / `prd.md` 章节。
2. 按 Milestone **序号升序**推进；当前 Milestone 验收通过并完成约定 `git commit` 后，方可启动下一 Milestone。
3. 本文**不包含**原子 checkbox；拆解结果写入各 Milestone 启动时的子任务段落（或独立 `docs/tasks/m{N}.md`，由实施时决定）。

---

## Part A — 基座能力（M0–M9）【已完成】

以下里程碑已于 **2026-05-31** 封版验收（细节见 git 历史 `feat/*` / `chore(release)/*` 提交）。**禁止**在未获明确指令时重复实现基座功能。

| ID | 模块 | 交付物摘要 | 状态 |
|----|------|------------|------|
| **M0** | 基础设施与数据库迁移 | Supabase CLI、monorepo 骨架、核心表/RLS/Storage、`seed` 内置 admin | 已完成 |
| **M1** | 认证、会话与个人中心 | 虚拟邮箱登录、改密门禁、profile、Web Guard | 已完成 |
| **M2** | 管理员 — 用户管理 | `/api/admin/users/*`、管理端用户 CRUD/禁用/重置密码 | 已完成 |
| **M3** | 管理员 — AI 基础设施 | 模型凭证、功能映射、Prompt、连通性测试 | 已完成 |
| **M4** | 语音转写 — BFF 上传 | TUS init/complete、任务列表、Outbox 首行写入 | 已完成 |
| **M5** | 异步流水线 Worker（U3） | Postgres Outbox 五阶段、FFmpeg/ASR/LLM、Stalled Cron | 已完成 |
| **M6** | 律师端 — 转写工作台 | 校对/编辑双模式、If-Match、导出、签名下载 | 已完成 |
| **M7** | 个人云盘与全文检索 | `drive_nodes` CRUD、`pg_trgm` 检索、签名下载 | 已完成 |
| **M8** | 审计日志与系统配置 | `/api/admin/audit/*`、`/api/admin/settings/*`、AuditWriter | 已完成 |
| **M9** | 集成验收与私有化就绪 | E2E 基建、compliance 脚本、`DEPLOYMENT.md`、`OPEN_ISSUES.md` | 已完成 |

**基座依赖简图**（只读参考）：

```
M0 → M1 → M2 ─┬→ M3
              ├→ M4 → M5 → M6
              └→ M7
M* → M9
```

---

## Part B — SOP 数字流水线（待开发）

**业务边界**（摘自 `CONTEXT_SUMMARY.md` §6–§7）：模板版本快照、案件流水线、产出物乐观锁与定稿血缘、四类 `sync_llm` / `async_deep_research` / `manual` 步骤、U3 阶段 `sop.media.ocr` / `sop.deep_research` / `sop.pdf_export`、`exports` 桶 PDF、显式 `close` 结案。SOP 需求项 `PRD-SOP-01～49` 已签收。

**仓库现状**：`supabase/migrations` 中**尚无** SOP 相关迁移；应用代码**尚无** `/api/sops/*` 与 U3 `sop.*` Handler。

**前置条件**：Part A（M0–M9）已交付；M3 AI 配置表可扩展 SOP 功能点。

**人工验收**：M10–M17 各 Milestone **完成门禁**末尾均含 **【人工黑盒】** 任务，由人工在联调/预发环境执行；须在 `docs/E2E_MANUAL_RUN_LOG.md` 完成 **【人工黑盒验收签收】** 后，方可 `git commit` 并启动下一 Milestone。

---

### Milestone 10：SOP 基础设施与数据库迁移（Supabase CLI）

**目标**：SOP 专用 schema、枚举扩展、RLS、Storage `exports` 策略、`system_settings` 键、AI 功能点种子落库。

**设计基准**：`prd.md` §1.5、§2.4、§2.2（SOP 矩阵）、§3.4.1（Prompt Studio 数据依赖）；`architecture.md` §3.2.6（`sop.*` stage、`aggregate_type=case_pipeline`）；`database.md` §1.2、§3.16、§3.12、§3.16.8。

**前置依赖**：Part A **M0–M9 已完成**（`profiles`、AI 配置表、`upload_sessions`、`outbox_events`、`exports` 桶、`append_audit_log` 已存在）。

**验收门禁**：`supabase db push` 成功；`assertMigrationsManifest(M10_MIGRATIONS)` 绿；律师 JWT 无法读他人 `case_pipelines`；`git commit` 后进入 M11。

---

#### M10-A Supabase CLI 与迁移文件骨架

- [x] 执行 `npx supabase migration new enums_sop`；在生成的 `supabase/migrations/<timestamp>_enums_sop.sql` 文件顶部写入注释：基准 `database.md` §1.2、`§3.16.3–§3.16.5`
  - **依赖**：Part A M0 已完成
- [x] 为 `enums_sop.sql` 新增静态测试 `packages/shared/src/migrations/m10-enums-sop.migration.test.ts`：断言文件含 `sop_execution_type`、`pipeline_artifact_status` 及四条 `sop.` `ai_feature_key` 扩展
  - **依赖**：上一条

- [x] 执行 `npx supabase migration new audit_action_sop`；创建空迁移文件供 §M10-B2 写入
  - **依赖**：M10-A 第一条
- [x] 新增 `packages/shared/src/migrations/m10-audit-action-sop.migration.test.ts`：断言迁移文件含 `sop.template.publish`、`sop.artifact.verify`
  - **依赖**：上一条

- [x] 执行 `npx supabase migration new tables_sop_templates`；创建空迁移文件
  - **依赖**：M10-B1 `enums_sop` 文件已创建（同批次可并行，应用顺序在 B1 之后）
- [x] 新增 `packages/shared/src/migrations/m10-tables-sop-templates.migration.test.ts`：断言含 `CREATE TABLE public.sop_templates`
  - **依赖**：上一条

- [x] 执行 `npx supabase migration new tables_sop_template_versions`
  - **依赖**：`tables_sop_templates` 迁移文件已创建
- [x] 新增 `packages/shared/src/migrations/m10-tables-sop-template-versions.migration.test.ts`：断言含 `UNIQUE (template_id, version_number)`
  - **依赖**：上一条

- [x] 执行 `npx supabase migration new tables_sop_steps`
  - **依赖**：`tables_sop_template_versions` 迁移文件已创建
- [x] 新增 `packages/shared/src/migrations/m10-tables-sop-steps.migration.test.ts`：断言含 `UNIQUE (template_version_id, step_code)`、`depends_on`
  - **依赖**：上一条

- [x] 执行 `npx supabase migration new tables_case_pipelines`
  - **依赖**：`tables_sop_steps` 迁移文件已创建
- [x] 新增 `packages/shared/src/migrations/m10-tables-case-pipelines.migration.test.ts`：断言含 `case_pipeline_status`、`lawyer_id`
  - **依赖**：上一条

- [x] 执行 `npx supabase migration new tables_pipeline_artifacts`
  - **依赖**：`tables_case_pipelines` 迁移文件已创建
- [x] 新增 `packages/shared/src/migrations/m10-tables-pipeline-artifacts.migration.test.ts`：断言含 `finalized_snapshot_raw`、`UNIQUE (pipeline_id, step_code)`、`pipeline_artifacts_set_updated_at`
  - **依赖**：上一条

- [x] 执行 `npx supabase migration new upload_sessions_sop`
  - **依赖**：`tables_case_pipelines` 迁移文件已创建
- [x] 新增 `packages/shared/src/migrations/m10-upload-sessions-sop.migration.test.ts`：断言含 `pipeline_id` 或 `session_kind` 及 `task_id` 可空约束（卷宗 TUS 专用，`architecture.md` §3.2.6.8）
  - **依赖**：上一条

- [x] 执行 `npx supabase migration new rls_sop`
  - **依赖**：全部 SOP 表迁移文件已创建
- [x] 新增 `packages/shared/src/migrations/m10-rls-sop.migration.test.ts`：断言含 `sop_templates`、`case_pipelines`、`pipeline_artifacts` 的 `ENABLE ROW LEVEL SECURITY`
  - **依赖**：上一条

- [x] 执行 `npx supabase migration new storage_exports_sop_path`
  - **依赖**：Part A `storage_buckets_policies` 已应用
- [x] 新增 `packages/shared/src/migrations/m10-storage-exports-sop-path.migration.test.ts`：断言 `exports` 策略校验路径含 `sops` 段（`database.md` §3.16.8）
  - **依赖**：上一条

- [x] 执行 `npx supabase migration new seed_system_settings_sop`
  - **依赖**：Part A `tables_audit_system` 已应用
- [x] 新增 `packages/shared/src/migrations/m10-seed-system-settings-sop.migration.test.ts`：断言 `INSERT INTO public.system_settings` 且 key 为 `sop.deep_research_enabled`
  - **依赖**：上一条

---

#### M10-B SQL 迁移正文（每条迁移一个写入任务 + 一个测试任务）

- [x] 在 `enums_sop.sql` 中写入 `CREATE TYPE public.sop_execution_type AS ENUM ('sync_llm','async_deep_research','manual')`
  - **依赖**：M10-A `enums_sop` 文件已创建
- [x] 扩展 `enums_sop.sql` 测试：更新 `m10-enums-sop.migration.test.ts` 断言 `sync_llm` 三字面值均存在
  - **依赖**：上一条

- [x] 在 `enums_sop.sql` 中写入 `CREATE TYPE public.case_pipeline_status AS ENUM ('in_progress','completed','suspended')`
  - **依赖**：M10-B1 第一条
- [x] 新增断言 `case_pipeline_status` 的 `m10-enums-sop.migration.test.ts` 用例
  - **依赖**：上一条

- [x] 在 `enums_sop.sql` 中写入 `CREATE TYPE public.pipeline_artifact_status AS ENUM ('running','draft','failed','finalized')`
  - **依赖**：M10-B2 第一条
- [x] 新增断言四态 `pipeline_artifact_status` 的测试用例
  - **依赖**：上一条

- [x] 在 `enums_sop.sql` 中写入 `CREATE TYPE public.artifact_content_type AS ENUM ('markdown','html','json')`
  - **依赖**：M10-B3 第一条
- [x] 新增断言 `artifact_content_type` 的测试用例
  - **依赖**：上一条

- [x] 在 `enums_sop.sql` 中执行 `ALTER TYPE public.ai_feature_key ADD VALUE IF NOT EXISTS 'sop.fact_extract'`（其余三条 SOP 值同理，共四次）
  - **依赖**：M10-B4 第一条
- [x] 更新 `m10-enums-sop.migration.test.ts`：断言四个 `ADD VALUE` 子串均存在
  - **依赖**：上一条

- [x] 在 `audit_action_sop.sql` 中扩展 `audit_action`：`sop.template.publish`、`sop.prompt.update`、`sop.artifact.export_pdf`、`sop.artifact.verify`（`prd.md` 附录审计表）
  - **依赖**：M10-A `audit_action_sop` 文件已创建
- [x] 运行 `m10-audit-action-sop.migration.test.ts` 全绿
  - **依赖**：上一条

- [x] 在 `tables_sop_templates.sql` 中写入 `CREATE TABLE public.sop_templates`（`id`,`name`,`case_type`,`created_by`,`created_at` + FK/index）
  - **依赖**：`enums_sop` 迁移**已写入磁盘**（本地 `migration up` 前可仅依赖文件顺序）
- [x] 更新 `m10-tables-sop-templates.migration.test.ts` 断言 `case_type VARCHAR`
  - **依赖**：上一条

- [x] 在 `tables_sop_template_versions.sql` 中写入 `CREATE TABLE public.sop_template_versions` 及 `UNIQUE (template_id, version_number)`
  - **依赖**：`tables_sop_templates.sql` 正文已写入
- [x] 更新 `m10-tables-sop-template-versions.migration.test.ts` 断言 `is_published`
  - **依赖**：上一条

- [x] 在 `tables_sop_steps.sql` 中写入 `CREATE TABLE public.sop_steps`（含 `input_schema`、`depends_on` 默认 `'[]'`、`requires_verification` 默认 `false`）
  - **依赖**：`tables_sop_template_versions.sql` 正文已写入
- [x] 更新 `m10-tables-sop-steps.migration.test.ts` 断言 `execution_type` 列类型为 `sop_execution_type`
  - **依赖**：上一条

- [x] 在 `tables_case_pipelines.sql` 中写入 `CREATE TABLE public.case_pipelines`（`lawyer_id`、`template_version_id`、`status`、`current_step_code`）
  - **依赖**：`tables_sop_steps.sql` 正文已写入
- [x] 更新 `m10-tables-case-pipelines.migration.test.ts` 断言 FK → `sop_template_versions`
  - **依赖**：上一条

- [x] 在 `tables_pipeline_artifacts.sql` 中写入 `CREATE TABLE public.pipeline_artifacts`（含 `version` 默认 1、`finalized_snapshot_raw`）
  - **依赖**：`tables_case_pipelines.sql` 正文已写入
- [x] 在 `tables_pipeline_artifacts.sql` 中挂载 `BEFORE UPDATE` 触发器 `pipeline_artifacts_set_updated_at` → `public.set_updated_at()`
  - **依赖**：上一条
- [x] 更新 `m10-tables-pipeline-artifacts.migration.test.ts` 断言 `linked_drive_node_id` FK → `drive_nodes`
  - **依赖**：上一条

- [x] 在 `upload_sessions_sop.sql` 中新增 `pipeline_id UUID NULL REFERENCES public.case_pipelines(id)`；将 `task_id` 改为 **NULLABLE**；增加 `CHECK`（`task_id` 与 `pipeline_id` 恰有一个非空）
  - **依赖**：`tables_case_pipelines.sql` 正文已写入
- [x] 更新 `m10-upload-sessions-sop.migration.test.ts` 断言 `upload_sessions_task_or_pipeline_chk`（或等价约束名）
  - **依赖**：上一条

- [x] 在 `rls_sop.sql` 中为 `sop_templates` / `sop_template_versions` / `sop_steps` 写入 **admin CRUD** 策略（`is_admin()`）
  - **依赖**：SOP 三表迁移正文已写入
- [x] 为上述三表写入 **lawyer SELECT** 策略：仅 `is_published = true` 的版本及其步骤（`database.md` §3.16.6）
  - **依赖**：上一条
- [x] 更新 `m10-rls-sop.migration.test.ts` 断言 `sop_template_versions` 律师策略含 `is_published`
  - **依赖**：上一条

- [x] 在 `rls_sop.sql` 中为 `case_pipelines` / `pipeline_artifacts` 写入律师 **CRUD** 策略：`lawyer_id = auth.uid()`（经 `case_pipelines` 连接）
  - **依赖**：M10-B12 第三条
- [x] 更新 `m10-rls-sop.migration.test.ts` 断言 `case_pipelines` 无 `is_admin()` 读律师业务数据策略
  - **依赖**：上一条

- [x] 在 `storage_exports_sop_path.sql` 中 **替换或增补** `exports` 的 `INSERT` 策略：路径须匹配 `{uuid}/sops/{uuid}/{uuid}.pdf`（`database.md` §3.16.8；保留首段 `auth.uid()`）
  - **依赖**：Part A `storage_buckets_policies` 已应用
- [x] 运行 `m10-storage-exports-sop-path.migration.test.ts` 全绿
  - **依赖**：上一条

- [x] 在 `seed_system_settings_sop.sql` 中 `INSERT ... ON CONFLICT` 写入 `sop.deep_research_enabled` = `true`（JSONB 布尔）
  - **依赖**：`system_settings` 表已存在
- [x] 运行 `m10-seed-system-settings-sop.migration.test.ts` 全绿
  - **依赖**：上一条

- [x] 本地执行 `npx supabase db push`（或 `migration up`）应用 M10-B 全部迁移；确认无 SQL 错误
  - **依赖**：M10-B1～B16 全部 SQL 已写入
- [x] 新增 `packages/shared/src/db/m10-migrations-applied.integration.test.ts`：查询 `information_schema.tables` 断言五张 SOP 表存在（`skip` 无 `SUPABASE_DB_URL`）
  - **依赖**：上一条

---

#### M10-C `packages/shared` — SOP 枚举（每个枚举文件一对任务）

- [x] 新增 `packages/shared/src/enums/sop-execution-type.ts`：导出 `SopExecutionType` 常量对象与 `isSopExecutionType()`
  - **依赖**：无（可与迁移并行，合并前须与 DB 枚举一致）
- [x] 新增 `packages/shared/src/enums/sop-execution-type.test.ts`：覆盖三值与非法字符串
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/enums/case-pipeline-status.ts`：导出 `CasePipelineStatus` 与 `isCasePipelineStatus()`
  - **依赖**：无
- [x] 新增 `packages/shared/src/enums/case-pipeline-status.test.ts`
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/enums/pipeline-artifact-status.ts`：导出 `PipelineArtifactStatus`（`running|draft|failed|finalized`）
  - **依赖**：无
- [x] 新增 `packages/shared/src/enums/pipeline-artifact-status.test.ts`
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/enums/artifact-content-type.ts`：导出 `ArtifactContentType`
  - **依赖**：无
- [x] 新增 `packages/shared/src/enums/artifact-content-type.test.ts`
  - **依赖**：上一条

- [x] 扩展 `packages/shared/src/enums/ai-feature-key.ts`：追加 `SOP_FACT_EXTRACT` 等四个常量；扩展 `AI_FEATURE_KEY_VALUES`
  - **依赖**：无
- [x] 更新 `packages/shared/src/enums/ai-feature-key.test.ts`：断言 `isAiFeatureKey('sop.fact_extract')` 为 true
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/enums/sop-ai-feature-keys.ts`：导出 `SOP_AI_FEATURE_KEY_VALUES` 只读数组（四功能点）
  - **依赖**：`ai-feature-key.ts` 已扩展
- [x] 新增 `packages/shared/src/enums/sop-ai-feature-keys.test.ts`：长度恒为 4
  - **依赖**：上一条

---

#### M10-D `packages/shared` — 错误码、Outbox 阶段、系统设置键

- [x] 在 `packages/shared/src/api/error-code.ts` 的 `ErrorCode` 中新增 `CONTEXT_LIMIT_EXCEEDED`
  - **依赖**：无
- [x] 在 `error-code.ts` 的 `ERROR_CODE_HTTP_STATUS` 中为 `CONTEXT_LIMIT_EXCEEDED` 映射 **422**
  - **依赖**：上一条
- [x] 更新 `packages/shared/src/api/error-code.test.ts`：断言 422 映射与 `isErrorCode` 识别
  - **依赖**：上两条

- [x] 新增 `packages/shared/src/constants/sop-pipeline-stages.ts`：导出 `SOP_STAGE_MEDIA_OCR`、`SOP_STAGE_DEEP_RESEARCH`、`SOP_STAGE_PDF_EXPORT` 及 `SOP_PIPELINE_STAGES`
  - **依赖**：无
- [x] 新增 `packages/shared/src/constants/sop-pipeline-stages.test.ts`：断言 `isSopPipelineStage()` 与 `architecture.md` §3.2.6.2 三字面值一致
  - **依赖**：上一条

- [x] 扩展 `packages/shared/src/constants/pipeline-stages.ts`：导出联合类型 `PipelineStage | SopPipelineStage` 的 `ALL_WORKER_STAGES`（转写五阶段 + SOP 三阶段）
  - **依赖**：`sop-pipeline-stages.ts` 已存在
- [x] 更新 `packages/shared/src/constants/pipeline-stages.test.ts`：断言 `ALL_WORKER_STAGES` 长度为 8
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/constants/sop-system-settings-keys.ts`：导出 `SOP_DEEP_RESEARCH_ENABLED_KEY = 'sop.deep_research_enabled'`
  - **依赖**：无
- [x] 新增 `packages/shared/src/constants/sop-system-settings-keys.test.ts`
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/types/sop-outbox-payload.ts`：定义 `SopOutboxPayload`（`stage` + `pipeline_id` + `step_code` + `artifact_id` 可选字段）
  - **依赖**：`sop-pipeline-stages.ts` 已存在
- [x] 新增 `packages/shared/src/types/sop-outbox-payload.test.ts`：断言 `aggregate_type` 文档注释为 `case_pipeline`
  - **依赖**：上一条

- [x] 在 `packages/shared/src/index.ts` 中 re-export M10-C、M10-D 新增模块
  - **依赖**：M10-C、M10-D 全部源文件已存在
- [x] 新增 `packages/shared/src/index.m10-exports.test.ts`：静态 import 断言 `SOP_PIPELINE_STAGES`、`ErrorCode.CONTEXT_LIMIT_EXCEEDED` 可解析
  - **依赖**：上一条

---

#### M10-E `packages/shared` — 迁移 manifest（M10 登记）

- [x] 在 `packages/shared/src/migrations/manifest.ts` 中新增导出数组 `M10_MIGRATIONS`（含 `enums_sop`～`seed_system_settings_sop` 共 11 项 `requiredSnippets`）
  - **依赖**：M10-B 各迁移 SQL 正文已写入
- [x] 新增 `packages/shared/src/migrations/manifest.m10.test.ts`：调用 `assertMigrationsManifest(M10_MIGRATIONS)`
  - **依赖**：上一条

- [x] 在 `manifest.ts` 中新增函数 `listExpectedM10MigrationNames(): readonly string[]`
  - **依赖**：`M10_MIGRATIONS` 已定义
- [x] 为 `listExpectedM10MigrationNames` 新增单元测试：返回长度 11 且含 `rls_sop`
  - **依赖**：上一条

---

#### M10-F 环境变量模板（SOP Worker 限额）

- [x] 在 `.env.example` 中追加 `SOP_PDF_MAX_CONCURRENT=1`、`SOP_DEEP_RESEARCH_MAX_CONCURRENT=2`、`SOP_DEEP_RESEARCH_TIMEOUT_MS=1800000`（注释引用 `architecture.md` §3.2.6.3、§3.2.6.9）
  - **依赖**：无
- [x] 新增 `packages/shared/src/config/sop-worker-runtime-env.test.ts`：文档化断言三变量名存在于 `.env.example` 文本（读文件，不连网）
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/config/sop-worker-runtime-env.ts`：导出 `loadSopWorkerRuntimeEnvFromProcess()` 解析上述三变量默认值
  - **依赖**：无
- [x] 新增 `packages/shared/src/config/sop-worker-runtime-env.parse.test.ts`：缺省 env 时 PDF=1、DR=2、timeout=1800000
  - **依赖**：上一条

- [x] 在 `packages/shared/src/config/worker-runtime-env.ts` 中合并 `loadSopWorkerRuntimeEnvFromProcess()` 返回值到 `WorkerRuntimeEnvConfig`
  - **依赖**：`sop-worker-runtime-env.ts` 已存在
- [x] 更新 `packages/shared/src/config/worker-runtime-env.test.ts`：断言合并后字段存在
  - **依赖**：上一条

---

#### M10-G Seed — SOP AI 功能点映射占位

- [x] 在 `supabase/seed.sql`（或独立 `supabase/seeds/sop_ai_mappings.sql` 并由 config 引用）中编写注释块：四 SOP `feature_key` 须指向已存在 `ai_model_credentials.id` 的幂等 `INSERT` 模板
  - **依赖**：M10-B `enums_sop` 已 push；M3 至少一条模型 seed 存在【无模型则跳过 INSERT 仅保留注释】
- [x] 新增 `packages/shared/src/seed/sop-ai-mappings-seed.test.ts`：解析 seed 文件断言含四个 `sop.` feature_key 字面量
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/seed/run-sop-ai-mappings-seed-cli.ts`：CLI 在存在默认模型时对四功能点 `INSERT ... ON CONFLICT DO NOTHING`
  - **依赖**：`sop-ai-mappings-seed.test.ts` 已绿
- [x] 新增 `packages/shared/src/seed/run-sop-ai-mappings-seed-cli.test.ts`：Mock DB；断言不硬编码 API Key
  - **依赖**：上一条

---

#### M10-H RLS 集成测试基建（律师隔离）

- [x] 新增 `packages/shared/src/rls/case-pipelines-rls.ts`：导出 `fetchCasePipelineAsUser(pipelineId, accessToken)` 封装 Supabase 客户端查询
  - **依赖**：M10-B `rls_sop` 已 push
- [x] 新增 `packages/shared/src/rls/case-pipelines-rls.test.ts`：Mock 客户端；断言使用 `case_pipelines` 表名
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/rls/case-pipelines-rls.integration.test.ts`：律师 A JWT 无法 `SELECT` 律师 B 的 `case_pipelines` 行（`skip` 无联调 env）
  - **依赖**：`case-pipelines-rls.ts` 已存在；联调库已有两名律师 seed
- [x] 新增 `packages/shared/src/rls/case-pipelines-rls.integration.test.ts` 第二用例：律师无法 `SELECT` 他人 `pipeline_artifacts`（经 `pipeline_id`）
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/rls/sop-templates-rls.integration.test.ts`：律师 JWT 可 `SELECT` `is_published=true` 的 `sop_template_versions`；不可 `INSERT` `sop_templates`
  - **依赖**：M10-B `rls_sop` 已 push；联调库存在一条已发布版本 seed【测试数据可在用例 `beforeAll` 用 service_role 插入】
- [x] 为 `sop-templates-rls.integration.test.ts` 增加 admin JWT 可 `INSERT sop_templates` 断言
  - **依赖**：上一条

---

#### M10-I Milestone 10 完成门禁

- [x] 运行 `npm run test --workspace=@lexos/shared`（或仓库等价命令）覆盖 M10-C～M10-H 新增测试；连续失败 **>2** 次则停止并汇报
  - **依赖**：M10-A～M10-H 全部 checkbox 已完成
- [x] 执行 `npx supabase migration list`；人工核对 M10 的 11 个迁移均为 **applied**
  - **依赖**：`db push` 已成功

**人工黑盒验收**（由人工在联调/预发环境执行，不通过不得 `git commit`）：

- [x] **【人工黑盒】** 在 Supabase Studio 或 psql 确认五张 SOP 表（`sop_templates`、`sop_template_versions`、`sop_steps`、`case_pipelines`、`pipeline_artifacts`）存在且 RLS 已启用
  - **依赖**：`db push` 成功
- [x] **【人工黑盒】** 使用两名律师测试账号 JWT：律师 A **无法** `SELECT` 律师 B 的 `case_pipelines` / `pipeline_artifacts` 行
  - **依赖**：M10-H RLS 集成测已绿或联调 seed 两名律师
- [x] **【人工黑盒】** Storage：`exports` 桶已创建；策略要求对象路径以 `{owner_id}/` 开头（抽查一条策略文案或试传违规路径被拒绝）
  - **依赖**：M10-F Storage 迁移
- [x] **【人工黑盒】** `system_settings`（或等价配置）存在 `sop.deep_research_enabled` 且默认值为 `true`
  - **依赖**：M10-G seed
- [x] **【人工黑盒验收签收】** 在 `docs/E2E_MANUAL_RUN_LOG.md` 追加 **M10** 小节：验收人、日期、环境、上述项通过/失败备注
  - **依赖**：上列黑盒项均通过

- [x] 执行 `git commit`：`feat(db): sop schema enums rls storage seed and shared types`
  - **依赖**：测试全绿；**人工黑盒验收签收**；`git status` 无未提交 M10 变更
- [x] 将下方进度表 **M10** 状态更新为「已完成」
  - **依赖**：`git commit` 成功

**M10 明确延后（归属 M11+）**：`AiOrchestrationService` SOP 调用实现、Mustache 插槽渲染、`/api/admin/sops/*` 路由、U3 `sop.*` Handler 注册、Admin/律师 SOP 前端页面。

---

### Milestone 11：AI 能力扩展（SOP 功能点与编排基座）

**目标**：在既有 M3 AI 栈上接入 SOP 四功能点；U2/U3 共用编排逻辑；SOP LLM **强制** `temperature: 0`；Token 超限 **422** `CONTEXT_LIMIT_EXCEEDED`（禁止截断）；`ai_invocation_logs` 支持 `task_id=NULL` + `metadata.pipeline_id`/`step_code`。

**设计基准**：`prd.md` §1.4 A8、§3.3–§3.4.1、§4.2.2–§4.2.4（AI-06～08、SOP L1–L4）；`architecture.md` §3.2.6.11、§4.3.3.1、§4.2.5；`database.md` §3.10 `metadata` 约定。

**前置依赖**：**Milestone 10 已完成**（SOP 枚举、`CONTEXT_LIMIT_EXCEEDED`、`SOP_AI_FEATURE_KEY_VALUES`、`system_settings.sop.deep_research_enabled` 种子）。

**验收门禁**：Admin 在 `/admin/ai` 可为四 SOP 功能点配置映射与 Prompt；`SopAiOrchestration` 单测覆盖 fallback×1、temperature=0、Token _guard 抛 422；Worker/API 写入 `ai_invocation_logs.metadata`；`git commit` 后进入 M12。

**M11 明确不在此 Milestone**：`/api/admin/sops/*` 模板 CRUD（M12）、律师 `execute`/`finalize` 路由（M13）、U3 `sop.*` Handler（M14）、Prompt Studio 专属页面（M15）。

---

#### M11-A 数据库迁移 — `ai_invocation_logs.metadata`

- [x] 执行 `npx supabase migration new ai_invocation_logs_sop_metadata`；创建空迁移文件
  - **依赖**：M10 已完成
- [x] 新增 `packages/shared/src/migrations/m11-ai-invocation-logs-metadata.migration.test.ts`：断言迁移文件含 `metadata JSONB`
  - **依赖**：上一条

- [x] 在迁移 SQL 中 `ALTER TABLE public.ai_invocation_logs ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb`
  - **依赖**：M11-A 第一条
- [x] 更新 `m11-ai-invocation-logs-metadata.migration.test.ts`：断言 `DEFAULT '{}'::jsonb`
  - **依赖**：上一条

- [x] 在同迁移 SQL 中创建 GIN 索引 `ai_invocation_logs_metadata_gin_idx ON public.ai_invocation_logs USING gin (metadata jsonb_path_ops)`（`database.md` §3.10）
  - **依赖**：M11-A 第三条
- [x] 为 GIN 索引新增 `m11-ai-invocation-logs-metadata.migration.test.ts` 用例
  - **依赖**：上一条

- [x] 执行 `npx supabase db push` 应用 M11-A 迁移
  - **依赖**：M11-A 全部 SQL 已写入
- [x] 新增 `packages/shared/src/db/m11-ai-invocation-metadata.integration.test.ts`：`SELECT metadata` 列存在（`skip` 无 DB）
  - **依赖**：上一条

- [x] 在 `packages/shared/src/migrations/manifest.ts` 的 `M10_MIGRATIONS` 旁新增 `M11_MIGRATIONS` 数组（含 `ai_invocation_logs_sop_metadata`）
  - **依赖**：迁移文件已落盘
- [x] 新增 `packages/shared/src/migrations/manifest.m11.test.ts`：`assertMigrationsManifest(M11_MIGRATIONS)`
  - **依赖**：上一条

---

#### M11-B `packages/shared` — 可配置功能点集合（Admin AI）

- [x] 新增 `packages/shared/src/ai/is-sop-ai-feature-key.ts`：导出 `isSopAiFeatureKey(value: string): boolean`（对照 `SOP_AI_FEATURE_KEY_VALUES`）
  - **依赖**：M10 `sop-ai-feature-keys.ts` 已存在
- [x] 新增 `packages/shared/src/ai/is-sop-ai-feature-key.test.ts`：四 SOP 键为 true；`llm_transcript_polish` 为 false
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/ai/admin-configurable-feature-keys.ts`：导出 `ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES`（转写三活跃 + 四 SOP，**不含** `asr_semantic`）
  - **依赖**：`is-sop-ai-feature-key.ts` 已存在
- [x] 新增 `packages/shared/src/ai/admin-configurable-feature-keys.test.ts`：长度 7、含 `sop.deep_research`
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/ai/is-admin-configurable-feature-key.ts`：导出 `isAdminConfigurableFeatureKey()`
  - **依赖**：`admin-configurable-feature-keys.ts` 已存在
- [x] 新增 `packages/shared/src/ai/is-admin-configurable-feature-key.test.ts`
  - **依赖**：上一条

- [x] 在 `packages/shared/src/index.ts` re-export M11-B 模块
  - **依赖**：M11-B 源文件齐全
- [x] 新增 `packages/shared/src/index.m11-ai-exports.test.ts`：静态 import `ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES`
  - **依赖**：上一条

---

#### M11-C `packages/shared` — Mustache 插槽与 Prompt 上下文类型

- [x] 新增 `packages/shared/src/sop/step-code-to-mustache-token.ts`：导出 `stepCodeToMustacheArtifactPrefix(stepCode: string): string`（`artifact_{normalized}_` 规则，`prd.md` §2.4）
  - **依赖**：无
- [x] 新增 `packages/shared/src/sop/step-code-to-mustache-token.test.ts`：`01-A` → `artifact_01_A_`
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/sop/extract-mustache-slot-names.ts`：导出 `extractMustacheSlotNames(template: string): readonly string[]`
  - **依赖**：无
- [x] 新增 `packages/shared/src/sop/extract-mustache-slot-names.test.ts`：解析 `{{artifact_01_A_fact}}` 与双花括号变体
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/sop/render-mustache-template.ts`：导出 `renderMustacheTemplate(template, context: Record<string, string>): string`（**禁止** HTML 转义以外的截断）
  - **依赖**：无
- [x] 新增 `packages/shared/src/sop/render-mustache-template.test.ts`：缺键保留原占位或抛 `VALIDATION_FAILED`【与实现对齐写死一种】
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/sop/validate-mustache-slots-in-depends-on.ts`：导出 `assertMustacheSlotsCoveredByDependsOn(slots, dependsOn: string[]): void`
  - **依赖**：`extract-mustache-slot-names.ts` 已存在
- [x] 新增 `packages/shared/src/sop/validate-mustache-slots-in-depends-on.test.ts`：未列入 `depends_on` 的 `step_code` → 抛错
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/types/sop-prompt-context.ts`：定义 `SopPromptContext`（`finalizedArtifacts`、`formValues`、`sopMediaExtractedText`）
  - **依赖**：无
- [x] 新增 `packages/shared/src/types/sop-prompt-context.test.ts`：类型守卫 `isSopPromptContext` 最小字段校验
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/types/sop-ai-invocation-metadata.ts`：定义 `SopAiInvocationMetadata`（`pipeline_id`、`step_code`）
  - **依赖**：无
- [x] 新增 `packages/shared/src/types/sop-ai-invocation-metadata.test.ts`：JSON 序列化 round-trip
  - **依赖**：上一条

---

#### M11-D `packages/shared` — Token 预估与 LLM Payload（temperature 锁定）

- [x] 新增 `packages/shared/src/ai/estimate-token-count.ts`：导出 `estimateTokenCount(text: string): number`（字符启发式或 tiktoken 可选【无新依赖则用 chars/4】）
  - **依赖**：无
- [x] 新增 `packages/shared/src/ai/estimate-token-count.test.ts`：空串 0；长文本单调增
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/ai/assert-context-within-model-window.ts`：导出 `assertContextWithinModelWindow(totalTokens, contextWindow: number): void`；超限抛带 `ErrorCode.CONTEXT_LIMIT_EXCEEDED` 的 `AppError` 类或共享 `LexosError`
  - **依赖**：M10 `ErrorCode.CONTEXT_LIMIT_EXCEEDED` 已存在
- [x] 新增 `packages/shared/src/ai/assert-context-within-model-window.test.ts`：超窗抛 `CONTEXT_LIMIT_EXCEEDED`；等于窗不抛
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/ai/build-openai-chat-completion-body.ts`：导出 `buildOpenAiChatCompletionBody(messages, options)` 纯对象构建
  - **依赖**：无
- [x] 新增 `packages/shared/src/ai/build-openai-chat-completion-body.test.ts`：默认不含 `temperature` 字段
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/ai/apply-sop-llm-temperature.ts`：导出 `applySopLlmTemperature(body, featureKey): typeof body`（SOP 功能点强制 `temperature: 0`，`prd.md` §1.4 A8）
  - **依赖**：`is-sop-ai-feature-key.ts` 已存在
- [x] 新增 `packages/shared/src/ai/apply-sop-llm-temperature.test.ts`：`sop.fact_extract` → `temperature===0`；`llm_transcript_polish` 不修改
  - **依赖**：上一条

---

#### M11-E `apps/api` — SOP Prompt 组装（U2 前置，无 HTTP 路由）

- [x] 新增 `apps/api/src/domain/sop/build-mustache-context-from-artifacts.ts`：导出 `buildMustacheContextFromArtifacts(artifacts: readonly { stepCode; contentRaw }[]): Record<string, string>`
  - **依赖**：M11-C `step-code-to-mustache-token.ts`
- [x] 新增 `apps/api/src/domain/sop/build-mustache-context-from-artifacts.test.ts`：仅 `finalized` 行进入 context【入参已过滤】
  - **依赖**：上一条

- [x] 新增 `apps/api/src/services/sop-prompt-assembler.service.ts`：导出 `assembleUserPrompt(systemTemplate, context: SopPromptContext): string`（合并表单 + `{{sop_media_extracted_text}}` + Mustache）
  - **依赖**：M11-C `render-mustache-template.ts`、`SopPromptContext`
- [x] 新增 `apps/api/src/services/sop-prompt-assembler.service.test.ts`：注入 `sop_media_extracted_text` 占位符被替换
  - **依赖**：上一条

- [x] 新增 `apps/api/src/services/sop-token-limit-guard.service.ts`：导出 `assertSopPromptWithinModelWindow(assembledPrompt, systemPrompt, contextWindow): void`（调用 shared `estimateTokenCount` + `assertContextWithinModelWindow`）
  - **依赖**：M11-D Token 工具已存在
- [x] 新增 `apps/api/src/services/sop-token-limit-guard.service.test.ts`：超窗 → `AppHttpError`/`CONTEXT_LIMIT_EXCEEDED` 422
  - **依赖**：上一条

---

#### M11-F `apps/api` — AI 编排（U2 · `SopAiOrchestrationService`）

- [x] 新增 `apps/api/src/repositories/ai-invocation-log.repository.ts`：导出 `insertInvocationLog(input)` 支持 `taskId: null` 与 `metadata: SopAiInvocationMetadata`
  - **依赖**：M11-A `metadata` 列已 push
- [x] 新增 `apps/api/src/repositories/ai-invocation-log.repository.test.ts`：Mock SQL；断言 `task_id` 绑定为 `null` 时传 `NULL`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/repositories/sop-ai-config.repository.ts`：导出 `resolveModelsForFeature(featureKey)`、`findPublishedPrompt(featureKey)`（复用 M3 表结构；**禁止**日志输出 `apiKey`）
  - **依赖**：M3 `ai-model.repository` 模式已存在
- [x] 新增 `apps/api/src/repositories/sop-ai-config.repository.test.ts`：Mock Supabase；映射缺失抛 `AI mapping not found`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/adapters/ai/llm-completion-http.adapter.ts`：导出 `postChatCompletion(credentials, body)`（Fetch；body 经 `applySopLlmTemperature`）
  - **依赖**：M11-D `apply-sop-llm-temperature.ts`
- [x] 新增 `apps/api/src/adapters/ai/llm-completion-http.adapter.test.ts`：Mock `fetch`；断言 SOP 请求 JSON 含 `"temperature":0`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/services/sop-ai-orchestration.service.ts`：导出 `invokeSopLlm(input)`（主模型 → fallback **1 次**；写 `ai_invocation_logs`；`idempotency_key` 由 `sha256(pipeline_id:step_code:attempt)` 生成）
  - **依赖**：M11-E `sop-token-limit-guard`、`sop-prompt-assembler`；M11-F repository + adapter
- [x] 新增 `apps/api/src/services/sop-ai-orchestration.service.test.ts`：主失败兜底成功 → `is_fallback=true`；映射缺失 → 抛错
  - **依赖**：上一条

- [x] 在 `sop-ai-orchestration.service.ts` 中提取私有函数 `logSopInvocationSuccess(...)`（单职责：写成功日志）
  - **依赖**：`sop-ai-orchestration.service.ts` 骨架已存在
- [x] 为 `logSopInvocationSuccess` 新增 `sop-ai-orchestration.service.logging.test.ts`：断言 `metadata.pipeline_id` / `step_code` 入库
  - **依赖**：上一条

- [x] 在 `sop-ai-orchestration.service.ts` 中提取私有函数 `logSopInvocationFailure(...)`
  - **依赖**：成功日志函数已存在
- [x] 为 `logSopInvocationFailure` 新增测试：失败路径 `outcome=failure` 且 `task_id` 为 NULL
  - **依赖**：上一条

---

#### M11-G `apps/api` — Admin AI 列表/写入扩展（无新路由）

- [x] 修改 `apps/api/src/services/ai-feature-mapping-list.service.ts`：将 `AI_ACTIVE_FEATURE_KEY_VALUES` 替换为 `ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES`
  - **依赖**：M11-B `admin-configurable-feature-keys.ts`
- [x] 更新 `apps/api/src/services/ai-feature-mapping-list.service.test.ts`：返回 items 长度 **7** 且含 `sop.visual_charting`
  - **依赖**：上一条

- [x] 修改 `apps/api/src/services/ai-feature-mapping-upsert.service.ts`：将 `isAiActiveFeatureKey` 替换为 `isAdminConfigurableFeatureKey`
  - **依赖**：M11-B `is-admin-configurable-feature-key.ts`
- [x] 更新 `apps/api/src/services/ai-feature-mapping-upsert.service.test.ts`：对 `sop.fact_extract` upsert 不再 `OPERATION_NOT_ALLOWED`
  - **依赖**：上一条

- [x] 修改 `apps/api/src/services/ai-prompt-create.service.ts`：允许 `feature_key` 为四 SOP 值（校验改用 `isAdminConfigurableFeatureKey` 或 `isSopAiFeatureKey`）
  - **依赖**：M11-B
- [x] 更新 `apps/api/src/services/ai-prompt-create.service.test.ts`：创建 `sop.strategy_gen` Prompt 成功
  - **依赖**：上一条

- [x] 新增 `apps/api/src/services/system-setting-read.service.ts`：导出 `isDeepResearchEnabled(): Promise<boolean>`（读 `system_settings` 键 `sop.deep_research_enabled`，默认 `true`，`prd.md` §4.2.4 SOP L4）
  - **依赖**：M10 `system_settings` 种子
- [x] 新增 `apps/api/src/services/system-setting-read.service.test.ts`：Mock repo；`false` 时返回 false
  - **依赖**：上一条

- [x] 新增 `apps/api/src/services/sop-deep-research-guard.service.ts`：导出 `assertDeepResearchEnabled()`；关闭时抛 `OPERATION_NOT_ALLOWED`（供 M13 `execute` 调用，本 Milestone 仅 Service）
  - **依赖**：`system-setting-read.service.ts`
- [x] 新增 `apps/api/src/services/sop-deep-research-guard.service.test.ts`
  - **依赖**：上一条

---

#### M11-H `workers/pipeline` — Worker 侧 SOP 编排对齐

- [x] 修改 `workers/pipeline/src/repositories/worker-ai.repository.ts` 的 `insertInvocationLog`：增加 `metadata?: Record<string, unknown>` 参数；SQL 写入 `metadata` 列；`taskId` 允许 `null`
  - **依赖**：M11-A 迁移已 push
- [x] 更新 `workers/pipeline/src/repositories/worker-ai.repository.test.ts`（若无则新建）：断言 INSERT 含 `metadata` 绑定
  - **依赖**：上一条

- [x] 修改 `workers/pipeline/src/adapters/ai/fetch-worker-ai.client.ts` 的 `complete`：请求 body 经 shared `applySopLlmTemperature`（传入 `featureKey` 新参数）
  - **依赖**：M11-D `apply-sop-llm-temperature.ts`；Worker 可 import `@lexos/shared`
- [x] 更新 `workers/pipeline/src/adapters/ai/fetch-worker-ai.client.test.ts`（若无则新建）：SOP featureKey 时 `temperature: 0`
  - **依赖**：上一条

- [x] 扩展 `workers/pipeline/src/services/ai-orchestration.service.ts` 的 `AiOrchestrationInvokeInput`：新增可选 `sop?: { pipelineId; stepCode }`；`taskId` 改为可选（SOP 时省略）
  - **依赖**：M11-H repository 已支持 null taskId
- [x] 更新 `workers/pipeline/src/services/ai-orchestration.service.test.ts`：SOP 入参写日志 `metadata` Mock 断言
  - **依赖**：上一条

- [x] 在 `ai-orchestration.service.ts` 的 `logSuccess` / `logFailure` 分支：当 `input.sop` 存在时传 `taskId: null` 与 `metadata`
  - **依赖**：上一条
- [x] 新增 `ai-orchestration.service.sop-metadata.test.ts`：专测 SOP metadata 写入路径
  - **依赖**：上一条

- [x] 新增 `workers/pipeline/src/services/sop-llm-orchestration.service.ts`：薄封装 `AiOrchestrationService.invoke`（固定 `llmUserPrompt` 已由 U2 组装；本类仅 Worker 复用 Deep Research 内 LLM 子步骤时用）
  - **依赖**：M11-H orchestration 扩展完成
- [x] 新增 `workers/pipeline/src/services/sop-llm-orchestration.service.test.ts`
  - **依赖**：上一条

---

#### M11-I 前端 — Admin `/admin/ai` 展示四 SOP 功能点

- [x] 修改 `apps/web/src/components/admin/ai/feature-labels.ts`：为 `sop.fact_extract` / `sop.strategy_gen` / `sop.deep_research` / `sop.visual_charting` 增加中文标签（`prd.md` §3.3 表）
  - **依赖**：M11-B `AiFeatureKey` 类型已含四 SOP 值（M10）
- [x] 新增 `apps/web/src/components/admin/ai/feature-labels.test.ts`：四 SOP 键均有非空 label
  - **依赖**：上一条

- [x] 修改 `apps/web/src/components/admin/ai/AiFeatureMappingsPanel.tsx`：将 `AI_ACTIVE_FEATURE_KEY_VALUES` 改为 `ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES`
  - **依赖**：M11-B shared 导出
- [x] 新增 `apps/web/src/components/admin/ai/AiFeatureMappingsPanel.test.tsx`：渲染 7 行（Mock API）
  - **依赖**：上一条

- [x] 修改 `apps/web/src/components/admin/ai/ai-prompt-editor-dialog.tsx` 的 `featureKey` `Select` 选项源：包含四 SOP 功能点
  - **依赖**：`feature-labels.ts` 已扩展
- [x] 新增 `apps/web/src/components/admin/ai/ai-prompt-editor-dialog.sop.test.tsx`：下拉含 `sop.deep_research` 选项
  - **依赖**：上一条

- [x] 修改 `apps/web/src/components/admin/ai/AiPromptsPanel.tsx`：`AI_FEATURE_LABELS` 展示 SOP 行时标签正确（无 `undefined`）
  - **依赖**：`feature-labels.ts` 已扩展
- [x] 新增 `apps/web/src/components/admin/ai/AiPromptsPanel.test.tsx`：列表 Mock 含 `sop.visual_charting` 行渲染通过
  - **依赖**：上一条

---

#### M11-J 集成与 Milestone 11 完成门禁

- [x] 新增 `apps/api/src/__tests__/sop-ai-orchestration.integration.test.ts`：`invokeSopLlm` Mock HTTP 成功 → DB `ai_invocation_logs` 行 `task_id IS NULL` 且 `metadata->>'pipeline_id'` 非空（`skip` 无联调 env）
  - **依赖**：M11-F、M11-A
- [x] 新增 `apps/api/src/__tests__/admin-sop-feature-mapping.integration.test.ts`：admin `PUT /api/admin/ai/mappings/sop.fact_extract` 返回 200（`skip` 无 env）
  - **依赖**：M11-G

- [x] 运行 `npm run test`（或 workspace 等价）覆盖 M11-A～M11-I；连续失败 **>2** 次则停止汇报
  - **依赖**：M11 全部开发 checkbox 已完成

**人工黑盒验收**（由人工执行，不通过不得 `git commit`）：

- [x] **【人工黑盒】** admin 登录 Web → `/admin/ai`：四个 SOP 功能点（`sop.fact_extract` / `sop.strategy_gen` / `sop.deep_research` / `sop.visual_charting`）在功能映射与 Prompt 列表中**均可见**
  - **依赖**：M11-I Admin UI 扩展
- [x] **【人工黑盒】** 为至少一个 SOP 功能点保存模型映射并执行「连通性测试」：界面显示成功或失败（非 500 白屏）
  - **依赖**：上一条
- [x] **【人工黑盒】** 联调库查询 `ai_invocation_logs`（或触发 M11 集成测后人工查表）：SOP 调用行 `task_id IS NULL` 且 `metadata` 含 `pipeline_id`、`step_code`【若尚无流水线可仅查集成测产生的行；**本期无流水，0 行接受通过**】
  - **依赖**：M11-F 编排已部署
- [x] **【人工黑盒】** 关闭 `system_settings.sop.deep_research_enabled` 后，再次打开 Admin 设置页确认开关状态持久化
  - **依赖**：M11 deep research guard 相关配置
- [x] **【人工黑盒验收签收】** 在 `docs/E2E_MANUAL_RUN_LOG.md` 追加 **M11** 小节
  - **依赖**：上列黑盒项均通过

- [x] 执行 `git commit`：`feat(ai): sop feature keys orchestration temperature zero and invocation metadata`
  - **依赖**：测试全绿；**人工黑盒验收签收**
- [x] 将下方进度表 **M11** 状态更新为「已完成」
  - **依赖**：`git commit` 成功

---

### Milestone 12：管理员 — SOP 模板与 Prompt Studio（U2 API）

**目标**：模板全生命周期（创建逻辑模板、草稿编辑、发布、已发布只读、新建版本草稿）、步骤 DAG/`depends_on`/JSON Schema、Prompt 绑定、发布前校验、Admin 沙盒试跑。

**设计基准**：`prd.md` §2.1（admin 模板 CRUD）、§2.4、§3.4.1、§3.9.1、§3.10；`architecture.md` §5.1、`§7` `/api/admin/sops/*`；`database.md` §3.16。

**前置依赖**：**Milestone 10–11 已完成**（SOP 表、Mustache 工具、`SopAiOrchestrationService`、`validate-mustache-slots-in-depends-on`）。

**契约路由**（`prd.md` §3.9.1 + 发布/创建隐含能力）：

| 方法 | 路径 |
|------|------|
| GET | `/api/admin/sops` |
| POST | `/api/admin/sops/templates` |
| GET | `/api/admin/sops/templates/:template_id` |
| GET | `/api/admin/sops/template-versions/:version_id` |
| PUT | `/api/admin/sops/template-versions/:version_id/prompts` |
| POST | `/api/admin/sops/template-versions/:version_id/publish` |
| POST | `/api/admin/sops/templates/:template_id/versions` |
| POST | `/api/admin/sops/preview-pipeline` |

**验收门禁**：仅 `admin` 可写；`is_published=true` 时 `PUT .../prompts` → **422** `OPERATION_NOT_ALLOWED`；发布校验失败（环/多入口/缺映射）→ **422**；`preview-pipeline` **不**写 `case_pipelines`；律师调用 admin 路由 → **403**；`git commit` 后进入 M13。

**M12 明确不在此 Milestone**：律师端 API（M13）、Admin SOP 前端页面（M15）、U3 Handler（M14）。

---

#### M12-A `packages/shared` — DTO 与类型（每条一个文件）

- [x] 新增 `packages/shared/src/dto/admin-sop-template-create.dto.ts`：导出 zod schema `name`、`caseType`、可选初始 `steps[]`
  - **依赖**：M10 SOP 枚举已存在
- [x] 新增 `packages/shared/src/dto/admin-sop-template-create.dto.test.ts`：非法空 `name` → 校验失败
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/dto/admin-sop-step-upsert.dto.ts`：单步字段 `stepCode`、`name`、`executionType`、`aiFeatureKey?`、`promptTemplateId?`、`inputSchema`、`dependsOn[]`、`requiresVerification`
  - **依赖**：M10 `SopExecutionType` 等枚举
- [x] 新增 `packages/shared/src/dto/admin-sop-step-upsert.dto.test.ts`：`manual` 时 `aiFeatureKey` 可空；`sync_llm` 必填 `aiFeatureKey`
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/dto/admin-sop-version-prompts-upsert.dto.ts`：导出 `{ steps: AdminSopStepUpsert[] }` zod schema（整包替换草稿步骤）
  - **依赖**：`admin-sop-step-upsert.dto.ts`
- [x] 新增 `packages/shared/src/dto/admin-sop-version-prompts-upsert.dto.test.ts`：`depends_on` 含重复 `stepCode` → 失败
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/dto/admin-sop-create-version.dto.ts`：可选 `sourceVersionId`（缺省取最新已发布版）
  - **依赖**：无
- [x] 新增 `packages/shared/src/dto/admin-sop-create-version.dto.test.ts`
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/dto/admin-sop-preview-pipeline.dto.ts`：`templateVersionId`、`stepCode`、沙盒 `formValues`、`finalizedArtifacts` 模拟数据
  - **依赖**：无
- [x] 新增 `packages/shared/src/dto/admin-sop-preview-pipeline.dto.test.ts`
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/types/admin-sop-template-list-item.ts`：列表行（`templateId`、`name`、`caseType`、`versions[]` 摘要）
  - **依赖**：无
- [x] 新增 `packages/shared/src/types/admin-sop-template-list-item.test.ts`：类型构造 smoke
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/types/admin-sop-template-version-detail.ts`：版本详情含 `steps` 全字段
  - **依赖**：无
- [x] 新增 `packages/shared/src/types/admin-sop-template-version-detail.test.ts`
  - **依赖**：上一条

- [x] 在 `packages/shared/src/index.ts` re-export M12-A DTO/类型
  - **依赖**：M12-A 源文件齐全
- [x] 新增 `packages/shared/src/index.m12-exports.test.ts`
  - **依赖**：上一条

---

#### M12-B `apps/api` — 领域规则（纯函数，每条一个文件）

- [x] 新增 `apps/api/src/domain/sop/assert-template-version-editable.ts`：导出 `assertTemplateVersionEditable(isPublished: boolean): void`；已发布抛 `OPERATION_NOT_ALLOWED`（`prd.md` §3.4.1）
  - **依赖**：无
- [x] 新增 `apps/api/src/domain/sop/assert-template-version-editable.test.ts`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/domain/sop/detect-depends-on-cycle.ts`：导出 `detectDependsOnCycle(steps): string | null`（返回环上 `step_code` 或 null）
  - **依赖**：无
- [x] 新增 `apps/api/src/domain/sop/detect-depends-on-cycle.test.ts`：三节点环可检测
  - **依赖**：上一条

- [x] 新增 `apps/api/src/domain/sop/assert-single-dag-entry.ts`：导出 `assertSingleDagEntry(steps): void`（入度为 0 的节点数必须 = 1，`prd.md` §3.4.1 Edge）
  - **依赖**：无
- [x] 新增 `apps/api/src/domain/sop/assert-single-dag-entry.test.ts`：双入口抛错
  - **依赖**：上一条

- [x] 新增 `apps/api/src/domain/sop/assert-step-codes-resolved.ts`：导出 `assertDependsOnReferencesExist(steps): void`（`depends_on` 引用存在）
  - **依赖**：无
- [x] 新增 `apps/api/src/domain/sop/assert-step-codes-resolved.test.ts`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/domain/sop/assert-publish-readiness.ts`：导出 `assertPublishReadiness(steps, promptsByStep, mappingsExist: fn): void`（`sync_llm`/`async_deep_research` 须 `prompt_template_id`+映射；Mustache 插槽 ⊆ `depends_on`）
  - **依赖**：M11 `validate-mustache-slots-in-depends-on`（shared）
- [x] 新增 `apps/api/src/domain/sop/assert-publish-readiness.test.ts`：缺映射抛 `VALIDATION_FAILED`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/domain/sop/compute-next-version-number.ts`：导出 `computeNextVersionNumber(existingMax: number): number`（发布时 `max+1`）
  - **依赖**：无
- [x] 新增 `apps/api/src/domain/sop/compute-next-version-number.test.ts`
  - **依赖**：上一条

---

#### M12-C `apps/api` — `AdminSopRepository`（`service_role`，单方法单任务）

- [x] 新增 `apps/api/src/repositories/admin-sop.repository.ts`：类骨架 + `service_role` 客户端注入
  - **依赖**：M10 SOP 表已迁移
- [x] 新增 `apps/api/src/repositories/admin-sop.repository.test.ts`：Mock 客户端；禁止泄漏 `service_role`
  - **依赖**：上一条

- [x] 在 `admin-sop.repository.ts` 实现 `listTemplatesWithVersions(limit, cursor)`：联结 `sop_templates` + `sop_template_versions`；分页 50
  - **依赖**：Repository 骨架
- [x] 为 `listTemplatesWithVersions` 新增 `admin-sop.repository.list.test.ts`
  - **依赖**：上一条

- [x] 实现 `insertTemplateWithInitialDraft(actorId, dto)`：事务插入 `sop_templates` + `sop_template_versions`（`version_number=0` 或 1 草稿、`is_published=false`）+ 可选 `sop_steps`
  - **依赖**：M12-C 第一条
- [x] 新增 `admin-sop.repository.insert-template.test.ts`
  - **依赖**：上一条

- [x] 实现 `findTemplateById(templateId)` 与 `findTemplateVersionById(versionId)`（含 steps 排序 `step_code`）
  - **依赖**：Repository 骨架
- [x] 新增 `admin-sop.repository.find.test.ts`
  - **依赖**：上一条

- [x] 实现 `replaceDraftSteps(versionId, steps[])`：删除旧 `sop_steps` 再批量 INSERT（仅 `is_published=false` 由 Service 前置断言）
  - **依赖**：`findTemplateVersionById`
- [x] 新增 `admin-sop.repository.replace-steps.test.ts`
  - **依赖**：上一条

- [x] 实现 `copyVersionToNewDraft(templateId, sourceVersionId, actorId)`：INSERT 新 `sop_template_versions` + 复制 `sop_steps`（`prd.md` §3.9.1 POST versions）
  - **依赖**：`findTemplateVersionById`
- [x] 新增 `admin-sop.repository.copy-version.test.ts`
  - **依赖**：上一条

- [x] 实现 `publishVersion(versionId, nextVersionNumber, publishedAt)`：`UPDATE is_published=true, version_number=..., published_at=now()`
  - **依赖**：`findTemplateVersionById`
- [x] 新增 `admin-sop.repository.publish.test.ts`
  - **依赖**：上一条

---

#### M12-D `apps/api` — Service 层（每条 Service 一个文件 + 测试）

- [x] 新增 `apps/api/src/services/admin-sop-list.service.ts`：导出 `list(query)` → 分页 DTO
  - **依赖**：M12-C `listTemplatesWithVersions`
- [x] 新增 `apps/api/src/services/admin-sop-list.service.test.ts`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/services/admin-sop-template-create.service.ts`：创建模板 + 初始草稿；审计 **不写**（创建模板非 PRD 强制审计项）或仅 `user.update` 跳过
  - **依赖**：`insertTemplateWithInitialDraft`；M12-B `detectDependsOnCycle` 等校验
- [x] 新增 `apps/api/src/services/admin-sop-template-create.service.test.ts`：非法 DAG → `VALIDATION_FAILED`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/services/admin-sop-template-get.service.ts`：导出 `getTemplate(templateId)`
  - **依赖**：`findTemplateById`
- [x] 新增 `apps/api/src/services/admin-sop-template-get.service.test.ts`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/services/admin-sop-version-get.service.ts`：导出 `getVersion(versionId)`
  - **依赖**：`findTemplateVersionById`
- [x] 新增 `apps/api/src/services/admin-sop-version-get.service.test.ts`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/services/admin-sop-version-prompts-upsert.service.ts`：调用 `assertTemplateVersionEditable` → DAG 校验 → `replaceDraftSteps`；`append_audit_log('sop.prompt.update')`
  - **依赖**：M12-B 领域函数；M12-C `replaceDraftSteps`；`AuditWriterService`
- [x] 新增 `apps/api/src/services/admin-sop-version-prompts-upsert.service.test.ts`：已发布版本 → `OPERATION_NOT_ALLOWED`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/services/admin-sop-version-create.service.ts`：新建草稿版本；复制步骤
  - **依赖**：`copyVersionToNewDraft`
- [x] 新增 `apps/api/src/services/admin-sop-version-create.service.test.ts`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/services/admin-sop-version-publish.service.ts`：`assertPublishReadiness` → `publishVersion`；`append_audit_log('sop.template.publish')`
  - **依赖**：M12-B `assert-publish-readiness`；M12-C `publishVersion`
- [x] 新增 `apps/api/src/services/admin-sop-version-publish.service.test.ts`：未配置 `prompt_template_id` → 422
  - **依赖**：上一条

- [x] 新增 `apps/api/src/services/admin-sop-preview-pipeline.service.ts`：组装沙盒 `SopPromptContext` → `SopTokenLimitGuard` → `SopAiOrchestrationService.invokeSopLlm`；**禁止** INSERT `case_pipelines`/`pipeline_artifacts`
  - **依赖**：M11 编排与 Prompt 组装服务
- [x] 新增 `apps/api/src/services/admin-sop-preview-pipeline.service.test.ts`：断言 Repository **未**调用 `insertPipeline`
  - **依赖**：上一条

---

#### M12-E `apps/api` — Controller 层（每条 HTTP 路由独立文件）

- [x] 新增 `apps/api/src/controllers/admin-sops-list.controller.ts`：处理 `GET /api/admin/sops`
  - **依赖**：`admin-sop-list.service`
- [x] 新增 `apps/api/src/controllers/admin-sops-list.controller.test.ts`：lawyer → `AUTH_FORBIDDEN`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/controllers/admin-sops-template-create.controller.ts`：处理 `POST /api/admin/sops/templates`
  - **依赖**：`admin-sop-template-create.service`
- [x] 新增 `apps/api/src/controllers/admin-sops-template-create.controller.test.ts`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/controllers/admin-sops-template-get.controller.ts`：处理 `GET /api/admin/sops/templates/:template_id`
  - **依赖**：`admin-sop-template-get.service`
- [x] 新增 `apps/api/src/controllers/admin-sops-template-get.controller.test.ts`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/controllers/admin-sops-version-get.controller.ts`：处理 `GET /api/admin/sops/template-versions/:version_id`
  - **依赖**：`admin-sop-version-get.service`
- [x] 新增 `apps/api/src/controllers/admin-sops-version-get.controller.test.ts`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/controllers/admin-sops-version-prompts-upsert.controller.ts`：处理 `PUT .../template-versions/:version_id/prompts`
  - **依赖**：`admin-sop-version-prompts-upsert.service`
- [x] 新增 `apps/api/src/controllers/admin-sops-version-prompts-upsert.controller.test.ts`：已发布 → 422
  - **依赖**：上一条

- [x] 新增 `apps/api/src/controllers/admin-sops-version-create.controller.ts`：处理 `POST .../templates/:template_id/versions`
  - **依赖**：`admin-sop-version-create.service`
- [x] 新增 `apps/api/src/controllers/admin-sops-version-create.controller.test.ts`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/controllers/admin-sops-version-publish.controller.ts`：处理 `POST .../template-versions/:version_id/publish`
  - **依赖**：`admin-sop-version-publish.service`
- [x] 新增 `apps/api/src/controllers/admin-sops-version-publish.controller.test.ts`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/controllers/admin-sops-preview-pipeline.controller.ts`：处理 `POST /api/admin/sops/preview-pipeline`
  - **依赖**：`admin-sop-preview-pipeline.service`
- [x] 新增 `apps/api/src/controllers/admin-sops-preview-pipeline.controller.test.ts`：响应 200 且 body 含 LLM 文本摘要
  - **依赖**：上一条

---

#### M12-F `apps/api` — 路由挂载与集成

- [x] 新增 `apps/api/src/routes/admin-sops.routes.ts`：导出 `handleAdminSopsRoute`；路径分发上述 8 条路由；仅 `admin` 角色
  - **依赖**：M12-E 全部 Controller
- [x] 新增 `apps/api/src/routes/admin-sops.routes.test.ts`：未登录 401；lawyer 403
  - **依赖**：上一条

- [x] 在 `apps/api/src/app.ts` 注册 `handleAdminSopsRoute`；链：`auth.middleware` → `password-change-gate` → `requireRoles('admin')`
  - **依赖**：`admin-sops.routes.ts`
- [x] 新增 `apps/api/src/__tests__/admin-sops-route-mount.test.ts`：Mock 请求 `GET /api/admin/sops` 命中处理器
  - **依赖**：上一条

- [x] 新增 `apps/api/src/__tests__/admin-sop-publish-flow.integration.test.ts`：创建模板 → 编辑 prompts → 发布 → 再 PUT prompts 期望 422（`skip` 无联调 env）
  - **依赖**：M12-F 挂载完成
- [x] 新增 `apps/api/src/__tests__/admin-sop-preview-pipeline.integration.test.ts`：preview 后 `case_pipelines` 行数不变（`skip` 无 env）
  - **依赖**：M12-D preview service

---

#### M12-G Milestone 12 完成门禁

- [x] 运行 `apps/api` 相关测试全绿；连续失败 **>2** 次则停止汇报
  - **依赖**：M12-A～M12-F 全部 checkbox 已完成

**人工黑盒验收**（由人工经 HTTP 客户端或临时脚本执行，不通过不得 `git commit`）：

- [x] **【人工黑盒】** admin Token：`POST` 创建模板 → `PUT` 草稿版本 prompts → `POST` 发布 → 再次 `PUT` prompts 期望 **422** `OPERATION_NOT_ALLOWED`
  - **依赖**：M12 API 已挂载
- [x] **【人工黑盒】** admin Token：`POST /api/admin/sops/preview-pipeline` 成功后，数据库 `case_pipelines` 行数**不变**
  - **依赖**：M12 preview 路由
- [x] **【人工黑盒】** lawyer Token：访问 `GET /api/admin/sops` 或任意 admin SOP 写路由 → **403**
  - **依赖**：M12 路由 `requireRoles('admin')`
- [x] **【人工黑盒】** 发布校验：故意配置 DAG 环或缺 Prompt 映射后 `POST` 发布 → **422** 且响应体含可读的校验错误信息
  - **依赖**：M12 发布校验服务（实测 HTTP **400** + `VALIDATION_FAILED`，见 `E2E_MANUAL_RUN_LOG.md` M12）
- [x] **【人工黑盒验收签收】** 在 `docs/E2E_MANUAL_RUN_LOG.md` 追加 **M12** 小节
  - **依赖**：上列黑盒项均通过

- [ ] 执行 `git commit`：`feat(admin-sop): template versions prompts publish and preview api`
  - **依赖**：测试全绿；**人工黑盒验收签收**
- [ ] 将下方进度表 **M12** 状态更新为「已完成」
  - **依赖**：`git commit` 成功

---

### Milestone 13：律师端 — SOP 流水线业务 API（U2）

**目标**：律师创建/推进/结案流水线；卷宗 TUS（独立 init）；步骤 `execute`/`finalize`；产出物乐观锁；异步 Deep Research **202**；人工 [Verified]；HTML 定稿触发 `sop.pdf_export` Outbox。

**设计基准**：`prd.md` §1.5、§2.3–§2.4、§3.5.1（卷宗限额）、§3.8.1–§3.8.6、§3.9.2–§3.9.3、§3.10；`architecture.md` §3.2.6、§3.7、§5.6.2、§7 `/api/sops/*`。

**前置依赖**：**Milestone 10–12 已完成**（SOP 表、M11 编排/Token 守卫、M12 已发布模板）。

**契约路由**（`prd.md` §3.9.2–§3.9.3 + 卷宗 complete + 人工校验）：

| 方法 | 路径 |
|------|------|
| GET | `/api/sops/templates` |
| POST | `/api/sops/uploads/init` |
| POST | `/api/sops/uploads/complete` |
| POST | `/api/sops/pipelines` |
| GET | `/api/sops/pipelines/:id/status` |
| POST | `/api/sops/pipelines/:id/resume` |
| POST | `/api/sops/pipelines/:id/close` |
| POST | `/api/sops/pipelines/:id/steps/:code/execute` |
| POST | `/api/sops/pipelines/:id/steps/:code/finalize` |
| POST | `/api/sops/artifacts/:id/verify` |
| GET | `/api/sops/artifacts/:id` |
| PATCH | `/api/sops/artifacts/:id` |
| POST | `/api/sops/artifacts/:id/regenerate-pdf` |

**验收门禁**：律师 A 不可读写律师 B 流水线/产出物；`async_deep_research` → **202** + 同事务 Outbox；`sync_llm` ≤60s；`finalize` 未 Verified → **422**；`git commit` 后进入 M14。

**M13 明确不在此 Milestone**：U3 Handler 实现（M14）、律师/Admin 前端（M16/M15）、`suspended` 挂起 API（PRD 仅定义 `resume`，挂起由运维/二期）。

---

#### M13-A `packages/shared` — DTO 与类型

- [x] 新增 `packages/shared/src/dto/sop-pipeline-create.dto.ts`：`templateVersionId`（UUID zod）
  - **依赖**：无
- [x] 新增 `packages/shared/src/dto/sop-pipeline-create.dto.test.ts`
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/dto/sop-step-execute.dto.ts`：`formValues`（`Record<string, unknown>`）、可选 `mediaObjectKeys[]`
  - **依赖**：无
- [x] 新增 `packages/shared/src/dto/sop-step-execute.dto.test.ts`
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/dto/sop-artifact-patch.dto.ts`：`contentRaw: string`
  - **依赖**：无
- [x] 新增 `packages/shared/src/dto/sop-artifact-patch.dto.test.ts`：空串是否允许【与 PRD 对齐写断言】
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/dto/sop-upload-init.dto.ts`：`pipelineId`、`fileName`、`mimeType`、`sizeBytes`、`durationSec?`（限额同 `transcription-limits`）
  - **依赖**：M4 `transcription-limits` 已存在
- [x] 新增 `packages/shared/src/dto/sop-upload-init.dto.test.ts`：超 1GB → 校验失败
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/dto/sop-upload-complete.dto.ts`：`uploadSessionId`
  - **依赖**：无
- [x] 新增 `packages/shared/src/dto/sop-upload-complete.dto.test.ts`
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/types/sop-published-template-item.ts`：`templateVersionId`、`templateName`、`caseType`、`versionNumber`
  - **依赖**：无
- [x] 新增 `packages/shared/src/types/sop-published-template-item.test.ts`
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/types/sop-pipeline-status-response.ts`：`pipelineId`、`status`、`currentStepCode`、`steps: { stepCode, artifactStatus }[]`
  - **依赖**：无
- [x] 新增 `packages/shared/src/types/sop-pipeline-status-response.test.ts`
  - **依赖**：上一条

- [x] 新增 `packages/shared/src/types/sop-async-execute-accepted.ts`：`pipelineId`、`stepCode`、`artifactId`（202 响应体，`architecture.md` §3.2.6.6）
  - **依赖**：无
- [x] 新增 `packages/shared/src/types/sop-async-execute-accepted.test.ts`
  - **依赖**：上一条

- [x] 在 `packages/shared/src/index.ts` re-export M13-A
  - **依赖**：M13-A 源文件齐全
- [x] 新增 `packages/shared/src/index.m13-exports.test.ts`
  - **依赖**：上一条

---

#### M13-B `apps/api` — 领域规则（纯函数）

- [x] 新增 `apps/api/src/domain/sop/assert-pipeline-actionable.ts`：导出 `assertPipelineActionable(status)`；`completed`/`suspended` 禁止 execute/finalize（`suspended` 须先 resume）
  - **依赖**：M10 `CasePipelineStatus`
- [x] 新增 `apps/api/src/domain/sop/assert-pipeline-actionable.test.ts`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/domain/sop/find-dag-entry-step-code.ts`：导出 `findDagEntryStepCode(steps)`（唯一入度 0 节点）
  - **依赖**：无
- [x] 新增 `apps/api/src/domain/sop/find-dag-entry-step-code.test.ts`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/domain/sop/assert-depends-on-finalized.ts`：导出 `assertDependsOnFinalized(pipelineId, step, artifactsByCode)`；未定稿 → `OPERATION_NOT_ALLOWED`
  - **依赖**：无
- [x] 新增 `apps/api/src/domain/sop/assert-depends-on-finalized.test.ts`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/domain/sop/assert-artifact-not-running.ts`：导出 `assertArtifactNotRunning(status)`；`running` 时拒绝第二次 execute
  - **依赖**：M10 `PipelineArtifactStatus`
- [x] 新增 `apps/api/src/domain/sop/assert-artifact-not-running.test.ts`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/domain/sop/assert-artifact-editable.ts`：导出 `assertArtifactEditable(status)`；`finalized` 禁止 PATCH
  - **依赖**：无
- [x] 新增 `apps/api/src/domain/sop/assert-artifact-editable.test.ts`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/domain/sop/build-sop-storage-key-prefix.ts`：导出 `buildSopMediaStorageKeyPrefix(ownerId, pipelineId)` → `{ownerId}/sops/{pipelineId}/`
  - **依赖**：无
- [x] 新增 `apps/api/src/domain/sop/build-sop-storage-key-prefix.test.ts`：首段等于 `ownerId`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/domain/sop/build-sop-deep-research-outbox-payload.ts`：导出 `buildSopDeepResearchOutboxPayload(...)`（`stage=sop.deep_research`）
  - **依赖**：M10 `SOP_STAGE_DEEP_RESEARCH`
- [x] 新增 `apps/api/src/domain/sop/build-sop-deep-research-outbox-payload.test.ts`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/domain/sop/build-sop-pdf-export-outbox-payload.ts`：导出 `buildSopPdfExportOutboxPayload(...)`（`stage=sop.pdf_export`）
  - **依赖**：M10 `SOP_STAGE_PDF_EXPORT`
- [x] 新增 `apps/api/src/domain/sop/build-sop-pdf-export-outbox-payload.test.ts`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/domain/sop/build-sop-media-ocr-outbox-payload.ts`：导出 `buildSopMediaOcrOutboxPayload(...)`（`stage=sop.media.ocr`）
  - **依赖**：M10 `SOP_STAGE_MEDIA_OCR`
- [x] 新增 `apps/api/src/domain/sop/build-sop-media-ocr-outbox-payload.test.ts`
  - **依赖**：上一条

---

#### M13-C `apps/api` — Repository（律师 JWT · 单方法）

- [x] 新增 `apps/api/src/repositories/sop-template-read.repository.ts`：导出 `listPublishedTemplates(accessToken, pagination)`
  - **依赖**：M10 RLS（律师仅 `is_published=true`）
- [x] 新增 `apps/api/src/repositories/sop-template-read.repository.test.ts`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/repositories/case-pipeline.repository.ts`：骨架 + 用户 JWT 客户端
  - **依赖**：M10 `case_pipelines` 表
- [x] 新增 `apps/api/src/repositories/case-pipeline.repository.test.ts`
  - **依赖**：上一条

- [x] 实现 `case-pipeline.repository.ts` 的 `createPipeline(accessToken, templateVersionId, lawyerId, entryStepCode)`
  - **依赖**：M13-C 第二条
- [x] 新增 `case-pipeline.repository.create.test.ts`
  - **依赖**：上一条

- [x] 实现 `findPipelineForLawyer(accessToken, pipelineId)` 与 `updatePipelineStatus(...)`
  - **依赖**：Repository 骨架
- [x] 新增 `case-pipeline.repository.find.test.ts`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/repositories/pipeline-artifact.repository.ts`：骨架
  - **依赖**：M10 `pipeline_artifacts`
- [x] 新增 `apps/api/src/repositories/pipeline-artifact.repository.test.ts`
  - **依赖**：上一条

- [x] 实现 `upsertArtifactForStep(...)`、`findArtifactByStep(...)`、`patchContentRaw(expectedVersion, ...)`
  - **依赖**：artifact repository 骨架
- [x] 新增 `pipeline-artifact.repository.upsert-patch.test.ts`：版本冲突返回 0 行
  - **依赖**：上一条

- [x] 实现 `setArtifactStatus(...)`、`setFinalizedSnapshot(...)`
  - **依赖**：upsert 已实现
- [x] 新增 `pipeline-artifact.repository.status.test.ts`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/repositories/sop-step-snapshot.repository.ts`：按 `template_version_id` 读 `sop_steps`（只读快照）
  - **依赖**：M10 `sop_steps`
- [x] 新增 `apps/api/src/repositories/sop-step-snapshot.repository.test.ts`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/repositories/sop-upload-session.repository.ts`：扩展 `upload_sessions`（`pipeline_id` 非空、`task_id` 空）创建/完成
  - **依赖**：M10 `upload_sessions_sop` 迁移
- [x] 新增 `apps/api/src/repositories/sop-upload-session.repository.test.ts`
  - **依赖**：上一条

- [x] 扩展 `apps/api/src/repositories/outbox.repository.ts`：新增 `insertSopOutboxInTransaction(client, { aggregateType: 'case_pipeline', stage, ...})`
  - **依赖**：M4 `outbox.repository` 已存在
- [x] 新增 `apps/api/src/repositories/outbox.repository.sop.test.ts`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/repositories/sop-verified.repository.ts`：导出 `hasAutoVerification(pipelineId, stepCode)`（查 `ai_invocation_logs`）；`hasManualVerification(artifactId)`（查 `audit_logs` `sop.artifact.verify`）
  - **依赖**：M11 metadata 列；M10 audit_action 扩展
- [x] 新增 `apps/api/src/repositories/sop-verified.repository.test.ts`
  - **依赖**：上一条

---

#### M13-D `apps/api` — Service：模板与流水线生命周期

- [x] 新增 `apps/api/src/services/sop-published-templates-list.service.ts`：导出 `list(actor, query)`
  - **依赖**：M13-C `listPublishedTemplates`
- [x] 新增 `apps/api/src/services/sop-published-templates-list.service.test.ts`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/services/sop-pipeline-create.service.ts`：校验 `template_version_id` 已发布 → 创建 `case_pipelines` + `current_step_code` 入口；**不**写 Outbox（`prd.md` §3.8.1）
  - **依赖**：M13-B `find-dag-entry-step-code`；M13-C create/find
- [x] 新增 `apps/api/src/services/sop-pipeline-create.service.test.ts`：未发布版本 → `OPERATION_NOT_ALLOWED`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/services/sop-pipeline-status.service.ts`：组装 `SopPipelineStatusResponse`
  - **依赖**：pipeline + artifacts 查询
- [x] 新增 `apps/api/src/services/sop-pipeline-status.service.test.ts`：律师越权 → `AUTH_FORBIDDEN`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/services/sop-pipeline-resume.service.ts`：`suspended` → `in_progress`（校验可恢复）
  - **依赖**：M13-B `assert-pipeline-actionable`
- [x] 新增 `apps/api/src/services/sop-pipeline-resume.service.test.ts`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/services/sop-pipeline-close.service.ts`：显式结案 → `completed`；**禁止**自动结案
  - **依赖**：pipeline repository
- [x] 新增 `apps/api/src/services/sop-pipeline-close.service.test.ts`：`in_progress` 外状态 → 422
  - **依赖**：上一条

---

#### M13-E `apps/api` — Service：卷宗 TUS（init / complete）

- [x] 新增 `apps/api/src/services/sop-upload-init.service.ts`：校验限额；`upload_sessions` + 前缀 `{ownerId}/sops/{pipelineId}/`；返回 TUS 参数（**禁止**走转写 init）
  - **依赖**：M13-B `build-sop-storage-key-prefix`；M13-C upload session repo；M4 Storage adapter
- [x] 新增 `apps/api/src/services/sop-upload-init.service.test.ts`：律师 B 无法为律师 A 的 `pipelineId` init
  - **依赖**：上一条

- [x] 新增 `apps/api/src/services/sop-upload-complete.service.ts`：校验 Storage 前缀 → 标记 session 完成 → **同事务**插入 Outbox `sop.media.ocr`（`prd.md` §3.8.4）
  - **依赖**：M13-B `build-sop-media-ocr-outbox-payload`；outbox repository
- [x] 新增 `apps/api/src/services/sop-upload-complete.service.test.ts`：完成后期望未发布 Outbox 行存在
  - **依赖**：上一条

---

#### M13-F `apps/api` — Service：`execute`（按分支拆函数）

- [x] 新增 `apps/api/src/services/sop-step-execute.service.ts`：编排入口 `execute(actor, pipelineId, stepCode, body)`
  - **依赖**：M13-B 前置校验；M13-C repos；M11 编排
- [x] 新增 `apps/api/src/services/sop-step-execute.service.test.ts`：前置未定稿 → `OPERATION_NOT_ALLOWED`
  - **依赖**：上一条

- [x] 在 `sop-step-execute.service.ts` 提取 `executeManualStep(...)`：写 `content_type=json`、`status=draft`
  - **依赖**：execute 骨架
- [x] 新增 `sop-step-execute.service.manual.test.ts`
  - **依赖**：上一条

- [x] 提取 `executeSyncLlmStep(...)`：组装 Prompt → `SopTokenLimitGuard` → `SopAiOrchestrationService`（60s）→ `draft`/`failed`
  - **依赖**：M11；M13-F 骨架
- [x] 新增 `sop-step-execute.service.sync-llm.test.ts`：Mock 超时 → `failed`
  - **依赖**：上一条

- [x] 提取 `executeAsyncDeepResearchStep(...)`：`assertDeepResearchEnabled` → artifact `running` → 同事务 Outbox → 返回 **202** body
  - **依赖**：M11 `sop-deep-research-guard`；M13-B outbox payload
- [x] 新增 `sop-step-execute.service.async.test.ts`：响应 status 202 且含 `artifact_id`
  - **依赖**：上一条

- [x] 提取 `updateCurrentStepCodeAfterExecute(...)`：更新 `case_pipelines.current_step_code`
  - **依赖**：execute 分支已实现
- [x] 新增 `sop-step-execute.service.current-step.test.ts`
  - **依赖**：上一条

---

#### M13-G `apps/api` — Service：产出物、定稿、校验、PDF 重试

- [x] 新增 `apps/api/src/services/sop-artifact-get.service.ts`
  - **依赖**：M13-C artifact repo
- [x] 新增 `apps/api/src/services/sop-artifact-get.service.test.ts`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/services/sop-artifact-patch.service.ts`：解析 `If-Match`；`assertArtifactEditable`；`version++`
  - **依赖**：M13-B `assert-artifact-editable`
- [x] 新增 `apps/api/src/services/sop-artifact-patch.service.test.ts`：陈旧 version → `RESOURCE_CONFLICT` 409
  - **依赖**：上一条

- [x] 新增 `apps/api/src/services/sop-artifact-verify.service.ts`：`append_audit_log('sop.artifact.verify')`；仅本案律师
  - **依赖**：M13-C verified repo；`AuditWriterService`
- [x] 新增 `apps/api/src/services/sop-artifact-verify.service.test.ts`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/services/sop-step-finalize.service.ts`：`assertVerifiedIfRequired` → `finalized` + `finalized_snapshot_raw`；`html` 步骤同事务 Outbox `sop.pdf_export`
  - **依赖**：M13-C verified；M13-B pdf outbox payload
- [x] 新增 `apps/api/src/services/sop-step-finalize.service.test.ts`：未 Verified → 422
  - **依赖**：上一条

- [x] 在 `sop-step-finalize.service.ts` 提取 `assertVerifiedIfRequired(...)` 私有函数（自动日志 OR 人工审计）
  - **依赖**：finalize 骨架
- [x] 新增 `sop-step-finalize.service.verified.test.ts`
  - **依赖**：上一条

- [x] 新增 `apps/api/src/services/sop-artifact-regenerate-pdf.service.ts`：仅 `finalized`；入队 `sop.pdf_export` Outbox
  - **依赖**：M13-B pdf payload；outbox repo
- [x] 新增 `apps/api/src/services/sop-artifact-regenerate-pdf.service.test.ts`：`draft` 状态 → 422
  - **依赖**：上一条

---

#### M13-H `apps/api` — Controller（每条路由一个文件）

- [ ] 新增 `apps/api/src/controllers/sop-templates-list.controller.ts`：`GET /api/sops/templates`
  - **依赖**：`sop-published-templates-list.service`
- [ ] 新增 `apps/api/src/controllers/sop-templates-list.controller.test.ts`：admin 可调 lawyer 路由【若禁止 admin 则 403】
  - **依赖**：上一条

- [ ] 新增 `apps/api/src/controllers/sop-uploads-init.controller.ts`：`POST /api/sops/uploads/init`
  - **依赖**：`sop-upload-init.service`
- [ ] 新增 `apps/api/src/controllers/sop-uploads-init.controller.test.ts`
  - **依赖**：上一条

- [ ] 新增 `apps/api/src/controllers/sop-uploads-complete.controller.ts`：`POST /api/sops/uploads/complete`
  - **依赖**：`sop-upload-complete.service`
- [ ] 新增 `apps/api/src/controllers/sop-uploads-complete.controller.test.ts`
  - **依赖**：上一条

- [ ] 新增 `apps/api/src/controllers/sop-pipelines-create.controller.ts`：`POST /api/sops/pipelines`
  - **依赖**：`sop-pipeline-create.service`
- [ ] 新增 `apps/api/src/controllers/sop-pipelines-create.controller.test.ts`
  - **依赖**：上一条

- [ ] 新增 `apps/api/src/controllers/sop-pipelines-status.controller.ts`：`GET /api/sops/pipelines/:id/status`
  - **依赖**：`sop-pipeline-status.service`
- [ ] 新增 `apps/api/src/controllers/sop-pipelines-status.controller.test.ts`
  - **依赖**：上一条

- [ ] 新增 `apps/api/src/controllers/sop-pipelines-resume.controller.ts`：`POST .../resume`
  - **依赖**：`sop-pipeline-resume.service`
- [ ] 新增 `apps/api/src/controllers/sop-pipelines-resume.controller.test.ts`
  - **依赖**：上一条

- [ ] 新增 `apps/api/src/controllers/sop-pipelines-close.controller.ts`：`POST .../close`
  - **依赖**：`sop-pipeline-close.service`
- [ ] 新增 `apps/api/src/controllers/sop-pipelines-close.controller.test.ts`
  - **依赖**：上一条

- [ ] 新增 `apps/api/src/controllers/sop-step-execute.controller.ts`：`POST .../steps/:code/execute`（async 时 `res.status(202)`）
  - **依赖**：`sop-step-execute.service`
- [ ] 新增 `apps/api/src/controllers/sop-step-execute.controller.test.ts`
  - **依赖**：上一条

- [ ] 新增 `apps/api/src/controllers/sop-step-finalize.controller.ts`：`POST .../steps/:code/finalize`
  - **依赖**：`sop-step-finalize.service`
- [ ] 新增 `apps/api/src/controllers/sop-step-finalize.controller.test.ts`
  - **依赖**：上一条

- [ ] 新增 `apps/api/src/controllers/sop-artifact-get.controller.ts`：`GET /api/sops/artifacts/:id`
  - **依赖**：`sop-artifact-get.service`
- [ ] 新增 `apps/api/src/controllers/sop-artifact-get.controller.test.ts`
  - **依赖**：上一条

- [ ] 新增 `apps/api/src/controllers/sop-artifact-patch.controller.ts`：`PATCH` + `If-Match` 头校验
  - **依赖**：`sop-artifact-patch.service`
- [ ] 新增 `apps/api/src/controllers/sop-artifact-patch.controller.test.ts`
  - **依赖**：上一条

- [ ] 新增 `apps/api/src/controllers/sop-artifact-verify.controller.ts`：`POST /api/sops/artifacts/:id/verify`
  - **依赖**：`sop-artifact-verify.service`
- [ ] 新增 `apps/api/src/controllers/sop-artifact-verify.controller.test.ts`
  - **依赖**：上一条

- [ ] 新增 `apps/api/src/controllers/sop-artifact-regenerate-pdf.controller.ts`：`POST .../regenerate-pdf`
  - **依赖**：`sop-artifact-regenerate-pdf.service`
- [ ] 新增 `apps/api/src/controllers/sop-artifact-regenerate-pdf.controller.test.ts`
  - **依赖**：上一条

---

#### M13-I `apps/api` — 路由挂载与集成

- [ ] 新增 `apps/api/src/routes/sops.routes.ts`：导出 `handleSopsRoute`；分发 M13-H 全部路径；`requireRoles('lawyer')`（admin **不可**读律师业务数据，转写路由同理则拒绝）
  - **依赖**：M13-H Controllers
- [ ] 新增 `apps/api/src/routes/sops.routes.test.ts`：未登录 401；admin 访问律师 SOP → 403
  - **依赖**：上一条

- [ ] 在 `apps/api/src/app.ts` 挂载 `/api/sops`：`auth` + `password-change-gate` + `lawyer`
  - **依赖**：`sops.routes.ts`
- [ ] 新增 `apps/api/src/__tests__/sops-route-mount.test.ts`
  - **依赖**：上一条

- [ ] 新增 `apps/api/src/__tests__/sop-pipeline-lawyer-isolation.integration.test.ts`：律师 A 无法 `GET status` 律师 B 流水线（`skip` 无 env）
  - **依赖**：M13-I 挂载
- [ ] 新增 `apps/api/src/__tests__/sop-execute-async-202.integration.test.ts`：Deep Research 步骤 → 202 + Outbox 行（`skip` 无 env）
  - **依赖**：M13-F async 分支

- [ ] 新增 `apps/api/src/__tests__/sop-context-limit.integration.test.ts`：超大 Prompt 组装 → 422 `CONTEXT_LIMIT_EXCEEDED`（Mock）
  - **依赖**：M11 Token guard
- [ ] 新增 `apps/api/src/__tests__/sop-upload-prefix.integration.test.ts`：init 返回前缀以 `auth.uid()` 开头（`skip` 无 env）
  - **依赖**：M13-E

---

#### M13-J Milestone 13 完成门禁

- [ ] 运行 `apps/api` M13 相关测试全绿；连续失败 **>2** 次则停止汇报
  - **依赖**：M13-A～M13-I 全部 checkbox 已完成

**人工黑盒验收**（由人工经 BFF/HTTP 执行，不通过不得 `git commit`）：

- [ ] **【人工黑盒】** lawyer Token：`GET /api/sops/templates` 仅返回 `is_published=true` 的模板版本
  - **依赖**：M12 已发布至少一条模板
- [ ] **【人工黑盒】** lawyer Token：`POST /api/sops/pipelines` 创建实例 → `GET .../status` 返回合法 `currentStepCode` 与步骤状态
  - **依赖**：上一条
- [ ] **【人工黑盒】** 对 `manual` 或 `sync_llm` 步骤：`POST .../execute` → `POST .../finalize`；未定稿前置步骤时 execute → **422**
  - **依赖**：模板含多步 DAG
- [ ] **【人工黑盒】** 对 `async_deep_research` 步骤（若模板含）：`POST .../execute` 响应 **202** 且 Body 含 `pipeline_id`、`step_code`、`artifact_id`
  - **依赖**：M11 DR 已启用
- [ ] **【人工黑盒】** 律师 A Token 访问律师 B 的 `GET .../status` 与 `PATCH /api/sops/artifacts/:id` → **403/404**
  - **依赖**：联调库两名律师
- [ ] **【人工黑盒】** `POST /api/sops/uploads/init` 返回 Storage 前缀以当前 `auth.uid()` 开头；**不得**使用转写 `uploads/init` 路径
  - **依赖**：M13-E
- [ ] **【人工黑盒】** `requires_verification=true` 步骤：未 verify 直接 finalize → **422**；`POST .../artifacts/:id/verify` 后再 finalize → **200**
  - **依赖**：M13 verify/finalize
- [ ] **【人工黑盒验收签收】** 在 `docs/E2E_MANUAL_RUN_LOG.md` 追加 **M13** 小节
  - **依赖**：上列黑盒项均通过

- [ ] 执行 `git commit`：`feat(sop): lawyer pipeline execute finalize uploads and artifacts api`
  - **依赖**：测试全绿；**人工黑盒验收签收**
- [ ] 将下方进度表 **M13** 状态更新为「已完成」
  - **依赖**：`git commit` 成功

---

### Milestone 14：异步 Worker — SOP 阶段处理器（U3）

**目标**：在 `workers/pipeline` 内注册 `sop.media.ocr` / `sop.deep_research` / `sop.pdf_export` 三阶段 Handler；共享 `WORKER_MAX_CONCURRENCY=5` + 分 stage 信号量；`service_role` 写库前 RLS 等价校验；失败写 `pipeline_artifacts.status=failed`（PDF 失败保持 `finalized`）。

**设计基准**：`prd.md` §3.8.4–§3.8.6、§3.10；`architecture.md` §3.2.6、§3.2.5、§3.7、§5.6.1–§5.6.2；`database.md` §3.16.8（`exports` 路径）。

**前置依赖**：**Milestone 10–13 已完成**（SOP Outbox 载荷由 U2 写入、M11 编排、M13 `regenerate-pdf` / upload complete）。

**阶段与限流**（`architecture.md` §3.2.6.3）：

| `stage` | 副作用 | 并发 |
|---------|--------|------|
| `sop.media.ocr` | Storage 卷宗 → ASR 文本拼接 `{{sop_media_extracted_text}}` | 共享 `WORKER_MAX_CONCURRENCY` |
| `sop.deep_research` | LLM（可选外网 Tool）→ artifact `draft`/`failed` | ≤ `SOP_DEEP_RESEARCH_MAX_CONCURRENT`（2） |
| `sop.pdf_export` | Playwright HTML→PDF → `exports` 桶；回写 `linked_drive_node_id` | ≤ `SOP_PDF_MAX_CONCURRENT`（1） |

**验收门禁**：Mock 集成测：重复 `outbox_event_id` 跳过；DR 超时 30min → `failed`；律师 `disabled` 不写库；`git commit` 后进入 M15。

**M14 明确不在此 Milestone**：律师/Admin 前端（M15/M16）；Playwright 安装文档可写入 `DEPLOYMENT.md` 但不阻塞 Handler 单测（Mock）。

---

#### M14-A `packages/shared` — SOP Outbox 载荷解析

- [ ] 新增 `packages/shared/src/types/sop-outbox-payload.ts`：定义 `SopOutboxPayload`（`stage` 为 SOP 三阶段之一、`pipelineId`、`lawyerId`、`stepCode?`、`artifactId?`、`storageKeyPrefix?`）
  - **依赖**：M10 `SOP_PIPELINE_STAGES` 常量
- [ ] 新增 `packages/shared/src/types/sop-outbox-payload.test.ts`：必填字段缺失抛错
  - **依赖**：上一条

- [ ] 新增 `packages/shared/src/types/parse-sop-outbox-payload.ts`：导出 `parseSopOutboxPayload(unknown): SopOutboxPayload`
  - **依赖**：`sop-outbox-payload.ts`
- [ ] 新增 `packages/shared/src/types/parse-sop-outbox-payload.test.ts`：合法 `sop.deep_research` 样例通过
  - **依赖**：上一条

- [ ] 新增 `packages/shared/src/types/parse-worker-outbox-payload.ts`：导出 `parseWorkerOutboxPayload(unknown): PipelineStageOutboxPayload | SopOutboxPayload`（按 `stage` 前缀/集合分流）
  - **依赖**：`parsePipelineStageOutboxPayload`（既有）、`parseSopOutboxPayload`
- [ ] 新增 `packages/shared/src/types/parse-worker-outbox-payload.test.ts`：转写 `media.extract` 仍解析为转写载荷
  - **依赖**：上一条

- [ ] 新增 `packages/shared/src/types/is-sop-pipeline-stage.ts`：导出 `isSopPipelineStage(stage: string): boolean`
  - **依赖**：M10 `sop-pipeline-stages.ts`
- [ ] 新增 `packages/shared/src/types/is-sop-pipeline-stage.test.ts`
  - **依赖**：上一条

- [ ] 在 `packages/shared/src/index.ts` re-export M14-A
  - **依赖**：M14-A 源文件齐全
- [ ] 新增 `packages/shared/src/index.m14-exports.test.ts`
  - **依赖**：上一条

---

#### M14-B `workers/pipeline` — 基础设施（并发、处理器分支）

- [ ] 新增 `workers/pipeline/src/infra/sop-pdf-concurrency-limiter.ts`：导出 `runWithSopPdfSlot(fn)`（`p-limit(SOP_PDF_MAX_CONCURRENT)`）
  - **依赖**：M11 `loadSopWorkerRuntimeEnvFromProcess`
- [ ] 新增 `workers/pipeline/src/infra/sop-pdf-concurrency-limiter.test.ts`：并发 2 任务仅 1 同时执行（PDF=1）
  - **依赖**：上一条

- [ ] 新增 `workers/pipeline/src/infra/sop-deep-research-concurrency-limiter.ts`：导出 `runWithSopDeepResearchSlot(fn)`
  - **依赖**：M11 SOP env
- [ ] 新增 `workers/pipeline/src/infra/sop-deep-research-concurrency-limiter.test.ts`
  - **依赖**：上一条

- [ ] 新增 `workers/pipeline/src/infra/sop-worker-concurrency-guard.ts`：导出 `runWithGlobalWorkerSlot(fn)`（复用 `getWorkerConcurrencyLimiter`；SOP 与转写共享 5 槽，`architecture.md` §3.2.6.10）
  - **依赖**：`worker-concurrency.ts`
- [ ] 新增 `workers/pipeline/src/infra/sop-worker-concurrency-guard.test.ts`
  - **依赖**：上一条

- [ ] 修改 `workers/pipeline/src/repositories/outbox-event.repository.ts`（或 `outbox.repository`）：新增 `parseWorkerPayload(event)` 调用 shared `parseWorkerOutboxPayload`
  - **依赖**：M14-A
- [ ] 新增 `workers/pipeline/src/repositories/outbox-event.repository.sop-parse.test.ts`
  - **依赖**：上一条

- [ ] 修改 `workers/pipeline/src/services/outbox-poller.service.ts`：`parseWorkerPayload` 替换仅转写解析；日志区分 `pipelineId` / `taskId`
  - **依赖**：repository 解析已扩展
- [ ] 更新 `workers/pipeline/src/services/outbox-poller.service.test.ts`：SOP 载荷不抛 `Invalid taskId`
  - **依赖**：上一条

- [ ] 修改 `workers/pipeline/src/services/pipeline-stage-processor.service.ts`：分支处理 `SopOutboxPayload`（幂等 `task_id` 列写入 `pipelineId`；路由 `SopStageRouter`）
  - **依赖**：M14-A；M14-H Handler 已注册
- [ ] 新增 `workers/pipeline/src/services/pipeline-stage-processor.service.sop.test.ts`：Mock Sop handler；重复 outbox 跳过
  - **依赖**：上一条

---

#### M14-C `workers/pipeline` — 领域纯函数

- [ ] 新增 `workers/pipeline/src/domain/sop/format-media-filename-header.ts`：导出 `formatMediaFilenameHeader(fileName: string): string`（`--- ${fileName} ---`，`prd.md` §3.8.4）
  - **依赖**：无
- [ ] 新增 `workers/pipeline/src/domain/sop/format-media-filename-header.test.ts`
  - **依赖**：上一条

- [ ] 新增 `workers/pipeline/src/domain/sop/concat-sop-media-text.ts`：导出 `concatSopMediaText(chunks: readonly { fileName; text }[]): string`
  - **依赖**：`format-media-filename-header.ts`
- [ ] 新增 `workers/pipeline/src/domain/sop/concat-sop-media-text.test.ts`：多文件顺序拼接
  - **依赖**：上一条

- [ ] 新增 `workers/pipeline/src/domain/sop/build-exports-pdf-storage-key.ts`：导出 `buildExportsPdfStorageKey(ownerId, pipelineId, artifactId)` → `{ownerId}/sops/{pipelineId}/{artifactId}.pdf`
  - **依赖**：无
- [ ] 新增 `workers/pipeline/src/domain/sop/build-exports-pdf-storage-key.test.ts`：首段为 `ownerId`
  - **依赖**：上一条

- [ ] 新增 `workers/pipeline/src/domain/sop/is-external-search-available.ts`：导出 `isExternalSearchAvailable(): Promise<boolean>`（探测配置端点；失败→ false，`architecture.md` §3.2.6.7）
  - **依赖**：无
- [ ] 新增 `workers/pipeline/src/domain/sop/is-external-search-available.test.ts`：Mock fetch 超时返回 false
  - **依赖**：上一条

---

#### M14-D `workers/pipeline` — Repository（`service_role`）

- [ ] 新增 `workers/pipeline/src/repositories/worker-case-pipeline.repository.ts`：骨架（`pg` + Supabase service_role）
  - **依赖**：M10 `case_pipelines`
- [ ] 新增 `workers/pipeline/src/repositories/worker-case-pipeline.repository.test.ts`
  - **依赖**：上一条

- [ ] 实现 `assertLawyerPipelineWritable(pipelineId)`：校验 `lawyer_id` 对应 `profiles.status=enabled`（`architecture.md` §5.6.2 / `prd.md` §2.3）
  - **依赖**：Repository 骨架
- [ ] 新增 `worker-case-pipeline.repository.assert-writable.test.ts`
  - **依赖**：上一条

- [ ] 实现 `findPipelineWithLawyer(pipelineId)`、`updateCurrentStepCode(...)`
  - **依赖**：assert 已实现
- [ ] 新增 `worker-case-pipeline.repository.find.test.ts`
  - **依赖**：上一条

- [ ] 新增 `workers/pipeline/src/repositories/worker-pipeline-artifact.repository.ts`：骨架
  - **依赖**：M10 `pipeline_artifacts`
- [ ] 新增 `workers/pipeline/src/repositories/worker-pipeline-artifact.repository.test.ts`
  - **依赖**：上一条

- [ ] 实现 `findArtifactById`、`setArtifactStatus`、`setContentRaw`、`setLinkedDriveNodeId`
  - **依赖**：artifact repo 骨架
- [ ] 新增 `worker-pipeline-artifact.repository.mutations.test.ts`
  - **依赖**：上一条

- [ ] 实现 `loadFinalizedSnapshotHtml(artifactId)`（读 `finalized_snapshot_raw` 或 `content_raw`）
  - **依赖**：find 已实现
- [ ] 新增 `worker-pipeline-artifact.repository.load-html.test.ts`
  - **依赖**：上一条

- [ ] 新增 `workers/pipeline/src/repositories/worker-sop-media.repository.ts`：列出 `storageKeyPrefix` 下对象键（`media` 桶）
  - **依赖**：`WorkerStorageAdapter`
- [ ] 新增 `workers/pipeline/src/repositories/worker-sop-media.repository.test.ts`
  - **依赖**：上一条

- [ ] 新增 `workers/pipeline/src/repositories/worker-system-settings.repository.ts`：读 `sop.deep_research_enabled`
  - **依赖**：M10 seed
- [ ] 新增 `workers/pipeline/src/repositories/worker-system-settings.repository.test.ts`
  - **依赖**：上一条

---

#### M14-E `workers/pipeline` — Service：`sop.media.ocr`（按函数拆分）

- [ ] 新增 `workers/pipeline/src/services/sop-media-ocr.service.ts`：类骨架 `SopMediaOcrService`
  - **依赖**：M14-D repos；M14-C concat
- [ ] 新增 `workers/pipeline/src/services/sop-media-ocr.service.test.ts`
  - **依赖**：上一条

- [ ] 提取 `downloadMediaObjectToTemp(storageKey, localPath)` 私有方法
  - **依赖**：service 骨架
- [ ] 新增 `sop-media-ocr.service.download.test.ts`（Mock storage）
  - **依赖**：上一条

- [ ] 提取 `transcribeMediaFile(localPath): Promise<string>`（复用 `AiOrchestrationService` + `asr_physical`）
  - **依赖**：download 方法
- [ ] 新增 `sop-media-ocr.service.transcribe.test.ts`
  - **依赖**：上一条

- [ ] 提取 `persistSopMediaExtractedText(pipelineId, stepCode, text)`：写入步骤上下文存储【DB 列/JSON 字段策略与 M13 对齐，如 `pipeline_artifacts` 或专用 KV】
  - **依赖**：transcribe 已实现
- [ ] 新增 `sop-media-ocr.service.persist.test.ts`
  - **依赖**：上一条

- [ ] 实现 `run(payload: SopOutboxPayload)`：编排上述步骤；成功 `markPublished`；失败抛错
  - **依赖**：全部子函数
- [ ] 更新 `sop-media-ocr.service.test.ts` 端到端 Mock
  - **依赖**：上一条

---

#### M14-F `workers/pipeline` — Service：`sop.deep_research`

- [ ] 新增 `workers/pipeline/src/services/sop-deep-research.service.ts`：骨架
  - **依赖**：M11 `SopLlmOrchestration` 或 `AiOrchestrationService` SOP 路径
- [ ] 新增 `workers/pipeline/src/services/sop-deep-research.service.test.ts`
  - **依赖**：上一条

- [ ] 提取 `assertDeepResearchEnabled()`：读 `worker-system-settings`；false 时 artifact `failed` 并返回（Worker 防御，U2 已拦）
  - **依赖**：service 骨架
- [ ] 新增 `sop-deep-research.service.settings.test.ts`
  - **依赖**：上一条

- [ ] 提取 `runWithTimeout(promise, SOP_DEEP_RESEARCH_TIMEOUT_MS)` 包装
  - **依赖**：M11 env
- [ ] 新增 `sop-deep-research.service.timeout.test.ts`：超时 → `failed`
  - **依赖**：上一条

- [ ] 提取 `runExternalSearchOrSkip()`：外网不可用则降级 LLM-only（`is-external-search-available`）
  - **依赖**：M14-C
- [ ] 新增 `sop-deep-research.service.degrade.test.ts`
  - **依赖**：上一条

- [ ] 提取 `writeDraftArtifact(artifactId, markdown)` / `writeFailedArtifact(...)`
  - **依赖**：worker-pipeline-artifact repo
- [ ] 新增 `sop-deep-research.service.artifact-status.test.ts`
  - **依赖**：上一条

- [ ] 实现 `run(payload)`：组装 Prompt（读步骤模板快照）→ 编排 LLM → 更新 artifact；写 `ai_invocation_logs`（`task_id` null + metadata）
  - **依赖**：上述子函数
- [ ] 更新 `sop-deep-research.service.test.ts` 主路径 Mock
  - **依赖**：上一条

---

#### M14-G `workers/pipeline` — Service：`sop.pdf_export`（Playwright）

- [ ] **经用户授权后**在 `workers/pipeline/package.json` 添加 `playwright` 依赖（或文档化系统 `npx playwright install chromium`）
  - **依赖**：无
- [ ] 新增 `workers/pipeline/src/services/sop-pdf-export.service.deps.test.ts`：断言 `package.json` 含 playwright【或 skip 若纯 Mock】
  - **依赖**：上一条

- [ ] 新增 `workers/pipeline/src/services/sop-pdf-export.service.ts`：骨架
  - **依赖**：M14-D；M14-C `build-exports-pdf-storage-key`
- [ ] 新增 `workers/pipeline/src/services/sop-pdf-export.service.test.ts`
  - **依赖**：上一条

- [ ] 提取 `renderHtmlToPdfBuffer(html: string): Promise<Buffer>`（Playwright `page.setContent` + `pdf()`）
  - **依赖**：service 骨架
- [ ] 新增 `sop-pdf-export.service.render.test.ts`：Mock Playwright API
  - **依赖**：上一条

- [ ] 提取 `uploadPdfToExports(buffer, storageKey)`
  - **依赖**：`WorkerStorageAdapter`
- [ ] 新增 `sop-pdf-export.service.upload.test.ts`
  - **依赖**：上一条

- [ ] 提取 `linkPdfToDriveNode(pipelineId, artifactId, storageKey)`（创建/更新 `drive_nodes` + `linked_drive_node_id`）
  - **依赖**：`WorkerDriveRepository` 或新 `worker-sop-drive.repository.ts`
- [ ] 新增 `sop-pdf-export.service.drive-link.test.ts`
  - **依赖**：上一条

- [ ] 实现 `run(payload)`：失败**不**回滚 `finalized`；仅日志 + 可重试 Outbox（`publish_attempts` 递增，`prd.md` §3.8.5）
  - **依赖**：上述子函数
- [ ] 更新 `sop-pdf-export.service.test.ts`：失败时 `status` 仍为 `finalized`
  - **依赖**：上一条

---

#### M14-H `workers/pipeline` — Handler 与错误处理（每条一个文件）

- [ ] 新增 `workers/pipeline/src/handlers/sop-stage-handler.ts`：定义 `SopStageHandlerContext`（`SopOutboxPayload`）与 `SopStageHandler` 接口
  - **依赖**：M14-A
- [ ] 新增 `workers/pipeline/src/handlers/sop-stage-handler.test.ts`：类型 smoke
  - **依赖**：上一条

- [ ] 新增 `workers/pipeline/src/handlers/sop-media-ocr.handler.ts`：实现 `SopStageHandler`；内调 `SopMediaOcrService.run`
  - **依赖**：M14-E
- [ ] 新增 `workers/pipeline/src/handlers/sop-media-ocr.handler.test.ts`
  - **依赖**：上一条

- [ ] 新增 `workers/pipeline/src/handlers/sop-deep-research.handler.ts`：包裹 `runWithSopDeepResearchSlot` + `runWithGlobalWorkerSlot`
  - **依赖**：M14-F；M14-B limiters
- [ ] 新增 `workers/pipeline/src/handlers/sop-deep-research.handler.test.ts`
  - **依赖**：上一条

- [ ] 新增 `workers/pipeline/src/handlers/sop-pdf-export.handler.ts`：包裹 `runWithSopPdfSlot` + `runWithGlobalWorkerSlot`
  - **依赖**：M14-G；M14-B limiters
- [ ] 新增 `workers/pipeline/src/handlers/sop-pdf-export.handler.test.ts`
  - **依赖**：上一条

- [ ] 新增 `workers/pipeline/src/handlers/sop-stage-error.handler.ts`：SOP 失败时 `pipeline_artifacts.status=failed`（**不**调用 `transition_task_status`）
  - **依赖**：M14-D artifact repo
- [ ] 新增 `workers/pipeline/src/handlers/sop-stage-error.handler.test.ts`
  - **依赖**：上一条

- [ ] 修改 `workers/pipeline/src/services/stage-router.ts`：支持 `PipelineStage | SopPipelineStage` 联合路由（或新增 `SopStageRouter` 类）
  - **依赖**：三 Handler 已存在
- [ ] 新增 `workers/pipeline/src/services/sop-stage-router.test.ts`：解析 `sop.pdf_export` 返回对应 Handler
  - **依赖**：上一条

---

#### M14-I `workers/pipeline` — Bootstrap 装配与完成 Outbox

- [ ] 修改 `workers/pipeline/src/bootstrap/create-pipeline-deps.ts`：实例化 SOP Services/Handlers 并注册到 `SopStageRouter` / 扩展 `StageRouter`
  - **依赖**：M14-H
- [ ] 新增 `workers/pipeline/src/bootstrap/create-pipeline-deps.sop.test.ts`：导出 processor 含 8 个 stage 键
  - **依赖**：上一条

- [ ] 在 `Sop*Handler` 成功路径调用 `WorkerOutboxRepository.markPublished`（与转写 Handler 一致）
  - **依赖**：bootstrap 已接线
- [ ] 新增 `workers/pipeline/src/__tests__/sop-handler-marks-published.test.ts`：Mock DB 断言 `published_at` 非空
  - **依赖**：上一条

- [ ] 修改 `workers/pipeline/src/index.ts` 启动日志：输出 `SOP_PDF_MAX_CONCURRENT`、`SOP_DEEP_RESEARCH_MAX_CONCURRENT`
  - **依赖**：M11 worker env 合并
- [ ] 新增 `workers/pipeline/src/index.sop-env-log.test.ts`（可选：捕获 console）
  - **依赖**：上一条

---

#### M14-J 集成测试与 Milestone 14 完成门禁

- [ ] 新增 `workers/pipeline/src/__tests__/sop-outbox-idempotency.integration.test.ts`：同一 `outbox_event_id` 处理两次 → 第二次 `skipped_duplicate`
  - **依赖**：M14-I
- [ ] 新增 `workers/pipeline/src/__tests__/sop-deep-research-disabled-lawyer.integration.test.ts`：disabled 律师 → 不写 artifact（Mock）
  - **依赖**：M14-F assert

- [ ] 新增 `workers/pipeline/src/__tests__/sop-pdf-export-path.integration.test.ts`：上传 key 匹配 `{ownerId}/sops/{pipelineId}/{artifactId}.pdf`（Mock storage）
  - **依赖**：M14-G

- [ ] 在 `docs/DEPLOYMENT.md` 增加「SOP Worker」小节：`playwright install`、三 stage 环境变量（**不**改其他 Milestone 文件以外内容若用户未要求—本条为部署说明单段）
  - **依赖**：M14-G
- [ ] 新增 `tools/compliance/no-u2-sync-sop-pdf.test.ts`：扫描 `apps/api` 禁止 `playwright` 生产 import（`architecture.md` U2 禁止无头 PDF）
  - **依赖**：无

- [ ] 运行 `workers/pipeline` 测试全绿；连续失败 **>2** 次则停止汇报
  - **依赖**：M14-A～M14-I 完成

**人工黑盒验收**（由人工启动 U1/U2/U3 联调栈执行，不通过不得 `git commit`）：

- [ ] **【人工黑盒】** 启动 `worker:pipeline`；律师完成卷宗 `uploads/complete` 后，观察 `outbox_events` 出现 `stage=sop.media.ocr` 且最终被消费（`published_at` 非空）
  - **依赖**：M13 卷宗 complete；M14 OCR Handler
- [ ] **【人工黑盒】** 对含 `async_deep_research` 的流水线：execute 202 后，轮询 `pipeline_artifacts.status` 由 `running` 变为 `draft` 或 `failed`（**禁止** U2 进程长时间阻塞）
  - **依赖**：M14-F DR Handler
- [ ] **【人工黑盒】** 对 `html` 步骤 finalize 后：Outbox 出现 `sop.pdf_export`；成功时 `exports` 桶可见 `{owner_id}/sops/{pipeline_id}/{artifact_id}.pdf` 或 `linked_drive_node_id` 回写
  - **依赖**：M14-G PDF Handler；Playwright 已安装
- [ ] **【人工黑盒】** 重复投递同一 Outbox 事件（或集成测模拟）：不产生重复 ASR/LLM 副作用（`pipeline_job_runs` 幂等）
  - **依赖**：M14-J 集成测或人工重放
- [ ] **【人工黑盒】** 禁用律师账号后：Worker 不再为该律师写入新 artifact（或标记失败），无跨用户数据泄露
  - **依赖**：M14-F `assertLawyerEnabled`
- [ ] **【人工黑盒验收签收】** 在 `docs/E2E_MANUAL_RUN_LOG.md` 追加 **M14** 小节
  - **依赖**：上列黑盒项均通过

- [ ] 执行 `git commit`：`feat(worker): sop outbox handlers media ocr deep research pdf export`
  - **依赖**：测试全绿；**人工黑盒验收签收**
- [ ] 将下方进度表 **M14** 状态更新为「已完成」
  - **依赖**：`git commit` 成功

---

### Milestone 15：管理员 — SOP 配置前端

**目标**：Admin Prompt Studio 与 SOP 模板版本管理 UI；对接 M12 `/api/admin/sops/*`；已发布版本只读；草稿可编辑步骤/Prompt 绑定；发布与新建版本草稿；沙盒试跑。

**设计基准**：`prd.md` §3.4.1、§3.9.1；`architecture.md` §7；`ui_design.md` §2–§3、§5.1、§6.5（高密度表）；`CONTEXT_SUMMARY.md` §11。

**前置依赖**：**Milestone 12 已完成**（Admin SOP API 可用）；M11（AI 配置页已展示四 SOP 功能点，供步骤绑定 `prompt_template_id`）。

**页面路由（建议）**：

| 路径 | 用途 |
|------|------|
| `/admin/sops` | 模板列表 + 新建模板 |
| `/admin/sops/templates/[templateId]` | 版本时间线、进入版本编辑 |
| `/admin/sops/template-versions/[versionId]` | 步骤/Prompt 编辑、发布、预览沙盒 |

**验收门禁**：Admin 完成「新建模板 → 编辑草稿步骤 → 发布 → 新建版本草稿 → 再发布」；已发布版本控件禁用且保存返回 422 Toast；`git commit` 后进入 M16。

**M15 明确不在此 Milestone**：律师端 SOP UI（M16）；Monaco/HTML 双栏（M16）；Mermaid/图表库。

---

#### M15-A Shadcn 组件引入（每条命令一项）

- [ ] 执行 `npx shadcn@latest add scroll-area`（步骤编辑区长列表；若 M6 已引入则跳过并勾选）
  - **依赖**：M1 Shadcn 基建已存在
- [ ] 执行 `npx shadcn@latest add accordion`（版本折叠面板，若已存在则跳过）
  - **依赖**：无
- [ ] 执行 `npx shadcn@latest add textarea`（JSON Schema / Mustache 说明；若已存在则跳过）
  - **依赖**：无

---

#### M15-B `apps/web` — API 客户端（每条函数一个任务 + 测试）

- [ ] 新增 `apps/web/src/lib/admin-sops-api.ts`：文件骨架 + 复用 `apiFetch` / `ApiSuccess` 类型
  - **依赖**：M12 API 已部署或 Mock 联调
- [ ] 新增 `apps/web/src/lib/admin-sops-api.types.ts`：定义 `AdminSopTemplateListItem`、`AdminSopVersionDetail` 等（对齐 M12 shared 类型或本地映射）
  - **依赖**：上一条
- [ ] 新增 `apps/web/src/lib/admin-sops-api.types.test.ts`：类型构造 smoke
  - **依赖**：上一条

- [ ] 在 `admin-sops-api.ts` 实现 `listAdminSops(query?)` → `GET /api/admin/sops`
  - **依赖**：types 已定义
- [ ] 新增 `apps/web/src/lib/admin-sops-api.list.test.ts`：Mock `fetch` 解析 `items` 数组
  - **依赖**：上一条

- [ ] 实现 `createAdminSopTemplate(body)` → `POST /api/admin/sops/templates`
  - **依赖**：`listAdminSops`
- [ ] 新增 `admin-sops-api.create-template.test.ts`
  - **依赖**：上一条

- [ ] 实现 `getAdminSopTemplate(templateId)` → `GET /api/admin/sops/templates/:id`
  - **依赖**：create 已实现
- [ ] 新增 `admin-sops-api.get-template.test.ts`
  - **依赖**：上一条

- [ ] 实现 `getAdminSopTemplateVersion(versionId)` → `GET /api/admin/sops/template-versions/:id`
  - **依赖**：get template 已实现
- [ ] 新增 `admin-sops-api.get-version.test.ts`
  - **依赖**：上一条

- [ ] 实现 `upsertAdminSopVersionPrompts(versionId, body)` → `PUT .../prompts`
  - **依赖**：get version 已实现
- [ ] 新增 `admin-sops-api.upsert-prompts.test.ts`：422 时抛出 `ApiClientError`
  - **依赖**：上一条

- [ ] 实现 `publishAdminSopTemplateVersion(versionId)` → `POST .../publish`
  - **依赖**：upsert 已实现
- [ ] 新增 `admin-sops-api.publish.test.ts`
  - **依赖**：上一条

- [ ] 实现 `createAdminSopTemplateVersion(templateId, body?)` → `POST .../templates/:id/versions`
  - **依赖**：publish 已实现
- [ ] 新增 `admin-sops-api.create-version.test.ts`
  - **依赖**：上一条

- [ ] 实现 `previewAdminSopPipeline(body)` → `POST /api/admin/sops/preview-pipeline`
  - **依赖**：create version 已实现
- [ ] 新增 `apps/web/src/lib/admin-sops-api.preview.test.ts`
  - **依赖**：上一条

---

#### M15-C `apps/web` — 展示辅助（标签/徽章，单文件）

- [ ] 新增 `apps/web/src/components/admin/sops/sop-execution-type-label.ts`：导出 `executionTypeLabel(type)`（`sync_llm` / `async_deep_research` / `manual`）
  - **依赖**：无
- [ ] 新增 `apps/web/src/components/admin/sops/sop-execution-type-label.test.ts`
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/components/admin/sops/sop-version-status-badge.tsx`：已发布/草稿 Badge（令牌色，禁止 hex）
  - **依赖**：Shadcn `badge`
- [ ] 新增 `apps/web/src/components/admin/sops/sop-version-status-badge.test.tsx`：渲染「已发布」
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/components/admin/sops/sop-published-readonly-banner.tsx`：`isPublished` 时顶部 Alert 文案「已发布只读，请新建版本草稿」
  - **依赖**：Shadcn `alert`
- [ ] 新增 `apps/web/src/components/admin/sops/sop-published-readonly-banner.test.tsx`
  - **依赖**：上一条

---

#### M15-D `apps/web` — 导航与路由守卫

- [ ] 在 `apps/web/src/lib/menus.ts` 增加 `{ href: "/admin/sops", label: "SOP 模板", allowedRoles: ["admin"] }`（`ui_design.md` §5.1）
  - **依赖**：无
- [ ] 新增 `apps/web/src/lib/menus.sop.test.ts`：admin 角色可见该项
  - **依赖**：上一条

- [ ] 确认 `middleware.ts` / `router-guard`：`/admin/sops` 仅 `admin`（lawyer → `/unauthorized`）
  - **依赖**：menus 已更新
- [ ] 新增 `apps/web/src/lib/router-guard.sop.test.ts`（若项目有 guard 单测；否则记入 M17 E2E）
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/app/(app)/admin/sops/page.tsx`：挂载 `AdminSopsPagePanel`；Skeleton/Error/Empty
  - **依赖**：M15-E 面板
- [ ] 新增 `apps/web/src/app/(app)/admin/sops/page.test.tsx`：导出默认组件 smoke
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/app/(app)/admin/sops/templates/[templateId]/page.tsx`：版本列表页
  - **依赖**：M15-F 时间线组件
- [ ] 新增 `apps/web/src/app/(app)/admin/sops/templates/[templateId]/page.test.tsx`
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/app/(app)/admin/sops/template-versions/[versionId]/page.tsx`：版本编辑页
  - **依赖**：M15-G 编辑壳
- [ ] 新增 `apps/web/src/app/(app)/admin/sops/template-versions/[versionId]/page.test.tsx`
  - **依赖**：上一条

---

#### M15-E `apps/web` — 模板列表页组件

- [ ] 新增 `apps/web/src/components/admin/sops/AdminSopsPagePanel.tsx`：Flex 列；工具栏 + 表格（`ui_design.md` §6.5）
  - **依赖**：M15-B `listAdminSops`
- [ ] 新增 `apps/web/src/components/admin/sops/AdminSopsPagePanel.test.tsx`：Loading 显示 Skeleton
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/components/admin/sops/admin-sops-templates-table.tsx`：列：模板名、`case_type`、最新版本、是否已发布、操作
  - **依赖**：Panel 骨架
- [ ] 新增 `apps/web/src/components/admin/sops/admin-sops-templates-table.test.tsx`
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/components/admin/sops/create-sop-template-dialog.tsx`：Dialog + Form（`name`、`caseType`）；提交 `createAdminSopTemplate`
  - **依赖**：M15-B create API
- [ ] 新增 `apps/web/src/components/admin/sops/create-sop-template-dialog.test.tsx`
  - **依赖**：上一条

---

#### M15-F `apps/web` — 版本时间线（模板详情页）

- [ ] 新增 `apps/web/src/components/admin/sops/AdminSopTemplateDetailPanel.tsx`：加载 `getAdminSopTemplate`；展示版本列表
  - **依赖**：M15-B get template
- [ ] 新增 `apps/web/src/components/admin/sops/AdminSopTemplateDetailPanel.test.tsx`
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/components/admin/sops/sop-template-versions-table.tsx`：列：`version_number`、`is_published`、`published_at`、操作「编辑/查看」
  - **依赖**：DetailPanel
- [ ] 新增 `apps/web/src/components/admin/sops/sop-template-versions-table.test.tsx`
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/components/admin/sops/create-sop-version-dialog.tsx`：`AlertDialog` 确认后 `createAdminSopTemplateVersion`
  - **依赖**：M15-B create version API
- [ ] 新增 `apps/web/src/components/admin/sops/create-sop-version-dialog.test.tsx`
  - **依赖**：上一条

---

#### M15-G `apps/web` — 版本编辑壳（只读态）

- [ ] 新增 `apps/web/src/components/admin/sops/AdminSopVersionEditorShell.tsx`：Grid 布局（侧栏步骤列表 + 主区）；挂载 `SopPublishedReadonlyBanner`
  - **依赖**：M15-C banner；`ui_design.md` §3 Grid
- [ ] 新增 `apps/web/src/components/admin/sops/AdminSopVersionEditorShell.test.tsx`
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/components/admin/sops/sop-version-editor-toolbar.tsx`：按钮「保存步骤」「发布」「新建版本草稿」「预览 Prompt」；`isPublished` 时禁用保存/发布
  - **依赖**：EditorShell
- [ ] 新增 `apps/web/src/components/admin/sops/sop-version-editor-toolbar.test.tsx`：已发布时保存按钮 `disabled`
  - **依赖**：上一条

- [ ] 在 `AdminSopVersionEditorShell` 内调用 `getAdminSopTemplateVersion(versionId)` 加载数据
  - **依赖**：M15-B；子组件骨架
- [ ] 新增 `AdminSopVersionEditorShell.load.test.tsx`：Error 时 Toast
  - **依赖**：上一条

---

#### M15-H `apps/web` — 步骤列表与 DAG `depends_on` 编辑

- [ ] 新增 `apps/web/src/components/admin/sops/sop-steps-list.tsx`：左侧步骤 `step_code` 列表；选中高亮
  - **依赖**：EditorShell
- [ ] 新增 `apps/web/src/components/admin/sops/sop-steps-list.test.tsx`
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/components/admin/sops/sop-step-editor-form.tsx`：RHF + zod：`stepCode`、`name`、`executionType` Select、`requiresVerification` Switch
  - **依赖**：Shadcn `form`/`select`/`switch`
- [ ] 新增 `apps/web/src/components/admin/sops/sop-step-editor-form.test.tsx`
  - **依赖**：上一条

- [ ] 在 `sop-step-editor-form.tsx` 增加 `aiFeatureKey` Select（选项来自 `ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES` 中四个 `sop.*`）
  - **依赖**：M11 shared 导出
- [ ] 新增 `sop-step-editor-form.ai-feature.test.tsx`：`manual` 时隐藏 AI 字段
  - **依赖**：上一条

- [ ] 在 `sop-step-editor-form.tsx` 增加 `promptTemplateId` Select（`listPrompts` 过滤对应 `featureKey`）
  - **依赖**：`admin-ai-api.ts` `listPrompts`
- [ ] 新增 `sop-step-editor-form.prompt-template.test.tsx`
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/components/admin/sops/sop-depends-on-multi-select.tsx`：多选前置 `step_code`（禁止选自身）
  - **依赖**：步骤列表数据
- [ ] 新增 `apps/web/src/components/admin/sops/sop-depends-on-multi-select.test.tsx`
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/components/admin/sops/sop-mustache-hint.tsx`：静态说明 `{{artifact_{step_code}_*}}` 须列入 `depends_on`（`prd.md` §2.4）
  - **依赖**：无
- [ ] 新增 `apps/web/src/components/admin/sops/sop-mustache-hint.test.tsx`
  - **依赖**：上一条

---

#### M15-I `apps/web` — JSON Schema 编辑器（`input_schema`）

- [ ] 新增 `apps/web/src/lib/validate-json-schema-text.ts`：导出 `validateJsonSchemaText(text): { ok, error? }`（`JSON.parse` + 最小对象校验）
  - **依赖**：无
- [ ] 新增 `apps/web/src/lib/validate-json-schema-text.test.ts`：非法 JSON 返回错误
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/components/admin/sops/sop-input-schema-editor.tsx`：`Textarea` 绑定 `input_schema`；保存前校验
  - **依赖**：validate 工具
- [ ] 新增 `apps/web/src/components/admin/sops/sop-input-schema-editor.test.tsx`
  - **依赖**：上一条

- [ ] 在工具栏「保存步骤」点击时聚合全部步骤为 `upsertAdminSopVersionPrompts` body
  - **依赖**：step form + schema editor + depends_on
- [ ] 新增 `apps/web/src/components/admin/sops/sop-save-version-prompts.test.tsx`：Mock API 被调用一次
  - **依赖**：上一条

---

#### M15-J `apps/web` — 发布与新建版本交互

- [ ] 新增 `apps/web/src/components/admin/sops/publish-sop-version-alert-dialog.tsx`：二次确认 → `publishAdminSopTemplateVersion`；成功 Toast
  - **依赖**：M15-B publish API
- [ ] 新增 `apps/web/src/components/admin/sops/publish-sop-version-alert-dialog.test.tsx`
  - **依赖**：上一条

- [ ] 在 `publish-sop-version-alert-dialog` 处理 API 422：Toast 展示发布校验错误（缺映射/DAG）
  - **依赖**：dialog 骨架
- [ ] 新增 `publish-sop-version-alert-dialog.error.test.tsx`
  - **依赖**：上一条

- [ ] 将 `create-sop-version-dialog` 在已发布版本工具栏挂载；成功后 `router.push` 新 `versionId`
  - **依赖**：M15-F dialog；Next router
- [ ] 新增 `create-sop-version-dialog.navigate.test.tsx`
  - **依赖**：上一条

---

#### M15-K `apps/web` — Prompt 沙盒预览

- [ ] 新增 `apps/web/src/components/admin/sops/sop-preview-pipeline-dialog.tsx`：Dialog；表单 `stepCode` + 模拟 `formValues` JSON + 可选上游 artifact 文本
  - **依赖**：M15-B `previewAdminSopPipeline`
- [ ] 新增 `apps/web/src/components/admin/sops/sop-preview-pipeline-dialog.test.tsx`
  - **依赖**：上一条

- [ ] 在预览 Dialog 展示 LLM 输出只读 `ScrollArea`（**禁止** Mermaid/图表库渲染）
  - **依赖**：dialog 骨架
- [ ] 新增 `sop-preview-pipeline-dialog.result.test.tsx`：Mock 返回 markdown 文本渲染为 `<pre>`
  - **依赖**：上一条

---

#### M15-L Milestone 15 完成门禁

**人工黑盒验收**（由产品在浏览器中执行，不通过不得 `git commit`）：

- [ ] **【人工黑盒】** admin 登录 → `/admin/sops` 新建模板 → 进入版本编辑 → 添加 2 步 DAG（含 `depends_on`）→ 保存 → 发布 → 新建草稿版本 → 再编辑并发布
  - **依赖**：M15-A～M15-K 完成
- [ ] **【人工黑盒】** 已发布版本打开编辑页：保存/发布按钮 **disabled**；DevTools 强制调用保存 API 时界面 Toast 展示 422 友好文案
  - **依赖**：上一条
- [ ] **【人工黑盒】** lawyer 账号访问 `/admin/sops` → `/unauthorized` 或等价拒绝页
  - **依赖**：M15-D guard
- [ ] **【人工黑盒】** Prompt 沙盒预览：输入模拟表单与上游文本，预览区仅展示纯文本/Markdown，**无** Mermaid/图表库渲染
  - **依赖**：M15-K
- [ ] **【人工黑盒验收签收】** 在 `docs/E2E_MANUAL_RUN_LOG.md` 追加 **M15** 小节
  - **依赖**：上列黑盒项均通过

- [ ] 执行 `git commit`：`feat(web): admin sop prompt studio and template versioning ui`
  - **依赖**：**人工黑盒验收签收**
- [ ] 将下方进度表 **M15** 状态更新为「已完成」
  - **依赖**：`git commit` 成功

---

### Milestone 16：律师端 — SOP 流水线前端

**目标**：律师从已发布模板创建流水线 → 卷宗 TUS → 步骤 `execute`/`finalize` → HTML 产出物双栏编辑 → 显式结案；对接 M13 `/api/sops/*`；状态 HTTP 轮询 **≥2s**。

**设计基准**：`prd.md` §3.8.1–§3.8.6、§3.9.2–§3.9.3、§3.10；`architecture.md` §3.2.6.5–§3.2.6.7、§7；`ui_design.md` §2–§3、§6.3（TUS 离开确认）；`CONTEXT_SUMMARY.md` §6、§11。

**前置依赖**：**Milestone 13 已完成**（律师 SOP API）；**Milestone 14 已完成**（`sop.media.ocr` / `sop.deep_research` / `sop.pdf_export` 可被轮询感知）；M6（`AppShell`、Toast、转写 TUS 基建可复用）。

**页面路由（建议）**：

| 路径 | 用途 |
|------|------|
| `/sops` | 已发布模板选择 + 创建流水线（**首期无**「我的流水线列表」API） |
| `/sops/pipelines/[pipelineId]` | 步骤看板、当前步骤操作、产出物编辑、结案 |

**验收门禁**：律师完成「选模板 → 建实例 → 卷宗上传 → sync 步骤 execute/finalize → async 步骤 202 后轮询 running→draft/failed → HTML 双栏 PATCH 定稿 → 显式结案」；`deep_research` 关闭时 UI 禁用对应步骤；`git commit` 后进入 M17。

**M16 明确不在此 Milestone**：Admin Prompt Studio（M15）；E2E/合规全量（M17）；WebSocket/邮件进度；Mermaid/图表库；上游已定稿 break-glass 改稿入口。

---

#### M16-A `apps/web` 依赖与 Shadcn（单包/单命令一项）

- [ ] 在 `apps/web/package.json` 增加 `@monaco-editor/react` 依赖（HTML 源码编辑，`prd.md` §3.8.5）
  - **依赖**：无
- [ ] 在 `apps/web/package.json` 增加 `@rjsf/core`、`@rjsf/utils`、`@rjsf/validator-ajv8`（`input_schema` 动态表单，`prd.md` §3.8.4）
  - **依赖**：无
- [ ] 在 `apps/web/package.json` 增加 `isomorphic-dompurify`（非 iframe 场景的 HTML 片段展示，`prd.md` §3.10）
  - **依赖**：无
- [ ] 执行 `npm install`（workspace 根目录）并确认 lockfile 更新
  - **依赖**：上三条 package.json 变更
- [ ] 执行 `npx shadcn@latest add progress`（步骤/上传进度；若已存在则跳过）
  - **依赖**：M1 Shadcn 基建
- [ ] 执行 `npx shadcn@latest add toggle`（HTML 预览黑白模式切换，`prd.md` §3.8.5）
  - **依赖**：无

---

#### M16-B `apps/web` — API 客户端（每条函数一个任务 + 测试）

- [ ] 新增 `apps/web/src/lib/lawyer-sops-api.ts`：文件骨架 + 复用 `apiFetch` / `ApiClientError`
  - **依赖**：M13 API 可联调
- [ ] 新增 `apps/web/src/lib/lawyer-sops-api.types.ts`：定义 `SopPublishedTemplateItem`、`SopPipelineStatusResponse` 等（对齐 `@lexos/shared` 或 M13 响应）
  - **依赖**：上一条
- [ ] 新增 `apps/web/src/lib/lawyer-sops-api.types.test.ts`
  - **依赖**：上一条

- [ ] 在 `lawyer-sops-api.ts` 实现 `listSopTemplates(query?)` → `GET /api/sops/templates`
  - **依赖**：types 已定义
- [ ] 新增 `apps/web/src/lib/lawyer-sops-api.list-templates.test.ts`
  - **依赖**：上一条

- [ ] 实现 `createSopPipeline(body)` → `POST /api/sops/pipelines`（Body `templateVersionId`）
  - **依赖**：list 已实现
- [ ] 新增 `lawyer-sops-api.create-pipeline.test.ts`：未发布版本 Mock 422
  - **依赖**：上一条

- [ ] 实现 `getSopPipelineStatus(pipelineId)` → `GET /api/sops/pipelines/:id/status`
  - **依赖**：create 已实现
- [ ] 新增 `lawyer-sops-api.get-status.test.ts`
  - **依赖**：上一条

- [ ] 实现 `resumeSopPipeline(pipelineId)` → `POST .../resume`
  - **依赖**：get status 已实现
- [ ] 新增 `lawyer-sops-api.resume.test.ts`
  - **依赖**：上一条

- [ ] 实现 `closeSopPipeline(pipelineId)` → `POST .../close`
  - **依赖**：resume 已实现
- [ ] 新增 `lawyer-sops-api.close.test.ts`
  - **依赖**：上一条

- [ ] 实现 `initSopUpload(body)` → `POST /api/sops/uploads/init`
  - **依赖**：无
- [ ] 新增 `lawyer-sops-api.init-upload.test.ts`
  - **依赖**：上一条

- [ ] 实现 `completeSopUpload(body)` → `POST /api/sops/uploads/complete`
  - **依赖**：init 已实现
- [ ] 新增 `lawyer-sops-api.complete-upload.test.ts`
  - **依赖**：上一条

- [ ] 实现 `executeSopStep(pipelineId, stepCode, body)` → `POST .../steps/:code/execute`（解析 200/202）
  - **依赖**：status API 已实现
- [ ] 新增 `lawyer-sops-api.execute.test.ts`：202 时返回 `artifactId`
  - **依赖**：上一条

- [ ] 实现 `finalizeSopStep(pipelineId, stepCode)` → `POST .../steps/:code/finalize`
  - **依赖**：execute 已实现
- [ ] 新增 `lawyer-sops-api.finalize.test.ts`：未 Verified Mock 422
  - **依赖**：上一条

- [ ] 实现 `getSopArtifact(artifactId)` → `GET /api/sops/artifacts/:id`
  - **依赖**：无
- [ ] 新增 `lawyer-sops-api.get-artifact.test.ts`
  - **依赖**：上一条

- [ ] 实现 `patchSopArtifact(artifactId, version, body)` → `PATCH` + Header `If-Match`
  - **依赖**：get artifact 已实现
- [ ] 新增 `lawyer-sops-api.patch-artifact.test.ts`：409 `RESOURCE_CONFLICT`
  - **依赖**：上一条

- [ ] 实现 `verifySopArtifact(artifactId)` → `POST .../verify`
  - **依赖**：patch 已实现
- [ ] 新增 `lawyer-sops-api.verify-artifact.test.ts`
  - **依赖**：上一条

- [ ] 实现 `regenerateSopArtifactPdf(artifactId)` → `POST .../regenerate-pdf`
  - **依赖**：verify 已实现
- [ ] 新增 `lawyer-sops-api.regenerate-pdf.test.ts`
  - **依赖**：上一条

---

#### M16-C `apps/web` — 纯函数与 Hook（单导出单文件）

- [ ] 新增 `apps/web/src/lib/sop-pipeline-poll-interval-ms.ts`：导出常量 `SOP_PIPELINE_POLL_INTERVAL_MS = 2000`（`prd.md` §3.8.1、`architecture.md` §3.2.6.5）
  - **依赖**：无
- [ ] 新增 `apps/web/src/lib/sop-pipeline-poll-interval-ms.test.ts`：断言 `>= 2000`
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/hooks/use-sop-pipeline-status-poll.ts`：导出 `useSopPipelineStatusPoll(pipelineId, { enabled })`；内部 `setInterval` 调用 `getSopPipelineStatus`；卸载清理
  - **依赖**：M16-B；M16-C 常量
- [ ] 新增 `apps/web/src/hooks/use-sop-pipeline-status-poll.test.ts`：Mock 两次轮询间隔 ≥2000ms（fake timers）
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/hooks/use-debounced-value.ts`：导出 `useDebouncedValue<T>(value, delayMs)`（通用 500ms 供 iframe 刷新）
  - **依赖**：无
- [ ] 新增 `apps/web/src/hooks/use-debounced-value.test.ts`
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/lib/build-iframe-srcdoc.ts`：导出 `buildIframeSrcdoc(html: string): string`（包裹最小 HTML 文档，**不**注入 script）
  - **依赖**：无
- [ ] 新增 `apps/web/src/lib/build-iframe-srcdoc.test.ts`：输出不含 `<script`
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/lib/sanitize-sop-html-snippet.ts`：导出 `sanitizeSopHtmlSnippet(html)`（DOMPurify，禁止 `script`/`on*`）
  - **依赖**：`isomorphic-dompurify` 已安装
- [ ] 新增 `apps/web/src/lib/sanitize-sop-html-snippet.test.ts`：剥离 `<script>alert(1)</script>`
  - **依赖**：上一条

---

#### M16-D `apps/web` — TUS 卷宗上传 Hook（独立于转写）

- [ ] 在 `apps/web/src/contexts/active-upload-context.tsx` 扩展 `ActiveUploadState`：增加可选 `kind: 'transcription' | 'sop'` 与 `pipelineId?`
  - **依赖**：M4 `ActiveUploadProvider` 已存在
- [ ] 新增 `apps/web/src/contexts/active-upload-context.sop.test.tsx`：`kind=sop` 时 `hasActiveUpload` 为 true
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/hooks/use-sop-tus-upload.ts`：导出 `uploadSopMedia(file, { pipelineId, fileName, ... })`；调用 `initSopUpload` → `buildTusUploadOptions` → TUS → `completeSopUpload`（**禁止**调用 `transcription-api`）
  - **依赖**：M16-B init/complete；`tus-upload.ts`；`active-upload-context`
- [ ] 新增 `apps/web/src/hooks/use-sop-tus-upload.test.ts`：Mock 未调用 `initUpload`（转写路径）
  - **依赖**：上一条

- [ ] 在 `use-sop-tus-upload.ts` 注册 `registerUpload({ kind: 'sop', pipelineId, fileName })` 与 `beforeunload` 提示（复用转写 §6.3.4 模式）
  - **依赖**：Hook 骨架
- [ ] 新增 `use-sop-tus-upload.register.test.ts`
  - **依赖**：上一条

---

#### M16-E `apps/web` — 展示辅助（标签/徽章）

- [ ] 新增 `apps/web/src/components/sops/sop-pipeline-status-label.ts`：导出 `pipelineStatusLabel(status)`（`in_progress` / `completed` / `suspended`）
  - **依赖**：无
- [ ] 新增 `apps/web/src/components/sops/sop-pipeline-status-label.test.ts`
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/components/sops/sop-artifact-status-badge.tsx`：`running` / `draft` / `failed` / `finalized` Badge
  - **依赖**：Shadcn `badge`
- [ ] 新增 `apps/web/src/components/sops/sop-artifact-status-badge.test.tsx`
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/components/sops/sop-execution-type-hint.tsx`：按 `executionType` 展示「同步 LLM ≤60s」「异步检索」「人工表单」说明
  - **依赖**：无
- [ ] 新增 `apps/web/src/components/sops/sop-execution-type-hint.test.tsx`
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/components/sops/sop-deep-research-offline-banner.tsx`：固定文案「外网检索不可用，幻觉风险上升」（`architecture.md` §3.2.6.7）
  - **依赖**：Shadcn `alert`
- [ ] 新增 `apps/web/src/components/sops/sop-deep-research-offline-banner.test.tsx`
  - **依赖**：上一条

---

#### M16-F `apps/web` — 导航与路由

- [ ] 在 `apps/web/src/lib/menus.ts` 增加 `{ href: "/sops", label: "SOP 流水线", allowedRoles: ["lawyer"] }`
  - **依赖**：无
- [ ] 新增 `apps/web/src/lib/menus.sops-lawyer.test.ts`
  - **依赖**：上一条

- [ ] 确认 `router-guard.ts`：`/sops` 仅 `lawyer`；`admin` 访问 → `/unauthorized`（admin **不可**读律师 SOP 数据，`prd.md` §2.3）
  - **依赖**：menus 已更新
- [ ] 新增 `apps/web/src/lib/router-guard.sops-lawyer.test.ts`（若项目无 guard 单测则记入 M17 E2E）
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/app/(app)/sops/page.tsx`：挂载 `LawyerSopsEntryPanel`
  - **依赖**：M16-G 入口面板
- [ ] 新增 `apps/web/src/app/(app)/sops/page.test.tsx`
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/app/(app)/sops/pipelines/[pipelineId]/page.tsx`：挂载 `LawyerSopPipelineWorkspace`
  - **依赖**：M16-H 工作区壳
- [ ] 新增 `apps/web/src/app/(app)/sops/pipelines/[pipelineId]/page.test.tsx`
  - **依赖**：上一条

---

#### M16-G `apps/web` — 模板选择与创建流水线

- [ ] 新增 `apps/web/src/components/sops/LawyerSopsEntryPanel.tsx`：Flex 列；调用 `listSopTemplates`；表格 +「新建流水线」
  - **依赖**：M16-B list API
- [ ] 新增 `apps/web/src/components/sops/LawyerSopsEntryPanel.test.tsx`：Loading Skeleton
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/components/sops/sop-published-templates-table.tsx`：列：`templateName`、`caseType`、`versionNumber`、操作
  - **依赖**：EntryPanel
- [ ] 新增 `apps/web/src/components/sops/sop-published-templates-table.test.tsx`
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/components/sops/create-pipeline-from-template-dialog.tsx`：`AlertDialog` 确认 → `createSopPipeline` → `router.push(/sops/pipelines/:id)`
  - **依赖**：M16-B create API
- [ ] 新增 `apps/web/src/components/sops/create-pipeline-from-template-dialog.test.tsx`
  - **依赖**：上一条

---

#### M16-H `apps/web` — 流水线工作区壳与步骤看板

- [ ] 新增 `apps/web/src/components/sops/LawyerSopPipelineWorkspace.tsx`：Grid（侧栏步骤 + 主区）；挂载 `useSopPipelineStatusPoll`；`suspended` 时展示恢复条
  - **依赖**：M16-C poll；M16-I 恢复条
- [ ] 新增 `apps/web/src/components/sops/LawyerSopPipelineWorkspace.test.tsx`
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/components/sops/sop-pipeline-steps-board.tsx`：按 `status.steps` 渲染步骤行 + `SopArtifactStatusBadge`；高亮 `currentStepCode`
  - **依赖**：poll 数据形状
- [ ] 新增 `apps/web/src/components/sops/sop-pipeline-steps-board.test.tsx`
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/components/sops/sop-pipeline-resume-banner.tsx`：`status=suspended` 时「恢复流水线」→ `resumeSopPipeline`
  - **依赖**：M16-B resume
- [ ] 新增 `apps/web/src/components/sops/sop-pipeline-resume-banner.test.tsx`
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/components/sops/sop-pipeline-close-dialog.tsx`：显式「结案」→ `closeSopPipeline`（**禁止**自动结案，`prd.md` §3.8.3）
  - **依赖**：M16-B close
- [ ] 新增 `apps/web/src/components/sops/sop-pipeline-close-dialog.test.tsx`：`completed` 后按钮隐藏
  - **依赖**：上一条

---

#### M16-I `apps/web` — JSON Schema 动态表单（`manual` / `execute` 前置）

- [ ] 新增 `apps/web/src/components/sops/sop-json-schema-form.tsx`：接收 `inputSchema` + `onSubmit`；`@rjsf` 渲染；校验失败阻止提交
  - **依赖**：M16-A RJSF 依赖
- [ ] 新增 `apps/web/src/components/sops/sop-json-schema-form.test.tsx`：必填缺失时不调用 `onSubmit`
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/lib/coerce-sop-form-values.ts`：导出 `coerceSopFormValues(formData)` → `Record<string, unknown>`（execute Body）
  - **依赖**：无
- [ ] 新增 `apps/web/src/lib/coerce-sop-form-values.test.ts`
  - **依赖**：上一条

---

#### M16-J `apps/web` — 卷宗 TUS 上传区

- [ ] 新增 `apps/web/src/components/sops/sop-media-upload-zone.tsx`：拖拽/选择文件；调用 `useSopTusUpload`；展示 `Progress`；限额提示（1GB/5h 同转写）
  - **依赖**：M16-D Hook
- [ ] 新增 `apps/web/src/components/sops/sop-media-upload-zone.test.tsx`
  - **依赖**：上一条

- [ ] 在 `sop-media-upload-zone.tsx` 上传进行中挂载路由离开 `AlertDialog`（复用 `active-upload-context` + 现有 Guard 组件）
  - **依赖**：zone 骨架；M4 路由 Guard
- [ ] 新增 `sop-media-upload-zone.leave-guard.test.tsx`
  - **依赖**：上一条

---

#### M16-K `apps/web` — 步骤执行与定稿操作

- [ ] 新增 `apps/web/src/components/sops/sop-step-action-panel.tsx`：聚合当前步骤 UI 容器（表单 + 上传 + 按钮区）
  - **依赖**：M16-I/J；步骤看板选中态
- [ ] 新增 `apps/web/src/components/sops/sop-step-action-panel.test.tsx`
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/components/sops/sop-execute-step-button.tsx`：收集 `formValues` → `executeSopStep`；`sync_llm` Loading；`async` 收到 202 后 Toast「已提交，请等待轮询」
  - **依赖**：M16-B execute
- [ ] 新增 `apps/web/src/components/sops/sop-execute-step-button.test.tsx`：Mock 202 不清除轮询
  - **依赖**：上一条

- [ ] 在 `sop-execute-step-button.tsx` 处理 `OPERATION_NOT_ALLOWED` / `CONTEXT_LIMIT_EXCEEDED` Toast 文案
  - **依赖**：按钮骨架
- [ ] 新增 `sop-execute-step-button.errors.test.tsx`
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/components/sops/sop-finalize-step-button.tsx`：`AlertDialog` 确认 → `finalizeSopStep`；成功后刷新 poll
  - **依赖**：M16-B finalize
- [ ] 新增 `apps/web/src/components/sops/sop-finalize-step-button.test.tsx`
  - **依赖**：上一条

- [ ] 当 `execution_type=async_deep_research` 且系统设置关闭时，禁用执行按钮并 Tooltip（读 `GET /api/admin/settings` 或 BFF 公开只读 flag【与 M8 settings 对齐】）
  - **依赖**：execute 按钮；M8 设置 API 字段 `sop.deep_research_enabled`
- [ ] 新增 `sop-execute-step-button.dr-disabled.test.tsx`
  - **依赖**：上一条

---

#### M16-L `apps/web` — 产出物编辑（JSON / HTML 分支）

- [ ] 新增 `apps/web/src/components/sops/sop-artifact-json-viewer.tsx`：`content_type=json` 只读/可编辑 `Textarea`；`PATCH` 保存 draft
  - **依赖**：M16-B patch
- [ ] 新增 `apps/web/src/components/sops/sop-artifact-json-viewer.test.tsx`：`finalized` 时只读
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/components/sops/sop-artifact-editor-shell.tsx`：按 `contentType` 切换 JSON 编辑器 vs HTML 双栏
  - **依赖**：M16-L json viewer；M16-M html editor
- [ ] 新增 `apps/web/src/components/sops/sop-artifact-editor-shell.test.tsx`
  - **依赖**：上一条

- [ ] 在 `sop-artifact-editor-shell.tsx` 实现乐观锁：保存时带 `If-Match`；409 时 Toast「版本冲突，请刷新」
  - **依赖**：shell 骨架
- [ ] 新增 `sop-artifact-editor-shell.conflict.test.tsx`
  - **依赖**：上一条

---

#### M16-M `apps/web` — Monaco + iframe 沙盒预览（`content_type=html`）

- [ ] 新增 `apps/web/src/components/sops/sop-monaco-html-editor.tsx`：`dynamic(() => import('@monaco-editor/react'), { ssr: false })`；`language=html`
  - **依赖**：M16-A Monaco
- [ ] 新增 `apps/web/src/components/sops/sop-monaco-html-editor.test.tsx`：Mock Monaco 渲染 textarea 占位
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/components/sops/sop-html-iframe-preview.tsx`：`<iframe sandbox="allow-same-origin">` **禁止** `allow-scripts`；`srcDoc={buildIframeSrcdoc(debouncedHtml)}`
  - **依赖**：M16-C debounce + buildIframeSrcdoc
- [ ] 新增 `apps/web/src/components/sops/sop-html-iframe-preview.test.tsx`：断言 sandbox 属性不含 `allow-scripts`
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/components/sops/sop-html-preview-toolbar.tsx`：Toggle 黑白模式（`filter: grayscale(100%)`）；A3/A4 纸张比例容器 + 红色虚线出血框（纯 CSS Grid/Flex，`prd.md` §3.8.5）
  - **依赖**：iframe 预览组件
- [ ] 新增 `apps/web/src/components/sops/sop-html-preview-toolbar.test.tsx`
  - **依赖**：上一条

- [ ] 组装 `apps/web/src/components/sops/sop-artifact-html-split-pane.tsx`：左 Monaco + 右 iframe + 工具栏；Debounce **500ms** 刷新预览
  - **依赖**：M16-M 子组件
- [ ] 新增 `apps/web/src/components/sops/sop-artifact-html-split-pane.test.tsx`
  - **依赖**：上一条

---

#### M16-N `apps/web` — 幻觉校验门禁与 PDF 重试

- [ ] 新增 `apps/web/src/components/sops/sop-artifact-verify-button.tsx`：展示 [Verified] 状态；人工 → `verifySopArtifact`
  - **依赖**：M16-B verify；`requires_verification` 来自 status/步骤元数据【若 status 未含则从 GET artifact 推断】
- [ ] 新增 `apps/web/src/components/sops/sop-artifact-verify-button.test.tsx`
  - **依赖**：上一条

- [ ] 在 `sop-finalize-step-button.tsx` 未 Verified 时禁用并 Tooltip（`prd.md` §3.8.3）
  - **依赖**：verify 按钮；finalize 按钮
- [ ] 新增 `sop-finalize-step-button.verify-gate.test.tsx`
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/components/sops/sop-regenerate-pdf-button.tsx`：仅 `finalized` 显示 → `regenerateSopArtifactPdf`；Toast 已入队
  - **依赖**：M16-B regenerate
- [ ] 新增 `apps/web/src/components/sops/sop-regenerate-pdf-button.test.tsx`
  - **依赖**：上一条

- [ ] 新增 `apps/web/src/components/sops/sop-pdf-link-status.tsx`：展示 `linked_drive_node_id` 空/非空；引导至云盘路径（只读链接，不写 Supabase）
  - **依赖**：artifact GET 字段
- [ ] 新增 `apps/web/src/components/sops/sop-pdf-link-status.test.tsx`
  - **依赖**：上一条

---

#### M16-O `apps/web` — 异步步骤轮询 UX

- [ ] 在 `LawyerSopPipelineWorkspace` 中：当任一步骤 `artifactStatus=running` 时强制 `enabled=true` 轮询（间隔 `SOP_PIPELINE_POLL_INTERVAL_MS`）
  - **依赖**：M16-C poll；M16-H workspace
- [ ] 新增 `LawyerSopPipelineWorkspace.running-poll.test.tsx`：`running` 时 poll 函数调用 ≥2 次
  - **依赖**：上一条

- [ ] 当步骤 `running→draft` 时 Toast「步骤已完成，请审阅定稿」；`→failed` 时 Toast 错误（**禁止** WebSocket，`prd.md` §4.2.4 SOP L3）
  - **依赖**：workspace poll 副作用
- [ ] 新增 `LawyerSopPipelineWorkspace.status-transition.test.tsx`
  - **依赖**：上一条

- [ ] 在 `async_deep_research` 步骤执行后展示 `SopDeepResearchOfflineBanner`（可由 BFF 设置或 status 扩展字段驱动；缺省不展示）
  - **依赖**：M16-E banner；execute 202 流程
- [ ] 新增 `sop-step-action-panel.dr-banner.test.tsx`
  - **依赖**：上一条

---

#### M16-P Milestone 16 完成门禁

**人工黑盒验收**（由产品在浏览器中执行，不通过不得 `git commit`）：

- [ ] **【人工黑盒】** lawyer 登录 → `/sops` 选已发布模板 → 创建流水线 → 卷宗 TUS 上传完成 → `sync_llm`/`manual` 步骤 execute → finalize
  - **依赖**：M16-A～M16-O 完成；M13–M14 联调栈在线
- [ ] **【人工黑盒】** `async_deep_research` 步骤：execute 后 UI Toast「已提交」；间隔 **≥2s** 轮询直至步骤 `draft` 或 `failed`（观察 Network 无 WebSocket）
  - **依赖**：上一条
- [ ] **【人工黑盒】** HTML 产出物：Monaco 修改源码 → 约 **500ms** 后 iframe 预览更新；检查 iframe `sandbox` **不含** `allow-scripts`
  - **依赖**：M16-M
- [ ] **【人工黑盒】** PATCH 保存 draft 后定稿；显式点击「结案」→ 流水线 `completed`（**禁止**自动结案）
  - **依赖**：M16-N close dialog
- [ ] **【人工黑盒】** `admin` 访问 `/sops` → 拒绝；律师 A 直接打开律师 B 的 `/sops/pipelines/:id` → 403/404 或空态
  - **依赖**：M16-F guard
- [ ] **【人工黑盒】** TUS 上传进行中：浏览器刷新出现 `beforeunload` 提示；SPA 路由离开出现 `AlertDialog`
  - **依赖**：M16-D/J
- [ ] **【人工黑盒】** `system_settings.sop.deep_research_enabled=false` 时，Deep Research 步骤执行按钮禁用且 Tooltip 可读
  - **依赖**：M16-K
- [ ] **【人工黑盒验收签收】** 在 `docs/E2E_MANUAL_RUN_LOG.md` 追加 **M16** 小节
  - **依赖**：上列黑盒项均通过

- [ ] 执行 `git commit`：`feat(web): lawyer sop pipeline ui tus polling and html sandbox`
  - **依赖**：**人工黑盒验收签收**
- [ ] 将下方进度表 **M16** 状态更新为「已完成」
  - **依赖**：`git commit` 成功

---

### Milestone 17：SOP 集成验收与基线回归

**目标**：在 M10–M16 交付后，补齐 **跨层** 集成/E2E/合规扫描；确认 M1–M9 基座无回归；更新人工验收文档；轻量验证 SOP `execute` 计入全站 **QPS ≤ 10**（`OPEN_ISSUES.md` PRD-SOP-46）。

**设计基准**：`prd.md` §3.8–§3.10、§4.2.1、§4.2.4（SOP L1–L4）；`architecture.md` §3.2.6（U2 同步边界、202 轮询、U3 三 stage、禁止 U2 无头 PDF）；`OPEN_ISSUES.md` §8（SOP 已签收项不得在本 Milestone  reopen）。

**前置依赖**：**Milestone 10–16 全部完成**（含 M14 `no-u2-sync-sop-pdf` 合规项、M15 Admin UI、M16 Lawyer UI）。

**范围说明**：M10–M16 已列 **单模块** 单测/集成测；M17 **不重复实现** 相同断言，仅新增 **编排级** 用例、Playwright、合规扩展、基线回归脚本与文档。

**验收门禁**：`npm run test` + `npm run test:compliance` + `npm run test:sop`（本 Milestone 新增）绿；Playwright SOP 用例在具备 `E2E_*` 环境时绿或合理 `skip`；`docs/E2E_MANUAL_CHECKLIST.md` §10 已填；产品声明：**非 SOP** `OPEN_ISSUES` 待确认项不阻塞 SOP 发布；`git commit` 后 Part B 封版。

---

#### M17-A `tools/compliance` — SOP 架构红线扫描（每条规则一个测试文件 + fixture 测）

- [ ] 新增 `tools/compliance/no-u2-sync-sop-deep-research.test.ts`：扫描 `apps/api/src`（排除 `__tests__`）禁止 `await` 调用 `SopDeepResearch`/`deep_research` 同步完成路径（`architecture.md` §3.2.6.4）
  - **依赖**：M14 已实现 U3 Handler；`scan-helpers.ts` 已存在
- [ ] 新增 `tools/compliance/fixtures/violation-u2-sync-dr.ts`：故意违规样例字符串（仅被 fixture 测试引用）
  - **依赖**：上一条扫描规则定义完成
- [ ] 新增 `tools/compliance/no-u2-sync-sop-deep-research.fixture.test.ts`：对 fixture 文件扫描应 ≥1 命中
  - **依赖**：上一条

- [ ] 确认 `tools/compliance/no-u2-sync-sop-pdf.test.ts`（M14-J）已合并且 `npm run test:compliance` 包含；若缺失则补建
  - **依赖**：M14-J
- [ ] 新增 `tools/compliance/no-u2-sync-sop-pdf.smoke.test.ts`：断言 `no-u2-sync-sop-pdf.test.ts` 文件存在
  - **依赖**：上一条

- [ ] 新增 `tools/compliance/no-sop-websocket.test.ts`：扫描 `apps/web` 禁止 `WebSocket`/`socket.io` 用于 SOP 进度（`prd.md` §4.2.4 SOP L3）
  - **依赖**：M16 轮询实现
- [ ] 新增 `tools/compliance/fixtures/violation-sop-websocket.ts`
  - **依赖**：上一条
- [ ] 新增 `tools/compliance/no-sop-websocket.fixture.test.ts`
  - **依赖**：上一条 fixture

- [ ] 新增 `tools/compliance/no-sop-mermaid-in-web.test.ts`：扫描 `apps/web/src/components/sops` 禁止 `mermaid`/`@mermaid` import（`prd.md` §3.10 / M15/M16 红线）
  - **依赖**：M16 组件目录存在
- [ ] 新增 `tools/compliance/no-sop-mermaid-in-web.fixture.test.ts`
  - **依赖**：上一条

- [ ] 新增 `tools/compliance/sop-iframe-sandbox-no-allow-scripts.test.ts`：扫描 `apps/web/src/components/sops` 中 `sandbox=` 不得含 `allow-scripts`（`prd.md` §3.8.5）
  - **依赖**：M16-M iframe 组件
- [ ] 新增 `tools/compliance/sop-iframe-sandbox-no-allow-scripts.fixture.test.ts`
  - **依赖**：上一条

- [ ] 新增 `tools/compliance/sop-poll-interval-min-2s.test.ts`：扫描 `apps/web` 中 `setInterval`/`poll` 相关常量不得 `< 2000`（`prd.md` §3.8.1、`architecture.md` §3.2.6.5）
  - **依赖**：`SOP_PIPELINE_POLL_INTERVAL_MS` 已定义（M16-C）
- [ ] 新增 `tools/compliance/sop-poll-interval-min-2s.fixture.test.ts`
  - **依赖**：上一条

- [ ] 扩展 `tools/compliance/no-business-supabase-writes.test.ts`：将 `apps/web/src/components/sops/**` 纳入扫描路径（与转写/云盘同规则）
  - **依赖**：M16 组件已落地
- [ ] 新增 `tools/compliance/no-business-supabase-writes.sops-scope.test.ts`：Mock 违规 `supabase.from('case_pipelines')` 在 sops 目录应被检出
  - **依赖**：上一条扩展

- [ ] 新增 `tools/compliance/sop-lawyer-api-no-transcription-upload-init.test.ts`：扫描 `apps/web/src/hooks/use-sop-tus-upload.ts` 与 `lawyer-sops-api.ts` 不得 import `transcription-api` 的 `initUpload`
  - **依赖**：M16-D
- [ ] 新增 `tools/compliance/sop-lawyer-api-no-transcription-upload-init.fixture.test.ts`
  - **依赖**：上一条

---

#### M17-B 集成测试基建（`packages/shared` / `apps/api` 辅助，单文件单导出）

- [ ] 新增 `packages/shared/src/testing/sop-integration-env.ts`：导出 `requireSopIntegrationEnv(): { apiUrl, adminToken, lawyerToken }`（读 `SOP_INT_*` / 复用现有 `SUPABASE_*`）
  - **依赖**：M0 联调 env 约定
- [ ] 新增 `packages/shared/src/testing/sop-integration-env.test.ts`：缺 env 时 `skip` 谓词为 true
  - **依赖**：上一条

- [ ] 新增 `packages/shared/src/testing/sop-integration-seed.ts`：导出 `seedMinimalPublishedSopTemplate(serviceClient)`（service_role 插入最小模板+单步 `manual` 已发布）
  - **依赖**：M10 表；M12 发布规则
- [ ] 新增 `packages/shared/src/testing/sop-integration-seed.test.ts`：Mock client 断言 SQL 表名
  - **依赖**：上一条

- [ ] 新增 `apps/api/src/__tests__/helpers/sop-integration-http.ts`：导出 `adminFetch(path, init)` / `lawyerFetch(path, init)`（Bearer + JSON）
  - **依赖**：M17-B env
- [ ] 新增 `apps/api/src/__tests__/helpers/sop-integration-http.test.ts`：Mock `fetch` 注入 Authorization
  - **依赖**：上一条

---

#### M17-C `apps/api` — 编排级集成测试（每条场景一个文件；`skip` 无联调 env）

- [ ] 新增 `apps/api/src/__tests__/sop-full-path-admin-to-close.integration.test.ts`：admin 发布模板 → lawyer `POST /pipelines` → `manual` execute → finalize → `POST .../close` → status=`completed`
  - **依赖**：M12–M13；M17-B seed
- [ ] 为 `sop-full-path-admin-to-close.integration.test.ts` 增加第二用例：未 finalize 直接 close → 422
  - **依赖**：上一条文件已存在

- [ ] 新增 `apps/api/src/__tests__/sop-sync-llm-execute-finalize.integration.test.ts`：`sync_llm` 步骤 Mock LLM → `draft` → PATCH → finalize → 下游可读（`prd.md` §3.8.2–§3.8.3）
  - **依赖**：M11 编排 Mock；M13 execute/finalize
- [ ] 新增 `apps/api/src/__tests__/sop-sync-llm-execute-finalize.integration.test.ts` 用例：`depends_on` 未满足 → execute 422
  - **依赖**：上一条

- [ ] 新增 `apps/api/src/__tests__/sop-async-deep-research-status.integration.test.ts`：async 步骤 execute → **202** → 轮询 status 直至 `draft` 或 `failed`（Mock U3 或 stub Outbox 消费）
  - **依赖**：M13 async；M14 Handler 可 Mock
- [ ] 新增 `apps/api/src/__tests__/sop-async-deep-research-status.integration.test.ts` 用例：`running` 时第二次 execute → 422
  - **依赖**：上一条

- [ ] 新增 `apps/api/src/__tests__/sop-html-finalize-pdf-outbox.integration.test.ts`：`content_type=html` finalize → 断言 Outbox 行 `stage=sop.pdf_export`（DB 查询）
  - **依赖**：M13 finalize；M14 payload 构建
- [ ] 新增 `apps/api/src/__tests__/sop-html-finalize-pdf-outbox.integration.test.ts` 用例：PDF 失败 artifact 仍 `finalized`（Mock U3 失败）
  - **依赖**：上一条

- [ ] 新增 `apps/api/src/__tests__/sop-artifact-verify-then-finalize.integration.test.ts`：`requires_verification=true` → 无 verify finalize 422 → `POST .../verify` 后 finalize 200
  - **依赖**：M13 verify/finalize
- [ ] 新增 `apps/api/src/__tests__/sop-artifact-verify-then-finalize.integration.test.ts` 用例：自动 Verified（Mock `ai_invocation_logs` success）无需人工 verify
  - **依赖**：上一条

- [ ] 新增 `apps/api/src/__tests__/sop-regenerate-pdf.integration.test.ts`：`finalized` → `regenerate-pdf` → 新 Outbox 行
  - **依赖**：M13 regenerate
- [ ] 新增 `apps/api/src/__tests__/sop-regenerate-pdf.integration.test.ts` 用例：`draft` regenerate → 422
  - **依赖**：上一条

- [ ] 新增 `apps/api/src/__tests__/sop-suspended-resume-guards.integration.test.ts`：`suspended` 禁止 execute → `resume` 后可 execute
  - **依赖**：M13 resume【挂起写入方式：测试 `beforeAll` 用 service_role 更新 status】
- [ ] 新增 `apps/api/src/__tests__/sop-suspended-resume-guards.integration.test.ts` 用例：resume 后仍须满足 depends_on
  - **依赖**：上一条

- [ ] 新增 `apps/api/src/__tests__/baseline-transcription-api-smoke.integration.test.ts`：lawyer `GET /api/transcription/tasks` 仍 200（M1–M9 回归）
  - **依赖**：联调库存在律师；转写 seed
- [ ] 新增 `apps/api/src/__tests__/baseline-admin-cannot-read-lawyer-tasks.integration.test.ts`：admin JWT `GET /api/transcription/tasks` → 403（`prd.md` §2.3）
  - **依赖**：上一条

---

#### M17-D `workers/pipeline` — SOP 与转写共存回归

- [ ] 新增 `workers/pipeline/src/__tests__/sop-transcription-outbox-fifo-order.integration.test.ts`：混合插入转写 Outbox 与 `sop.media.ocr` 行 → 消费顺序按 `created_at` FIFO（Mock Handler 记录顺序）
  - **依赖**：M14 stage-router；M5 Outbox 基建
- [ ] 新增 `workers/pipeline/src/__tests__/sop-transcription-outbox-fifo-order.integration.test.ts` 用例：SOP PDF 占用 `SOP_PDF_MAX_CONCURRENT=1` 时不阻塞转写 `asr` 槽位【Mock 信号量】
  - **依赖**：上一条

- [ ] 新增 `workers/pipeline/src/__tests__/sop-deep-research-timeout-marks-failed.integration.test.ts`：Mock 超时 → artifact `failed`（`SOP_DEEP_RESEARCH_TIMEOUT_MS`，`architecture.md` §3.2.6.9）
  - **依赖**：M14-F Handler
- [ ] 新增 `workers/pipeline/src/__tests__/sop-deep-research-timeout-marks-failed.integration.test.ts` 用例：超时后 `ai_invocation_logs` 有记录
  - **依赖**：上一条

---

#### M17-E 静态审计与枚举回归（单文件）

- [ ] 更新 `apps/api/src/__tests__/audit-coverage.static.test.ts`：为 `sop.artifact.verify` 增加 `ACTION_ALIASES`（若 M10 已入枚举）
  - **依赖**：M10 audit_action 扩展；M13 verify service
- [ ] 新增 `apps/api/src/__tests__/audit-coverage.sop-actions.test.ts`：断言 `sop.template.publish` 在 `services`/`controllers` 源码中出现
  - **依赖**：上一条

- [ ] 新增 `packages/shared/src/milestones/m10-m17-sop-exports.test.ts`：断言 `@lexos/shared` 导出 SOP 相关 DTO/枚举（`sop-pipeline-create` 等）
  - **依赖**：M13-A exports
- [ ] 新增 `packages/shared/src/milestones/m10-m17-sop-exports.test.ts` 第二用例：导出 `SOP_PIPELINE_POLL_INTERVAL_MS` 或文档化由 web 常量承担【与实现一致即可】
  - **依赖**：上一条

---

#### M17-F `e2e/fixtures` — SOP 专用（单函数/单文件）

- [ ] 新增 `e2e/fixtures/sop-env.ts`：导出 `hasSopE2eEnv()`（`E2E_ADMIN_*` + `E2E_LAWYER_*` + API healthy）
  - **依赖**：`e2e/fixtures/env.ts`
- [ ] 新增 `e2e/fixtures/sop-env.test.ts`：Vitest 运行于 Node；缺变量时 `hasSopE2eEnv` 为 false
  - **依赖**：上一条

- [ ] 新增 `e2e/fixtures/sop-tus-mock.ts`：导出 `mockSopTusRoutes(page)`（复用转写 TUS Mock 模式，路径 `**/storage/v1/upload/**`）
  - **依赖**：`transcription-upload-happy-path.spec.ts` 模式
- [ ] 新增 `e2e/fixtures/sop-tus-mock.test.ts`：Mock 函数返回 Promise（smoke）
  - **依赖**：上一条

- [ ] 新增 `e2e/fixtures/sop-api.ts`：导出 `createPipelineViaApi(request, templateVersionId)`（BFF `POST /api/sops/pipelines`）
  - **依赖**：`loginViaBff`
- [ ] 新增 `e2e/fixtures/sop-api.test.ts`：缺 token 时抛错
  - **依赖**：上一条

---

#### M17-G Playwright E2E（每条 spec 一个主场景 + 前置 skip）

- [ ] 新增 `e2e/admin-sop-publish-template.spec.ts`：admin 登录 → `/admin/sops` → 新建模板 → 编辑草稿 → 发布成功 Toast
  - **依赖**：M15 UI；M12 API；`hasSopE2eEnv()`
- [ ] 在 `admin-sop-publish-template.spec.ts` 增加断言：已发布版本保存按钮 `disabled`
  - **依赖**：上一条 spec 骨架

- [ ] 新增 `e2e/lawyer-sop-create-pipeline.spec.ts`：lawyer → `/sops` → 选模板 → 创建 → 跳转 `/sops/pipelines/:id`
  - **依赖**：M16 UI；M17-F fixtures
- [ ] 新增 `e2e/lawyer-sop-create-pipeline.spec.ts` 用例：创建后看板可见 `currentStepCode` 高亮
  - **依赖**：上一条

- [ ] 新增 `e2e/lawyer-sop-media-upload-mock.spec.ts`：卷宗 TUS Mock 上传 → 进度条完成（不等待真实 OCR）
  - **依赖**：M17-F `mockSopTusRoutes`；M16-J
- [ ] 新增 `e2e/lawyer-sop-media-upload-mock.spec.ts` 用例：上传中触发路由离开出现 `AlertDialog`
  - **依赖**：上一条

- [ ] 新增 `e2e/lawyer-sop-pipeline-close.spec.ts`：完成最小 manual 步骤后显式「结案」→ 状态 `completed`
  - **依赖**：M16 close dialog；联调或 UI Mock execute
- [ ] 新增 `e2e/lawyer-sop-pipeline-close.spec.ts` 用例：未结案前 close 按钮可用、结案后禁用
  - **依赖**：上一条

- [ ] 新增 `e2e/admin-cannot-access-lawyer-sops.spec.ts`：admin 访问 `/sops` → `/unauthorized` 或 403 页
  - **依赖**：M16-F guard
- [ ] 新增 `e2e/lawyer-cannot-access-admin-sops.spec.ts`：lawyer 访问 `/admin/sops` → 拒绝
  - **依赖**：M15 路由

- [ ] 新增 `e2e/sop-pipeline-status-poll.spec.ts`：经 BFF 轮询 `GET /api/sops/pipelines/:id/status` 间隔 ≥2s（`E2E_SOP_PIPELINE_ID` 可选 env）
  - **依赖**：M17-F；模式同 `transcription-pipeline-completed.spec.ts`
- [ ] 新增 `e2e/sop-pipeline-status-poll.spec.ts` 用例：两次请求时间差 ≥2000ms
  - **依赖**：上一条

- [ ] 新增 `e2e/sop-html-editor-sandbox.spec.ts`：打开 html 产出物页 → 检查 iframe `sandbox` 无 `allow-scripts`；Monaco 输入后预览更新（可选 `E2E_SOP_HTML_PIPELINE_ID`）
  - **依赖**：M16-M；长耗时 `test.setTimeout`
- [ ] 新增 `e2e/sop-html-editor-sandbox.spec.ts` 用例：预览区 Toggle 黑白模式可见
  - **依赖**：上一条

---

#### M17-H 根脚本 — SOP 测试聚合与基线回归

- [ ] 在根 `package.json` 增加 script `"test:sop"`：`vitest run` 匹配 `sop` 相关路径（`apps/api/**/sop*.test.ts`、`admin-sop*.test.ts`、`workers/pipeline/**/sop*.test.ts`、`packages/shared/**/sop*.test.ts`、`packages/shared/**/rls/*sop*`）
  - **依赖**：M17-C/D 测试文件已创建
- [ ] 新增 `scripts/verify-test-sop-script.test.ts`：读取 `package.json` 断言 `test:sop` 存在且非空
  - **依赖**：上一条

- [ ] 在根 `package.json` 增加 script `"test:regression"`：顺序执行 `npm run test:compliance` && `npm run test:sop` && `npm run test:integration`（文档化不要求单次 vitest 全量）
  - **依赖**：`test:sop` 已添加
- [ ] 新增 `scripts/verify-test-regression-script.test.ts`
  - **依赖**：上一条

- [ ] 新增 `scripts/run-baseline-regression.mjs`：CLI 依次 spawn `npm run test`、`npm run test:regression`、`npm run test:e2e`（e2e 失败不阻塞时加 `--continue` 开关【默认严格】）
  - **依赖**：上列 scripts
- [ ] 新增 `scripts/run-baseline-regression.test.ts`：Mock spawn 断言调用顺序含 `test:compliance`
  - **依赖**：上一条

---

#### M17-I 轻量压测 — SOP `execute` QPS 抽样（PRD-SOP-46）

- [ ] 新增 `scripts/sop-execute-qps-sample.mjs`：对 `POST .../execute`（`sync_llm` 或 `manual`）在 **10s** 内发送 **N≤20** 次请求；统计实际 QPS；**断言峰值 ≤ 10** 或输出报告供人工签收
  - **依赖**：M13 execute 可用；`SOP_QPS_SAMPLE_BASE_URL` env
- [ ] 新增 `scripts/sop-execute-qps-sample.test.ts`：纯函数 `computeQps(count, durationMs)` 单元测
  - **依赖**：上一条脚本内联函数可提取到 `scripts/lib/compute-qps.ts` 时单独测

- [ ] 新增 `scripts/lib/compute-qps.ts`：导出 `computeQps(requestCount, durationMs)`
  - **依赖**：无
- [ ] 新增 `scripts/lib/compute-qps.test.ts`：10 次 / 1s → QPS=10
  - **依赖**：上一条

---

#### M17-J 文档与签收（单节/单表一项）

- [ ] 在 `docs/E2E_MANUAL_CHECKLIST.md` 新增 **§10 SOP 数字流水线** 表：含 admin 发布、律师建实例、卷宗上传、sync/async 步骤、HTML 双栏、显式结案、regenerate-pdf、admin 不可访问 `/sops`
  - **依赖**：M15–M16 功能已实现
- [ ] 在 `docs/E2E_MANUAL_CHECKLIST.md` §10 增加行：`iframe` 无 `allow-scripts`、轮询间隔体感 ≥2s
  - **依赖**：上一条

- [ ] 更新 `docs/E2E_MANUAL_RUN_LOG.md`：增加 M17 执行记录模板（`test:sop` / Playwright SOP / compliance 结果列）
  - **依赖**：§10 已写入
- [ ] 新增 `docs/E2E_MANUAL_RUN_LOG.m17-template.test.ts`：读取 markdown 含 `§10` 与 `test:sop` 关键字【文档结构 smoke】
  - **依赖**：上一条

- [ ] 在 `docs/DEPLOYMENT.md` 验收章节增加 bullet：`npm run test:sop`、`npm run test:regression`、Playwright `e2e/admin-sop-*.spec.ts` / `e2e/lawyer-sop-*.spec.ts`
  - **依赖**：M17-H scripts
- [ ] 新增 `docs/DEPLOYMENT.sop-regression.test.ts`：读取 `DEPLOYMENT.md` 含 `test:sop`
  - **依赖**：上一条

- [ ] 在 `docs/OPEN_ISSUES.md` §5 M9 后增加 **§5.1 M17 SOP 集成签收** 表：记录 M17 通过日期；**明确** §1–§4 非 SOP 待确认项仍 open、不阻塞 SOP
  - **依赖**：M17 测试全绿
- [ ] 新增 `docs/OPEN_ISSUES.m17-section.test.ts`：断言 `OPEN_ISSUES.md` 含 `M17`
  - **依赖**：上一条

- [ ] 更新 `docs/CONTEXT_SUMMARY.md` §12 进度：M10–M17 状态改为「已交付」【仅当本 Milestone 验收通过后勾选】
  - **依赖**：M17-L **人工黑盒验收签收**
- [ ] 新增 `docs/CONTEXT_SUMMARY.m17-progress.test.ts`：断言文件含 `M17`
  - **依赖**：上一条

---

#### M17-K `packages/shared` — Milestone 17 门禁 CLI

- [ ] 新增 `packages/shared/src/milestones/run-m17-gate-cli.ts`：顺序检查 `test:compliance` 退出码、提示运行 `test:sop` / `test:e2e`（可 `--skip-e2e`）
  - **依赖**：M17-H scripts
- [ ] 新增 `packages/shared/src/milestones/run-m17-gate-cli.test.ts`：Mock `execSync`；`--dry-run` 不抛错
  - **依赖**：上一条

- [ ] 在根 `package.json` 增加 `"verify:m17-gate": "tsx packages/shared/src/milestones/run-m17-gate-cli.ts"`
  - **依赖**：CLI 已实现
- [ ] 新增 `packages/shared/src/milestones/verify-m17-gate-script.test.ts`：断言根 `package.json` 含 `verify:m17-gate`
  - **依赖**：上一条

---

#### M17-L Milestone 17 完成门禁

- [ ] 运行 `npm run test:compliance` 全绿（含 M17-A 新增规则 + M14 `no-u2-sync-sop-pdf`）
  - **依赖**：M17-A 完成
- [ ] 运行 `npm run test:sop` 全绿（`skip` 用例须有明确 env 说明）
  - **依赖**：M17-C/D
- [ ] 运行 `npm run test` 全绿（含 M1–M9 + M10–M16 全量单测）
  - **依赖**：M10–M16 已完成
- [ ] 运行 `npm run test:e2e`：SOP spec 在具备 `E2E_*` 时通过；否则记录 `skip` 原因于 `E2E_MANUAL_RUN_LOG.md`
  - **依赖**：M17-G
- [ ] 运行 `node scripts/sop-execute-qps-sample.mjs`（联调 env）并记录 QPS ≤10 或人工签收例外
  - **依赖**：M17-I

**人工黑盒验收**（由产品/测试负责人执行，作为 **Part B SOP 最终验收**；不通过不得封版 commit）：

- [ ] **【人工黑盒】** 按 `docs/E2E_MANUAL_CHECKLIST.md` **§10 SOP 数字流水线** 全表逐项执行并填写「通过/失败/跳过」
  - **依赖**：M15–M16 UI 已部署；U1/U2/U3 联调栈
- [ ] **【人工黑盒】** 端到端主路径（黑盒）：Admin 发布含 sync + async + html 的模板 → Lawyer 建实例 → 卷宗 → 各步 execute/finalize → HTML 定稿 → PDF（可异步等待）→ 显式结案
  - **依赖**：上一条
- [ ] **【人工黑盒】** 基座回归（黑盒）：`docs/E2E_MANUAL_CHECKLIST.md` **§3** 任选一题（小文件转写上传）确认 M1–M9 能力未回退
  - **依赖**：转写 Worker 可用
- [ ] **【人工黑盒】** 角色隔离（黑盒）：admin 不可见律师 `/sops` 业务数据；lawyer 不可见 `/admin/sops`；双律师不可互访对方 `pipelineId`
  - **依赖**：M16/M15 路由
- [ ] **【人工黑盒】** 在 `docs/OPEN_ISSUES.md` §5.1 填写 M17 签收行：声明 **§1–§4 非 SOP 待确认项不阻塞** SOP 发布
  - **依赖**：上列黑盒与自动化测试通过
- [ ] **【人工黑盒验收签收】** 在 `docs/E2E_MANUAL_RUN_LOG.md` 追加 **M17 / Part B 封版** 汇总：验收人、日期、环境、§10 通过项数、已知遗留
  - **依赖**：上列黑盒项均通过或已文档化例外

- [ ] 填写 `docs/E2E_MANUAL_CHECKLIST.md` §10 全部行（允许标注「由 Playwright 覆盖」；须与黑盒执行结果一致）
  - **依赖**：M17-J；**【人工黑盒】§10 已执行**
- [ ] 执行 `git commit`：`test(sop): integration e2e compliance and m17 regression gate`
  - **依赖**：上列自动化命令通过或已文档化 skip；**人工黑盒验收签收**
- [ ] 将下方进度表 **M10–M17** 状态更新为「已完成」
  - **依赖**：`git commit` 成功

---

## Part B 依赖关系（简图）

```
M10 (SOP DB/RLS/Storage)
  → M11 (AI 四功能点)
  → M12 (Admin SOP API)
  → M13 (Lawyer SOP API) ──→ M14 (U3 sop.*)
        │                        │
        └──────────┬─────────────┘
                   ▼
         M15 (Admin UI) ∥ M16 (Lawyer UI)   ← M14 可与 M13 部分并行，但 M16 依赖 M14
                   ▼
                 M17 (集成验收)
```

**并行说明**：M15 与 M16 可在 M13 API 稳定后并行；M16 异步/PDF 相关交互依赖 M14 已可联调。

---

## 当前进度（Part B）

| Milestone | 名称 | 状态 |
|-----------|------|------|
| M10 | SOP 基础设施与数据库迁移 | **已完成** |
| M11 | AI 能力扩展（SOP 功能点） | **已完成** |
| M12 | 管理员 SOP 模板与 Prompt Studio API | 已完成（黑盒 2026-06-02） |
| M13 | 律师端 SOP 流水线业务 API | 未开始 |
| M14 | 异步 Worker SOP 阶段处理器 | 未开始 |
| M15 | 管理员 SOP 配置前端 | 未开始 |
| M16 | 律师端 SOP 流水线前端 | 未开始 |
| M17 | SOP 集成验收与基线回归 | 未开始 |

| Milestone | 名称 | 状态 |
|-----------|------|------|
| M0–M9 | 基座能力（Part A） | **已完成** |

---

## 附录：历史原子任务

M0–M9 的原子级 checkbox 拆解已随 **tasks.md v1.2** 封版提交于 git 历史。若需查阅逐项验收记录，请执行：

```bash
git log --oneline -- docs/tasks.md
git show <commit>:docs/tasks.md
```

**禁止**在未授权情况下将 v1.2 全文重新合并回本文件，以免与 Part B 大纲冲突。
