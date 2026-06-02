# LexOS 待确认项清单（OPEN ISSUES）

| 字段 | 内容 |
|------|------|
| 版本 | 1.6 |
| 用途 | 产品签收 M9 前须逐条闭合或转入后续版本 |
| 来源 | `prd.md` v0.3 · `architecture.md` v1.3 · `database.md` v1.4 · `ui_design.md` v1.1 |

**签收状态**：`open` = 未闭合 · `accepted` = 接受现状 · `deferred` = 转入后续版本

**编号规则**：`PRD-章节-序号` = 来自 `prd.md` 对应章节；`ARCH`/`DB`/`UI`/`M9` 同理。每条下方 **说明** 解释「为什么待确认、影响什么、签收时要定什么」。

---

## 1. `prd.md`

### §1.3 Out of Scope

| ID | 章节 | 描述 | 签收 |
|----|------|------|:----:|
| PRD-1.3-01 | §1.3 | 移动端原生 App：Web 响应式/桌面浏览器具体适配范围 | open |

**PRD-1.3-01 说明**：首期明确不做 iOS/Android 原生 App，只交付 Web。但 PRD 未写死 Web 要适配到什么程度（仅桌面 Chrome、是否必须支持平板/手机浏览器、最小分辨率等）。这会影响 `ui_design.md` 窄屏布局是否必须实现。签收时需定：「仅桌面」或「响应式到某断点」。

---

### §2 角色与权限

| ID | 章节 | 描述 | 签收 |
|----|------|------|:----:|
| PRD-2-01 | §2.2 | 预留角色（director/client/channel）查看本人资料权限 | accepted |
| PRD-2-02 | §2.2 | 预留角色修改本人密码权限 | accepted |
| PRD-2-03 | §2.2 | 预留角色 MFA 绑定/管理 | accepted |
| PRD-2-04 | §2.2 说明 | 预留角色登录后占位页文案 | accepted |
| PRD-2-05 | §2.3 | admin 全量读写 vs 审计表只读+管理写分离 | accepted |
| PRD-2-06 | §2.4.2 | Storage admin 管理端直读方式 | accepted |
| PRD-2-07 | §2.4.2 | 签名 URL 有效期 | accepted |

**PRD-2-01 说明（已签收 · accepted）**：`director` / `client` / `channel` 首期**仅可进入个人中心只读**查看本人资料（用户名、显示名、联系方式等），**不可**访问转写、云盘等业务模块。Router Guard 仅放行 `/profile`（及改密相关路由，见 PRD-2-02），其余业务路由跳转占位页或 403。

**PRD-2-02 说明（已签收 · accepted）**：预留角色**允许**修改本人密码（需原密码，走 BFF `POST /api/auth/change-password`），与个人中心只读并列开放；不要求 `requires_password_change` 以外的额外流程。

**PRD-2-03 说明（已签收 · accepted）**：**首期全系统已取消 MFA/TOTP 功能**（与 `CONTEXT_SUMMARY.md` §4 一致：图形验证码与 MFA 绑定流程均已移除）。`profiles.mfa_enabled` 字段保留但 **UI/API 均不展示、不强制**；所有角色（含 admin、预留角色）首期**均无** MFA 绑定/验证流程。PRD 矩阵中 MFA 列视为 **N/A（首期不适用）**，后续版本单独立项再开。

**PRD-2-04 说明（已签收 · accepted）**：预留角色登录后默认进入占位页，**统一文案**（与 UI-5-01 一致）：

> **功能尚未开放**  
> 您的账户类型（主任 / 客户 / 渠道）暂无可用业务模块。您可前往 **个人中心** 查看资料或修改密码。如需开通权限，请联系系统管理员。

