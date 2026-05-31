# LexOS 数据库设计与安全规范

| 字段 | 内容 |
|------|------|
| 文档版本 | v1.4 |
| 依据 | `docs/prd.md` v0.3、`docs/architecture.md` v1.3、`docs/design-review-report.md` v1.0 |
| 数据库 | PostgreSQL 15+（Supabase 托管或私有化等价实例） |
| 租户模型 | **单律所单实例**；业务表不设 `tenant_id` |

---

## 1. 总则

### 1.1 设计原则

1.1.1 所有业务表启用 RLS；禁止 `PUBLIC` 宽权限。

1.1.2 主键统一 `UUID`，默认 `gen_random_uuid()`。

1.1.3 时间戳统一 `TIMESTAMPTZ`，写入 UTC；`created_at` / `updated_at` 由触发器或应用维护。

1.1.4 分页列表默认 `LIMIT 50`（PRD §5.1）。

### 1.2 枚举类型

```sql
CREATE TYPE user_role AS ENUM (
  'admin', 'lawyer', 'director', 'client', 'channel'
);

CREATE TYPE user_status AS ENUM (
  'enabled', 'disabled'
);

CREATE TYPE transcription_task_status AS ENUM (
  'uploading',
  'queued',
  'extracting',
  'preprocessing',
  'asr_running',
  'llm_running',
  'completed',
  'failed'
);

CREATE TYPE ai_provider_kind AS ENUM (
  'openai_compatible',
  'azure_openai',
  'custom_http'
);

CREATE TYPE ai_feature_key AS ENUM (
  'asr_physical',
  'asr_semantic',
  'llm_transcript_polish',
  'llm_legal_summary'
);

CREATE TYPE drive_node_type AS ENUM (
  'folder', 'file'
);

-- 【遗留·v1.3 起不再写入】快慢 ASR 队列分层；列保留可空，待后续迁移删除
CREATE TYPE asr_queue_tier AS ENUM (
  'express',
  'batch'
);

CREATE TYPE audit_action AS ENUM (
  'auth.login_success',
  'auth.login_failure',
  'auth.logout',
  'auth.password_change',
  'auth.password_reset',
  'user.create',
  'user.update',
  'user.disable',
  'user.enable',
  'ai.model.upsert',
  'ai.mapping.upsert',
  'ai.prompt.publish',
  'task.create',
  'task.complete',
  'task.fail',
  'file.download',
  'file.delete',
  'file.export'
);
```

---

## 2. 核心实体关系（ERD 概要）

```
auth.users (Supabase) 1──1 profiles
profiles 1──* transcription_tasks
profiles 1──* drive_nodes
transcription_tasks 1──* transcription_segments
transcription_tasks 1──1 transcription_transcripts
transcription_tasks 0──1 drive_nodes (archive folder)
ai_model_credentials 1──* ai_feature_model_mappings
ai_prompt_templates ── (by feature_key) ── AI 运行时
audit_logs ── actor_id ── profiles
```

---

## 3. 表结构清单

### 3.1 `profiles`

**业务场景（PRD）**：§2.4 账户字段；§2.5.1 虚拟邮箱用户业务镜像；§2.5.4 `requires_password_change`；§2.5.2 MFA 展示缓存。

| 字段名 | 数据类型 | 约束 | 默认 | 说明 |
|--------|----------|------|------|------|
| `id` | `UUID` | PK, FK → `auth.users(id)` ON DELETE RESTRICT | — | 与 Auth 用户同 ID |
| `username` | `VARCHAR(64)` | NOT NULL, UNIQUE | — | 登录名，小写规范化【待确认】大小写策略 |
| `display_name` | `VARCHAR(128)` | NOT NULL | — | 真实姓名 |
| `role` | `user_role` | NOT NULL | — | RBAC 角色 |
| `contact` | `VARCHAR(256)` | NULL | — | 可选联系方式 |
| `status` | `user_status` | NOT NULL | `'enabled'` | 启用/禁用 |
| `requires_password_change` | `BOOLEAN` | NOT NULL | `false` | 强制改密标记 |
| `mfa_enabled` | `BOOLEAN` | NOT NULL | `false` | TOTP 已绑定缓存；避免列表/个人中心频繁调 Auth API |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |

**同步规则**：

- 用户成功完成 TOTP 绑定（Supabase Auth MFA enroll/verify）后，BFF 调用 `set_profile_mfa_enabled(user_id, true)`（`SECURITY DEFINER`）更新本字段。
- 管理员解除 MFA（若产品允许）或 Auth 侧删除因子后，同步置 `false`。
- 本字段为**展示与路由门禁缓存**，鉴权仍以 Supabase Auth MFA 校验为准；二者不一致时以 Auth 为准并异步修正缓存。

**索引**：

- `UNIQUE (username)`
- `INDEX profiles_role_idx ON (role)`
- `INDEX profiles_status_idx ON (status)`
- `INDEX profiles_mfa_enabled_idx ON (mfa_enabled) WHERE mfa_enabled = true`

---

### 3.2 `transcription_tasks`

**业务场景（PRD）**：§3.5 语音转写任务全生命周期；§3.5.1 上传与状态机。

