# LexOS 设计审查与整改报告

| 字段 | 内容 |
|------|------|
| 报告版本 | v1.0 |
| 审查日期 | 2026-05-29 |
| 审查范围 | `prd.md` v0.3、`architecture.md` v1.0、`database.md` v1.0、`ui_design.md` v1.0 |
| 审查结论 | **有条件通过**；共发现 **18** 项缺陷（严重 6 / 高 7 / 中 5）；已对 `architecture.md`、`database.md` 覆写修正 |

---

## 1. 数据隔离与越权风险（RLS / RBAC）

| ID | 严重度 | 缺陷描述 | 确定性修正方案 | 文档落点 |
|----|--------|----------|----------------|----------|
| R-01 | **严重** | `profiles` 的 `profiles_update_self` 仅约束 `id = auth.uid()`，未限制可写列。律师经 PostgREST/直连可自提权 `role=admin` 或 `status=enabled`。 | 增加 `BEFORE UPDATE` 触发器 `profiles_guard_self_update()`：禁止非 `admin` 修改 `role`、`status`、`requires_password_change`、`username`；上述字段仅允许 `SECURITY DEFINER` 函数 `admin_*` 写入。 | `database.md` §4.2、§7.4 |
| R-02 | **严重** | Storage 策略依赖客户端可写 `metadata.owner_id`；攻击者可伪造他人 `owner_id` 或路径前缀实现水平越权读。 | 禁止客户端直传任意路径。`POST /uploads/init` 服务端签发 **一次性** `upload_sessions` 记录，绑定 `owner_id`、`storage_key_prefix`、`expires_at`；TUS 完成回调由服务端校验 `upload_session_id` 后写 `transcription_tasks`。Storage 策略改为校验 `name` 路径前缀 `(storage.foldername()) = auth.uid()::text`（见 Supabase path 规范），**不**单独信任 metadata。 | `architecture.md` §5.5；`database.md` §3.13、§5 |
| R-03 | **高** | PRD §2.2 规定 `admin` 对云盘/转写「CUD 全部」，但 `drive_write`/`tasks_update` 的 `WITH CHECK` 要求 `created_by = auth.uid()`，管理员无法合法代管律师资源行（实现必然走 `service_role` 裸奔）。 | 管理端跨用户写操作 **禁止** 律师 JWT + RLS；统一经 **仅 API** 的 `AdminRepository`（`service_role`）执行，且 Service 层校验 `role=admin` + 写 `audit_logs`。律师 JWT 客户端不得绑定 `service_role`。 | `architecture.md` §5.4、§5.6 |
| R-04 | **高** | U3 Worker 使用 `service_role` 将绕过全部 RLS；若 Job 载荷被篡改 `taskId`，可写任意用户任务。 | Worker 更新任务前执行 `assert_task_exists(task_id)` 且状态迁移经 `transition_task_status()`（`SECURITY DEFINER`）内部校验合法迁移；禁止 Worker 直接 `UPDATE` 无守卫。Job 载荷须含 `job_run_id` 与 DB 对账。 | `architecture.md` §3.6、§5.6；`database.md` §4.11、§3.14 |
| R-05 | **高** | `segments_access` 使用 `FOR ALL`，律师可对他人任务片段 **INSERT**（若猜中 `task_id`）。`EXISTS` 仅约束读路径，INSERT 时 `task_id` 伪造风险存在。 | 拆分为 `SELECT`/`UPDATE`/`DELETE` 策略；`INSERT` 单独策略且 `WITH CHECK` 要求关联任务 `created_by = auth.uid()`。Worker 片段写入仅用 `service_role` + `transition` 函数。 | `database.md` §4.4 |
| R-06 | **中** | `SECURITY DEFINER` 辅助函数未限制执行主体；任意已认证用户可调用 `is_admin()` 探测（信息泄露面小但违反最小特权）。 | 函数保持 `STABLE SECURITY DEFINER`；撤销 `PUBLIC` 执行权限，仅授予 `authenticated` 与 `service_role`；文档禁止创建 `SECURITY DEFINER` **视图** 暴露业务表。 | `database.md` §4.1、§4.12 |
| R-07 | **中** | `ui_design.md` 未禁止前端使用 Supabase 匿名密钥直连业务表（绕过 BFF 与审计）。 | 前端 **禁止** 持有可写业务的 Supabase 客户端；只调用 BFF API。TUS 使用 **scoped** 上传令牌。 | `architecture.md` §5.7（交叉引用 UI） |