**PRD-2-05 说明（已签收 · accepted）**：admin 权限模型定为 **「管理写 + 审计只读」**：
- **管理写**：用户/AI 配置/系统设置等管理 API，经 `AdminRepository`（service_role）+ 角色门禁 + 审计；
- **审计只读**：`audit_logs` 仅 admin 可读，**不可** UPDATE/DELETE（append-only）；
- **不**授予 admin 对律师业务数据（转写任务、云盘文件内容等）的常规浏览权限（见 PRD-2-06）。

**PRD-2-06 说明（已签收 · accepted）**：**管理员无法查看律师业务数据**。admin **不得**通过管理端或 Storage 直读律师的转写任务、文稿、云盘文件；跨用户操作仅限**用户账户管理**（创建/禁用/重置密码等）与**审计日志**查询。Storage 签名下载须 `created_by = auth.uid()`，admin JWT **无**律师对象读路径；律师数据边界保持 `created_by = auth.uid()` + RLS。

**PRD-2-07 说明（已签收 · accepted）**：签名 URL 有效期与架构统一：**`STORAGE_SIGNED_URL_TTL_SEC=300`（5 分钟）**，由环境变量配置，禁止硬编码。BFF 仅在 `GET .../download` 校验归属后签发；大文件下载若超时须**重新请求**下载 API 获取新签名。同步闭合 ARCH-4-01；`.env.example` / `.env.production.example` 已声明该变量。

---

### §2.4 认证

| ID | 章节 | 描述 | 签收 |
|----|------|------|:----:|
| PRD-2.4-01 | §2.4.4 | 律师/客户/渠道商首期 MFA 是否扩展 | accepted |
| PRD-2.4-02 | §2.4.5 | 禁用账户错误提示是否统一文案 | accepted |
| PRD-2.4-03 | §2.4.6 | 强制改密 BFF 二次校验细节 | accepted |
| PRD-2.4-04 | §2.4.7 | 禁用会话中用户：立即失效 vs 下次请求 | accepted |
| PRD-2.4-05 | §2.4.7 | 内置 admin 不可被禁用 | accepted |
| PRD-2.4-06 | §2.4.8 | 预留角色登录入口范围 | accepted |
| PRD-2.4-07 | §2.4.9 | 密码强度最小长度与复杂度 | accepted |
| PRD-2.4-08 | §2.4.9 | 会话策略与 Supabase Session 配置 | accepted |

**PRD-2.4-01 说明（已签收 · accepted）**：与 PRD-2-03 一致——**首期不扩展 MFA**；律师/客户/渠道商/admin 均不强制 TOTP。字段保留，功能关闭。

**PRD-2.4-02 说明（已签收 · accepted）**：登录失败（用户不存在、密码错误、**账户已禁用**）统一返回 **`用户名或密码错误`**（`AUTH_INVALID_CREDENTIALS`），防账户枚举。审计仍区分 `auth.login_failure` 与 `profiles.status`。常量见 `AUTH_LOGIN_FAILURE_MESSAGE`。

**PRD-2.4-03 说明（已签收 · accepted）**：强制改密期间 **BFF 仅依赖 `password-change-gate` 中间件**拦截非白名单 API；**不在**各 Controller/Service 重复校验 `requires_password_change`。前端 Router Guard 负责导航拦截（UX），不算 BFF 二次校验。

**PRD-2.4-04 说明（已签收 · accepted）**：管理员禁用用户后，**不**调用 `signOut(global)`；已登录会话在 **下一次 API 请求** 时由 `auth.middleware` 查 `profiles.status=disabled` 返回 `AUTH_ACCOUNT_DISABLED`（禁用后 `clearProfileStatusCache` 确保尽快生效）。重置密码仍全局吊销会话（§2.5.4）。

**PRD-2.4-05 说明（已签收 · accepted）**：内置 `admin` 账户 **不可禁用**（API `OPERATION_NOT_ALLOWED` + 管理端禁用按钮置灰）。末位 admin 防护保留。

**PRD-2.4-06 说明（已签收 · accepted）**：预留角色（`director`/`client`/`channel`）**允许登录**；登录后默认进入 **`/coming-soon` 占位大屏**（文案见 PRD-2-04），可访问个人中心（只读）与改密。

