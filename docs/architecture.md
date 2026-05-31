# LexOS 系统架构规范

| 字段 | 内容 |
|------|------|
| 文档版本 | v1.3 |
| 依据 | `docs/prd.md` v0.3、`docs/design-review-report.md` v1.0 |
| 适用范围 | Node.js 业务服务、U3 Job Worker（纯 TypeScript）、公有/私有化 ASR·LLM HTTP 适配 |
| 规模假设 | 单律所；同时转写任务 **≤ 5**；日均约 10 任务（PRD §5.1） |

---

## 1. 总则

### 1.1 架构目标

1.1.1 满足单律所私有化部署：全部有状态依赖可通过环境变量切换端点，业务代码不硬编码公网 SaaS。

1.1.2 满足 PRD §3.5.1：大文件不经 Node 进程内存收流；CPU 密集计算（FFmpeg 抽音/物理切片）在 **U3 Worker** 执行，与 **U2 API** 进程隔离；**不**部署独立 Python VAD 微服务。

1.1.3 满足 PRD §2.2、§2.3：权限在 API 中间件与 Postgres RLS / Storage 策略双层强制执行。

### 1.2 逻辑部署单元

| 单元 ID | 名称 | 职责 |
|---------|------|------|
| U1 | Web 前端 | 会话、Router Guard、TUS 直传 Storage |
| U2 | API 服务（Node） | HTTP API、鉴权、状态机调度、元数据 CRUD、审计写入、Outbox 生产 |
| U3 | Job Worker（Node） | **单进程**：轮询 Postgres Outbox、执行流水线各阶段；FFmpeg 抽音/物理切片；ASR/LLM 编排；不写 HTTP 路由 |
| — | ~~U4 Python VAD~~ | **已废除**；切片与预处理统一由 U3（TypeScript + FFmpeg 子进程）完成 |
| U5 | Supabase | Auth、Postgres（RLS）、Storage；Realtime 默认关闭（§3.4.3） |
| U6 | 推理适配层 | U2/U3 内 Adapter：封装 Whisper 等 ASR API 与 LLM Chat API（HTTP/SDK） |

首期规模（PRD §5.1）：活跃用户 50～100；日均转写约 10；轻量 API 峰值 QPS ≤ 10。

---

## 2. 目录结构与分层架构规范

### 2.1 仓库目录约定（API 与 Worker）

```
lexos/
├── apps/
│   ├── web/                    # U1：Next.js 或等价 SPA
│   └── api/                    # U2：HTTP 入口
│       └── src/
│           ├── routes/         # 路由注册，仅做路径与方法绑定
│           ├── controllers/    # 请求校验、响应映射、HTTP 状态码
│           ├── services/       # 业务规则、事务边界、跨表编排
│           ├── repositories/   # 数据访问（Supabase client / SQL）
│           ├── adapters/       # 外部系统：ASR/LLM、Storage 签名、验证码
│           ├── middleware/     # 鉴权、审计、改密门禁、错误包装
│           ├── lib/            # 纯函数工具（无 IO）
│           └── types/          # DTO、枚举、ErrorCode
├── workers/
│   ├── pipeline/               # U3：Outbox 消费者 + 流水线 Handler（**唯一**异步执行进程）
│   └── outbox-dispatcher/      # 【遗留·待合并】M4 过渡；目标并入 pipeline/，不再依赖 Redis
├── packages/
│   └── shared/                 # 跨进程共享类型、常量、ErrorCode
└── supabase/                   # 迁移、RLS、Storage 策略（见 database.md）
```

### 2.2 分层定义与调用流向

#### 2.2.1 Routes 层

2.2.1.1 职责：注册 HTTP 路径；挂载中间件链；将请求委托至唯一 Controller 方法。

2.2.1.2 禁止：业务判断、数据库访问、外部 HTTP 调用。

#### 2.2.2 Controllers 层

2.2.2.1 职责：解析并校验输入（schema）；读取 `request.context`（用户、Request ID）；调用 Service；将 Service 结果映射为统一响应体（§6）。

2.2.2.2 禁止：直接调用 Repository；跨模块编排；队列生产以外的副作用链。

#### 2.2.3 Services 层

2.2.3.1 职责：实现 PRD 业务规则；定义事务边界；调用一个或多个 Repository / Adapter；写入审计；与业务更新**同一事务**写入 `outbox_events`（触发 U3 异步处理）。

2.2.3.2 禁止：读取 `req`/`res` 原始对象；拼接 SQL 字符串（须通过 Repository 参数化）；在 Service 层同步执行 FFmpeg/ASR/LLM；**严禁**在 U2 进程内直接触发 Worker 副作用（须经 Outbox）。

#### 2.2.4 Repositories 层（Data Access）

2.2.4.1 职责：对 Supabase/Postgres 的 CRUD；使用用户 JWT 客户端（RLS 生效）或 Service Role 客户端（仅管理员跨用户场景，须 Service 层显式授权）。

