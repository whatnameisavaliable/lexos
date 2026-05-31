# LexOS 开发上下文摘要（CONTEXT_SUMMARY）

| 字段 | 内容 |
|------|------|
| 版本 | 1.1 |
| 用途 | 后续开发极简上下文；**不可替代**完整规范 |
| 冻结基准 | `prd.md` v0.3 · `architecture.md` v1.3 · `database.md` v1.4 · `ui_design.md` v1.1 |

---

## 1. 产品定位（30 秒）

- **LexOS**：单律所私有化律所协作平台；Node.js + Supabase（Postgres/Auth/Storage）。
- **核心**：AI 语音转写（ASR + LLM 润色/摘要）、个人云盘、RBAC、审计、AI 配置后台。
- **规模**：活跃用户 50～100；日均转写约 10；**同时转写 ≤ 5**；轻量 API 峰值 QPS ≤ 10。
- **非目标**：多租户 SaaS、案件全流程、浏览器 ffmpeg.wasm、Python VAD 微服务、向量检索（首期）、用户自助找回密码、**Redis/BullMQ**（v1.3 起）。

---

## 2. 部署单元

| ID | 组件 | 职责 |
|----|------|------|
| U1 | Web | 会话、Router Guard、TUS 直传（经 BFF init） |
| U2 | API (Node) | HTTP、鉴权、CRUD、Outbox 生产、审计 |
| U3 | Worker (Node) | **单进程**轮询 Outbox；FFmpeg 抽音/物理切片；ASR/LLM 编排 |
| U5 | Supabase | Auth、Postgres+RLS、Storage |
| U6 | Adapter | ASR/LLM HTTP（TS，无独立 Python 服务） |

**不部署**：Redis、独立 Python VAD、`outbox-dispatcher`（M4 遗留，合并入 U3）。

---

## 3. 角色与权限（首期）

| 角色 | 业务权限 |
|------|----------|
| `admin` | 用户/AI/审计/全量转写与云盘；强制 MFA |
| `lawyer` | 仅 **本人** 转写、云盘、检索 |
| `director` / `client` / `channel` | **预留**，首期无业务模块 |
| `anonymous` | 仅登录等公开页 |

**律师数据边界**：`created_by = auth.uid()`；RLS + API 双重校验。

---

## 4. 认证与安全要点

- 登录：用户名 → 虚拟邮箱 `{username}@llexos.internal` → `signInWithPassword`。
- **首期已移除**：图形验证码（Turnstile/Geetest）、MFA/TOTP 绑定流程；`profiles.mfa_enabled` 字段保留但 UI/API 不强制。
- `profiles`：`status`、`requires_password_change`、`mfa_enabled`（字段保留，首期不启用 MFA 流程）。
- 强制改密：`requires_password_change=true` 时仅白名单 API + 改密页；Router Guard 拦截业务。
- 管理员重置密码：**单事务** 改密标记 + `signOut(global)` + 审计。
- 禁用用户：`signOut(global)` + 每请求校验 `status`（缓存 ≤30s）。
- 锁号：Auth 5 次/30 分钟（首期**未启用**图形验证码与 MFA，见下方说明）。
- 前端 **禁止** 用 Supabase 客户端写业务表；下载 **仅** BFF 签名 URL + 审计。

---

## 5. 转写任务：约束与状态机

| 约束 | 值 |
|------|-----|
| 单文件大小 | ≤ 1 GB |
| 单文件时长 | ≤ 5 h |
| 上传 | TUS 直传 Storage；**禁止** Node 收文件流 |
| MP4 | 服务端 FFmpeg 抽音；禁止浏览器 wasm |
| 切片 | U3 FFmpeg 物理切片（约 15min/片，<20MB）；**不落** Storage |
| Worker 并发 | 同时处理 ≤ **5** 个任务（`WORKER_MAX_CONCURRENCY`） |

**状态枚举**：`uploading` → `queued` → `extracting`（MP4）→ `preprocessing` → `asr_running` → `llm_running` → `completed` | `failed`

**状态迁移**：仅 `transition_task_status(from, to)`；Worker 抢 Outbox `FOR UPDATE SKIP LOCKED`。

**Stalled**：`last_progress_at` 超 2h 可回滚 `queued` 或 `failed`（`retry_count`）。

**禁用律师 mid-task**：后端流水线继续；用户无法登录查看。