**PRD-2.4-07 说明（已签收 · accepted）**：首期 **无** 密码复杂度要求（无最小长度、大小写、符号规则）；改密/创建用户仅校验非空 + 最大长度。弱口令 `111111` 仅用于管理员重置后的过渡态，须配合强制改密。

**PRD-2.4-08 说明（已签收 · accepted）**：用户侧会话 **长期有效**——access token 过期时前端经 `POST /api/auth/refresh` 静默续期；**仅**主动登出或清除本地 token（`localStorage`/Cookie）后需重新登录。Refresh token 持久化于 `localStorage`；`SessionGuard` 与 `api-client` 在 401 时自动 refresh。

---

### §3 AI 配置

| ID | 章节 | 描述 | 签收 |
|----|------|------|:----:|
| PRD-3-01 | §3.3 | `asr_semantic` 与物理层边界 | accepted |
| PRD-3-02 | §3.3 | 功能绑定模型失败兜底重试次数 | accepted |

**PRD-3-01 说明（已签收 · accepted）**：**不单独实现** `asr_semantic`。转写链路为 `asr_physical`（听写）→ `llm_transcript_polish`（听写后语义改顺）→ `llm_legal_summary`。DB 枚举 `asr_semantic` **保留**；管理端与 Worker 仅暴露/调用 `AI_ACTIVE_FEATURE_KEY_VALUES`（三项）。听写后改顺由 **LLM 通用模型 + Prompt** 承担，不再挂语义 ASR 阶段。

**PRD-3-02 说明（已签收 · accepted）**：主模型失败 → 对该功能点 `fallback_model_id` **重试 1 次**（`AiOrchestrationService` 已实现）。**不**写入 `audit_logs`；可写入 `ai_invocation_logs`（`is_fallback` / `outcome`）。管理员改映射仍走 `ai.mapping.upsert` 审计（配置变更，非运行时兜底）。

---

### §3.5 转写流水线

| ID | 章节 | 描述 | 签收 |
|----|------|------|:----:|
| PRD-3.5-01 | §3.5.2 | MP4 源文件冷存储 vs 默认删除 | accepted |
| PRD-3.5-02 | §3.5.3 | 说话人分离最大说话人数 | accepted |
| PRD-3.5-03 | §3.5.4 | VAD/ASR 部分片段失败：整任务失败 vs 部分降级 | accepted |
| PRD-3.5-04 | §3.5.4 | LLM 失败仍保留 ASR 稿策略 | accepted |
| PRD-3.5-05 | §3.5.5 | UI 轮询 vs Realtime 订阅 | accepted |
| PRD-3.5-06 | §3.5.5 | Storage 与 DB 状态一致性补偿 | accepted |
| PRD-3.5-07 | §3.5.5 | 临时对象生命周期与加密 | accepted |
| PRD-3.5-08 | §3.5.6 | 失败任务用户重试 | accepted |

**PRD-3.5-01 说明（已签收 · accepted）**：MP4 **抽音成功后默认删除** Storage 源视频（`media.extract` 内 `removeObject(source_storage_key)`）；不默认冷归档。

**PRD-3.5-02 说明（已签收 · accepted）**：新建任务 UI **可选**「说话人上限」；**留空 = 不限制**（`max_speakers` NULL）。写入 `transcription_tasks.max_speakers`；ASR 适配器接入 diarization 时读取该字段。

**PRD-3.5-03 说明（已签收 · accepted）**：**任一切片 ASR 失败 → 整任务 `failed`**（`Promise.all` 任一片抛错即失败）；不做缺段降级。

**PRD-3.5-04 说明（已签收 · accepted）**：**整篇**润色 + **整篇**摘要（非按切片）。润色/摘要失败时任务仍为 **`completed`**，置 `llm_polish_failed` / `llm_summary_failed`，**保留 ASR**；UI 展示「部分成功」并提供 **分项重试**（`POST .../retry` scope=`polish`|`summary`）。