---

## 2. 数据一致性与并发冲突

| ID | 严重度 | 缺陷描述 | 确定性修正方案 | 文档落点 |
|----|--------|----------|----------------|----------|
| C-01 | **严重** | 任务状态机无数据库级互斥；BullMQ 至少一次投递可导致双 Worker 同时将任务从 `queued` 推至 `asr_running`，重复 ASR/LLM 计费。 | 引入 `transition_task_status(task_id, from_status, to_status)`：`UPDATE ... WHERE id=$1 AND status=$2` 返回行数为 0 则中止；Worker 抢取用 `FOR UPDATE SKIP LOCKED` 选取 `queued` 任务。表增加 `status_changed_at`。 | `database.md` §3.2、§4.11；`architecture.md` §3.6 |
| C-02 | **严重** | 队列入队与 DB 事务非原子：API 创建 `transcription_tasks` 成功后 Redis 宕机则任务永久停在 `uploading`。 | 采用 **Transactional Outbox**：同事务写入 `outbox_events`；独立 `outbox_dispatcher` 轮询投递 BullMQ；消费成功后标记 `published_at`。 | `architecture.md` §3.7；`database.md` §3.15 |
| C-03 | **高** | `transcription_transcripts.version` 无强制使用规范，并发编辑可覆盖。 | API `PATCH` 须带 `If-Match: <version>`；Repository `UPDATE ... WHERE version=$n`；冲突返回 `RESOURCE_CONFLICT`。 | `architecture.md` §2.3；`database.md` §3.4 |
| C-04 | **高** | Job 重试无幂等键，ASR/LLM 外部调用可能重复。 | `pipeline_job_runs` 表：`UNIQUE(queue_name, job_id, attempt)`；外部调用携带 `idempotency_key` 写入 `ai_invocation_logs`。 | `database.md` §3.14；`architecture.md` §3.2.5 |
| C-05 | **中** | 连接池使用 Transaction mode 时，跨请求事务 + Outbox 须同一连接，文档未声明。 | Outbox 写入与业务 CRUD 同一数据库事务；Dispatcher 使用独立只读连接池配置。 | `architecture.md` §3.5.4 |
| C-06 | **中** | 禁用律师后 JWT 仍有效至过期（PRD 未闭合立即失效），存在窗口期越权。 | 中间件除 RLS 外，**每请求**查 `profiles.status`（短 TTL 缓存 ≤30s）；`disabled` 立即 `AUTH_ACCOUNT_DISABLED`。管理员禁用用户时调用 `auth.admin.signOut(user_id, global=true)`。 | `architecture.md` §5.1.3 |

---

## 3. 审计追踪完整性