2.2.4.2 禁止：业务规则（如「律师仅本人」须在 RLS + Service 双重保证，Service 不得省略角色校验）。

#### 2.2.5 Adapters 层

2.2.5.1 职责：封装 Supabase Auth Admin、Storage 签名、Turnstile/Geetest、ASR/LLM Provider（§4.3、§5.3）。

2.2.5.2 禁止：依赖 Services；写入业务表。

#### 2.2.6 调用流向（强制）

```
HTTP Request
  → middleware (auth | password-change-gate | role | audit | error)
  → Route
  → Controller
  → Service
  → Repository / Adapter
  → Service → Controller → Response
```

2.2.6.1 Worker 进程：仅允许 `Job Handler → Service → Repository/Adapter`；禁止挂载 HTTP Routes。

2.2.6.2 跨层禁止：`Route → Repository`、`Controller → Adapter`（测试替身除外）、`Repository → Service`。

### 2.3 数据传递契约

| 边界 | 输入 | 输出 |
|------|------|------|
| Controller → Service | 已校验 DTO + `AuthContext` | `Result<T, AppError>` 或抛出 `AppError` |
| Service → Repository | 实体 ID、分页（limit≤50、cursor/offset） | 行类型 / 列表 + `nextCursor` |
| Service → Queue | `JobPayload`（JSON 可序列化，含 `taskId`、`requestId`） | `jobId` |
| Adapter → 外部 | 提供商无关 `CompletionRequest` | `CompletionResponse`（含 `latencyMs`、`usage`） |

2.3.1 `AuthContext` 最低字段：`userId`（UUID）、`role`（枚举）、`username`、`requiresPasswordChange`（boolean）、`sessionId`（可选）。

---

## 3. 并发与性能控制策略

### 3.1 Node 主进程职责边界

3.1.1 主 API 进程仅处理：I/O 密集 HTTP、轻量 JSON、Outbox 生产（短事务）、短事务 DB 操作。

3.1.2 禁止在 **U2 API 主进程** 同步执行：FFmpeg、ASR、LLM 推理、大于 1 MB 的文件体缓冲。FFmpeg 仅允许在 **U3 Worker** 子进程执行。

### 3.2 异步流水线与 Worker（Postgres Outbox，无 Redis）

#### 3.2.1 技术选型（简化版 · v1.3）

3.2.1.1 **不引入 Redis / BullMQ**。异步调度完全基于 Postgres `outbox_events` + U3 单 Worker 进程；首期并发 **≤ 5** 个转写任务，无需独立消息中间件。

3.2.1.2 **Transactional Outbox**（§3.7）：API 与 Worker 阶段切换时，业务状态变更与 `outbox_events` 插入在同一数据库事务；U3 轮询 `published_at IS NULL` 行，`FOR UPDATE SKIP LOCKED` 领取后执行对应阶段 Handler，成功则 `published_at = now()`。

3.2.1.3 **流水线阶段**（逻辑名，写入 Outbox `payload.stage`；**非** Redis 队列名）：

| `stage` | 执行内容 | 典型 `status` 迁移 |
|---------|----------|-------------------|
| `media.extract` | MP4 抽音（FFmpeg） | `queued` → `extracting` → … |
| `media.preprocess` | 下载 Storage 音频 → 重采样 → 物理切片至本地临时目录 | → `preprocessing` |
| `asr` | 公有 ASR API（单任务切片并发 3） | → `asr_running` |
| `llm` | LLM 润色 + 摘要 | → `llm_running` |
| `drive.archive` | 归档云盘目录 | → `completed` 前 |

3.2.1.4 阶段完成后：U3 在**同一事务**内调用 `transition_task_status`、插入**下一阶段** Outbox 行（若还有后续）；末阶段完成后任务进入 `completed`。

3.2.1.5 **全局并发**：`WORKER_MAX_CONCURRENCY` 默认 **5**（同时处理的 `task_id` 数）；进程内 `p-limit`（或等价）实现，**禁止**无界并行。

3.2.1.6 **ASR 限流**（公有云 QPS/RPM）：`ASR_RATE_LIMIT_MAX` 默认 **50** 次/分钟；Worker 进程内令牌桶或查询 `ai_invocation_logs` 计数；收到 HTTP **429** 时指数退避重试。**不**依赖 Redis 共享计数（单所规模足够）。

3.2.1.7 **废除** v1.2 的 express/batch 双 ASR 队列与 `asr_queue_tier` 路由；长短视频在同一 Worker 池按 FIFO（`outbox_events.created_at`）处理。

#### 3.2.2 本地 FFmpeg 预处理与物理切片（替代 VAD）

3.2.2.1 **公有 API 限制**：公有 ASR（如 OpenAI Whisper）常见单文件 **≤25MB**。U3 从 Storage **流式下载**原音频至 Worker 宿主机，禁止整文件载入 Node 堆内存。