**PRD-3.5-05 说明（已签收 · accepted）**：任务进度 **HTTP 轮询**（列表/详情 ≥2s，`REALTIME_ENABLED=false`）；首期不用 Realtime 订阅。

**PRD-3.5-06 说明（已签收 · accepted）**：上传已成功、后续流水线失败时，用户点 **「重试后续步骤」**（`scope=pipeline`），从失败点恢复（有 ASR 则重跑 LLM，有音频则重跑 ASR，否则从 extract/preprocess），**无需重新 TUS 上传**。

**PRD-3.5-07 说明（已签收 · accepted）**：FFmpeg 切片仅落 `WORKER_TMP_DIR/{taskId}/`，**不上传 Storage**；任务完成/失败/LLM 分项重试结束后 **删除临时目录**；**不要求**对 `/tmp` 切片单独加密。

**PRD-3.5-08 说明（已签收 · accepted）**：与 3.5-06 一致——`failed` 任务可 **重试后续步骤**；已落库媒体不强制重传。`POST /api/transcription/tasks/:id/retry`。

---

### §3.6 云盘

| ID | 章节 | 描述 | 签收 |
|----|------|------|:----:|
| PRD-3.6-01 | §3.6.1 | 归档目录任务名截断规则 | accepted |
| PRD-3.6-02 | §3.6.2 | admin 是否可删除律师文件 | accepted |
| PRD-3.6-03 | §3.6.2 | 目录同级重名、级联删除 | accepted |

**PRD-3.6-01 说明（已签收 · accepted）**：归档文件夹名 **不截断** 任务标题；仅替换非法路径字符（`\ / : * ? " < > |`）并规整空白。超过 `drive_nodes.name` 上限（256）时归档失败并告警，由律师缩短标题后重试。实现：`sanitizeDriveFolderName`。

**PRD-3.6-02 说明（已签收 · accepted）**：律师可删除本人节点；**admin** 可跨用户删除律师云盘节点（`service_role` + `file.delete` 审计，`deletedByAdmin`）。admin **不可**访问律师云盘列表/下载（PRD-2 边界不变）。

**PRD-3.6-03 说明（已签收 · accepted）**：同一 `parent_id` 下 **不允许** 同级重名（DB 唯一索引）；删除文件夹 **级联软删除** 子树，前端确认文案说明级联并展示 `deletedCount`。

---

### §3.7 审计

| ID | 章节 | 描述 | 签收 |
|----|------|------|:----:|
| PRD-3.7-01 | §3.7.2 | 失败登录是否记录尝试用户名 | accepted |
| PRD-3.7-02 | §3.7.2 | 审计日志保留期 | accepted |

**PRD-3.7-01 说明（已签收 · accepted）**：**不写入** `audit_logs` 失败登录事件（无 `auth.login_failure`、无 `attempted_username`）；枚举保留仅供历史行查询。登录失败仅返回统一错误文案（PRD-2）。

**PRD-3.7-02 说明（已签收 · accepted）**：业务 `audit_logs` 保留 **365** 天（`AUDIT_LOG_RETENTION_DAYS` / `system_settings.retention.days` 默认）；超期分区 DETACH 冷归档。首期不对接 SIEM。

---

### §5 非功能