---

## 6. 流水线（U3 · Postgres Outbox）

1. BFF `uploads/init` → `upload_sessions` + task `uploading`
2. TUS 直传至 `{uid}/{task_id}/` 前缀
3. `uploads/complete` → `queued` + **Outbox**（`payload.stage = media.extract|media.preprocess`）
4. U3 轮询 Outbox → 按 `stage` 顺序执行：
   - `media.extract`（MP4）→ `media.preprocess`（重采样+切片至 `/tmp/lexos/{task_id}/`）
   - `asr`（单任务切片并发 3，全局限流 50/min 进程内）
   - `llm`（兜底模型 1 次）
   - `drive.archive` → 云盘 `YYYY-MM-DD/任务名/`
5. 每阶段成功 → `published_at = now()`；下一阶段插入新 Outbox 行（同事务）

**禁止**：Redis、BullMQ、`queue.add()`、U2 同步跑 FFmpeg/ASR。

---

## 7. API 目录树（BFF）

```
/api/auth/*              会话、改密、登出、MFA 状态
/api/profile             个人资料
/api/admin/users/*       用户 CRUD、重置密码（admin）
/api/admin/ai/*          模型、映射、Prompt、连通性测试（admin）
/api/admin/audit/*       审计查询（admin）
/api/transcription/uploads/init      创建 upload_session + task
/api/transcription/uploads/complete  TUS 完成回调
/api/transcription/*     任务列表、状态、文稿 PATCH（If-Match）
/api/transcription/tasks/:id/download  签名下载 + 审计
/api/drive/*             目录、文件、全文检索（分页 50）
/api/drive/files/:id/download          签名下载 + 审计
```

**禁止**：经 API 上传 `File` body；前端自拼 Storage 路径。

**统一响应**：`{ success, data?, error?: { code, message, requestId }, meta? }`

**分页**：limit 默认 50；cursor/offset；禁止全表拉取。

---

## 8. 代码分层（强制）

```
Route → Controller → Service → Repository | Adapter
```

- U3：`Outbox Poller → Stage Handler → Service → Repository | Adapter`
- **禁止**：`Route→Repository`、`Controller→Adapter`（测试除外）、主进程跑 FFmpeg/ASR
- 管理员跨用户：仅 `AdminRepository`（service_role）+ `role===admin` + 审计
- Worker 写库：经 `transition_task_status`；禁止裸 `UPDATE status`

**目录**（目标结构）：

```
apps/web/          apps/api/src/{routes,controllers,services,repositories,adapters,middleware}
workers/pipeline/  packages/shared/  supabase/migrations/
```

---

## 9. 核心数据表（字段摘要）

### `profiles`
`id`(=auth.users), `username` UNIQUE, `display_name`, `role`, `contact`, `status`, `requires_password_change`, `mfa_enabled`, timestamps

### `transcription_tasks`
`id`, `created_by`, `title`, `status`, `source_mime`, `source_storage_key`, `audio_storage_key`, `duration_sec`, `size_bytes`, `is_mp4`, `diarization_degraded`, `last_progress_at`, `retry_count`, `archive_folder_id`, `idempotency_key`, `deleted_at`, timestamps（`asr_queue_tier` 遗留可空）

### `transcription_segments`
`task_id`, `segment_index`, `start_ms`, `end_ms`, `chunk_size_bytes`, `asr_text`, `speaker_label`, `status`；`storage_key` 首期 NULL

### `transcription_transcripts`
`task_id` UNIQUE, `asr_raw_json`, `polished_text`, `summary_text`, `version`（乐观锁）, `updated_by`

### `drive_nodes`
`created_by`, `parent_id`, `node_type`, `name`, `storage_key`, `linked_task_id`, `deleted_at`；**禁止**根目录堆文件

### `upload_sessions`
`task_id`, `owner_id`, `storage_key_prefix`, `expected_max_bytes`, `expires_at`, `completed_at`

### `outbox_events` / `pipeline_job_runs`
Outbox 事务触发 U3；阶段幂等 `UNIQUE(stage, outbox_event_id, attempt)`（目标 schema；已部署库可能仍为 `bull_job_id`）

### `ai_model_credentials` / `ai_feature_model_mappings` / `ai_prompt_templates`
管理员专用；API Key 密文；Prompt 禁止硬编码