3.2.2.2 **抽音（MP4）**：`child_process.spawn` 调用 `ffmpeg`；参数白名单；`FFMPEG_MAX_CONCURRENT`（默认 2）。

3.2.2.3 **重采样**：统一 `-ar 16000 -ac 1`，输出 **MP3**（高压缩），降低体积。

3.2.2.4 **物理切片**：使用 FFmpeg `segment`（或等价）按 **时长** 切分（默认每 **15 分钟** 一片），使每片 **< `ASR_MAX_CHUNK_SIZE_MB`**（默认 20MB）；不足一片的尾段单独成片。

3.2.2.5 **临时目录**：`WORKER_TMP_DIR` 默认 `/tmp/lexos/{task_id}/`；切片 **仅** 存本地；ASR 完成后 **立即删除** 该片文件；**禁止**将切片回传 Supabase Storage。

3.2.2.6 子进程超时：`FFMPEG_TIMEOUT_MS`（默认 3_600_000）。

3.2.2.7 预处理失败：`transition_task_status` → `failed`，`error_code=MEDIA_PREPROCESS_FAILED`。

3.2.2.8 Diarization：首期由 ASR API 说话人标签（若提供商支持）写入 `transcription_segments`；不支持则按 PRD §4.3 降级 `diarization_degraded=true`。

#### 3.2.3 ASR API 并发与限流控制

3.2.3.1 **单任务并发**：`ASR_API_CONCURRENCY=3`；使用 `p-limit`（或等价）控制 Promise 池；**严禁**对全部切片无界 `Promise.all`。

3.2.3.2 **全局限流**：见 §3.2.1.6；Worker 内实现，不依赖外部消息队列。

3.2.3.3 **提供商类型**：`ASR_PROVIDER_TYPE`（`openai` \| `aliyun` \| `openai_compatible` 等）驱动 U6 `AsrAdapter`；模型凭证仍以 `ai_model_credentials` 为准。

3.2.3.4 ASR 超时：`ASR_REQUEST_TIMEOUT_MS`（默认 120_000/片）。

#### 3.2.4 LLM 并发

3.2.4.1 LLM 调用经 U6 Adapter；`LLM_REQUEST_TIMEOUT_MS`（默认 60_000）。

3.2.4.2 兜底（PRD §4.2.4 L1）：失败回退 `fallback_model_id`，重试 **1** 次。

### 3.3 任务状态机（与 PRD 对齐）

3.3.1 状态枚举存储于 `transcription_tasks.status`（见 `database.md`）。

3.3.2 仅 U3 Worker 或经 Service 封装的「状态迁移」函数可修改 `status`；Controller 不得直接跳态。

3.3.3 律师账号禁用（PRD §3.5）：不取消已入队 Job；继续执行至 `completed`/`failed`。

3.3.4 状态迁移 **必须** 调用数据库函数 `transition_task_status()`（见 `database.md` §4.11）；禁止 Worker/API 直接 `UPDATE transcription_tasks SET status=...` 无 `WHERE status` 守卫。

#### 3.2.5 阶段幂等与运行记录

3.2.5.1 每个 Outbox 阶段处理前插入 `pipeline_job_runs`（`stage`、`outbox_event_id`、`attempt`），`UNIQUE` 冲突则视为重复消费并 **跳过**（不重复调用 ASR/LLM）。

3.2.5.2 外部 AI 调用须写入 `ai_invocation_logs`，并携带 `idempotency_key = sha256(task_id || feature_key || segment_index || attempt)`。

### 3.6 任务状态机并发控制（审查整改 C-01）

3.6.1 Worker 领取任务：

```sql
SELECT id FROM transcription_tasks
WHERE status = 'queued' AND deleted_at IS NULL
ORDER BY created_at
FOR UPDATE SKIP LOCKED
LIMIT 1;
```

3.6.2 迁移状态示例：`transition_task_status($id, 'queued', 'extracting')` 返回 `false` 时，当前 Worker **立即退出**（另一 Worker 已领取）。

3.6.3 禁止在单 Worker 槽位内串行处理多个无关 `task_id` 的长事务（避免占锁）；单任务内各阶段顺序执行。

3.6.4 幽灵任务补偿（Stalled / Dead Letter）（审查整改）

3.6.4.1 **不依赖** BullMQ Stalled 检测；以 Postgres 任务心跳 + Cron 补偿为主（§3.6.4.2）。

3.6.4.2 **Cron 补偿**（U2 或独立 `scheduler` 进程）：每 10 分钟扫描 `status IN ('extracting','preprocessing','asr_running','llm_running')` 且 `last_progress_at < now() - interval '2 hours'`（见 `database.md` §3.2）：