| ID | 章节 | 描述 | 签收 |
|----|------|------|:----:|
| PRD-5-01 | §5.1 AI-02 | 说话人标注范围 | open |
| PRD-5-02 | §5.1 | ASR 5h 音频 RT 估算 | open |
| PRD-5-03 | §5.1 | LLM 润色 P95 单片/批次定义 | open |
| PRD-5-04 | §5.1 | 超长全文 LLM 分片策略 | open |
| PRD-5-05 | §5.2 | 律师端是否展示用量 | open |
| PRD-5-06 | §5.2 | 计费口径 | open |
| PRD-5-07 | §5.2 | 超长转写分片+合并策略 | open |
| PRD-5-08 | §5.2 | LLM 分片阈值与 5h 上限规划 | open |
| PRD-5-09 | §5.3 L1 | 功能模型失败默认模型重试次数 | open |
| PRD-5-10 | §5.3 L2 | 仍失败任务状态与 ASR 保留 | open |
| PRD-5-11 | §5.3 L3/L4 | 熔断阈值与全站不可用提示 | open |
| PRD-5-12 | §5.3 | 私有化 ASR/LLM 协议兼容清单 | open |

**PRD-5-01 说明**：交付物是否必须含说话人标签、适用哪些任务类型，PRD AI-02 行待确认。

**PRD-5-02 说明**：5 小时音频端到端处理时间目标未量化，难做容量规划与验收。

**PRD-5-03 说明**：「P95 ≤ 60s」指单片 ASR 后 LLM 还是整任务，未定义测量口径。

**PRD-5-04 说明**：超过模型 context 的全文如何切分、合并润色结果，策略待确认（与 ARCH-6-01 相关）。

**PRD-5-05 说明**：律师是否能看到 ASR/LLM 调用次数或 token 用量，首期未定义。

**PRD-5-06 说明**：若未来计费，按任务时长、token 还是存储，PRD 未写；首期可不实现但需确认「不做」。

**PRD-5-07 说明**：极长音频在 ASR 层的分片合并策略（与 Worker 15min 物理片关系）待确认。

**PRD-5-08 说明**：LLM 输入超过阈值时按字数/ token 切分的具体阈值未入库或未签收。

**PRD-5-09 说明**：与 PRD-3-02 类似，L1 降级重试次数需数字（如 1 次/3 次）。

**PRD-5-10 说明**：L2 仍失败时任务标记与用户可见内容（仅 ASR / 完全失败）待确认。

**PRD-5-11 说明**：全站 AI 不可用时的熔断条件、前端提示文案未定义；首期可能仅日志告警。

**PRD-5-12 说明**：私有化内网 ASR/LLM 须兼容哪些 API 形态（OpenAI 兼容、Azure、自定义 HTTP），交付清单待产品列明。

---

### §4.4 / 附录

| ID | 章节 | 描述 | 签收 |
|----|------|------|:----:|
| PRD-4-01 | §4.3 | 任务元数据创建 SLA | open |
| PRD-4-02 | §4.3 | 任务状态查询 SLA | open |
| PRD-4-03 | §4.3 | 全文检索引擎选型（Postgres FTS vs 外部） | open |
| PRD-4-04 | §5.2.1 | 审计保留期与 SIEM 对接 | open |
| PRD-4-05 | §5.3 | VAD/重计算部署拓扑（已废除 Python VAD，遗留表述） | open |
| PRD-4-06 | §5.3 | 验证码私有化替代方案细节 | open |
| PRD-4-07 | §5.4 | HTTPS TLS 1.2+ 强制策略 | open |
| PRD-4-08 | §5.4 | 存储加密要求 | open |
| PRD-4-09 | §5.4 | 备份 RPO/RTO | open |
| PRD-4-10 | §5.5 | WCAG 无障碍等级 | open |

**PRD-4-01 说明**：`uploads/init` 创建任务记录的响应时间 SLA 未写，仅原则「不经 Node 收流」。

**PRD-4-02 说明**：轮询任务状态的接口延迟/可用性 SLA 未写；UI 已用 ≥2s 轮询间隔。

**PRD-4-03 说明**：云盘/转写检索首期用 Postgres `pg_trgm` 还是外部引擎，PRD 附录仍待确认；当前实现偏 pg_trgm。

**PRD-4-04 说明**：审计冷归档、SIEM 导出格式与频率，首期 Out of Scope（M8 已注明）但保留期数字需统一。