| 字段名 | 数据类型 | 约束 | 默认 | 说明 |
|--------|----------|------|------|------|
| `id` | `UUID` | PK | `gen_random_uuid()` | — |
| `created_by` | `UUID` | NOT NULL, FK → `profiles(id)` | — | 律师本人数据边界 |
| `title` | `VARCHAR(256)` | NOT NULL | — | 任务名称；归档目录名来源 |
| `status` | `transcription_task_status` | NOT NULL | `'uploading'` | 状态机 |
| `source_mime` | `VARCHAR(128)` | NOT NULL | — | 原始 MIME |
| `source_storage_key` | `TEXT` | NOT NULL | — | Storage 对象键（TUS 完成后） |
| `audio_storage_key` | `TEXT` | NULL | — | 抽音/归一化后音频键 |
| `duration_sec` | `INTEGER` | NULL | — | 时长校验 ≤ 18000（5h） |
| `size_bytes` | `BIGINT` | NOT NULL | — | ≤ 1073741824（1GB） |
| `is_mp4` | `BOOLEAN` | NOT NULL | `false` | 是否走抽音分支 |
| `diarization_degraded` | `BOOLEAN` | NOT NULL | `false` | PRD §4.3 降级标记 |
| `error_code` | `VARCHAR(64)` | NULL | — | 失败时对齐 architecture ErrorCode |
| `error_message` | `TEXT` | NULL | — | 运维可见摘要 |
| `archive_folder_id` | `UUID` | NULL, FK → `drive_nodes(id)` | — | 完成后云盘目录 |
| `idempotency_key` | `VARCHAR(128)` | NULL, UNIQUE | — | 防重复创建 |
| `deleted_at` | `TIMESTAMPTZ` | NULL | — | 软删除 |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |
| `status_changed_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | 状态迁移审计 |
| `last_progress_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | Worker 心跳；Stalled 扫描（`architecture.md` §3.6.4） |
| `asr_queue_tier` | `asr_queue_tier` | NULL | — | **【遗留·v1.3 废弃写入】** 曾用于 express/batch 路由；新代码不填 |
| `retry_count` | `INTEGER` | NOT NULL | `0` | 幽灵任务补偿重试次数 |

**索引**：

- `INDEX transcription_tasks_created_by_created_at_idx ON (created_by, created_at DESC)`
- `INDEX transcription_tasks_status_idx ON (status) WHERE deleted_at IS NULL`
- `INDEX transcription_tasks_stalled_idx ON (last_progress_at) WHERE status IN ('extracting','preprocessing','asr_running','llm_running') AND deleted_at IS NULL`
- `UNIQUE (idempotency_key) WHERE idempotency_key IS NOT NULL`

---

### 3.3 `transcription_segments`

**业务场景（PRD + 架构 v1.2）**：U3 Worker 使用 FFmpeg **按物理时长**（默认 15 分钟）切片；并行调用公有 ASR；切片文件 **不落库** Storage（仅 Worker 本地路径，见 `architecture.md` §3.2.2.5）。

| 字段名 | 数据类型 | 约束 | 默认 | 说明 |
|--------|----------|------|------|------|
| `id` | `UUID` | PK | `gen_random_uuid()` | — |
| `task_id` | `UUID` | NOT NULL, FK → `transcription_tasks(id)` ON DELETE CASCADE | — | — |
| `segment_index` | `INTEGER` | NOT NULL | — | 0-based 顺序 |
| `start_ms` | `INTEGER` | NOT NULL | — | 相对音频起点 |
| `end_ms` | `INTEGER` | NOT NULL | — | — |
| `storage_key` | `TEXT` | NULL | — | **首期保持 NULL**；禁止持久化切片对象键 |
| `local_path_hint` | `TEXT` | NULL | — | 可选；仅运维排障，**禁止**存绝对路径至客户端 API |
| `chunk_size_bytes` | `BIGINT` | NULL | — | 切片文件大小；须 `< ASR_MAX_CHUNK_SIZE_MB` |
| `asr_text` | `TEXT` | NULL | — | 片段识别结果 |
| `speaker_label` | `VARCHAR(32)` | NULL | — | ASR 提供商返回或降级为空 |
| `status` | `VARCHAR(32)` | NOT NULL | `'pending'` | `pending`/`done`/`failed` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |

**索引**：

- `UNIQUE (task_id, segment_index)`
- `INDEX transcription_segments_task_id_idx ON (task_id)`

---

### 3.4 `transcription_transcripts`

**业务场景（PRD）**：§3.5 工作台编辑；ASR/LLM 多阶段文稿；§4.3 降级后合并正文。

| 字段名 | 数据类型 | 约束 | 默认 | 说明 |
|--------|----------|------|------|------|
| `id` | `UUID` | PK | `gen_random_uuid()` | — |
| `task_id` | `UUID` | NOT NULL, UNIQUE, FK → `transcription_tasks(id)` ON DELETE CASCADE | — | 每任务一行 |
| `asr_raw_json` | `JSONB` | NULL | — | 带时间戳原始 ASR |
| `polished_text` | `TEXT` | NULL | — | LLM 润色后（富文本存 HTML【待确认】或 Markdown） |
| `summary_text` | `TEXT` | NULL | — | 法律摘要 |
| `search_vector` | `TSVECTOR` | NULL | — | 可选；`zhparser` 配妥后启用（见 §7.3） |
| `version` | `INTEGER` | NOT NULL | `1` | 乐观锁 |
| `updated_by` | `UUID` | NULL, FK → `profiles(id)` | — | 最后编辑人 |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |

**索引（中文检索，首期）**：

- `CREATE EXTENSION IF NOT EXISTS pg_trgm;`（迁移脚本 **必须** 包含，见 §7.3、§8）
- `GIN INDEX transcription_transcripts_polished_trgm_idx ON (polished_text gin_trgm_ops)`
- `GIN INDEX transcription_transcripts_summary_trgm_idx ON (summary_text gin_trgm_ops)`
- 查询：`WHERE polished_text % :q OR summary_text % :q` 或 `ILIKE`，配合 `pg_trgm` 相似度排序

**说明**：

- **禁止**在中文法律长文本场景单独依赖 `to_tsvector('simple', ...)` 作为唯一检索方案（分词无效，查准率极低）。
- `zhparser`（或其它中文分词扩展）部署后，可增设 `search_vector` 触发器并保留 `pg_trgm` 作为模糊兜底。

---

### 3.5 `drive_nodes`

**业务场景（PRD）**：§3.6 个人云盘；`YYYY-MM-DD/任务名称/` 自动目录；禁止根目录堆文件。

| 字段名 | 数据类型 | 约束 | 默认 | 说明 |
|--------|----------|------|------|------|
| `id` | `UUID` | PK | `gen_random_uuid()` | — |
| `created_by` | `UUID` | NOT NULL, FK → `profiles(id)` | — | 所有者 |
| `parent_id` | `UUID` | NULL, FK → `drive_nodes(id)` ON DELETE RESTRICT | — | `NULL` 仅允许系统初始化虚拟根【待确认】 |
| `node_type` | `drive_node_type` | NOT NULL | — | `folder` / `file` |
| `name` | `VARCHAR(256)` | NOT NULL | — | 同级唯一【待确认】见 §7.2 |
| `storage_key` | `TEXT` | NULL | — | `file` 类型指向 Storage |
| `mime_type` | `VARCHAR(128)` | NULL | — | — |
| `size_bytes` | `BIGINT` | NULL | — | — |
| `linked_task_id` | `UUID` | NULL, FK → `transcription_tasks(id)` | — | 转写归档关联 |
| `deleted_at` | `TIMESTAMPTZ` | NULL | — | 软删除 |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |

**约束（应用层 + 可选 DB）**：

- `file` 类型：`parent_id IS NOT NULL`（禁止根目录文件，PRD §3.6）
- `folder`：允许 `parent_id` 指向用户根文件夹

**索引**：

- `INDEX drive_nodes_created_by_parent_idx ON (created_by, parent_id) WHERE deleted_at IS NULL`
- `UNIQUE (created_by, parent_id, name) WHERE deleted_at IS NULL`【待确认】同级重名策略

---

### 3.6 `drive_node_tags`（可选扩展）

**业务场景（PRD）**：§3.6 标签。首期若 UI 未实现可延后迁移。

| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| `node_id` | `UUID` | PK, FK → `drive_nodes(id)` | — |
| `tag` | `VARCHAR(64)` | PK | — |
| `created_by` | `UUID` | NOT NULL, FK → `profiles(id)` | — |

---

### 3.7 `ai_model_credentials`

**业务场景（PRD）**：§3.3 模型凭证；私有化 Base URL 替换。

| 字段名 | 数据类型 | 约束 | 默认 | 说明 |
|--------|----------|------|------|------|
| `id` | `UUID` | PK | `gen_random_uuid()` | — |
| `name` | `VARCHAR(128)` | NOT NULL | — | 展示名 |
| `provider_kind` | `ai_provider_kind` | NOT NULL | — | Adapter 路由 |
| `model_name` | `VARCHAR(128)` | NOT NULL | — | — |
| `model_id` | `VARCHAR(256)` | NOT NULL | — | 提供商模型 ID |
| `api_key_ciphertext` | `TEXT` | NOT NULL | — | 应用层加密后存储 |
| `base_url` | `TEXT` | NULL | — | 反向代理/内网 |
| `context_window` | `INTEGER` | NULL | — | LLM 分片依据 |
| `is_enabled` | `BOOLEAN` | NOT NULL | `true` | — |
| `is_default_fallback` | `BOOLEAN` | NOT NULL | `false` | 全局兜底唯一【待确认】约束 |
| `created_by` | `UUID` | NOT NULL, FK → `profiles(id)` | — | 管理员 |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |

**索引**：

- `UNIQUE (is_default_fallback) WHERE is_default_fallback = true`（仅允许一条兜底）

---

### 3.8 `ai_feature_model_mappings`

**业务场景（PRD）**：§3.3 功能-模型映射；§4.2.4 兜底。

| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| `feature_key` | `ai_feature_key` | PK | 功能点 |
| `primary_model_id` | `UUID` | NOT NULL, FK → `ai_model_credentials(id)` | 主模型 |
| `fallback_model_id` | `UUID` | NULL, FK → `ai_model_credentials(id)` | 功能级兜底 |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | — |

---

### 3.9 `ai_prompt_templates`

**业务场景（PRD）**：§3.4 Prompt 模板库。

| 字段名 | 数据类型 | 约束 | 默认 | 说明 |
|--------|----------|------|------|------|
| `id` | `UUID` | PK | `gen_random_uuid()` | — |
| `feature_key` | `ai_feature_key` | NOT NULL | — | 绑定功能点 |
| `name` | `VARCHAR(128)` | NOT NULL | — | — |
| `system_prompt` | `TEXT` | NOT NULL | — | 非空校验 |
| `version` | `INTEGER` | NOT NULL | `1` | 递增发布 |
| `is_published` | `BOOLEAN` | NOT NULL | `false` | 运行时使用最新 published |
| `created_by` | `UUID` | NOT NULL, FK → `profiles(id)` | — | — |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |

**索引**：

- `INDEX ai_prompt_templates_feature_published_idx ON (feature_key, is_published, version DESC)`

---

### 3.10 `ai_invocation_logs`

**业务场景（PRD）**：§4.2.2 Token/耗时记录；architecture §6.3。

| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| `id` | `UUID` | PK | — |
| `task_id` | `UUID` | NULL, FK → `transcription_tasks(id)` | — |
| `feature_key` | `ai_feature_key` | NOT NULL | — |
| `model_id` | `UUID` | NOT NULL, FK → `ai_model_credentials(id)` | 实际调用模型 |
| `is_fallback` | `BOOLEAN` | NOT NULL | 是否兜底 |
| `input_tokens` | `INTEGER` | NULL | — |
| `output_tokens` | `INTEGER` | NULL | — |
| `latency_ms` | `INTEGER` | NOT NULL | — |
| `outcome` | `VARCHAR(16)` | NOT NULL | `success`/`failure` |
| `error_code` | `VARCHAR(64)` | NULL | — |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | — |

**索引**：`INDEX ai_invocation_logs_task_id_idx ON (task_id)`

---

### 3.11 `audit_logs`

**业务场景（PRD）**：§3.7 审计；§5.2 可维护性。仅 `admin` 可读（RLS）。

| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| `id` | `UUID` | PK | — |
| `actor_id` | `UUID` | NULL, FK → `profiles(id)` | 失败登录可为 NULL |
| `action` | `audit_action` | NOT NULL | — |
| `target_type` | `VARCHAR(64)` | NULL | 如 `profile`、`transcription_task` |
| `target_id` | `UUID` | NULL | — |
| `ip_address` | `INET` | NULL | — |
| `user_agent` | `TEXT` | NULL | — |
| `metadata` | `JSONB` | NOT NULL | `default '{}'` | 见下表 **metadata 必填键** |
| `prev_hash` | `CHAR(64)` | NULL | — | 上一条 `row_hash`（链首为 NULL） |
| `row_hash` | `CHAR(64)` | NOT NULL | — | `SHA-256` 规范化行内容 |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | — | 服务端入库时间（UTC） |

**`metadata` 必填键（凡经 BFF 写入且来源浏览器）**：

| 键 | 类型 | 说明 |
|----|------|------|
| `client_timestamp` | `string` (ISO8601) | 浏览器 `new Date().toISOString()`；合规比对客户端/服务端时序 |
| `client_timezone` | `string` | 可选；`Intl.DateTimeFormat().resolvedOptions().timeZone` |

- 纯服务端事件（Worker、Outbox、定时任务）：`client_timestamp` 可省略，以 `created_at` 为准。
- `auth.login_failure` 另须 `attempted_username`（或 `attempted_username_sha256`）。
- `append_audit_log()` 将 `client_timestamp` 纳入 `row_hash` 计算（若存在）。

**索引**：

- `INDEX audit_logs_created_at_idx ON (created_at DESC)`
- `INDEX audit_logs_actor_id_idx ON (actor_id)`

**写入**：仅 `append_audit_log()`（`SECURITY DEFINER`）插入；见 §6.5。

**权限**：`REVOKE UPDATE, DELETE ON audit_logs FROM PUBLIC, authenticated, service_role`。

---

### 3.13 `upload_sessions`（审查整改 R-02）

**业务场景**：TUS 直传前服务端签发；绑定 `owner_id` 与存储前缀，防止路径/元数据伪造。

| 字段名 | 数据类型 | 约束 | 默认 | 说明 |
|--------|----------|------|------|------|
| `id` | `UUID` | PK | `gen_random_uuid()` | 会话 ID |
| `task_id` | `UUID` | NOT NULL, FK → `transcription_tasks(id)` ON DELETE CASCADE | — | — |
| `owner_id` | `UUID` | NOT NULL, FK → `profiles(id)` | — | 须等于 `auth.uid()` |
| `storage_key_prefix` | `TEXT` | NOT NULL | — | 形如 `{uuid}/{uuid}/` |
| `expected_max_bytes` | `BIGINT` | NOT NULL | — | ≤ 1073741824 |
| `expires_at` | `TIMESTAMPTZ` | NOT NULL | — | 默认 `now() + interval '24 hours'` |
| `completed_at` | `TIMESTAMPTZ` | NULL | — | TUS 完成回调置位 |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |

**索引**：`INDEX upload_sessions_task_id_idx ON (task_id)`；`INDEX upload_sessions_expires_at_idx ON (expires_at) WHERE completed_at IS NULL`

---

### 3.14 `pipeline_job_runs`（审查整改 C-04）

**业务场景**：U3 流水线阶段幂等；防止重复 ASR/LLM（**不**依赖 BullMQ）。

| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| `id` | `UUID` | PK | — |
| `stage` | `VARCHAR(64)` | NOT NULL | 逻辑阶段名，如 `asr`、`media.preprocess`（`architecture.md` §3.2.1.3） |
| `outbox_event_id` | `UUID` | NOT NULL, FK → `outbox_events(id)` | 关联触发的 Outbox 行 |
| `attempt` | `INTEGER` | NOT NULL | 重试序号 |
| `task_id` | `UUID` | NULL, FK → `transcription_tasks(id)` | — |
| `status` | `VARCHAR(16)` | NOT NULL | `running`/`succeeded`/`failed` |
| `started_at` | `TIMESTAMPTZ` | NOT NULL | — |
| `finished_at` | `TIMESTAMPTZ` | NULL | — |

**索引**：`UNIQUE (stage, outbox_event_id, attempt)`

3.14.1 **【遗留 schema】** 已部署库可能仍为 `queue_name` + `bull_job_id`（M0 迁移）；M5 须新增迁移重命名为上表结构，并回填 `stage` ← `queue_name`、`outbox_event_id` ← 新生成 UUID 映射策略【实现时定】。

---

### 3.15 `outbox_events`（审查整改 C-02）

**业务场景**：事务性出站；与业务写入同事务提交。

| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| `id` | `UUID` | PK | — |
| `aggregate_type` | `VARCHAR(64)` | NOT NULL | 如 `transcription_task` |
| `aggregate_id` | `UUID` | NOT NULL | — |
| `event_type` | `VARCHAR(64)` | NOT NULL | 如 `task.queued`、`task.stage` |
| `payload` | `JSONB` | NOT NULL | 含 `stage`、`taskId`、`createdBy`、`isMp4` 等（见 `architecture.md` §3.7.2） |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | — |
| `published_at` | `TIMESTAMPTZ` | NULL | U3 成功处理该阶段后置位（**非**「投递到 Redis」） |
| `publish_attempts` | `INTEGER` | NOT NULL | `0` |

**索引**：`INDEX outbox_events_unpublished_idx ON (created_at) WHERE published_at IS NULL`

---

### 3.12 `system_settings`（首期最小）

**业务场景（PRD）**：§2.2 系统配置（非 AI）。键值存储律所级参数。

| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| `key` | `VARCHAR(128)` | PK | — |
| `value` | `JSONB` | NOT NULL | — |
| `updated_by` | `UUID` | FK → `profiles(id)` | — |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | — |

---

## 4. 行级安全策略（RLS）

### 4.1 辅助函数

```sql
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND status = 'enabled'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_enabled_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status = 'enabled'
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_enabled_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_enabled_user() TO authenticated, service_role;
```

4.1.1 **禁止**创建 `SECURITY DEFINER` 视图包装业务表（审查整改 R-06）；列表/报表经 API 或 `SECURITY INVOKER` 视图。

### 4.2 `profiles`

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 用户读取本人
CREATE POLICY profiles_select_self ON public.profiles
  FOR SELECT USING (id = auth.uid() AND is_enabled_user());

-- 管理员读取全部
CREATE POLICY profiles_select_admin ON public.profiles
  FOR SELECT USING (is_admin());

-- 用户更新本人（仅 display_name, contact；禁止自改 role/status/requires_password_change）
CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE USING (id = auth.uid() AND is_enabled_user())
  WITH CHECK (id = auth.uid());

-- 管理员全部写
CREATE POLICY profiles_write_admin ON public.profiles
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
```

4.2.1 `requires_password_change`、`role`、`status`、`username`、`mfa_enabled` 仅 `SECURITY DEFINER` 函数 `admin_*` / `complete_password_change()` / `set_profile_mfa_enabled()` 可写。

4.2.2 触发器 `profiles_guard_self_update`（审查整改 R-01）：

```sql
CREATE OR REPLACE FUNCTION public.profiles_guard_self_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF current_user_role() = 'admin' THEN
    RETURN NEW;
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.username IS DISTINCT FROM OLD.username
     OR NEW.requires_password_change IS DISTINCT FROM OLD.requires_password_change
     OR NEW.mfa_enabled IS DISTINCT FROM OLD.mfa_enabled
     OR NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'profiles_escalation_denied';
  END IF;
  RETURN NEW;
END;
$$;
```

### 4.3 `transcription_tasks`

```sql
ALTER TABLE public.transcription_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tasks_select ON public.transcription_tasks
  FOR SELECT USING (
    deleted_at IS NULL AND (
      (created_by = auth.uid() AND is_enabled_user())
      OR is_admin()
    )
  );