- 若 `retry_count < STALLED_TASK_MAX_RETRIES`（默认 3）：`transition_task_status` 回滚至 `queued`，递增 `retry_count`，写 `audit_logs`（`task.fail` metadata.reason=`stalled_recovery`）；
- 否则：`failed` + `TASK_STALLED`。

3.6.4.3 每个 Worker 阶段结束须更新 `last_progress_at = now()`（与 `status_changed_at` 同步）。

### 3.7 事务性出站（Transactional Outbox）（审查整改 C-02）

3.7.1 下列操作与 `outbox_events` 插入 **同一数据库事务**：

- 创建 `transcription_tasks`；
- TUS 完成回调将任务置 `queued`；
- 任意需触发 Worker 的状态变更。

3.7.2 `outbox_events` 行字段：`aggregate_type`、`aggregate_id`、`event_type`、`payload`（含 `stage`、`taskId`、`createdBy`、`isMp4` 等）、`published_at`、`publish_attempts`。

3.7.3 **U3 Worker**（`workers/pipeline`）：轮询 `published_at IS NULL`，`FOR UPDATE SKIP LOCKED` 领取；按 `payload.stage` 路由 Handler；成功则 `published_at = now()`。**禁止**再经 Redis/BullMQ 二次投递。

3.7.3.1 【遗留】`workers/outbox-dispatcher`（M4 过渡）：曾将 Outbox 投递至 BullMQ；**v1.3 起废弃该路径**，实现 M5 时合并入 `pipeline/` 并移除 `REDIS_URL` 依赖。

3.7.4 处理失败递增 `publish_attempts` 并指数退避；超过 `OUTBOX_MAX_ATTEMPTS`（默认 20）写入 `audit_logs` 并告警，任务标记 `failed` + `INTERNAL_ERROR`。

### 3.4 长轮询与前端查询

3.4.1 任务状态查询接口供前端轮询；推荐间隔 ≥ 2s（PRD §5.1）。

3.4.2 禁止 API 层长连接阻塞等待任务完成。

3.4.3 **私有化默认** `REALTIME_ENABLED=false`（审查整改 P-05）。仅当显式启用且部署 Supabase Realtime 等价服务时，前端可订阅；订阅须受 RLS 约束，且不得替代 Outbox/轮询作为唯一进度来源。

### 3.5 Supabase 连接与超时

#### 3.5.1 客户端类型

| 类型 | 用途 | 密钥 |
|------|------|------|
| `anon` + 用户 JWT | 律师自助 API（RLS） | `SUPABASE_ANON_KEY` |
| `service_role` | 管理员跨用户、Auth Admin、Storage 管理签名 | `SUPABASE_SERVICE_ROLE_KEY`（仅 U2/U3 服务端） |

3.5.2 禁止将 `service_role` 下发至浏览器。

#### 3.5.2 连接池（Supavisor / 直连）

3.5.2.1 开发期（Supabase 云）：Server 端使用 **Transaction mode** 连接池 URI（端口 6543），单进程 `max: 10`（峰值 QPS 10 场景）。

3.5.2.2 私有化：使用 PgBouncer 或 Supavisor 等价池；`DB_POOL_MAX` 默认 20，`DB_POOL_IDLE_TIMEOUT_MS` 默认 30_000。

3.5.2.3 单查询语句超时：`DB_STATEMENT_TIMEOUT_MS` 默认 30_000；全文检索可放宽至 60_000。

3.5.2.4 Storage SDK 调用超时：`STORAGE_OPERATION_TIMEOUT_MS` 默认 120_000（签 URL、元数据）。

#### 3.5.3 重试策略

3.5.3.1 幂等写操作使用 `idempotency_key`（任务创建、Job 投递）。

3.5.3.2 Postgres `40001`（序列化失败）、`57P01`（管理员关闭）可重试 2 次指数退避。

3.5.3.3 Auth API 调用不重试写操作（创建用户、改密）；读操作可重试 1 次。

#### 3.5.4 连接池与 Outbox 事务

3.5.4.1 使用 Supavisor **Transaction mode** 时，承载 Outbox 的 Service 方法须在 **单请求单连接** 上下文内完成事务（AsyncLocalStorage 绑定 `pg` client 或 Supabase RPC 事务）。

3.5.4.2 U3 Worker 使用 `WORKER_DB_URL`（默认同 `SUPABASE_DB_URL`）；Outbox 轮询与阶段事务可共用连接池，`application_name` 区分 `lexos-pipeline-worker`。

---

## 4. 环境隔离与私有化部署解耦

### 4.1 环境文件约定

| 文件 | 用途 |
|------|------|
| `.env.development` | 线上 Supabase 调试、云 AI Key |
| `.env.production` | 私有化内网端点 |
| `.env.example` | 变量清单模板（无秘密值） |

4.1.1 应用启动时按 `NODE_ENV` 加载；秘密值不得入库、不得入 Git。

### 4.2 环境变量清单