**PRD-4-05 说明**：PRD 遗留「Python VAD 微服务」表述；v1.3 已改为 U3 FFmpeg 物理切片。签收应标记为 **obsolete/accepted** 以免误读。

**PRD-4-06 说明**：私有化 `CAPTCHA_PROVIDER=none` + IP 白名单已实施；Turnstile/Geetest 内网替代细节若未来要加，需单独 PRD。

**PRD-4-07 说明**：是否强制 TLS 1.2+、由反向代理还是 Node 终止，运维规范待确认。

**PRD-4-08 说明**：Storage/DB 静态加密、密钥谁管，PRD 未写；私有化交付常由运维承担。

**PRD-4-09 说明**：备份恢复点目标 RPO/RTO 未定义，影响部署方案评审。

**PRD-4-10 说明**：WCAG 目标等级（A/AA）未闭合；与 UI-7-01 对比度实测相关。

---

## 2. `architecture.md`

| ID | 章节 | 描述 | 签收 |
|----|------|------|:----:|
| ARCH-4-01 | §4.2.2 | `STORAGE_SIGNED_URL_TTL_SEC` 默认 300 与 PRD 闭合 | accepted |
| ARCH-6-01 | §6 附录 | LLM/ASR 分片阈值入库策略 | open |
| ARCH-6-02 | §6 附录 | ASR 部分切片失败：整任务 failed vs 部分降级 | open |

**ARCH-4-01 说明（已签收 · accepted）**：与 PRD-2-07 闭合——默认 **300 秒**，经 `STORAGE_SIGNED_URL_TTL_SEC` 配置；`packages/shared` 中 `DEFAULT_STORAGE_SIGNED_URL_TTL_SEC = 300` 为唯一代码默认值。

**ARCH-6-01 说明**：超长文本分片阈值是写死在代码、环境变量还是 `system_settings`/模型表，架构写「入库【待确认】后修订」。

**ARCH-6-02 说明**：架构附录默认部分切片失败 → 整任务 `failed`；PRD-3.5-03 仍 open。产品需在两者间选一作为首期行为。

---

## 3. `database.md`

| ID | 章节 | 描述 | 签收 |
|----|------|------|:----:|
| DB-1-01 | §3.1 profiles | `username` 大小写规范化策略 | open |
| DB-3-01 | §3.4 transcription_transcripts | `polished_text` 存 HTML vs Markdown | open |
| DB-4-01 | §3.5 drive_nodes | 虚拟根 `parent_id NULL` 初始化 | open |
| DB-4-02 | §3.5 / §7.2 | 同级目录重名 UNIQUE 约束策略 | accepted |
| DB-5-01 | §3.6 ai_model_credentials | 全局兜底模型唯一约束 | open |
| DB-6-01 | §6.2.1 | admin 是否可查看已软删行 | open |
| DB-6-02 | §6.3.2 | Storage 临时切片保留期（默认 7 日） | open |
| DB-6-03 | §6.3.3 | MP4 源文件冷存储 | accepted |
| DB-6-04 | §6.3.4 | `audit_logs` 保留 365 天与冷归档 Cron | accepted |

**DB-1-01 说明**：登录名是否强制小写、比较是否 case-insensitive，影响唯一索引与 Auth 虚拟邮箱映射。

**DB-3-01 说明**：TipTap 富文本存 HTML 还是 Markdown，影响导出 Word/PDF 与 XSS 策略；当前实现偏 HTML。

**DB-4-01 说明**：每用户是否必须有一条 `parent_id IS NULL` 的虚拟根；创建用户时是否自动插入 `__root__` 文件夹，与实现需一致。

**DB-4-02 说明（已签收 · 与 PRD-3.6-03）**：已建 `drive_nodes_created_by_parent_name_uidx`；同级重名插入/创建返回 `VALIDATION_FAILED`。

**DB-5-01 说明**：`is_default_fallback=true` 是否全局只能一条，数据库 UNIQUE 还是应用校验待确认。