CREATE POLICY tasks_insert ON public.transcription_tasks
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND is_enabled_user()
    AND current_user_role() IN ('lawyer', 'admin')
  );

CREATE POLICY tasks_update ON public.transcription_tasks
  FOR UPDATE USING (
    deleted_at IS NULL AND (
      (created_by = auth.uid() AND is_enabled_user())
      OR is_admin()
    )
  );

-- 软删除视为 UPDATE deleted_at
```

4.3.1 `director`/`client`/`channel`：无策略匹配 → 拒绝（首期零业务权限）。

4.3.2 律师 **无** `INSERT` 策略的跨用户写；管理员跨用户写经 API `AdminRepository`（`service_role`），不扩展律师 JWT 策略。

### 4.4 `transcription_segments` / `transcription_transcripts`

4.4.1 **禁止** `FOR ALL` 合并策略（审查整改 R-05）。`transcription_segments` 示例：

```sql
CREATE POLICY segments_select ON public.transcription_segments
  FOR SELECT USING (
    is_enabled_user() AND EXISTS (
      SELECT 1 FROM public.transcription_tasks t
      WHERE t.id = task_id AND t.deleted_at IS NULL
        AND (t.created_by = auth.uid() OR is_admin())
    )
  );

CREATE POLICY segments_insert_lawyer ON public.transcription_segments
  FOR INSERT WITH CHECK (
    is_enabled_user() AND EXISTS (
      SELECT 1 FROM public.transcription_tasks t
      WHERE t.id = task_id AND t.deleted_at IS NULL AND t.created_by = auth.uid()
    )
  );
```

4.4.2 Worker 批量写入片段：**不**使用律师 JWT；经 `service_role` 调用 `upsert_task_segments()`（`SECURITY DEFINER`，内部校验 `task_id` 存在）。

4.4.3 `transcription_transcripts`：`SELECT`/`UPDATE` 谓词同 §4.4.1；`INSERT` 仅允许关联本人任务；`UPDATE` 须配合应用层 `version` 乐观锁。

### 4.5 `drive_nodes`

```sql
CREATE POLICY drive_select ON public.drive_nodes
  FOR SELECT USING (
    deleted_at IS NULL AND (
      (created_by = auth.uid() AND is_enabled_user())
      OR is_admin()
    )
  );

CREATE POLICY drive_write ON public.drive_nodes
  FOR ALL USING (
    created_by = auth.uid() AND is_enabled_user()
    AND current_user_role() IN ('lawyer', 'admin')
  ) WITH CHECK (created_by = auth.uid());
```

4.5.1 律师 JWT：`drive_write` 仅 `created_by = auth.uid()`。管理员跨用户云盘操作 **不** 扩展 RLS，仅 `AdminRepository` + 审计（审查整改 R-03）。

4.5.2 `drive_node_tags`：RLS 继承 `drive_nodes` 可见性（`EXISTS` 关联 `node_id`）。

### 4.6 AI 配置表

```sql
-- ai_model_credentials, ai_feature_model_mappings, ai_prompt_templates
-- SELECT/INSERT/UPDATE/DELETE 仅 is_admin()
```

律师、预留角色：无策略。

### 4.7 `audit_logs`

```sql
CREATE POLICY audit_select_admin ON public.audit_logs
  FOR SELECT USING (is_admin());

-- 无客户端 INSERT/UPDATE/DELETE 策略
```

### 4.8 `ai_invocation_logs`

4.8.1 `SELECT`：`admin` 全量；`lawyer` 仅关联本人 `task_id`。

4.8.2 `INSERT`：仅 `service_role`（Worker）。

### 4.9 `upload_sessions` RLS

```sql
ALTER TABLE public.upload_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY upload_sessions_select ON public.upload_sessions
  FOR SELECT USING (owner_id = auth.uid() AND is_enabled_user());

CREATE POLICY upload_sessions_insert ON public.upload_sessions
  FOR INSERT WITH CHECK (owner_id = auth.uid() AND is_enabled_user());