#### 4.2.1 应用通用

| 变量名 | 必填 | 说明 |
|--------|:----:|------|
| `NODE_ENV` | 是 | `development` \| `production` |
| `APP_URL` | 是 | 前端对外 URL（改密回调、CORS） |
| `API_URL` | 是 | API 对外 URL |
| `LOG_LEVEL` | 否 | `info`（默认）\| `debug` \| `warn` |
| `REQUEST_ID_HEADER` | 否 | 默认 `x-request-id` |

#### 4.2.2 Supabase

| 变量名 | 必填 | 说明 |
|--------|:----:|------|
| `SUPABASE_URL` | 是 | 项目 URL |
| `SUPABASE_ANON_KEY` | 是 | 匿名密钥（仅服务端代转发时慎用） |
| `SUPABASE_SERVICE_ROLE_KEY` | 是 | 服务端专用 |
| `SUPABASE_JWT_SECRET` | 私有化是 | 自建 Auth 时 |
| `SUPABASE_DB_URL` | 是 | 池化连接串（Server/Worker） |
| `STORAGE_BUCKET_MEDIA` | 是 | 默认 `media` |
| `STORAGE_BUCKET_EXPORTS` | 是 | 默认 `exports` |
| `STORAGE_SIGNED_URL_TTL_SEC` | 否 | 默认 300【待确认】与 PRD 闭合 |

#### 4.2.3 认证与安全

| 变量名 | 必填 | 说明 |
|--------|:----:|------|
| `AUTH_VIRTUAL_EMAIL_DOMAIN` | 是 | 固定 `llexos.internal` |
| `AUTH_INITIAL_PASSWORD` | 是 | 管理员重置默认值 `111111`（仅服务端使用） |
| `CAPTCHA_PROVIDER` | 是 | `turnstile` \| `geetest` \| `none` |
| `CAPTCHA_SECRET_KEY` | 条件 | 提供商密钥 |
| `CAPTCHA_PROVIDER=none` | — | 私有化无外网时；须启用 `LOGIN_IP_ALLOWLIST` 或内网独占 |
| `LOGIN_IP_ALLOWLIST` | 否 | CIDR 列表，逗号分隔 |
| `MFA_REQUIRED_ROLES` | 否 | 默认 `admin,director` |

#### 4.2.4 Worker 与 Outbox

| 变量名 | 必填 | 说明 |
|--------|:----:|------|
| `WORKER_DB_URL` | 否 | 默认同 `SUPABASE_DB_URL` |
| `WORKER_POLL_INTERVAL_MS` | 否 | Outbox 轮询间隔，默认 `1000` |
| `OUTBOX_MAX_ATTEMPTS` | 否 | 单条 Outbox 最大处理尝试，默认 `20` |
| `WORKER_MAX_CONCURRENCY` | 否 | 同时处理的转写任务数，默认 **5** |
| `FFMPEG_PATH` | 否 | 默认 `ffmpeg` |
| `FFMPEG_MAX_CONCURRENT` | 否 | 默认 `2` |
| `FFMPEG_TIMEOUT_MS` | 否 | 默认 `3600000` |
| `WORKER_TMP_DIR` | 否 | 默认 `/tmp/lexos` |
| `ASR_RATE_LIMIT_MAX` | 否 | 默认 `50`（每分钟 ASR HTTP 上限，进程内限流） |
| `ASR_API_CONCURRENCY` | 否 | 默认 `3`（单任务切片并发） |
| `STALLED_TASK_MAX_RETRIES` | 否 | 默认 `3` |
| `STALLED_TASK_IDLE_HOURS` | 否 | 默认 `2` |

4.2.4.1 **已废除（v1.3）**：`REDIS_URL`、`BULLMQ_RATE_LIMIT_MAX`、`ASR_EXPRESS_MAX_DURATION_SEC`、`OUTBOX_DB_URL`（合并为 `WORKER_DB_URL`）。遗留 `.env` 可保留至代码迁移完成，**新部署不必配置 Redis**。

#### 4.2.5 AI / ASR（可被数据库凭证覆盖）

| 变量名 | 必填 | 说明 |
|--------|:----:|------|
| `ASR_PROVIDER_TYPE` | 否 | 默认 `openai`；路由 AsrAdapter |
| `ASR_MAX_CHUNK_SIZE_MB` | 否 | 默认 `20`；指导 FFmpeg 切分目标体积 |
| `ASR_SEGMENT_DURATION_SEC` | 否 | 默认 `900`（15 分钟/片，物理切分） |
| `ASR_REQUEST_TIMEOUT_MS` | 否 | 默认 `120000` |
| `AI_DEFAULT_TIMEOUT_MS` | 否 | 默认 `60000`（LLM） |
| `AI_TEST_TIMEOUT_MS` | 否 | 连通性测试 `10000` |