**DB-6-01 说明**：软删除后 admin 审计/管理能否看到已删节点；律师 RLS 已不可见。

**DB-6-02 说明**：Storage 里历史 segments 对象 7 日后删除是否为正式策略；Cron 是否首期实现。

**DB-6-03 说明（已签收 · 与 PRD-3.5-01）**：抽音成功后删除 MP4 源对象，不冷备。

**DB-6-04 说明（已签收 · 与 PRD-3.7-02）**：保留 **365** 天；`AUDIT_LOG_RETENTION_DAYS=365`。DETACH 冷归档 Cron 可后置，保留天数已确定。

---

## 4. `ui_design.md`

| ID | 章节 | 描述 | 签收 |
|----|------|------|:----:|
| UI-3-01 | §3.1.3 | 窄屏 `< 1024px` 侧边栏抽屉行为 | open |
| UI-4-01 | §4.3.2.2 | 校对模式管理员标记纠错接口 | open |
| UI-4-02 | §4.3.4 | 波形图可选插件 | open |
| UI-5-01 | §5.2 | 预留角色占位页文案 | accepted |
| UI-6-01 | §6.3.4.3 | 上传中断后任务状态（uploading vs failed） | open |
| UI-6-02 | §6.3.5 | Realtime 可选 vs 纯轮询 | open |
| UI-6-03 | §6.4.2 | 自动归档目录是否只读/可重命名 UI | open |
| UI-7-01 | §7.2 | WCAG AA 对比度实测 | open |

**UI-3-01 说明**：与 PRD-1.3-01 相关；窄屏是否必须做抽屉侧栏，还是首期仅支持 ≥1024px 桌面。

**UI-4-01 说明**：校对模式只读 ASR；是否允许 admin 标记纠错并写回，还是首期无写接口。当前无 PATCH 校对稿 API。

**UI-4-02 说明**：段落点击 seek 已要求；波形图是否为可选增强、用何库，PRD 禁止 canvas 作为唯一交互层。

**UI-5-01 说明（已签收 · accepted）**：文案与 PRD-2-04 相同（见 §2 占位页引文）；页面需保留进入个人中心/改密的入口。

**UI-6-01 说明**：用户中断 TUS 上传后，任务保持 `uploading` 还是自动 `failed`，前后端须一致。

**UI-6-02 说明**：与 PRD-3.5-05 相同；`REALTIME_ENABLED=false` 时 UI 是否仍预留 Realtime 代码路径。

**UI-6-03 说明**：PRD 允许律师重命名归档目录，UI 是否显示「系统自动归档」只读标识、是否禁用重命名，待确认。

**UI-7-01 说明**：与 PRD-4-10 相同；主题色对比度是否需 AA 级实测报告。

---

## 5. M9 实现相关【待确认】

| ID | 来源 | 描述 | 签收 |
|----|------|------|:----:|
| M9-01 | tasks.md M9-E | 性能冒烟脚本是否纳入 CI | open |
| M9-02 | tasks.md M9-G | 工作台校对 seek 断言 audio `currentTime` 桩策略 | open |

**M9-01 说明**：`scripts/load/smoke-*.mjs` 已文档化于 `DEPLOYMENT.md`，但是否在 GitHub Actions 对 staging 定期跑、失败是否阻塞发布，产品/运维需定。

**M9-02 说明**：Playwright `workbench-proofread-seek.spec.ts` 需已完成任务 ID；断言 audio `currentTime` 变化在 CI 无真实音频时可能需 Mock 或跳过，桩策略待确认。

---

## 6. 签收记录

| 日期 | 签收人 | 说明 |
|------|--------|------|
| 2026-05-31 | 产品 | PRD-2-01～07、PRD-2.4-01、ARCH-4-01、UI-5-01 签收（见 §2 说明） |
| — | — | 其余条目仍 open，待后续评审 |