| ID | 严重度 | 缺陷描述 | 确定性修正方案 | 文档落点 |
|----|--------|----------|----------------|----------|
| A-01 | **严重** | `audit_logs` 无防篡改；持有 `service_role` 的 DBA/运维可 `UPDATE`/`DELETE` 掩盖行为。 | `REVOKE UPDATE, DELETE ON audit_logs FROM authenticated, service_role`；`BEFORE UPDATE OR DELETE` 触发器 `RAISE EXCEPTION`；仅 `INSERT` 经 `append_audit_log()`（`SECURITY DEFINER`）。可选 `prev_hash`/`row_hash` 链（SHA-256）。 | `database.md` §3.11、§6.5 |
| A-02 | **高** | Storage 直读/签名下载未强制经审计 API，合规缺口。 | 所有下载经 `GET /api/.../download`：校验归属 → `createSignedUrl` → `audit_logs` 记 `file.download`。禁止前端 `createSignedUrl` 持用户 JWT 直调 Storage（若 SDK 允许）。 | `architecture.md` §5.5、§6.3 |
| A-03 | **高** | 登录失败是否记用户名未闭合，暴力破解溯源不足。 | `auth.login_failure` 的 `metadata` 固定写入 `attempted_username`（哈希后存储可选 `username_sha256` 兼查重）。 | `database.md` §3.11 |
| A-04 | **中** | 运行日志（stdout）与合规审计混用，stdout 可删改，不满足 ITGC 不可篡改要求。 | 明确：**合规证据以 `audit_logs` 为准**；stdout 仅运维排障，保留期可短于审计表。 | `architecture.md` §6.4 |
| A-05 | **中** | AI 调用审计仅有 `ai_invocation_logs`，管理员改密钥无字段级前后值。 | `ai.model.upsert` 的 `metadata` 记录 `model_id`、`fields_changed[]`，**不**记录 api_key 明文或密文。 | `database.md` §3.11（已有枚举，强化 metadata 规范） |

---

## 4. 私有化部署阻断风险

| ID | 严重度 | 缺陷描述 | 确定性修正方案 | 文档落点 |
|----|--------|----------|----------------|----------|
| P-01 | **高** | 架构默认 Supabase 云 Auth/Storage/Realtime，未给出可替换组件清单与禁用路径。 | 增加 **私有化替代矩阵**：Auth→GoTrue；DB→Postgres；Storage→MinIO（S3 API）；Realtime→默认关闭；Captcha→`none`+内网限流。 | `architecture.md` §4.4 |
| P-02 | **高** | `REDIS_URL` 为硬依赖，未声明私有化必配组件。 | 私有化交付清单强制包含 Redis 7+（或 Valkey）；无 Redis 则 API 不得启动（health check fail）。 | `architecture.md` §4.2.4、§4.4 |
| P-03 | **中** | Turnstile/Geetest 无外网时登录阻断。 | `CAPTCHA_PROVIDER=none` 时，依赖 Auth 暴力破解防护 + 内网 IP 白名单（`LOGIN_IP_ALLOWLIST` 可选）。 | `architecture.md` §4.2.3 |
| P-04 | **中** | VAD 微服务调用无 mTLS/共享密钥，内网横向移动风险。 | `VAD_SERVICE_HMAC_SECRET` 请求头签名；私有化部署强制非空。 | `architecture.md` §3.2.3 |
| P-05 | **中** | Realtime 订阅若启用，增加对 Supabase Realtime 云耦合。 | 私有化默认 `REALTIME_ENABLED=false`；任务状态仅 HTTP 轮询。 | `architecture.md` §3.4 |

---

## 5. 整改执行状态

| 文档 | 版本 | 状态 |
|------|------|------|
| `architecture.md` | v1.1 | 已覆写修正（§3.6–3.7、§5.5–5.7、§4.4、§6.4–6.5） |
| `database.md` | v1.1 | 已覆写修正（新表、RLS 拆分、触发器、Outbox、审计防篡改） |
| `ui_design.md` | — | 本次不修改；R-07 由架构 §5.7 约束前端 |

---

## 6. 残余风险（需产品闭合，不阻断实现）

| 编号 | 项 |
|------|-----|
| L-01 | 密码复杂度规则 |
| L-02 | VAD/ASR 单片失败整任务 vs 部分降级 |
| L-03 | 审计保留 365 天后的法律归档格式 |

---

## 7. 审查签注

本报告所列 **R/C/A/P** 项中，严重与高等级缺陷已在 `architecture.md` v1.1、`database.md` v1.1 中落实修正条款。实现阶段须以迁移脚本与代码评审逐项勾验，不得以「设计意图」替代数据库约束与 API 门禁。