4.2.5.1 模型级 `api_key`、`base_url` 以 `ai_model_credentials` 表为准；环境变量仅作全局默认或私有化根证书路径（`NODE_EXTRA_CA_CERTS`）。

### 4.3 AI 适配器模式（Adapter Pattern）

#### 4.3.1 接口定义（逻辑）

```typescript
interface AiCompletionAdapter {
  readonly providerKind: 'openai_compatible' | 'azure_openai' | 'custom_http';
  healthCheck(credentials: ModelCredentials): Promise<HealthCheckResult>;
  transcribe?(request: AsrRequest): Promise<AsrResponse>;
  complete(request: LlmRequest): Promise<LlmResponse>;
}
```

#### 4.3.2 工厂注册

4.3.2.1 `AiAdapterFactory.get(providerKind)` 返回实现类；`Services` 仅依赖工厂与 `ModelCredentials` DTO。

4.3.2.2 私有化切换：管理员在控制台修改 `base_url` 指向内网网关，**无需**修改 Service 代码。

4.3.2.3 `openai_compatible`：请求/响应映射 OpenAI Chat Completions 与 Whisper 风格端点；内网兼容网关归入此类。

#### 4.3.3 功能点绑定

4.3.3.1 `AiOrchestrationService` 按 `feature_key`（PRD §3.3 枚举）查询 `ai_feature_model_mappings` → 主模型 → 失败则 `fallback_model_id` → 记录 `ai_invocation_logs`。

### 4.4 私有化替代矩阵与云耦合消除（审查整改 P-01～P-02）

| 能力 | 开发期（云） | 私有化交付 | 代码耦合要求 |
|------|--------------|------------|--------------|
| Auth | Supabase Auth | GoTrue 自建或 Supabase 内网实例 | 仅经 `AuthAdapter`；虚拟邮箱域可配置 |
| Postgres | Supabase DB | 自建 PostgreSQL 15+ | 标准 SQL + RLS；无 Supabase 专有 SQL 扩展（除 `auth.uid()`） |
| Storage | Supabase Storage | MinIO / SeaweedFS（S3 API） | `StorageAdapter` 抽象 `createSignedUploadUrl`、`createSignedDownloadUrl` |
| Realtime | 可选 | **默认关闭** | 不写入核心业务路径 |
| 异步调度 | Postgres Outbox | 同左（无额外组件） | U3 轮询 `outbox_events`；**禁止**硬编码 Redis |
| 验证码 | Turnstile/Geetest | `CAPTCHA_PROVIDER=none` + IP 白名单 | `CaptchaAdapter` 可空实现 |
| ASR/LLM | 公网 API | 内网 HTTP 端点 | `AiAdapterFactory` + DB `base_url` |

4.4.1 健康检查 `/health` 须探测：Postgres、Storage 桶 HEAD；U3 节点另探测 `ffmpeg -version`。**不**要求 Redis（v1.3）。

4.4.2 禁止在业务代码写死 `*.supabase.co` 域名；仅允许读取 `SUPABASE_URL` / `STORAGE_ENDPOINT`。

---

## 5. 安全中间件与 API 门禁

### 5.1 认证中间件

5.1.1 自 `Authorization: Bearer <access_token>` 解析 Supabase JWT；无效返回 `AUTH_UNAUTHORIZED`。

5.1.2 加载 `profiles`：`status=disabled` 返回 `AUTH_ACCOUNT_DISABLED`。

5.1.3 **禁用即失效**（审查整改 C-06）：禁用用户时同步调用 `auth.admin.signOut(user_id, 'global')`；中间件每请求校验 `profiles.status`（进程内缓存 TTL ≤30s，键 `userId`）。

5.1.4 **密码重置的全局会话撤销（Session Avalanche 防护）**

5.1.4.1 `POST /api/admin/users/:id/reset-password` 在 **单数据库事务** 内顺序执行：

1. Supabase Auth Admin：密码设为 `AUTH_INITIAL_PASSWORD`；
2. `profiles.requires_password_change = true`（经 `AdminRepository` / `SECURITY DEFINER`）；
3. `supabase.auth.admin.signOut(user_id, 'global')` 吊销该用户 **全部** 现存会话；
4. `append_audit_log`（`auth.password_reset`）。

5.1.4.2 用户须重新登录并进入强制改密页（§5.2）；不得在未改密前保留旧 JWT 访问业务 API。

5.1.5 禁止信任 JWT 内自定义 `role` Claim；**以 `profiles.role` 为准**。

### 5.2 强制改密门禁（PRD §2.5.4）

5.2.1 路径白名单：`/api/auth/change-password`、`/api/auth/session`、`/api/auth/logout`。

5.2.2 `requires_password_change=true` 时，非白名单业务 API 返回 `AUTH_PASSWORD_CHANGE_REQUIRED`（HTTP 403）。

5.2.3 与前端 Router Guard 双重校验。