### `audit_logs`
append-only + 哈希链；`metadata` 含 `client_timestamp`（浏览器事件）；仅 `append_audit_log()`

### 检索（首期）
`CREATE EXTENSION pg_trgm`；`polished_text`/`summary_text` GIN `gin_trgm_ops`；禁单独依赖 `simple` tsvector 做中文

---

## 10. RLS / Storage 要点

- 全业务表 RLS；律师仅 `created_by = auth.uid()`
- `profiles` 自更新触发器：禁止自改 `role/status/username/requires_password_change/mfa_enabled`
- Storage 路径：`(foldername)[1] = auth.uid()::text`；不信任客户端 metadata 作唯一授权
- `audit_logs`：无客户端 INSERT；不可 UPDATE/DELETE

---

## 11. 前端 UI 要点（详见 `ui_design.md`）

- **Shadcn UI + Tailwind**；基础控件禁止裸 DOM 堆叠
- 引入组件：`npx shadcn@latest add <component>`（勿手写 Button/Input/Dialog 等）
- **AppShell**：CSS Grid（sidebar | header / main）；列表区 Flex 列
- **禁止**：Mermaid/动态图渲染法律图表与打印视图；须 HTML+Grid/Flex
- **转写工作台**：校对模式（只读 `asr_raw_json`+seek）/ 编辑模式（仅 `polished_text`）
- **上传**：init → TUS(服务端前缀) → complete；上传中 `beforeunload` + 路由 `AlertDialog`
- 主题色：深蓝/藏青/高级灰（`globals.css` 令牌）
- 用户列表 admin：含 MFA Badge（`mfa_enabled`）

---

## 12. 关键环境变量（禁止硬编码）

```
NODE_ENV, APP_URL, API_URL
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_DB_URL
STORAGE_BUCKET_MEDIA, STORAGE_BUCKET_EXPORTS, STORAGE_SIGNED_URL_TTL_SEC
WORKER_DB_URL, WORKER_POLL_INTERVAL_MS, OUTBOX_MAX_ATTEMPTS, WORKER_MAX_CONCURRENCY
FFMPEG_*, WORKER_TMP_DIR, ASR_RATE_LIMIT_MAX, ASR_API_CONCURRENCY
ASR_PROVIDER_TYPE, ASR_MAX_CHUNK_SIZE_MB, ASR_SEGMENT_DURATION_SEC
AUTH_VIRTUAL_EMAIL_DOMAIN, AUTH_INITIAL_PASSWORD, CAPTCHA_*, MFA_REQUIRED_ROLES
AI_*_TIMEOUT_MS, STALLED_TASK_*
```

凭证以 `ai_model_credentials` 表为准；`.env` 不得入 Git。**不必配置** `REDIS_URL`（v1.3）。

---

## 13. 错误码（常用）

`AUTH_*`, `VALIDATION_FAILED`, `RESOURCE_NOT_FOUND`, `RESOURCE_CONFLICT`, `UPLOAD_SESSION_INVALID`, `RESOURCE_LIMIT_EXCEEDED`, `TASK_INVALID_STATE`, `MEDIA_EXTRACT_FAILED`, `MEDIA_PREPROCESS_FAILED`, `TASK_STALLED`, `AI_RATE_LIMITED`, `AI_PROVIDER_*`, `INTERNAL_ERROR`

---

## 14. 测试与提交

- Service/Controller **新增或修改必须同步** 自动化测试。
- 完成 `tasks.md` 子任务且测试通过后 **必须** `git commit`，未提交 **严禁** 开始下一子任务。

---

## 15. 开发前阅读顺序

1. **本文** `docs/CONTEXT_SUMMARY.md`
2. 子模块对应：`architecture.md` / `database.md` / `ui_design.md` / `prd.md`（按需章节）
3. 涉及迁移：以 `database.md` v1.4 为准

---

## 16. 文档索引

| 文件 | 内容 |
|------|------|
| `docs/prd.md` | 需求、RBAC、业务流程 |
| `docs/architecture.md` | 分层、Outbox 流水线、API、安全 |
| `docs/database.md` | 表、RLS、触发器、SQL |
| `docs/ui_design.md` | 组件、布局、页面交互 |
| `docs/design-review-report.md` | 安全审查整改记录 |

**行数预算**：本文控制在 500 行以内；细节冲突以各规范正文为准。