-- UPDATE completed_at 仅服务端 service_role 或 SECURITY DEFINER
```

### 4.10 `outbox_events` / `pipeline_job_runs`

4.10.1 **不** 对 `authenticated` 开放；仅 `service_role` 读写（U3 Pipeline Worker）。

4.10.2 U3 轮询 `outbox_events` 时使用 `service_role` 连接；`FOR UPDATE SKIP LOCKED` 见 `architecture.md` §3.7.3。

### 4.11 状态迁移函数 `transition_task_status`（审查整改 C-01）

```sql
CREATE OR REPLACE FUNCTION public.transition_task_status(
  p_task_id uuid,
  p_from public.transcription_task_status,
  p_to public.transcription_task_status
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated int;
BEGIN
  UPDATE public.transcription_tasks
  SET status = p_to,
      status_changed_at = now(),
      last_progress_at = now(),
      updated_at = now()
  WHERE id = p_task_id
    AND status = p_from
    AND deleted_at IS NULL;
  GET DIAGNOSTICS updated = ROW_COUNT;
  RETURN updated = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.transition_task_status(uuid, public.transcription_task_status, public.transcription_task_status) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transition_task_status(uuid, public.transcription_task_status, public.transcription_task_status) TO service_role;
```

4.11.1 合法迁移表由应用层 `TaskStateMachine` 维护；数据库函数 **不** 校验迁移图（防止函数过度复杂），非法迁移由 Worker 在调用前断言。

### 4.12 审计追加函数 `append_audit_log`（审查整改 A-01）

```sql
CREATE OR REPLACE FUNCTION public.append_audit_log(
  p_actor_id uuid,
  p_action public.audit_action,
  p_target_type varchar,
  p_target_id uuid,
  p_ip inet,
  p_user_agent text,
  p_metadata jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid := gen_random_uuid();
  v_prev char(64);
  v_row char(64);
BEGIN
  SELECT row_hash INTO v_prev FROM public.audit_logs ORDER BY created_at DESC LIMIT 1;
  v_row := encode(digest(
    coalesce(v_prev,'') || v_id::text || p_action::text || coalesce(p_actor_id::text,'')
    || coalesce(p_target_id::text,'') || p_metadata::text || clock_timestamp()::text,
    'sha256'), 'hex');
  INSERT INTO public.audit_logs (
    id, actor_id, action, target_type, target_id, ip_address, user_agent, metadata, prev_hash, row_hash, created_at
  ) VALUES (
    v_id, p_actor_id, p_action, p_target_type, p_target_id, p_ip, p_user_agent, p_metadata, v_prev, v_row, now()
  );
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.append_audit_log(...) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.append_audit_log(...) TO service_role;
```

4.12.1 `BEFORE UPDATE OR DELETE ON audit_logs` → `RAISE EXCEPTION 'audit_log_immutable'`。

---

## 5. Supabase Storage Bucket 策略

### 5.1 Bucket 划分

| Bucket | 内容 | 路径模式示例 |
|--------|------|----------------|
| `media` | 上传源文件、处理后音频、切片 | `{owner_id}/{task_id}/...` |
| `exports` | 导出 docx/pdf | `{owner_id}/{task_id}/exports/...` |

### 5.2 路径规范（审查整改 R-02）

5.2.1 对象 `name`（路径）**必须**匹配：`^{owner_uuid}/{task_uuid}/.+$`，其中 `owner_uuid = auth.uid()`。

5.2.2 `owner_uuid`、`task_uuid` 与 `upload_sessions.storage_key_prefix` 一致；完成回调时服务端校验对象列表前缀。

5.2.3 自定义 `metadata` 仅作辅助展示，**不得**作为授权唯一依据。

### 5.3 Storage RLS（路径优先）

```sql
CREATE POLICY "media_select_path_owner"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "media_insert_path_owner"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "media_delete_path_owner"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

5.3.1 `exports` 桶策略同构。

5.3.2 禁止客户端 `UPDATE` 他人对象；禁止 `authenticated` 对 `media` 桶 `SELECT` 列表全桶（若需列表，仅经 API）。

5.3.3 管理员读取律师对象：**禁止** 对 `authenticated` 放开跨路径；仅 BFF `service_role` 签发短时下载 URL + 审计。

---

## 6. 审计与生命周期控制

### 6.1 通用审计字段

| 字段 | 适用范围 |
|------|----------|
| `created_at` | 所有业务表 |
| `updated_at` | 可变表 |
| `created_by` | 用户产生数据：`transcription_tasks`、`drive_nodes`、AI 配置 |
| `updated_by` | `transcription_transcripts`、可选 `system_settings` |

6.1.1 `audit_logs` 为操作级审计，不替代行内 `created_by`。

### 6.2 软删除

| 表 | 软删除字段 | 范围说明 |
|----|------------|----------|
| `transcription_tasks` | `deleted_at` | 律师/管理员删除任务（PRD 矩阵 D） |
| `drive_nodes` | `deleted_at` | 文件/目录删除 |
| `profiles` | **无** | PRD §1.4 A4：仅 `status=disabled`，禁止物理删用户 |

6.2.1 软删除行：RLS `SELECT` 默认不可见；`admin` 审计库可查【待确认】是否需 admin 查看已删。

### 6.3 数据归档策略

6.3.1 任务 `completed` 后：Worker 创建 `drive_nodes` 文件夹 `YYYY-MM-DD/title/`，写入转写文件引用；`transcription_tasks.archive_folder_id` 回链。

6.3.2 Storage 临时切片：任务完成后 7 日内删除 `media/{owner}/{task}/segments/*`【待确认】保留期，由定时 Job 执行。

6.3.3 MP4 源文件：抽音成功后默认删除源对象（PRD 默认删除）；若启用冷存储则复制后删【待确认】。

6.3.4 `audit_logs`：保留 **365** 天【待确认】；超期 **分区 DETACH** 冷归档，禁止 `DELETE` 抹痕。

### 6.5 审计防篡改（审查整改 A-01）

6.5.1 `audit_logs` 为 **append-only**；应用与 DBA 均不可 `UPDATE`/`DELETE`。

6.5.2 哈希链：`row_hash = SHA-256(prev_hash || canonical_fields)`；验签工具由运维脚本提供（非热路径）。

6.5.3 合规取证以 `audit_logs` 为准；`ai_invocation_logs` 为辅助计量，亦可设只读策略。

### 6.4 Auth 与 `profiles` 同步

6.4.1 `auth.users` 插入后触发器 `handle_new_user` 写入 `profiles`（或在 Admin API 创建后由服务端事务写入）。

6.4.2 禁止应用层直接 `DELETE FROM auth.users`（PRD 禁用账户删除）。

---

## 7. 约束与业务规则（数据库层补充）

### 7.1 任务创建校验（触发器或 API）

7.1.1 `size_bytes <= 1073741824`。

7.1.2 `duration_sec IS NULL OR duration_sec <= 18000`。

7.1.3 ~~入队时写入 `asr_queue_tier`~~ **【v1.3 废除】**；`complete` 时不再更新该列。

7.1.4 Stalled 补偿扫描谓词见 `architecture.md` §3.6.4.2（`last_progress_at`、`retry_count`）。

### 7.2 云盘目录

7.2.1 应用层创建用户时插入不可见「根」文件夹记录，或使用 `parent_id NULL` 仅允许 `node_type='folder' AND name='__root__'` 单行。

7.2.2 自动归档路径：`to_char(completed_at, 'YYYY-MM-DD') || '/' || sanitized(title)`。

### 7.3 全文检索（中文）

7.3.1 数据库初始化脚本 **必须** 执行：

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

7.3.2 **过渡期（zhparser 未部署）**：对 `transcription_transcripts.polished_text`、`summary_text` 使用 `pg_trgm` GIN 索引（§3.4）；API 使用 `%` / `ILIKE` / `similarity()` 实现高效模糊检索，替代无效的 `simple` 分词。

7.3.3 **目标态（zhparser 已部署）**：增加 `search_vector` + `to_tsvector('zhparser', ...)` 触发器；`pg_trgm` 索引保留作为子串兜底。

7.3.4 首期不使用向量语义检索（PRD §1.3）。

### 7.4 `profiles` 列级防护

7.4.1 触发器 `profiles_guard_self_update`（§4.2.2）为 **必须** 迁移项。

7.4.2 `complete_password_change()`：`SECURITY DEFINER`；校验 `id=auth.uid()` 后设 `requires_password_change=false`。

7.4.3 `set_profile_mfa_enabled(p_user_id uuid, p_enabled boolean)`：`SECURITY DEFINER`；仅在 Auth MFA 绑定/解绑成功回调后由 BFF 调用；禁止律师 JWT 直接 `UPDATE mfa_enabled`。

### 7.5 `upload_sessions` 与 Storage 一致性

7.5.1 `uploads/complete` 须验证 Storage 中至少存在一个 `name` 以 `storage_key_prefix` 开头的对象，且 `sum(size) <= expected_max_bytes`。

---

## 8. 迁移与初始化顺序

0. `CREATE EXTENSION IF NOT EXISTS pg_trgm;`（§7.3.1）  
1. 枚举类型  
2. `profiles`（依赖 `auth.users`）  
3. AI 配置表  
4. `transcription_tasks` → `segments` → `transcripts`  
5. `drive_nodes`  
6. `upload_sessions`、`outbox_events`、`pipeline_job_runs`  
7. `audit_logs`、`ai_invocation_logs`  
8. 函数：`transition_task_status`、`append_audit_log`、`profiles_guard_self_update`、`set_profile_mfa_enabled`  
9. RLS 策略与 Storage policies  
10. 触发器：审计不可变、`profiles_guard_self_update`  
11. Seed：内置 `admin` 用户（与 PRD §1.4 A3 一致，脚本外置 `supabase/seed.sql`）

---

## 9. 文档修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-05-29 | 首版，依据 PRD v0.3 |
| v1.1 | 2026-05-29 | 安全审查整改：见 `design-review-report.md` |
| v1.2 | 2026-05-29 | `mfa_enabled`；中文 `pg_trgm` 检索；`audit_logs.metadata.client_timestamp` |
| v1.3 | 2026-05-29 | 对齐架构 v1.2：废除 VAD；`asr_queue_tier`、`last_progress_at`、`retry_count`；片段表物理切片语义 |
| v1.4 | 2026-05-30 | 对齐架构 v1.3：Outbox 直消费；`pipeline_job_runs` 目标 schema（`stage`+`outbox_event_id`）；`asr_queue_tier` 停止写入 |

---

## 附录 A：残余实现依赖（非阻断）

| 编号 | 项 | 本文默认 |
|------|-----|----------|
| B1 | 密码强度规则 | 应用层校验，未入库 |
| B2 | 同级目录重名 | `UNIQUE(created_by, parent_id, name)` |
| B3 | admin 删除律师云盘文件 | 首期禁止；仅 `AdminRepository` |
| B4 | 中文 FTS | 首期 `pg_trgm`；目标态 `zhparser` + `search_vector` |
| B5 | ASR 单片失败策略 | Worker 整任务 `failed` |
| B6 | 切片 Storage | 禁止；仅 Worker 本地临时文件 |