### 5.3 角色门禁

5.3.1 路由表声明 `allowedRoles: Role[]`；不满足返回 `AUTH_FORBIDDEN`。

5.3.2 首期 `director`/`client`/`channel` 无业务路由权限（PRD §2.2）。

### 5.4 管理员跨用户访问

5.4.1 仅 `admin` 角色可调用带 `targetUserId` 的管理接口。

5.4.2 **AdminRepository**（`service_role`）为唯一可跨 `created_by` 读写业务行的通道；须满足：

- Controller 已验证 `AuthContext.role === 'admin'`；
- 每次写操作追加 `audit_logs`；
- 禁止暴露通用「代用户 JWT」接口。

5.4.3 律师/主任/客户/渠道商 JWT **不得** 绑定 `service_role` 客户端（审查整改 R-03）。

### 5.5 Storage 与上传网关（审查整改 R-02、A-02）

5.5.1 流程强制顺序：

1. `POST /api/transcription/uploads/init` → 创建 `upload_sessions` + `transcription_tasks`（`uploading`）；
2. 返回 TUS 端点与 **限定前缀** `storage_key_prefix = {auth.uid()}/{task_id}/`；
3. 客户端 TUS 直传；
4. `POST /api/transcription/uploads/complete` 校验 `upload_session_id`、大小、时长 → 任务 `queued` + Outbox 事件。

5.5.2 禁止浏览器持有可写 Storage 策略的 Supabase 客户端上传业务桶（审查整改 R-07）。

5.5.3 下载/导出：**仅** `GET /api/drive/files/:id/download` 或 `/api/transcription/tasks/:id/download` 由服务端 `createSignedDownloadUrl`（TTL=`STORAGE_SIGNED_URL_TTL_SEC`，默认 300）并写 `audit_logs`（`file.download` / `file.export`）。

5.5.4 Storage 路径与 `auth.uid()` 绑定规则见 `database.md` §5；**不**以客户端自定义 `metadata.owner_id` 作为唯一授权依据。

### 5.6 Service Role 使用红线（审查整改 R-04）

5.6.1 `service_role` 仅用于：Auth Admin、审计追加、`AdminRepository`、Worker 流水线、`append_audit_log()`。

5.6.2 Worker 写业务表前必须：

- 校验 `task_id` 存在且未软删；
- 经 `transition_task_status()` 改状态；
- 片段/文稿写入须与 `task.created_by` 一致。

5.6.3 禁止在 HTTP 请求处理器内默认使用 `service_role` 替代用户 JWT。

### 5.7 前端数据访问约束（审查整改 R-07）

5.7.1 Web 应用 **不得** 使用 Supabase JS 客户端对业务表执行 INSERT/UPDATE/DELETE。

5.7.2 允许：Auth 登录会话（经 BFF 代理或 PKCE 仅限认证域）；TUS 使用 init 接口返回的上传授权。

---

## 6. 异常处理与全局日志追踪

### 6.1 统一错误响应体

```json
{
  "success": false,
  "error": {
    "code": "AUTH_UNAUTHORIZED",
    "message": "人类可读简述",
    "details": {},
    "requestId": "uuid"
  }
}
```

6.1.1 成功响应：

```json
{
  "success": true,
  "data": {},
  "meta": { "requestId": "uuid", "cursor": "optional" }
}
```

### 6.2 错误代码表（首期）

| 代码 | HTTP | 说明 |
|------|------|------|
| `AUTH_UNAUTHORIZED` | 401 | 未登录或令牌无效 |
| `AUTH_FORBIDDEN` | 403 | 角色无权限 |
| `AUTH_ACCOUNT_DISABLED` | 403 | 账户已禁用 |
| `AUTH_PASSWORD_CHANGE_REQUIRED` | 403 | 须先改密 |
| `AUTH_INVALID_CREDENTIALS` | 401 | 用户名或密码错误（文案统一，PRD §2.5.3） |
| `AUTH_CAPTCHA_REQUIRED` | 400 | 须完成验证码 |
| `AUTH_MFA_REQUIRED` | 403 | 须提交 TOTP |
| `VALIDATION_FAILED` | 400 | 请求体验证失败 |
| `RESOURCE_NOT_FOUND` | 404 | 资源不存在或无权得知 |
| `RESOURCE_CONFLICT` | 409 | 用户名重复、文稿版本冲突（If-Match） |
| `UPLOAD_SESSION_INVALID` | 400 | 上传会话过期或密钥不匹配 |
| `RESOURCE_LIMIT_EXCEEDED` | 413 | 超过 1GB / 5h |
| `OPERATION_NOT_ALLOWED` | 422 | 如删除用户、禁用末位 admin |
| `TASK_INVALID_STATE` | 422 | 状态机非法迁移 |
| `AI_PROVIDER_ERROR` | 502 | 上游模型失败 |
| `AI_PROVIDER_TIMEOUT` | 504 | 上游超时 |
| `MEDIA_EXTRACT_FAILED` | 500 | FFmpeg 失败 |
| `MEDIA_PREPROCESS_FAILED` | 500 | FFmpeg 抽音/切片失败 |
| `TASK_STALLED` | 500 | 超时无进度且重试耗尽 |
| `AI_RATE_LIMITED` | 429 | 公有 ASR/LLM 限流（可重试） |
| `INTERNAL_ERROR` | 500 | 未分类 |

6.2.1 向客户端暴露的错误 `message` 不得包含堆栈、SQL、密钥。

### 6.3 全链路日志规范

#### 6.3.1 结构化字段（每条业务日志）

| 字段 | 必填 | 说明 |
|------|:----:|------|
| `timestamp` | 是 | ISO8601 UTC |
| `level` | 是 | `info` \| `warn` \| `error` |
| `requestId` | 是 | 自中间件注入 |
| `userId` | 条件 | 已认证则填 |
| `operation` | 是 | 如 `user.reset_password`、`task.create` |
| `durationMs` | 条件 | 请求结束或 Job 完成时 |
| `resourceType` | 否 | `transcription_task` 等 |
| `resourceId` | 否 | UUID |
| `outcome` | 是 | `success` \| `failure` |
| `errorCode` | 条件 | 失败时 |

#### 6.3.2 必须埋点的操作（对齐 PRD §3.7）

登录成功/失败、登出、改密、管理员重置密码、用户创建/禁用、AI 配置变更、任务创建/阶段完成/失败、文件下载/删除/导出、模型调用（含兜底标记）。

#### 6.3.3 Request ID 传递

6.3.3.1 中间件：无则生成 UUID；写入 `AsyncLocalStorage`；回写响应头。

6.3.3.2 Outbox `payload` 须含 `taskId`；可选携带源 `requestId` 便于 Worker 日志关联。

### 6.4 审计与运行日志边界

6.4.1 **合规审计唯一证据源**：`audit_logs`（append-only，见 `database.md` §6.5）；审查整改 A-04。

6.4.2 应用运行日志写入 stdout（私有化由运维采集）；可删改、不作为法庭/合规举证唯一来源。

6.4.3 禁止将 API Key、TOTP 密钥、`api_key_ciphertext` 写入任一日志级别。

### 6.5 文稿并发更新契约（审查整改 C-03）

6.5.1 `PATCH /api/transcription/tasks/:id/transcript` 请求头 **必须** 携带 `If-Match: <version>`。

6.5.2 成功响应返回新 `version`；冲突返回 `RESOURCE_CONFLICT`。

---

## 7. 主要 API 模块划分（首期）

| 模块前缀 | 角色 | 说明 |
|----------|------|------|
| `/api/auth/*` | 混合 | 会话、改密、MFA 状态 |
| `/api/admin/users/*` | admin | 用户 CRUD、重置密码 |
| `/api/admin/ai/*` | admin | 模型、映射、Prompt、连通性测试 |
| `/api/admin/audit/*` | admin | 审计查询 |
| `/api/transcription/*` | admin, lawyer | 任务元数据、TUS 完成回调、状态查询 |
| `/api/drive/*` | admin, lawyer | 目录、文件元数据、搜索 |
| `/api/profile` | 已认证 | 个人资料 |

7.1 文件二进制不经上述 API 上传；仅 `POST /api/transcription/uploads/init` 返回 TUS 目标与约束。

---

## 8. 文档修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-05-29 | 首版，依据 PRD v0.3 |
| v1.1 | 2026-05-29 | 安全审查整改：Outbox、状态机锁、Storage 网关、Service Role 红线、私有化矩阵、审计边界 |
| v1.2 | 2026-05-29 | 废除 Python VAD；FFmpeg 物理切片 + express/batch 队列；ASR 限流；重置密码全局 signOut；Stalled Job 补偿 |
| v1.3 | 2026-05-30 | **简化部署**：废除 Redis/BullMQ；Outbox 由 U3 直消费；全局并发 ≤5；废除 express/batch 双队列 |

---

## 附录 A：与 PRD 未闭合项的对齐方式

| PRD 待确认项 | 本文处理 |
|--------------|----------|
| 任务状态轮询 vs Realtime | 默认轮询 ≥2s；`REALTIME_ENABLED` 可选 |
| LLM/ASR 分片阈值 | Service 层按模型 `context_window` 配置切分，阈值入库【待确认】后修订 |
| 签名 URL 有效期 | `STORAGE_SIGNED_URL_TTL_SEC` 默认 300 |
| ASR 部分切片失败 | 默认整任务 `failed`；保留 `transcription_segments` 日志【待确认】可改为部分降级 |

未列入上表且标记【待确认】的 PRD 条款，实现前须回溯 PRD 修订，不得自行扩展业务含义。
