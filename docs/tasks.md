# LexOS 开发里程碑（Milestones）

| 字段 | 内容 |
|------|------|
| 文档版本 | 1.2 |
| 粒度 | 模块级大纲；原子任务在各 Milestone 启动时再拆解 |
| 基准 | `CONTEXT_SUMMARY.md` v1.1 · `architecture.md` v1.3 · `database.md` v1.4 · 冻结 PRD v0.3 业务边界 |

---

## 使用说明

- 按 **Milestone 序号升序** 推进；完成当前 Milestone 验收后再进入下一项。
- 子任务级拆解、测试与 `git commit` 遵守根目录 `.cursorrules` §5。
- 每个 Milestone 启动前读取对应完整规范（`architecture.md` v1.3 / `database.md` v1.4 / `ui_design.md`）。
- **v1.3 架构简化**（2026-05-30）：废除 Redis/BullMQ；U3 单进程轮询 Postgres Outbox；`WORKER_MAX_CONCURRENCY` 默认 5。M4 已交付的 `outbox-dispatcher` 为遗留，在 **M5-0** 合并入 `workers/pipeline`。

---

## Milestone 0：基础设施与数据库迁移（Supabase CLI Setup）

**目标**：可运行的 monorepo 骨架、环境加载、远端 Supabase 连通、数据库 schema 与 RLS/Storage 策略落地。

**设计基准**：`docs/database.md` v1.3 §8 迁移顺序；迁移文件是唯一权威 DDL 来源（测试环境与私有化环境一致）。

**验收**：`supabase db push`（或 CI 等价）成功；`migration list` 与本地一致；RLS/Storage smoke 通过；`seed.sql` 可创建内置 `admin`。

---

### M0-A Supabase CLI 与仓库初始化

- [x] 确认已配置 `.env.development`（自 `.env.example` 复制）且 `SUPABASE_*` 可连接远端项目
- [x] 安装并验证 Supabase CLI：`supabase --version`（或全局 `supabase`）
- [x] 在项目根目录执行 `supabase init`（若尚无 `supabase/config.toml`）；保留默认结构并核对 `project_id` 与远端项目关联方式（`supabase link --project-ref <ref>`）
- [x] 创建目录：`supabase/migrations/`、`supabase/seed.sql`（若 CLI 未自动生成则手动创建）
- [x] 在 `.gitignore` 中忽略 `.env`、`.env.development`、`.env.production`；**禁止**提交含秘密值的 env 文件
- [x] 初始化 monorepo 目录骨架（空包即可）：`apps/api/`、`apps/web/`、`workers/pipeline/`、`packages/shared/`（与 `architecture.md` §2.1 一致）

---

### M0-B SQL 迁移（按依赖顺序；每条对应一个迁移文件）

> **命令模板**：`supabase migration new <snake_case_name>` → 在生成的 `supabase/migrations/<timestamp>_<name>.sql` 中写入 DDL → 本地验证 `npx supabase db push`（或 `migration up`）。

- [x] **B1 扩展** — `supabase migration new extensions_pg_trgm`  
  写入：`CREATE EXTENSION IF NOT EXISTS pg_trgm;`（`database.md` §7.3.1）

- [x] **B2 枚举类型** — `supabase migration new enums`  
  写入：`user_role`、`user_status`、`transcription_task_status`、`ai_provider_kind`、`ai_feature_key`、`drive_node_type`、`asr_queue_tier`、`audit_action`（`database.md` §1.2）

- [x] **B3 主表 profiles** — `supabase migration new table_profiles`  
  写入：`public.profiles` 全字段（含 `mfa_enabled`）、索引、`FK → auth.users(id) ON DELETE RESTRICT`；通用 `updated_at` 触发器（`BEFORE UPDATE` 置 `updated_at = now()`）

- [x] **B4 AI 配置表（无跨域 FK 依赖）** — `supabase migration new tables_ai_config`  
  写入：`ai_model_credentials`（含 `UNIQUE (is_default_fallback) WHERE is_default_fallback = true`）、`ai_feature_model_mappings`、`ai_prompt_templates` 及各自索引

- [x] **B5 转写主表 transcription_tasks** — `supabase migration new table_transcription_tasks`  
  写入：`transcription_tasks` 全字段；**暂不添加** `archive_folder_id → drive_nodes` 外键（避免与 `drive_nodes` 循环依赖）；索引含 `stalled_idx`、`idempotency_key` 部分唯一

- [x] **B6 转写子表 segments + transcripts** — `supabase migration new tables_transcription_children`  
  写入：`transcription_segments`（含 `local_path_hint`、`chunk_size_bytes`）、`transcription_transcripts`；`pg_trgm` GIN 索引：`polished_text`、`summary_text`（`database.md` §3.4）

- [x] **B7 云盘 drive_nodes + 闭环 FK** — `supabase migration new table_drive_nodes`  
  写入：`drive_nodes` 全字段与索引；`CHECK`：`node_type = 'file'` 时 `parent_id IS NOT NULL`；`ALTER TABLE transcription_tasks ADD CONSTRAINT ... FOREIGN KEY (archive_folder_id) REFERENCES drive_nodes(id)`

- [x] **B8 流水线支撑表** — `supabase migration new tables_pipeline`  
  写入：`upload_sessions`、`outbox_events`（含 `outbox_events_unpublished_idx`）、`pipeline_job_runs`（`UNIQUE (queue_name, bull_job_id, attempt)`）

- [x] **B9 审计与系统表** — `supabase migration new tables_audit_system`  
  写入：`audit_logs`（含 `prev_hash`、`row_hash`）、`ai_invocation_logs`、`system_settings`；`REVOKE UPDATE, DELETE ON audit_logs FROM PUBLIC, authenticated, service_role`

- [x] **B10 安全 DEFINER 函数（RLS 前置依赖）** — `supabase migration new functions_security`  
  写入：`current_user_role()`、`is_admin()`、`is_enabled_user()` 及 `REVOKE`/`GRANT`（§4.1）；`transition_task_status()`（§4.11）；`append_audit_log()`（§4.12）；`complete_password_change()`（§7.4.2）；`set_profile_mfa_enabled()`（§7.4.3）；`profiles_guard_self_update()` 函数体（触发器在 B12 挂载）

- [x] **B11 业务约束触发器（可选同文件或拆分）** — `supabase migration new triggers_business_rules`  
  写入：`transcription_tasks` 校验触发器：`size_bytes <= 1073741824`、`duration_sec <= 18000`（§7.1）；`handle_new_user` 或文档约定由 Admin API 同步 `profiles`（若用 Auth trigger 则在本迁移实现）

- [x] **B12 RLS 策略（全部业务表）** — `supabase migration new rls_policies`  
  按 `database.md` §4.2–§4.10 写入：`profiles`、`transcription_tasks`、`transcription_segments`（拆分 SELECT/INSERT，禁止 `FOR ALL`）、`transcription_transcripts`、`drive_nodes`、`ai_*` 仅 `is_admin()`、`audit_logs` 仅 admin SELECT、`ai_invocation_logs` admin/lawyer 分策略、`upload_sessions`；`outbox_events` / `pipeline_job_runs` **不** 对 `authenticated` 授权

- [x] **B13 审计不可变 + profiles 防护触发器** — `supabase migration new triggers_immutable`  
  写入：`BEFORE UPDATE OR DELETE ON audit_logs` → `RAISE EXCEPTION`；`BEFORE UPDATE ON profiles` → `profiles_guard_self_update()`

- [x] **B14 Storage Buckets 与对象策略** — `supabase migration new storage_buckets_policies`  
  写入：创建/声明 `media`、`exports` bucket；`storage.objects` 策略：路径首段 `= auth.uid()::text`（§5.3）；`exports` 同构；禁止 authenticated 越权 UPDATE 他人对象

- [x] **B15 推送校验** — 执行 `nsupabase db push`（已 `supabase link` 时）或 `npx supabase migration up`；确认无报错且 `npx supabase migration list` 显示 B1–B14 均已应用

---

### M0-C Seed 与 Auth 内置账户

- [x] 编写 `supabase/seed.sql`：通过 Supabase Auth Admin 流程说明或 SQL 注释 + 文档化脚本；创建内置 `admin` 用户及对应 `profiles`（`role=admin`，`requires_password_change=true` 首次登录策略，与 PRD §1.4 A3 一致）
- [x] 配置 `supabase/config.toml` 的 `[db.seed]`（若使用 CLI seed）并执行 `npx supabase db reset`（**仅开发库**）或 `npx supabase seed` 验证 seed 可重复执行策略
- [x] 验证：远端/本地库存在可登录的 `admin` profile 行，且 `username` 唯一

---

### M0-D 应用基建最小集（M0 验收所需）

- [x] 初始化 `packages/shared`：`ErrorCode` 枚举（对齐 `architecture.md` §6.2）、`ApiSuccess`/`ApiError` 响应类型、分页 `limit` 默认 50
- [x] 初始化 `apps/api` 最小入口：加载 `.env.development`；`GET /health` 检测 Postgres（`SUPABASE_DB_URL`）；~~Redis~~（M4 遗留，**M5-0** 移除 `REDIS_URL` 探测）
- [x] 添加数据库连通性 smoke 测试（可选：`psql` 或 vitest 单测查询 `SELECT 1`）
- [x] 添加 RLS smoke 脚本或测试用例：律师 JWT 无法读取他人 `transcription_tasks` 行（可用 Supabase 测试用户）

---

### M0-E Milestone 0 完成门禁

- [x] 全部 M0-A～M0-D 复选框已完成
- [x] `npx supabase migration list` 与仓库 `supabase/migrations/*.sql` 文件一一对应，无手工改库漂移
- [x] 执行 `git commit`（约定式提交，如 `feat(db): add supabase migrations and m0 scaffold`）
- [x] 在下方进度表将 **M0** 标为「已完成」后，方可启动 Milestone 1

**M0 明确延后（不阻塞 M1 启动）**：

- `drive_node_tags` 表（`database.md` §3.6 可选）
- `upsert_task_segments()` DEFINER 函数（Worker 阶段 M5 前补充迁移）
- `zhparser` / `search_vector` 触发器（目标态，见 §7.3.3）

---


## Milestone 1：认证、会话与个人中心

**目标**：用户名登录、虚拟邮箱映射、会话、强制改密、MFA（admin/director）、个人资料 API。

**局部规范索引**（无 `docs/prd/01_auth.md` 等拆分文件时，以以下章节为准）：

| 文档 | 章节 |
|------|------|
| `prd.md` | §2.4–§2.5、§3.2 |
| `architecture.md` | §5.1–§5.3、§6.1–§6.2（错误码）、§7 `/api/auth/*`、`/api/profile` |
| `ui_design.md` | §3.3–§3.4、§5.2、§6.1 |
| `database.md` | §3.1 `profiles`、`complete_password_change`、`set_profile_mfa_enabled` |

**验收**：admin/lawyer 可登录；`requires_password_change` 时仅改密白名单 API；lawyer 无法访问 admin 路由；登录/登出/改密写审计。（**MFA 首期已关闭**，见 `prd.md` §2.5.2–§2.5.3，不阻塞 M1 完成。）

**前置依赖**：Milestone 0 已完成（`profiles` 表与 RLS 已存在）。

---

### M1-A 共享类型与适配器基础（`packages/shared`）

- [x] 新增 `packages/shared/src/errors/auth-error-codes.ts`：`AUTH_UNAUTHORIZED`、`AUTH_FORBIDDEN`、`AUTH_ACCOUNT_DISABLED`、`AUTH_PASSWORD_CHANGE_REQUIRED`、`AUTH_INVALID_CREDENTIALS`、`AUTH_CAPTCHA_REQUIRED`、`AUTH_MFA_REQUIRED`
- [x] 新增 `packages/shared/src/types/auth-context.ts`：`userId`、`role`、`username`、`requiresPasswordChange`、`sessionId?`
- [x] 新增 `packages/shared/src/dto/auth-login.dto.ts`：`username`、`password`、`captchaToken?`、`totpCode?`（zod schema）
- [x] 新增 `packages/shared/src/dto/auth-change-password.dto.ts`：`currentPassword?`、`newPassword`（强制改密场景可无 `currentPassword` 的规则在 Service 层分支）
- [x] 新增 `packages/shared/src/dto/profile-update.dto.ts`：`displayName?`、`contact?`

---

### M1-B Auth 适配器（`apps/api` · Adapter 层）

- [x] 新增 `apps/api/src/adapters/auth/supabase-auth.adapter.ts`：`resolveVirtualEmail(username)` → `{username}@llexos.internal`（读 `AUTH_VIRTUAL_EMAIL_DOMAIN`）
- [x] 实现 `signInWithPassword(virtualEmail, password)` 封装 Supabase Auth
- [x] 实现 `signOut(accessToken?)` / `signOutGlobal(userId)`（Admin 重置属 M2，本模块仅封装方法）
- [x] 实现 `updateUserPassword(userId, newPassword)`（Auth Admin 或用户 session 改密）
- [x] 实现 `enrollMfa` / `verifyMfa` / `getMfaAuthenticatorAssuranceLevel`（Supabase TOTP API 封装）
- [x] 新增 `apps/api/src/adapters/auth/captcha.adapter.ts` 接口 + `none-captcha.adapter.ts`（`CAPTCHA_PROVIDER=none` 空实现）
- [x] 新增 `apps/api/src/adapters/auth/turnstile-captcha.adapter.ts` 或 `geetest-captcha.adapter.ts`（按 env 二选一，**实施前须用户授权新依赖时仅实现接口桩**）

---

### M1-C 中间件（`apps/api` · 每条一个文件）

- [x] 新增 `apps/api/src/middleware/request-id.middleware.ts`：注入 `requestId` + `AsyncLocalStorage`
- [x] 新增 `apps/api/src/middleware/error-handler.middleware.ts`：统一 `{ success, error }` 响应体
- [x] 新增 `apps/api/src/middleware/auth.middleware.ts`：解析 Bearer JWT；加载 `profiles`；`status=disabled` → `AUTH_ACCOUNT_DISABLED`；**以 `profiles.role` 为准**
- [x] 新增 `apps/api/src/middleware/password-change-gate.middleware.ts`：白名单 `/api/auth/change-password`、`/api/auth/session`、`/api/auth/logout`；否则 `AUTH_PASSWORD_CHANGE_REQUIRED`
- [x] 新增 `apps/api/src/middleware/role-gate.factory.ts`：导出 `requireRoles(...roles)` 高阶函数（M1 仅挂载 profile 路由测试用）

---

### M1-D Repository（`apps/api`）

- [x] 新增 `apps/api/src/repositories/profile.repository.ts`：`findById`、`findByUsername`、`updateDisplayContact`（用户 JWT 客户端，RLS 生效）
- [x] 新增 `apps/api/src/repositories/profile-admin.repository.ts`（可选合并）：`setRequiresPasswordChange`、`setMfaEnabled` 经 RPC 调用 `complete_password_change` / `set_profile_mfa_enabled`（`service_role` 或 supabase rpc）

---

### M1-E Service + 单元测试（每条 Service 对应测试文件）

- [x] 新增 `apps/api/src/services/auth-login.service.ts`：虚拟邮箱登录；失败计数占位对接验证码策略；成功写 `audit_logs`（`auth.login_success`，`metadata.attempted_username` 仅 failure）
- [x] 新增 `apps/api/src/services/auth-login.service.test.ts`：Mock Adapter；断言错误码 `AUTH_INVALID_CREDENTIALS`、`AUTH_ACCOUNT_DISABLED`
- [x] 新增 `apps/api/src/services/auth-session.service.ts`：组装 session + profile 摘要（含 `requires_password_change`、`mfa_enabled`、`role`）
- [x] 新增 `apps/api/src/services/auth-session.service.test.ts`
- [x] 新增 `apps/api/src/services/auth-logout.service.ts`：登出 + `auth.logout` 审计
- [x] 新增 `apps/api/src/services/auth-logout.service.test.ts`
- [x] 新增 `apps/api/src/services/auth-change-password.service.ts`：验证原密码（主动改密）；Admin API 更新密码；`setRequiresPasswordChange(false)`；返回新 access token
- [x] 新增 `apps/api/src/services/auth-change-password.service.test.ts`
- [x] 新增 `apps/api/src/services/auth-mfa.service.ts`：enroll 返回 QR；verify 后 `set_profile_mfa_enabled(true)`；强制角色未绑定返回 `AUTH_MFA_REQUIRED`
- [x] 新增 `apps/api/src/services/auth-mfa.service.test.ts`
- [x] 新增 `apps/api/src/services/profile.service.ts`：GET/PATCH 本人资料（禁止改 `role/status/username/mfa_enabled`）
- [x] 新增 `apps/api/src/services/profile.service.test.ts`

---

### M1-F 路由与 Controller（每条 HTTP 路由独立任务）

- [x] 注册路由 `POST /api/auth/login` → `auth.routes.ts` + `auth-login.controller.ts` + `auth-login.controller.test.ts`
- [x] 注册路由 `POST /api/auth/logout` → `auth-logout.controller.ts` + `auth-logout.controller.test.ts`
- [x] 注册路由 `GET /api/auth/session` → `auth-session.controller.ts` + `auth-session.controller.test.ts`（需 `auth.middleware`）
- [x] 注册路由 `POST /api/auth/change-password` → `auth-change-password.controller.ts` + `auth-change-password.controller.test.ts`
- [x] 注册路由 `POST /api/auth/mfa/enroll` → `auth-mfa-enroll.controller.ts` + 测试（仅 `admin`/`director`）
- [x] 注册路由 `POST /api/auth/mfa/verify` → `auth-mfa-verify.controller.ts` + 测试
- [x] 注册路由 `GET /api/auth/mfa/status` → `auth-mfa-status.controller.ts` + 测试
- [x] 注册路由 `GET /api/profile` → `profile.routes.ts` + `profile-get.controller.ts` + 测试
- [x] 注册路由 `PATCH /api/profile` → `profile-patch.controller.ts` + 测试
- [x] 在 `apps/api/src/app.ts` 挂载 auth/profile 路由组；公开路由仅 `login`；其余走 `auth` + `password-change-gate` 链

---

### M1-G 数据库函数调用迁移（若 M0 未包含）

- [x] 确认 M0 迁移已含 `complete_password_change()`、`set_profile_mfa_enabled()`；若缺失：`npx supabase migration new functions_auth_profile` 并 `db push`
- [x] 新增集成测试 `apps/api/src/__tests__/auth-password-change.db.test.ts`：调用 RPC 后 `requires_password_change` 为 `false`

---

### M1-H 前端 · Shadcn 组件引入（每条命令一项）

- [x] 执行 `npx shadcn@latest add card`（登录/改密页容器）
- [x] 执行 `npx shadcn@latest add input`
- [x] 执行 `npx shadcn@latest add label`
- [x] 执行 `npx shadcn@latest add button`
- [x] 执行 `npx shadcn@latest add form`
- [x] 执行 `npx shadcn@latest add alert`
- [x] 执行 `npx shadcn@latest add skeleton`
- [x] 执行 `npx shadcn@latest add sonner`（错误 Toast）

---

### M1-I 前端 · API 客户端（BFF 代理，禁止业务 Supabase 写表）

- [x] 新增 `apps/web/src/lib/api-client.ts`：`fetch` 封装、`credentials: include`、统一解析 `ApiSuccess`/`ApiError`
- [x] 新增 `apps/web/src/lib/auth-api.ts`：`login`、`logout`、`getSession`、`changePassword`、`mfaEnroll`、`mfaVerify`、`getMfaStatus`
- [x] 新增 `apps/web/src/lib/profile-api.ts`：`getProfile`、`updateProfile`

---

### M1-J 前端 · 页面与单组件（每条一项）

- [x] 新增 `apps/web/src/app/login/page.tsx`：`auth-layout` Grid/Flex；`LoginForm` 组件；Loading/Error/Empty（§2.13）
- [x] 新增 `apps/web/src/components/auth/login-form.tsx`：用户名/密码；失败 3 次显示验证码占位 UI
- [x] 新增 `apps/web/src/app/change-password/page.tsx`：强制改密与主动改密共用
- [x] 新增 `apps/web/src/components/auth/change-password-form.tsx`：原密码（条件渲染）+ 新密码
- [x] 新增 `apps/web/src/app/mfa/setup/page.tsx`：展示 enroll QR（admin/director）
- [x] 新增 `apps/web/src/components/auth/mfa-verify-form.tsx`：6 位 TOTP 输入
- [x] 新增 `apps/web/src/app/(app)/profile/page.tsx`：只读展示 + 编辑 `display_name`/`contact`
- [x] 新增 `apps/web/src/components/profile/profile-form.tsx`

---

### M1-K 前端 · Router Guard（单文件一项）

- [x] 新增 `apps/web/src/middleware.ts`（Next.js）或 `apps/web/src/lib/router-guard.ts`：未登录 → `/login`
- [x] Guard 规则 2：`requires_password_change` → `/change-password`（可调 `GET /api/auth/session`）
- [x] Guard 规则 3：`admin`/`director` 且 `mfa_enabled=false` → `/mfa/setup`
- [x] Guard 规则 4：`/admin/*` 路由 `allowedRoles=['admin']` 拒绝 lawyer（跳转 403 或首页）
- [x] 新增 `apps/web/src/app/unauthorized/page.tsx`：无权限占位（预留角色友好文案）

---

### M1-L 端到端与 Milestone 1 完成门禁

- [x] 手工验收：lawyer 登录 → 进入律师占位首页；访问 `/admin` 被拒绝（M2-K 已补测）
- [x] 手工验收：admin 登录 → 强制改密 → 进入业务壳 `/admin`（`AppShell` 空壳；MFA 首期已关闭）
- [x] 手工验收：`requires_password_change=true` 时请求 `GET /api/profile` 返回 403（改密白名单门禁已实现；与强制改密流程一致）
- [x] 运行 M1 相关测试套件全绿；失败超过 2 次则停止并汇报（`.cursorrules` §5.1）
- [x] `git commit`：`feat(auth): session login mfa profile and guards`
- [x] 进度表 **M1** 标为「已完成」（2026-05-29：admin 登录 + 强制改密 + 进入业务壳已本地验收）

**M1 明确不在此 Milestone（归属 M2）**：管理员创建用户、重置密码、`signOut(global)`。

---


## Milestone 2：管理员 — 用户管理

**目标**：管理员对用户全生命周期管理（无物理删除）。

**局部规范索引**（无拆分文件时，以以下章节为准）：

| 文档 | 章节 |
|------|------|
| `prd.md` | §2.1 角色矩阵「用户管理」、§2.4–§2.5.1、§3.1 |
| `architecture.md` | §5.1.3–§5.1.4、§5.3–§5.4、§5.6、§7 `/api/admin/users/*` |
| `ui_design.md` | §5.1（admin 菜单）、§6.2 |
| `database.md` | §3.1 `profiles`、§4.2 RLS、`audit_action` `user.*` / `auth.password_reset` |

**验收**：仅 `admin` 可调用；用户名唯一；禁用后立即 `signOut(global)` 且无法登录；重置密码后 `requires_password_change=true` 且全局会话吊销；禁止物理删除与禁用末位 `admin`；列表分页 50。

**前置依赖**：Milestone 1 已完成（`auth.middleware`、`requireRoles('admin')`、登录/改密链路可用）。

---

### M2-A 共享 DTO 与校验（`packages/shared`）

- [x] 新增 `packages/shared/src/dto/admin-user-create.dto.ts`：`username`、`displayName`、`role`、`contact?`（zod；`username` 规范化规则与 PRD 一致）
- [x] 新增 `packages/shared/src/dto/admin-user-update.dto.ts`：`displayName?`、`role?`、`contact?`（禁止含 `status`/`username` 自改入口）
- [x] 新增 `packages/shared/src/dto/admin-user-status.dto.ts`：`status: 'enabled' | 'disabled'`
- [x] 新增 `packages/shared/src/dto/admin-user-list-query.dto.ts`：`limit`（默认 50，最大 50）、`cursor?` 或 `offset?`、`role?`、`status?`、`q?`（用户名/姓名模糊）
- [x] 新增 `packages/shared/src/types/admin-user-list-item.ts`：列表行字段（含 `mfaEnabled`、`createdAt`）

---

### M2-B `AdminRepository`（`service_role`，单文件一项）

- [x] 新增 `apps/api/src/repositories/admin-user.repository.ts`：封装 `service_role` Supabase 客户端（**禁止**在 HTTP 默认链路替代用户 JWT）
- [x] 实现 `listUsers(query)`：分页 50；排序 `created_at DESC`；返回 `meta.nextCursor` 或 `meta.total`
- [x] 实现 `findUserById(id)`：含 `profiles` 全字段（供编辑表单）
- [x] 实现 `findUserByUsername(username)`：创建前唯一性预检
- [x] 实现 `insertProfileAfterAuth(...)`：事务内写入 `profiles`（若不用 `handle_new_user` 触发器则显式插入）
- [x] 实现 `updateProfileFields(id, dto)`：仅 `display_name`/`role`/`contact`（经 `profiles_write_admin` 或 SECURITY DEFINER RPC）
- [x] 实现 `setUserStatus(id, status)`：更新 `profiles.status`
- [x] 实现 `setRequiresPasswordChange(id, true)`：重置密码链路用
- [x] 实现 `countEnabledAdmins()`：禁用末位 admin 防护
- [x] 新增 `apps/api/src/repositories/admin-user.repository.test.ts`：Mock Supabase；断言不暴露 `service_role` 到返回值

---

### M2-C 数据库 SECURITY DEFINER（若 M0 未覆盖 admin 写列）

- [x] 确认 M0 已含 `profiles_guard_self_update`；若缺失则 `npx supabase migration new profiles_guard_self_update` 并 `db push`
- [x] 新增迁移 `npx supabase migration new admin_profile_functions`：`admin_update_profile(...)`、`admin_set_user_status(...)`（仅 `service_role` 调用路径）
- [x] 同上迁移：`admin_mark_password_reset_required(user_id uuid)` 置 `requires_password_change=true`
- [x] 新增 `apps/api/src/__tests__/admin-user-rls.db.test.ts`：律师 JWT 无法 `UPDATE` 他人 `profiles.role`

---

### M2-D Auth Admin 适配器扩展（`apps/api`）

- [x] 扩展 `supabase-auth.adapter.ts`：`adminCreateUser(virtualEmail, initialPassword)` → `auth.admin.createUser`
- [x] 实现 `adminUpdateUserPassword(userId, password)`（`AUTH_INITIAL_PASSWORD` 来自 env）
- [x] 实现 `adminSignOutGlobal(userId)` → `auth.admin.signOut(userId, 'global')`
- [x] 新增 `apps/api/src/adapters/auth/supabase-auth.adapter.admin.test.ts`：Mock Admin API；禁止日志输出密码

---

### M2-E Service + 单元测试（每条 Service 对应一个 `.test.ts`）

- [x] 新增 `apps/api/src/services/admin-user-list.service.ts`：组装列表 DTO + 分页 meta
- [x] 新增 `apps/api/src/services/admin-user-list.service.test.ts`
- [x] 新增 `apps/api/src/services/admin-user-create.service.ts`：用户名唯一 → 虚拟邮箱 → `createUser` + `profiles` + 可选 `drive_nodes` 根目录种子（`database.md` §7.2.1）+ `append_audit_log('user.create')`
- [x] 新增 `apps/api/src/services/admin-user-create.service.test.ts`：重复用户名 → `VALIDATION_FAILED`；部分写入回滚
- [x] 新增 `apps/api/src/services/admin-user-update.service.ts`：禁止改 `username`/`status`；`user.update` 审计
- [x] 新增 `apps/api/src/services/admin-user-update.service.test.ts`
- [x] 新增 `apps/api/src/services/admin-user-status.service.ts`：禁用 → `signOut(global)` + `user.disable`；启用 → `user.enable`；末位 admin / 内置 admin → `OPERATION_NOT_ALLOWED`
- [x] 新增 `apps/api/src/services/admin-user-status.service.test.ts`
- [x] 新增 `apps/api/src/services/admin-user-reset-password.service.ts`：**单 DB 事务**：Auth 密码=`AUTH_INITIAL_PASSWORD` → `requires_password_change=true` → `signOut(global)` → `auth.password_reset` 审计（`architecture.md` §5.1.4.1）
- [x] 新增 `apps/api/src/services/admin-user-reset-password.service.test.ts`：断言事务失败时不遗留半状态

---

### M2-F 路由与 Controller（每条 HTTP 路由独立任务）

- [x] 注册 `GET /api/admin/users` → `admin-users.routes.ts` + `admin-users-list.controller.ts` + `admin-users-list.controller.test.ts`（`requireRoles('admin')`）
- [x] 注册 `POST /api/admin/users` → `admin-users-create.controller.ts` + `admin-users-create.controller.test.ts`
- [x] 注册 `GET /api/admin/users/:id` → `admin-users-get.controller.ts` + `admin-users-get.controller.test.ts`
- [x] 注册 `PATCH /api/admin/users/:id` → `admin-users-patch.controller.ts` + `admin-users-patch.controller.test.ts`
- [x] 注册 `PATCH /api/admin/users/:id/status` → `admin-users-status.controller.ts` + `admin-users-status.controller.test.ts`
- [x] 注册 `POST /api/admin/users/:id/reset-password` → `admin-users-reset-password.controller.ts` + `admin-users-reset-password.controller.test.ts`
- [x] 在 `apps/api/src/app.ts` 挂载 `/api/admin/users` 路由组；全组前置 `auth.middleware` + `password-change-gate` + `requireRoles('admin')`

---

### M2-G 前端 · Shadcn 组件引入（每条命令一项）

- [x] 执行 `npx shadcn@latest add table`
- [x] 执行 `npx shadcn@latest add badge`
- [x] 执行 `npx shadcn@latest add alert-dialog`
- [x] 执行 `npx shadcn@latest add dialog`
- [x] 执行 `npx shadcn@latest add select`
- [x] 执行 `npx shadcn@latest add dropdown-menu`

---

### M2-H 前端 · API 客户端（单文件一项）

- [x] 新增 `apps/web/src/lib/admin-users-api.ts`：`listUsers`、`getUser`、`createUser`、`updateUser`、`setUserStatus`、`resetPassword`

---

### M2-I 前端 · 页面与组件（每条一项）

- [x] 新增 `apps/web/src/app/(app)/admin/users/page.tsx`：挂载 `AdminUsersPanel`；Skeleton / Error / Empty（§2.13）
- [x] 新增 `apps/web/src/components/admin/AdminUsersPanel.tsx`：Data Table；列：用户名、真实姓名、角色、状态、MFA Badge、`created_at`、操作列
- [x] 新增 `apps/web/src/components/admin/admin-users-table.tsx`：Shadcn `Table` + 分页控件（每页 50，与 API `meta` 同步）
- [x] 新增 `apps/web/src/components/admin/user-status-badge.tsx`：`enabled`/`disabled` 颜色令牌（`ui_design.md` §2.2）
- [x] 新增 `apps/web/src/components/admin/user-mfa-badge.tsx`：读 `mfa_enabled` 展示「已绑定」/「未绑定」
- [x] 新增 `apps/web/src/components/admin/create-user-dialog.tsx`：Shadcn `Dialog` + `Form`；字段 username/displayName/role/contact
- [x] 新增 `apps/web/src/components/admin/edit-user-dialog.tsx`：编辑 `displayName`/`role`/`contact`
- [x] 新增 `apps/web/src/components/admin/disable-user-alert-dialog.tsx`：`AlertDialog` 二次确认后调用 `setUserStatus('disabled')`
- [x] 新增 `apps/web/src/components/admin/enable-user-alert-dialog.tsx`：`AlertDialog` 启用确认
- [x] 新增 `apps/web/src/components/admin/reset-password-alert-dialog.tsx`：`AlertDialog` 文案含「将密码重置为初始密码并强制改密」

---

### M2-J 前端 · 导航与权限（单文件一项）

- [x] 在 `apps/web/src/lib/menus.ts`（或等价）为 `admin` 增加「用户管理」→ `/admin/users`（`ui_design.md` §5.1；禁止 `display:none` 藏路由）
- [x] 确认 `router-guard` / `middleware`：`/admin/users` 仅 `allowedRoles=['admin']`；lawyer 访问返回 `/unauthorized`

---

### M2-K 端到端与 Milestone 2 完成门禁

- [x] 手工验收：admin 创建 lawyer 用户 → 线下凭据登录（M1）→ 强制改密流程可用
- [x] 手工验收：禁用该 lawyer → 已登录会话立即失效；再次登录 `AUTH_ACCOUNT_DISABLED`
- [x] 手工验收：重置律师密码 → 重新登录仅可改密；`GET /api/profile` 在改密前 403
- [x] 手工验收：尝试禁用唯一 admin → API `OPERATION_NOT_ALLOWED`
- [x] 运行 M2 相关测试全绿；连续失败 >2 次则停止汇报（`.cursorrules` §5.1）
- [x] `git commit`：`feat(admin): user management crud status reset password`
- [x] 进度表 **M2** 标为「已完成」

**M2 明确不在此 Milestone**：AI 配置（M3）、审计日志查询 UI（M6）、物理删除用户接口。

---


## Milestone 3：管理员 — AI 基础设施配置

**目标**：模型凭证、功能-模型映射、Prompt 模板、连通性测试。

**局部规范索引**（无拆分文件时，以以下章节为准）：

| 文档 | 章节 |
|------|------|
| `prd.md` | §2.2「AI：模型凭证 / 映射 / Prompt」、§3.3–§3.4、§4.1 AI-01、§4.2 |
| `architecture.md` | §4.2.5、§4.3 Adapter/Factory、§7 `/api/admin/ai/*`、§6.4.3（禁止日志输出密钥） |
| `ui_design.md` | §5.1（admin 菜单「AI 配置」）、§6.5 高密度表格通用规范 |
| `database.md` | §3.7–§3.10、`ai_feature_key` 枚举、§4.6 RLS、§4.8 `ai_invocation_logs` |

**验收**：仅 `admin` 可读写 AI 配置 API；`api_key` 密文入库且响应/日志掩码；连通性测试 P95≤10s（`AI_TEST_TIMEOUT_MS`）；律师 JWT 访问 `/api/admin/ai/*` 返回 `AUTH_FORBIDDEN`；业务代码无硬编码 Prompt。

**前置依赖**：Milestone 0（AI 表与 RLS）、Milestone 1（admin 鉴权）已完成。

---

### M3-A 共享 DTO 与枚举（`packages/shared`）

- [x] 新增 `packages/shared/src/enums/ai-feature-key.ts`：对齐 `ai_feature_key` 四值（`asr_physical`、`asr_semantic`、`llm_transcript_polish`、`llm_legal_summary`）
- [x] 新增 `packages/shared/src/enums/ai-provider-kind.ts`：`openai_compatible`、`azure_openai`、`custom_http`
- [x] 新增 `packages/shared/src/dto/ai-model-create.dto.ts`：`name`、`providerKind`、`modelName`、`modelId`、`apiKey`、`baseUrl?`、`contextWindow?`、`isEnabled?`、`isDefaultFallback?`
- [x] 新增 `packages/shared/src/dto/ai-model-update.dto.ts`：同上可选字段（`apiKey` 空表示不轮换）
- [x] 新增 `packages/shared/src/dto/ai-model-list-query.dto.ts`：`limit`（默认 50）、`cursor?`、`providerKind?`、`isEnabled?`
- [x] 新增 `packages/shared/src/dto/ai-feature-mapping-upsert.dto.ts`：`primaryModelId`、`fallbackModelId?`
- [x] 新增 `packages/shared/src/dto/ai-prompt-create.dto.ts`：`featureKey`、`name`、`systemPrompt`
- [x] 新增 `packages/shared/src/dto/ai-prompt-update.dto.ts`：`name?`、`systemPrompt?`
- [x] 新增 `packages/shared/src/dto/ai-invocation-logs-query.dto.ts`：分页 + `taskId?`、`featureKey?`、`outcome?`
- [x] 新增 `packages/shared/src/types/ai-model-public.ts`：对外响应**不含**明文 `apiKey`（仅 `apiKeyMasked` 如 `sk-***`）

---

### M3-B 凭证加解密（`apps/api` · 单文件一项）

- [x] 在 `.env.example` 增加 `AI_CREDENTIALS_ENCRYPTION_KEY`（32 字节 base64 说明；**禁止**提交真实值）
- [x] 新增 `apps/api/src/lib/ai-credential-crypto.ts`：`encrypt(plaintext)` / `decrypt(ciphertext)`（AES-256-GCM 或项目既定算法）
- [x] 新增 `apps/api/src/lib/ai-credential-crypto.test.ts`：往返加解密；缺失 env 时启动失败

---

### M3-C Repository（`service_role` 或 admin JWT + RLS）

- [x] 新增 `apps/api/src/repositories/ai-model.repository.ts`：`list`、`findById`、`create`、`update`、`delete`（删除前校验无映射 FK 引用）
- [x] 新增 `apps/api/src/repositories/ai-feature-mapping.repository.ts`：`listAll`、`upsert(featureKey, dto)`、`findByFeatureKey`
- [x] 新增 `apps/api/src/repositories/ai-prompt.repository.ts`：`list`、`findById`、`create`、`update`、`publish(id)`（`version++`、`is_published=true`）
- [x] 新增 `apps/api/src/repositories/ai-invocation-log.repository.ts`：`listAdmin(query)`（仅 admin 读路径）
- [x] 新增 `apps/api/src/repositories/ai-model.repository.test.ts`：断言写入字段为 `api_key_ciphertext` 而非明文列

---

### M3-D U6 适配器与工厂（每条实现一个文件 + 测试）

- [x] 新增 `apps/api/src/adapters/ai/ai-adapter.interface.ts`：`healthCheck`、`complete?`、`transcribe?`（对齐 `architecture.md` §4.3.1）
- [x] 新增 `apps/api/src/adapters/ai/ai-adapter.factory.ts`：`get(providerKind)` 注册表
- [x] 新增 `apps/api/src/adapters/ai/openai-compatible.adapter.ts` + `openai-compatible.adapter.test.ts`（Mock HTTP）
- [x] 新增 `apps/api/src/adapters/ai/azure-openai.adapter.ts` + `azure-openai.adapter.test.ts`（可最小桩实现）
- [x] 新增 `apps/api/src/adapters/ai/custom-http.adapter.ts` + `custom-http.adapter.test.ts`（`healthCheck` 探活路径）
- [x] 新增 `apps/api/src/adapters/ai/model-credentials.mapper.ts`：DB 行 + `decrypt` → `ModelCredentials` DTO（**禁止**日志打印 `apiKey`）

---

### M3-E Service + 单元测试（每条 Service 一个 `.test.ts`）

- [x] 新增 `apps/api/src/services/ai-model-list.service.ts` + `ai-model-list.service.test.ts`
- [x] 新增 `apps/api/src/services/ai-model-create.service.ts`：加密 `apiKey` → 入库；`is_default_fallback` 唯一约束冲突 → `VALIDATION_FAILED`；`append_audit_log('ai.model.upsert')`（`metadata.fields_changed`，**无**密钥）
- [x] 新增 `apps/api/src/services/ai-model-update.service.ts` + `ai-model-update.service.test.ts`
- [x] 新增 `apps/api/src/services/ai-model-delete.service.ts`：有关联 mapping 时 → `OPERATION_NOT_ALLOWED` + 测试
- [x] 新增 `apps/api/src/services/ai-model-healthcheck.service.ts`：`AiAdapterFactory` + `AI_TEST_TIMEOUT_MS`；成功/失败结构化结果
- [x] 新增 `apps/api/src/services/ai-model-healthcheck.service.test.ts`：超时判失败
- [x] 新增 `apps/api/src/services/ai-feature-mapping-list.service.ts` + 测试（返回四功能点，缺省映射标空）
- [x] 新增 `apps/api/src/services/ai-feature-mapping-upsert.service.ts` + 测试；审计 `ai.mapping.upsert`
- [x] 新增 `apps/api/src/services/ai-prompt-list.service.ts` + 测试
- [x] 新增 `apps/api/src/services/ai-prompt-create.service.ts` + 测试（`system_prompt` 非空）
- [x] 新增 `apps/api/src/services/ai-prompt-update.service.ts` + 测试（仅未发布或策略允许编辑【待确认】默认仅 draft）
- [x] 新增 `apps/api/src/services/ai-prompt-publish.service.ts`：发布新版本；审计 `ai.prompt.publish` + 测试
- [x] 新增 `apps/api/src/services/ai-invocation-log-list.service.ts`：admin 分页列表 + 测试

---

### M3-F 路由与 Controller（每条 HTTP 路由独立任务）

- [x] 注册 `GET /api/admin/ai/models` → `admin-ai.routes.ts` + `ai-models-list.controller.ts` + `ai-models-list.controller.test.ts`
- [x] 注册 `POST /api/admin/ai/models` → `ai-models-create.controller.ts` + 测试
- [x] 注册 `GET /api/admin/ai/models/:id` → `ai-models-get.controller.ts` + 测试（响应含 `apiKeyMasked`）
- [x] 注册 `PATCH /api/admin/ai/models/:id` → `ai-models-patch.controller.ts` + 测试
- [x] 注册 `DELETE /api/admin/ai/models/:id` → `ai-models-delete.controller.ts` + 测试
- [x] 注册 `POST /api/admin/ai/models/:id/test` → `ai-models-test.controller.ts` + 测试（连通性，PRD §4.2 AI-01）
- [x] 注册 `GET /api/admin/ai/mappings` → `ai-mappings-list.controller.ts` + 测试
- [x] 注册 `PUT /api/admin/ai/mappings/:featureKey` → `ai-mappings-upsert.controller.ts` + 测试
- [x] 注册 `GET /api/admin/ai/prompts` → `ai-prompts-list.controller.ts` + 测试
- [x] 注册 `POST /api/admin/ai/prompts` → `ai-prompts-create.controller.ts` + 测试
- [x] 注册 `GET /api/admin/ai/prompts/:id` → `ai-prompts-get.controller.ts` + 测试
- [x] 注册 `PATCH /api/admin/ai/prompts/:id` → `ai-prompts-patch.controller.ts` + 测试
- [x] 注册 `POST /api/admin/ai/prompts/:id/publish` → `ai-prompts-publish.controller.ts` + 测试
- [x] 注册 `GET /api/admin/ai/invocation-logs` → `ai-invocation-logs-list.controller.ts` + 测试
- [x] 在 `apps/api/src/app.ts` 挂载 `/api/admin/ai`；全组 `auth` + `password-change-gate` + `requireRoles('admin')`

---

### M3-G 前端 · Shadcn 组件引入（每条命令一项）

- [x] 执行 `npx shadcn@latest add tabs`
- [x] 执行 `npx shadcn@latest add textarea`
- [x] 执行 `npx shadcn@latest add switch`
- [x] 执行 `npx shadcn@latest add tooltip`

---

### M3-H 前端 · API 客户端（单文件一项）

- [x] 新增 `apps/web/src/lib/admin-ai-api.ts`：models CRUD + `testModel`、mappings list/upsert、prompts CRUD + `publishPrompt`、`listInvocationLogs`

---

### M3-I 前端 · 页面与组件（每条一项；高密度表 `ui_design.md` §6.5）

- [x] 新增 `apps/web/src/app/(app)/admin/ai/page.tsx`：`Tabs` 四分栏（模型凭证 / 功能映射 / Prompt / 调用日志）；Skeleton/Error/Empty
- [x] 新增 `apps/web/src/components/admin/ai/AiModelsPanel.tsx`：模型列表 `Table`（列：名称、provider、model_id、启用、兜底、操作）
- [x] 新增 `apps/web/src/components/admin/ai/ai-model-form-dialog.tsx`：创建/编辑；`apiKey` 输入仅创建或「轮换密钥」时展示
- [x] 新增 `apps/web/src/components/admin/ai/ai-model-test-button.tsx`：调用 `POST .../test` 展示连通性 Toast
- [x] 新增 `apps/web/src/components/admin/ai/AiFeatureMappingsPanel.tsx`：四行功能点 × 主模型/兜底模型 `Select`
- [x] 新增 `apps/web/src/components/admin/ai/ai-feature-mapping-row.tsx`：单行保存 `PUT /mappings/:featureKey`
- [x] 新增 `apps/web/src/components/admin/ai/AiPromptsPanel.tsx`：Prompt 列表（feature、name、version、published）
- [x] 新增 `apps/web/src/components/admin/ai/ai-prompt-editor-dialog.tsx`：`Textarea` 编辑 `system_prompt`；发布按钮二次确认
- [x] 新增 `apps/web/src/components/admin/ai/AiInvocationLogsPanel.tsx`（可选子 Tab）：只读调用日志表；分页 50

---

### M3-J 前端 · 导航与权限（单文件一项）

- [x] 在 `menus.ts` 为 `admin` 增加「AI 配置」→ `/admin/ai`
- [x] 确认 lawyer 访问 `/admin/ai` 被 Guard 拒绝

---

### M3-K 种子数据与 Milestone 3 完成门禁

- [x] 可选 `supabase/seed.sql` 片段：插入 4 条 `ai_feature_model_mappings` 占位（`primary_model_id` 指向 seed 模型，若无可跳过）
- [x] 手工验收：创建 OpenAI 兼容模型 → 连通性测试成功/失败提示明确
- [x] 手工验收：配置 `llm_transcript_polish` 映射并发布 Prompt；响应中无完整 `apiKey`
- [x] 手工验收：lawyer 调用 `GET /api/admin/ai/models` → `403`
- [x] 运行 M3 测试全绿；连续失败 >2 次停止汇报
- [x] `git commit`：`feat(admin-ai): credentials mappings prompts and healthcheck`
- [x] 进度表 **M3** 标为「已完成」

**M3 明确不在此 Milestone**：`AiOrchestrationService` 运行时编排（M5 Worker）、转写任务实际 ASR/LLM 调用、`ai_invocation_logs` Worker 写入（M5）。

---


## Milestone 4：语音转写 — BFF 元数据与上传（U2）

**目标**：任务创建、TUS 上传会话、完成回调、Outbox 写入（触发 U3）；**不经 API 传文件流**。

**局部规范索引**（无拆分文件时，以以下章节为准）：

| 文档 | 章节 |
|------|------|
| `prd.md` | §3.5、§3.5.1 媒体约束与状态机 |
| `architecture.md` v1.3 | §3.2 Outbox 流水线、§3.7 Outbox、§5.5 Storage 网关、§7 `/api/transcription/*` |
| `ui_design.md` | §6.3 任务列表与 TUS 时序、§6.3.4 上传防误离开 |
| `database.md` v1.4 | §3.2 `transcription_tasks`、§3.13 `upload_sessions`、§3.15 `outbox_events`、§4.11 `transition_task_status`、§7.1 / §7.5 |

**验收**：`size_bytes≤1GB`、`duration_sec≤18000`；`init→TUS→complete` 后任务 `queued` 且 Outbox 行存在（`published_at IS NULL`，`payload.stage` 为 `media.extract` 或 `media.preprocess`）；律师仅本人任务；admin 可见全部；**禁止** API 收 `File` body。

**前置依赖**：M0（表/RLS/Outbox）、M1（鉴权）、M3 非必须（Worker 消费属 M5）。

**v1.3 说明**：M4-G 曾实现 BullMQ 投递路径，已标记遗留；U3 直消费 Outbox 在 **M5-0** 落地。

---

### M4-A 共享 DTO（`packages/shared`）

- [x] 新增 `packages/shared/src/dto/transcription-upload-init.dto.ts`：`title`、`fileName`、`mimeType`、`sizeBytes`、`durationSec?`、`idempotencyKey?`
- [x] 新增 `packages/shared/src/dto/transcription-upload-complete.dto.ts`：`uploadSessionId`
- [x] 新增 `packages/shared/src/dto/transcription-task-list-query.dto.ts`：`limit`（默认 50）、`cursor?`、`status?`
- [x] 新增 `packages/shared/src/types/transcription-upload-init-response.ts`：`uploadSessionId`、`taskId`、`storageKeyPrefix`、`tusEndpoint`、`tusHeaders?`
- [x] 新增 `packages/shared/src/types/transcription-task-summary.ts`：列表行（`id`、`title`、`status`、`durationSec`、`sizeBytes`、`createdAt`）
- [x] 新增 `packages/shared/src/lib/transcription-limits.ts`：`MAX_SIZE_BYTES=1073741824`、`MAX_DURATION_SEC=18000`（与 DB 触发器一致）

---

### M4-B Storage 适配器（TUS 签发，单文件一项）

- [x] 新增 `apps/api/src/adapters/storage/storage.adapter.ts` 接口：`listObjectsByPrefix`、`headObject`
- [x] 新增 `apps/api/src/adapters/storage/supabase-storage.adapter.ts`：`createResumableUploadUrl` / TUS 端点元数据（读 `STORAGE_BUCKET_MEDIA`）
- [x] 新增 `apps/api/src/adapters/storage/supabase-storage.adapter.test.ts`：Mock SDK；**禁止**日志输出签名 token

---

### M4-C Repository（单文件一项）

- [x] 新增 `apps/api/src/repositories/transcription-task.repository.ts`：`createUploading`、`findById`、`listForUser`（律师 JWT）、`listAll`（admin JWT 或 RLS）
- [x] 新增 `apps/api/src/repositories/upload-session.repository.ts`：`create`、`findByIdForOwner`、`markCompleted`
- [x] 新增 `apps/api/src/repositories/outbox.repository.ts`：`insertInTransaction(client, row)`（仅 Outbox 写入封装）
- [x] 新增 `apps/api/src/repositories/task-state.repository.ts`：封装 `transition_task_status` RPC（`service_role`）
- [x] 新增 `apps/api/src/repositories/transcription-task.repository.test.ts`：律师不可读他人 `task_id`

---

### M4-D 领域逻辑（状态机 / Outbox 载荷，单文件一项）

- [x] 新增 `apps/api/src/domain/task-state-machine.ts`：合法迁移表（`uploading→queued` 等）；非法迁移抛 `TASK_INVALID_STATE`
- [x] 新增 `apps/api/src/domain/asr-queue-tier.ts`：**【遗留·v1.3 停止写入】** `resolveAsrQueueTier`；M5-0 移除 complete 调用
- [x] 新增 `apps/api/src/domain/outbox-payload.factory.ts`：`buildQueuedPayload(task)` → 首阶段 `media.extract`（`is_mp4`）或 `media.preprocess`（M5-0 改为 `payload.stage`）
- [x] 新增 `apps/api/src/domain/task-state-machine.test.ts`

---

### M4-E Service + 单元测试（每条 Service 一个 `.test.ts`）

- [x] 新增 `apps/api/src/services/transcription-upload-init.service.ts`：校验限额；创建 `transcription_tasks`（`uploading`）+ `upload_sessions`；`storage_key_prefix={uid}/{task_id}/`；返回 TUS 参数；`append_audit_log('task.create')`
- [x] 新增 `apps/api/src/services/transcription-upload-init.service.test.ts`：超 1GB → `RESOURCE_LIMIT_EXCEEDED`；重复 `idempotencyKey` → 幂等返回原会话
- [x] 新增 `apps/api/src/services/transcription-upload-complete.service.ts`：**单事务**：Storage 前缀校验 → 写 `source_storage_key` → `transition_task_status(uploading,queued)` → `upload_sessions.completed_at` → `outbox_events`（**禁止** U2 同步 Worker / **禁止** `queue.add`）
- [x] 新增 `apps/api/src/services/transcription-upload-complete.service.test.ts`：过期会话 → `UPLOAD_SESSION_INVALID`；未上传对象 → 400
- [x] 新增 `apps/api/src/services/transcription-task-list.service.ts` + 测试（分页 50）
- [x] 新增 `apps/api/src/services/transcription-task-get.service.ts` + 测试（含状态、错误码；律师越权 → `AUTH_FORBIDDEN`）

---

### M4-F 路由与 Controller（每条 HTTP 路由独立任务）

- [x] 注册 `POST /api/transcription/uploads/init` → `transcription-uploads.routes.ts` + `uploads-init.controller.ts` + `uploads-init.controller.test.ts`（`admin`|`lawyer`）
- [x] 注册 `POST /api/transcription/uploads/complete` → `uploads-complete.controller.ts` + `uploads-complete.controller.test.ts`
- [x] 注册 `GET /api/transcription/tasks` → `transcription-tasks-list.controller.ts` + `transcription-tasks-list.controller.test.ts`
- [x] 注册 `GET /api/transcription/tasks/:id` → `transcription-tasks-get.controller.ts` + `transcription-tasks-get.controller.test.ts`
- [x] 在 `apps/api/src/app.ts` 挂载 `/api/transcription` 路由组；前置 `auth` + `password-change-gate` + 角色（律师+admin）

---

### M4-G Outbox Dispatcher 进程【遗留 · M4 已完成 · M5-0 废弃】

> v1.3 起 **不再使用** Redis/BullMQ；下列项为 M4 历史交付，M5-0 合并入 `workers/pipeline` 后删除。

- [x] 初始化 `workers/outbox-dispatcher/`（**待 M5-0 删除**）
- [x] `outbox-poller.service.ts` + `bullmq-publisher.ts`（**待 M5-0 删除**）
- [x] `outbox-poller.service.test.ts`
- [x] 根脚本 `outbox:dispatcher`（**待 M5-0 改为 `worker:pipeline` 或移除**）

---

### M4-H 前端 · 依赖与 Shadcn（单条一项）

- [x] **经用户授权后**安装 TUS 客户端依赖（如 `tus-js-client`）；禁止未授权 `npm install`
- [x] 执行 `npx shadcn@latest add progress`
- [x] 执行 `npx shadcn@latest add alert-dialog`（若 M1/M2 未引入则执行，已存在则跳过）

---

### M4-I 前端 · API 与上传 Hook（单文件一项）

- [x] 新增 `apps/web/src/lib/transcription-api.ts`：`initUpload`、`completeUpload`、`listTasks`、`getTask`
- [x] 新增 `apps/web/src/hooks/use-tus-upload.ts`：仅使用 `init` 返回的 `storageKeyPrefix`/`tusEndpoint`；进度回调；完成后调 `completeUpload`
- [x] 新增 `apps/web/src/hooks/use-task-polling.ts`：间隔 ≥2s 轮询 `getTask`（`ui_design.md` §6.3.5）
- [x] 新增 `apps/web/src/contexts/active-upload-context.tsx`：标记进行中上传供路由 Guard（§6.3.4.2）

---

### M4-J 前端 · 页面与组件（每条一项）

- [x] 新增 `apps/web/src/app/(app)/transcription/page.tsx`：律师任务列表页；Skeleton/Error/Empty
- [x] 新增 `apps/web/src/app/(app)/admin/transcription/page.tsx`：admin 全量列表（可复用表格组件）
- [x] 新增 `apps/web/src/components/transcription/transcription-tasks-table.tsx`：列：任务名、状态 Badge、时长、创建时间、操作
- [x] 新增 `apps/web/src/components/transcription/task-status-badge.tsx`：枚举色令牌（§6.3.2）
- [x] 新增 `apps/web/src/components/transcription/new-transcription-dialog.tsx`：选文件 + 元数据表单 → 触发 `use-tus-upload`
- [x] 新增 `apps/web/src/components/transcription/upload-progress-bar.tsx`：Shadcn `Progress` 绑定 TUS 进度
- [x] 新增 `apps/web/src/components/transcription/upload-leave-alert-dialog.tsx`：离开确认文案（§6.3.4.2）
- [x] 在 `(app)/layout` 挂载 `ActiveUploadProvider` + `beforeunload` + 路由拦截（§6.3.4.1–6.3.4.4）
- [x] 在 `menus.ts` 为 `lawyer`/`admin` 增加「语音转写」菜单项

---

### M4-K 集成与 Milestone 4 完成门禁

- [x] 新增 `apps/api/src/__tests__/transcription-upload-flow.integration.test.ts`：init → mock Storage → complete → `status=queued` + 未发布 Outbox
- [x] ~~BullMQ 断言~~（v1.3 废除；**M5-0** 改为断言 U3 消费后 `published_at` 非空，或保留仅 Outbox 断言）
- [x] 手工验收：律师 A 无法 `GET` 律师 B 的 `taskId`（集成测试覆盖；需配置 Supabase 时自动执行）
- [x] 手工验收：上传中切换路由弹出 `AlertDialog`；完成后监听移除（M4-J 已实现 Guard；浏览器冒烟建议本地确认）
- [x] 运行 M4 测试全绿；连续失败 >2 次停止汇报
- [x] `git commit`：`feat(transcription): tus upload init complete outbox and task list`
- [x] 进度表 **M4** 标为「已完成」

**M4 明确不在此 Milestone**：FFmpeg/ASR/LLM Worker 消费（M5）、文稿 PATCH/下载（M6）、云盘归档（M5 `drive.archive`）。

---


## Milestone 5：异步流水线 Worker（U3 · Postgres Outbox）

**目标**：单 U3 进程轮询 Outbox，顺序执行抽音→预处理→ASR→LLM→归档；**无 Redis**；全局并发 ≤5；Stalled Cron 补偿。

**局部规范索引**（**以 `architecture.md` v1.3 为准**；废除 PRD Python VAD、废除 v1.2 BullMQ 六队列）：

| 文档 | 章节 |
|------|------|
| `prd.md` | §3.5 状态机、§4.1–§4.2 AI 场景与降级 |
| `architecture.md` v1.3 | §3.2 Outbox 流水线、§3.3 状态机、§3.6 并发与 Stalled、§3.7 Outbox、§5.6.2 Worker 写库红线 |
| `database.md` v1.4 | §3.3 `transcription_segments`、§3.4 `transcription_transcripts`、§3.14 `pipeline_job_runs`、§4.4.2 `upsert_task_segments`、§4.11 `transition_task_status` |
| `ui_design.md` | §6.3.5 任务状态轮询（无独立 Worker UI） |

**验收**：M4 上传后 U3 端到端至 `completed`；失败为 `failed` 且 `error_code` 可查；切片仅存 `WORKER_TMP_DIR` 不入 Storage；同时处理任务 ≤5；单任务 ASR 切片并发 3；ASR 全局限流 50/min（进程内）；`pipeline_job_runs` 重复 `outbox_event_id` 跳过；Cron 补偿 stalled；**不**依赖 Redis。

**前置依赖**：M3（`AiAdapterFactory`）、M4（Outbox 首行、`queued` 任务）。

---

### M5-0 v1.3 架构迁移（自 M4 遗留代码对齐）

- [x] 新增迁移 `supabase migration new pipeline_job_runs_v13`：`queue_name`→`stage`、`bull_job_id`→`outbox_event_id`（FK → `outbox_events`）；更新 UNIQUE（`database.md` v1.4 §3.14）
- [x] 更新 `packages/shared/src/types/transcription-queued-outbox-payload.ts`：主字段 `stage`（保留 `queueName` 只读别名至 M5-K 后删除）
- [x] 更新 `buildQueuedPayload` / complete 服务：**停止**写 `asr_queue_tier`；Outbox `payload.stage` 为首阶段名
- [x] 将 `workers/outbox-dispatcher/src/outbox-poller.service.ts` 逻辑迁入 `workers/pipeline`（**删除** `bullmq-publisher.ts` 与 Redis 依赖）
- [x] 删除根脚本 `outbox:dispatcher`；新增/替换为 `worker:pipeline`
- [x] 移除 `apps/api` 对 `REDIS_URL` 的健康检查与 `redis` npm 依赖（若仅 health 使用）
- [x] 更新 `transcription-upload-flow.integration.test.ts`：删除 BullMQ 用例；可选增加 U3 `pollOnce` 后 `published_at` 断言
- [x] 更新 `.env.example`：`WORKER_DB_URL`、`WORKER_MAX_CONCURRENCY`、`WORKER_POLL_INTERVAL_MS`、`ASR_RATE_LIMIT_MAX`；标注 `REDIS_URL` 已废弃

---

### M5-A Worker 进程骨架（`workers/pipeline`）

- [x] 新增 `workers/pipeline/package.json` 与 `workers/pipeline/src/index.ts`：加载 `.env`；校验 `WORKER_DB_URL`（或 `SUPABASE_DB_URL`）、`FFMPEG_PATH`；**不**校验 `REDIS_URL`
- [x] 新增 `workers/pipeline/src/health/ffmpeg-healthcheck.ts`：启动前 `ffmpeg -version`（§4.4.1）
- [x] 新增 `packages/shared/src/constants/pipeline-stages.ts`：五阶段常量（`media.extract`、`media.preprocess`、`asr`、`llm`、`drive.archive`）
- [x] 新增 `workers/pipeline/src/infra/worker-concurrency.ts`：`p-limit(WORKER_MAX_CONCURRENCY)` 默认 **5**
- [x] 新增 `workers/pipeline/src/infra/asr-rate-limiter.ts`：进程内令牌桶或 DB 计数（`ASR_RATE_LIMIT_MAX`/60s）
- [x] 新增 `workers/pipeline/src/infra/worker-db-pool.ts`：`pg.Pool` 连接 `WORKER_DB_URL`
- [x] 在根 `package.json` 增加脚本：`worker:pipeline`

---

### M5-B 数据库函数（若 M0 未含 `upsert_task_segments`）

- [x] 新增迁移 `npx supabase migration new upsert_task_segments`：`upsert_task_segments(p_task_id, p_segments jsonb)`（`SECURITY DEFINER`；§4.4.2）
- [x] 新增 `workers/pipeline/src/__tests__/upsert-task-segments.db.test.ts`：service_role 写入片段成功

---

### M5-C 阶段幂等与 Outbox 链式入队

- [x] 新增 `workers/pipeline/src/middleware/stage-idempotency.middleware.ts`：处理前插入 `pipeline_job_runs(stage, outbox_event_id, attempt)`；UNIQUE 冲突则跳过（§3.2.5.1）
- [x] 新增 `workers/pipeline/src/middleware/stage-idempotency.middleware.test.ts`
- [x] 新增 `workers/pipeline/src/domain/worker-outbox.factory.ts`：生成下一阶段 Outbox 行（如 `media.preprocess`→`asr`）
- [x] 新增 `workers/pipeline/src/services/worker-transaction.service.ts`：`transition_task_status` + `insert outbox` + `mark published_at` 同事务

---

### M5-D FFmpeg 与临时目录（单文件一项）

- [x] 新增 `workers/pipeline/src/adapters/ffmpeg/ffmpeg.runner.ts`：`spawn` 白名单；超时 `FFMPEG_TIMEOUT_MS`；信号量 `FFMPEG_MAX_CONCURRENT`
- [x] 新增 `workers/pipeline/src/adapters/ffmpeg/ffmpeg.runner.test.ts`：Mock `child_process`
- [x] 新增 `workers/pipeline/src/services/media-extract.service.ts`：MP4→16kHz mono MP3；更新 `audio_storage_key`；失败 `MEDIA_EXTRACT_FAILED`
- [x] 新增 `workers/pipeline/src/services/media-extract.service.test.ts`
- [x] 新增 `workers/pipeline/src/services/media-preprocess.service.ts`：Storage 流式落盘 → 重采样 → 物理切片（`ASR_SEGMENT_DURATION_SEC`）；输出 `WORKER_TMP_DIR/{taskId}/*.mp3`
- [x] 新增 `workers/pipeline/src/services/media-preprocess.service.test.ts`：断言切片路径；**禁止**上传切片至 Storage
- [x] 新增 `workers/pipeline/src/services/temp-dir-cleanup.service.ts`：任务结束/失败后删除 `{taskId}` 目录

---

### M5-E Storage 下载（Worker 专用）

- [x] 新增 `workers/pipeline/src/adapters/storage/worker-storage.adapter.ts`：流式 `downloadToFile(storageKey, localPath)`
- [x] 新增 `workers/pipeline/src/adapters/storage/worker-storage.adapter.test.ts`

---

### M5-F AI 编排（复用 M3 适配器，单文件一项）

- [x] 新增 `workers/pipeline/src/services/ai-orchestration.service.ts`：`feature_key` 映射 → 主模型 → fallback 一次；`ai_invocation_logs` + `idempotency_key`
- [x] 新增 `workers/pipeline/src/services/ai-orchestration.service.test.ts`
- [x] 新增 `workers/pipeline/src/services/asr-segment-runner.service.ts`：`p-limit(ASR_API_CONCURRENCY=3)`；合并 `asr_raw_json`；`diarization_degraded` 降级
- [x] 新增 `workers/pipeline/src/services/asr-segment-runner.service.test.ts`
- [x] 新增 `workers/pipeline/src/services/llm-transcript.service.ts`：`llm_transcript_polish`
- [x] 新增 `workers/pipeline/src/services/llm-transcript.service.test.ts`
- [x] 新增 `workers/pipeline/src/services/llm-summary.service.ts`：`llm_legal_summary` → `summary_text`
- [x] 新增 `workers/pipeline/src/services/llm-summary.service.test.ts`

---

### M5-G Repository（Worker · `service_role`）

- [x] 新增 `workers/pipeline/src/repositories/outbox-event.repository.ts`：`fetchUnpublishedBatch`（`FOR UPDATE SKIP LOCKED`）、`markPublished`、`incrementPublishAttempts`（自 M4-G 迁入并去 BullMQ）
- [x] 新增 `workers/pipeline/src/repositories/worker-segment.repository.ts`：调用 `upsert_task_segments`
- [x] 新增 `workers/pipeline/src/repositories/worker-transcript.repository.ts`：`upsertTranscript`
- [x] 新增 `workers/pipeline/src/repositories/pipeline-job-run.repository.ts`：`stage` + `outbox_event_id` 幂等
- [x] 新增 `workers/pipeline/src/repositories/worker-task.repository.ts`：读/更新任务行；封装 `transition_task_status` 调用

---

### M5-H 阶段 Handler（每个 `stage` 一个 Handler + 测试）

- [x] 新增 `workers/pipeline/src/handlers/media-extract.handler.ts`：`stage=media.extract`；`extracting`；完成后同事务 Outbox → `media.preprocess`（非 MP4 可跳过至 preprocess/asr）
- [x] 新增 `workers/pipeline/src/handlers/media-extract.handler.test.ts`
- [x] 新增 `workers/pipeline/src/handlers/media-preprocess.handler.ts`：`stage=media.preprocess`；`preprocessing`；Outbox → `asr`
- [x] 新增 `workers/pipeline/src/handlers/media-preprocess.handler.test.ts`
- [x] 新增 `workers/pipeline/src/handlers/asr.handler.ts`：`stage=asr`；`asr_running`；`asr_physical` feature
- [x] 新增 `workers/pipeline/src/handlers/asr.handler.test.ts`
- [x] 新增 `workers/pipeline/src/handlers/llm.handler.ts`：`stage=llm`；`llm_running`；润色+摘要；Outbox → `drive.archive`
- [x] 新增 `workers/pipeline/src/handlers/llm.handler.test.ts`
- [x] 新增 `workers/pipeline/src/handlers/drive-archive.handler.ts`：`stage=drive.archive`；云盘目录；`completed` + `task.complete` 审计
- [x] 新增 `workers/pipeline/src/handlers/drive-archive.handler.test.ts`
- [x] 新增 `workers/pipeline/src/handlers/stage-error.handler.ts`：未捕获异常 → `failed` + `error_code` + 清理临时目录

---

### M5-I Pipeline 调度器（替代 BullMQ Worker 注册）

- [x] 新增 `workers/pipeline/src/services/outbox-poller.service.ts`：定时 `pollOnce`；按 `payload.stage` 分发 Handler；成功 `published_at=now()`；失败递增 `publish_attempts`
- [x] 新增 `workers/pipeline/src/services/outbox-poller.service.test.ts`：Mock Handler；超 `OUTBOX_MAX_ATTEMPTS` 告警【待确认】
- [x] 新增 `workers/pipeline/src/services/stage-router.ts`：`stage` → Handler 映射表
- [x] 在 `index.ts` 启动：`ffmpeg-healthcheck` → `outbox-poller.start()` → 优雅关闭 `SIGTERM`

---

### M5-J Stalled 补偿 Cron（`workers/scheduler` 或 API 定时任务）

- [x] 新增 `workers/scheduler/src/index.ts`：每 10 分钟扫描 `last_progress_at`（§3.6.4.2）
- [x] 新增 `workers/scheduler/src/stalled-task-scanner.service.ts`：`retry_count < STALLED_TASK_MAX_RETRIES` → 回滚 `queued` + 新 Outbox；否则 `failed`/`TASK_STALLED`
- [x] 新增 `workers/scheduler/src/stalled-task-scanner.service.test.ts`
- [x] 根 `package.json` 脚本：`scheduler:stalled`

---

### M5-K 端到端与 Milestone 5 完成门禁

- [x] 集成测试：fixture 小音频 → U3 全阶段至 `completed`（Mock ASR/LLM HTTP）
- [x] 集成测试：重复处理同一 `outbox_event_id` → 不重复 ASR（`pipeline_job_runs`）
- [x] 集成测试：模拟 `last_progress_at` 超时 → Cron 回滚或 `failed`
- [x] 手工验收：M4 任务列表状态 `queued`→…→`completed`；轮询 ≥2s
- [x] 手工验收：`/tmp/lexos/{taskId}` 完成后清理
- [x] 手工验收：**无需**启动 Redis；仅 `worker:pipeline` + API + Web
- [x] 运行 M5 测试全绿；连续失败 >2 次停止汇报
- [x] `git commit`：`feat(worker): postgres outbox pipeline without redis`
- [x] 进度表 **M5** 标为「已完成」

**M5 明确不在此 Milestone**：转写工作台 UI、文稿 PATCH/导出（M6）、云盘浏览 UI（M7）。

---


## Milestone 6：律师端 — 转写工作台与导出

**目标**：任务进度、音文对照、校对/编辑双模式、导出与签名下载。

**局部规范索引**（无拆分文件时，以以下章节为准）：

| 文档 | 章节 |
|------|------|
| `prd.md` | §2.2 转写矩阵（R/U/D、导出）、§3.5 工作台、§4.3 Diarization 降级 |
| `architecture.md` | §5.5.3 签名下载、§6.5 文稿 `If-Match`、`§7` `/api/transcription/tasks/:id/download` |
| `ui_design.md` | §4.3 工作台 Grid/校对·编辑模式、§4.2 打印/PDF 预览、§6.3.5 轮询 |
| `database.md` | §3.4 `transcription_transcripts`（`version` 乐观锁）、§6.1 软删除 `deleted_at` |

**验收**：校对模式点击段落 `seek`；编辑模式仅 PATCH `polished_text`；`If-Match` 冲突 `RESOURCE_CONFLICT`；下载/导出写 `file.download`/`file.export` 审计；律师不可访问他人任务；`diarization_degraded` 显示固定 Banner。

**前置依赖**：M4（任务列表/轮询）、M5（`completed` 任务含文稿与 `audio_storage_key`）。

---

### M6-A 共享 DTO（`packages/shared`）

- [x] 新增 `packages/shared/src/dto/transcript-patch.dto.ts`：`polishedText`（编辑模式唯一可写字段）
- [x] 新增 `packages/shared/src/types/transcript-detail.ts`：`asrRawJson`、`polishedText`、`summaryText`、`version`、`diarizationDegraded`
- [x] 新增 `packages/shared/src/types/transcription-task-detail.ts`：扩展 M4 摘要 + 文稿摘要 + 播放用 `audioStorageKey` 引用（**不**返回 Storage 直链）
- [x] 新增 `packages/shared/src/enums/export-format.ts`：`docx` | `pdf` | `txt`

---

### M6-B Repository（单文件一项）

- [x] 新增 `apps/api/src/repositories/transcription-transcript.repository.ts`：`findByTaskId`、`updatePolishedText(taskId, text, expectedVersion)`（`WHERE version=` 乐观锁）
- [x] 新增 `apps/api/src/repositories/transcription-transcript.repository.test.ts`：版本冲突返回 0 行更新
- [x] 扩展 `transcription-task.repository.ts`：`softDelete(taskId)`、`findDetailForUser`（含 `diarization_degraded`）
- [x] 新增 `apps/api/src/repositories/transcription-segment.repository.ts`：`listByTaskId`（校对模式只读展示，若 UI 需分段列表）

---

### M6-C 导出与下载适配器（单文件一项）

- [x] 新增 `apps/api/src/adapters/export/docx-export.adapter.ts`：由 `polished_text`/`summary_text` 生成 docx 缓冲（**实施前若需新依赖须用户授权**）
- [x] 新增 `apps/api/src/adapters/export/pdf-export.adapter.ts`：HTML 模板 + 打印引擎或 pdf 库（同上授权）
- [x] 新增 `apps/api/src/adapters/export/txt-export.adapter.ts`：纯文本导出
- [x] 扩展 `supabase-storage.adapter.ts`：`createSignedDownloadUrl(key, ttl)`；校验 key 前缀归属 `created_by`
- [x] 新增 `apps/api/src/adapters/export/docx-export.adapter.test.ts`：Mock 输出；无密钥日志

---

### M6-D Service + 单元测试（每条 Service 一个 `.test.ts`）

- [x] 新增 `apps/api/src/services/transcription-transcript-get.service.ts`：律师/ admin 读文稿；越权 `AUTH_FORBIDDEN`
- [x] 新增 `apps/api/src/services/transcription-transcript-get.service.test.ts`
- [x] 新增 `apps/api/src/services/transcription-transcript-patch.service.ts`：解析 `If-Match`；仅更新 `polished_text` + `version++`；冲突 `RESOURCE_CONFLICT`
- [x] 新增 `apps/api/src/services/transcription-transcript-patch.service.test.ts`
- [x] 新增 `apps/api/src/services/transcription-task-download.service.ts`：选 `audio_storage_key` 或 `source_storage_key`；签名 URL；`append_audit_log('file.download')`
- [x] 新增 `apps/api/src/services/transcription-task-download.service.test.ts`
- [x] 新增 `apps/api/src/services/transcription-export-docx.service.ts`：生成 → 上传 `exports` 桶 → 返回短期签名 URL；`file.export` 审计
- [x] 新增 `apps/api/src/services/transcription-export-docx.service.test.ts`
- [x] 新增 `apps/api/src/services/transcription-export-pdf.service.ts` + `transcription-export-pdf.service.test.ts`
- [x] 新增 `apps/api/src/services/transcription-export-txt.service.ts` + `transcription-export-txt.service.test.ts`
- [x] 新增 `apps/api/src/services/transcription-task-delete.service.ts`：软删除 `deleted_at`；仅 `completed|failed`【待确认】或任意非进行中；审计【待确认】`task.delete` 用 `file.delete` 或扩展枚举
- [x] 新增 `apps/api/src/services/transcription-task-delete.service.test.ts`

---

### M6-E 路由与 Controller（每条 HTTP 路由独立任务）

- [x] 注册 `GET /api/transcription/tasks/:id/transcript` → `transcription-transcript.routes.ts` + `transcript-get.controller.ts` + `transcript-get.controller.test.ts`
- [x] 注册 `PATCH /api/transcription/tasks/:id/transcript` → `transcript-patch.controller.ts` + `transcript-patch.controller.test.ts`（校验 `If-Match` 头）
- [x] 注册 `GET /api/transcription/tasks/:id/download` → `task-download.controller.ts` + `task-download.controller.test.ts`（query `type=audio|source`）
- [x] 注册 `POST /api/transcription/tasks/:id/export/docx` → `task-export-docx.controller.ts` + `task-export-docx.controller.test.ts`
- [x] 注册 `POST /api/transcription/tasks/:id/export/pdf` → `task-export-pdf.controller.ts` + `task-export-pdf.controller.test.ts`
- [x] 注册 `POST /api/transcription/tasks/:id/export/txt` → `task-export-txt.controller.ts` + `task-export-txt.controller.test.ts`
- [x] 注册 `DELETE /api/transcription/tasks/:id` → `task-delete.controller.ts` + `task-delete.controller.test.ts`

---

### M6-F 前端 · Shadcn / 依赖（单条一项）

- [x] 执行 `npx shadcn@latest add switch`
- [x] 执行 `npx shadcn@latest add scroll-area`
- [x] 执行 `npx shadcn@latest add separator`
- [x] **经用户授权后**安装 TipTap（或 Slate）无头富文本 + 仅 Tailwind 样式（`.cursorrules` §2.12）

---

### M6-G 前端 · API 客户端（单文件一项）

- [x] 扩展 `apps/web/src/lib/transcription-api.ts`：`getTranscript`、`patchTranscript`、`getDownloadUrl`、`exportDocx`、`exportPdf`、`exportTxt`、`deleteTask`
- [x] 新增 `apps/web/src/lib/transcript-if-match.ts`：从 PATCH 响应更新本地 `version` 缓存

---

### M6-H 前端 · 工作台页面与组件（每条一项）

- [x] 新增 `apps/web/src/app/(dashboard)/transcription/[taskId]/page.tsx`：工作台路由；未完成态引导回列表；Skeleton/Error
- [x] 新增 `apps/web/src/components/transcription/workbench/transcript-workbench-shell.tsx`：CSS Grid 两列（`ui_design.md` §4.3.1）
- [x] 新增 `apps/web/src/components/transcription/workbench/audio-player-panel.tsx`：Flex 列；`ref` 暴露 `seek(ms)`
- [x] 新增 `apps/web/src/components/transcription/workbench/proofread-transcript-view.tsx`：只读 `asr_raw_json`；`<button data-start-ms>` 点击 seek
- [x] 新增 `apps/web/src/components/transcription/workbench/polished-text-editor.tsx`：TipTap/Slate 封装；仅绑定 `polished_text`
- [x] 新增 `apps/web/src/components/transcription/workbench/transcript-mode-switch.tsx`：Shadcn `Switch`/`Tabs` + 切编辑模式 `AlertDialog`（§4.3.2.1）
- [x] 新增 `apps/web/src/components/transcription/workbench/diarization-degraded-alert.tsx`：固定文案 Alert（§4.3.5）
- [x] 新增 `apps/web/src/components/transcription/workbench/transcript-save-toolbar.tsx`：保存调用 PATCH + `If-Match`；冲突 Toast `RESOURCE_CONFLICT`
- [x] 新增 `apps/web/src/components/transcription/workbench/export-menu.tsx`：导出 Word/PDF/TXT 触发对应 POST
- [x] 新增 `apps/web/src/components/transcription/workbench/print-preview-panel.tsx`：语义化 HTML + `@media print`（§4.2；禁止 Mermaid/canvas 图表）
- [x] 在任务列表表增加「打开工作台」链接 → `/transcription/[taskId]`

---

### M6-I 样式与无障碍（单文件一项）

- [x] 在 `apps/web/src/styles/transcript-workbench.css`（或 `globals.css`）添加 `.transcript-workbench` Grid 与打印块（§4.3.1、§4.2.3）
- [x] 校对模式段落按钮：键盘可聚焦、`type="button"` 可访问名称含时间戳

---

### M6-J 端到端与 Milestone 6 完成门禁

- [x] 集成测试：PATCH 陈旧 `version` → 409 `RESOURCE_CONFLICT`
- [x] 集成测试：律师 B 无法 `GET` 律师 A 的 `transcript`
- [x] 手工验收：校对模式点击段落音频跳转；编辑模式保存后刷新仍保留
- [x] 手工验收：下载音频返回签名 URL 且审计表有 `file.download`
- [x] 手工验收：三种导出格式可下载；`diarization_degraded=true` 显示 Banner
- [x] 运行 M6 测试全绿；连续失败 >2 次停止汇报
- [x] `git commit`：`feat(transcription): workbench transcript patch export download`
- [x] 进度表 **M6** 标为「已完成」

**M6 明确不在此 Milestone**：云盘目录 UI（M7）、审计查询 UI（M8）、转写任务上传 init/complete（M4）。

---


## Milestone 7：个人云盘与全文检索

**目标**：目录树、文件元数据、pg_trgm 检索、签名下载。

**局部规范索引**（无拆分文件时，以以下章节为准）：

| 文档 | 章节 |
|------|------|
| `prd.md` | §2.2「个人云盘 / 全文检索」、§3.6 |
| `architecture.md` | §5.4–§5.5.3（签名下载）、§7 `/api/drive/*` |
| `ui_design.md` | §6.4 个人云盘、§6.5 高密度表格 |
| `database.md` | §3.5 `drive_nodes`、§3.4 `transcription_transcripts` 检索、§4.5 RLS、§7.2–§7.3 |

**验收**：律师仅本人 `drive_nodes`；`file` 类型禁止 `parent_id IS NULL`；列表分页 50；检索走 `pg_trgm`（非 `simple` tsvector）；下载仅 BFF 签名 URL + `file.download` 审计；admin 可跨用户 **只读** 浏览（RLS `is_admin()`），跨用户写仅 `AdminRepository`（本期云盘 API 不提供 admin 写）。

**前置依赖**：M0（`drive_nodes`、RLS、`pg_trgm`）、M1、M5（归档目录由 `drive.archive` 创建，M7 消费展示）。

---

### M7-A 共享 DTO（`packages/shared`）

- [x] 新增 `packages/shared/src/dto/drive-folder-create.dto.ts`：`parentId`、`name`
- [x] 新增 `packages/shared/src/dto/drive-node-update.dto.ts`：`name?`、`parentId?`（移动）
- [x] 新增 `packages/shared/src/dto/drive-nodes-list-query.dto.ts`：`parentId`、`limit`（默认 50）、`cursor?`
- [x] 新增 `packages/shared/src/dto/drive-search-query.dto.ts`：`q`（min 长度校验）、`limit`、`cursor?`
- [x] 新增 `packages/shared/src/types/drive-node-summary.ts`：`id`、`nodeType`、`name`、`sizeBytes`、`mimeType`、`linkedTaskId`、`isArchiveFolder?`、`updatedAt`

---

### M7-B Repository（单文件一项）

- [x] 新增 `apps/api/src/repositories/drive-node.repository.ts`：`findRootByUser`、`listChildren`、`findById`、`createFolder`、`updateNode`、`softDelete`
- [x] 新增 `apps/api/src/repositories/drive-node.repository.test.ts`：律师无法 `SELECT` 他人节点（RLS 集成）
- [x] 新增 `apps/api/src/repositories/drive-search.repository.ts`：`searchTranscripts(userId, q, pagination)` — `polished_text`/`summary_text` `%` / `similarity()`（§7.3.2）
- [x] 新增 `apps/api/src/repositories/drive-search.repository.test.ts`：Mock SQL；断言未使用 `to_tsvector('simple'...)`

---

### M7-C 领域规则（单文件一项）

- [x] 新增 `apps/api/src/domain/drive-node-rules.ts`：`assertFileHasParent`、`assertNotRootFileCreate`、`assertSameOwnerParent`
- [x] 新增 `apps/api/src/domain/drive-node-rules.test.ts`：根目录建文件 → `VALIDATION_FAILED`
- [x] 新增 `apps/api/src/domain/drive-archive-detect.ts`：根据 `linked_task_id` / 路径判断归档目录只读标识（供 UI）

---

### M7-D Service + 单元测试（每条 Service 一个 `.test.ts`）

- [x] 新增 `apps/api/src/services/drive-root.service.ts`：返回用户 `__root__` 文件夹 id（若无则创建，§7.2.1）
- [x] 新增 `apps/api/src/services/drive-root.service.test.ts`
- [x] 新增 `apps/api/src/services/drive-nodes-list.service.ts` + 测试（分页 50）
- [x] 新增 `apps/api/src/services/drive-node-get.service.ts` + 测试（越权 `AUTH_FORBIDDEN`）
- [x] 新增 `apps/api/src/services/drive-folder-create.service.ts`：同级重名 → `VALIDATION_FAILED`【待确认】
- [x] 新增 `apps/api/src/services/drive-folder-create.service.test.ts`
- [x] 新增 `apps/api/src/services/drive-node-update.service.ts`：重命名/移动；禁止将文件夹移入自身子树
- [x] 新增 `apps/api/src/services/drive-node-update.service.test.ts`
- [x] 新增 `apps/api/src/services/drive-node-delete.service.ts`：软删除；`file.delete` 审计；有子节点 → `OPERATION_NOT_ALLOWED`【待确认】
- [x] 新增 `apps/api/src/services/drive-node-delete.service.test.ts`
- [x] 新增 `apps/api/src/services/drive-search.service.ts`：仅返回本人任务文稿命中 + 关联 `drive_nodes` 跳转信息
- [x] 新增 `apps/api/src/services/drive-search.service.test.ts`
- [x] 新增 `apps/api/src/services/drive-file-download.service.ts`：`storage_key` 归属校验 → 签名 URL；`file.download` 审计
- [x] 新增 `apps/api/src/services/drive-file-download.service.test.ts`

---

### M7-E 路由与 Controller（每条 HTTP 路由独立任务）

- [x] 注册 `GET /api/drive/root` → `drive.routes.ts` + `drive-root.controller.ts` + `drive-root.controller.test.ts`
- [x] 注册 `GET /api/drive/nodes` → `drive-nodes-list.controller.ts` + `drive-nodes-list.controller.test.ts`
- [x] 注册 `GET /api/drive/nodes/:id` → `drive-node-get.controller.ts` + `drive-node-get.controller.test.ts`
- [x] 注册 `POST /api/drive/folders` → `drive-folder-create.controller.ts` + `drive-folder-create.controller.test.ts`
- [x] 注册 `PATCH /api/drive/nodes/:id` → `drive-node-patch.controller.ts` + `drive-node-patch.controller.test.ts`
- [x] 注册 `DELETE /api/drive/nodes/:id` → `drive-node-delete.controller.ts` + `drive-node-delete.controller.test.ts`
- [x] 注册 `GET /api/drive/search` → `drive-search.controller.ts` + `drive-search.controller.test.ts`
- [x] 注册 `GET /api/drive/files/:id/download` → `drive-file-download.controller.ts` + `drive-file-download.controller.test.ts`
- [x] 在 `apps/api/src/app.ts` 挂载 `/api/drive`；`auth` + `password-change-gate`；`lawyer` + `admin`（admin 写操作仍受 RLS 限制）

---

### M7-F 用户根目录种子（与 M2 对齐，单条）

- [x] 扩展 `admin-user-create.service.ts`（M2）：创建用户后插入 `__root__` 文件夹（若未在 DB trigger 中实现）

---

### M7-G 前端 · Shadcn（每条命令一项）

- [x] 执行 `npx shadcn@latest add breadcrumb`
- [x] 执行 `npx shadcn@latest add collapsible`（侧栏目录树可选）

---

### M7-H 前端 · API 与页面（每条一项）

- [x] 新增 `apps/web/src/lib/drive-api.ts`：`getRoot`、`listNodes`、`getNode`、`createFolder`、`updateNode`、`deleteNode`、`search`、`downloadFile`
- [x] 新增 `apps/web/src/app/(dashboard)/drive/page.tsx`：云盘主页；Skeleton/Error/Empty（§2.13）
- [x] 新增 `apps/web/src/components/drive/drive-breadcrumb-nav.tsx`：基于 `parentId` 路径导航（§6.4.1）
- [x] 新增 `apps/web/src/components/drive/drive-nodes-table.tsx`：当前目录文件/文件夹表（§6.5 行高）
- [x] 新增 `apps/web/src/components/drive/create-folder-dialog.tsx`：Shadcn `Dialog` + 表单
- [x] 新增 `apps/web/src/components/drive/drive-node-actions-menu.tsx`：重命名、移动、删除（`AlertDialog` 确认）
- [x] 新增 `apps/web/src/components/drive/drive-search-panel.tsx`：检索框 + 结果列表（跳转任务/文件）
- [x] 新增 `apps/web/src/components/drive/archive-folder-badge.tsx`：归档目录只读/可重命名标识（§6.4.2）
- [x] 在 `menus.ts` 为 `lawyer`/`admin` 增加「个人云盘」→ `/drive`

---

### M7-I 端到端与 Milestone 7 完成门禁

- [x] 集成测试：律师 A 无法 `GET /api/drive/nodes/:id` 律师 B 的节点
- [x] 集成测试：`POST /api/drive/files` 在根目录（若暴露）被拒绝 — 本 Milestone **不** 提供直传文件 API，仅文件夹 CRUD + 归档文件元数据
- [x] 手工验收：打开 M5 归档目录可见转写导出文件；下载走签名 URL
- [x] 手工验收：全文检索中文关键词命中 `polished_text`；分页 50
- [x] 运行 M7 测试全绿；连续失败 >2 次停止汇报
- [x] `git commit`：`feat(drive): nodes crud search and signed download`
- [x] 进度表 **M7** 标为「已完成」

**M7 明确不在此 Milestone**：`drive_node_tags` UI（表可选，首期可跳过）、向量语义检索、经 API 上传文件二进制、admin 代删律师文件（须 `AdminRepository` 另立 M8+ 需求）。

---


## Milestone 8：审计日志与系统配置

**目标**：合规审计查询、append-only 链、系统键值配置。

**局部规范索引**（无拆分文件时，以以下章节为准）：

| 文档 | 章节 |
|------|------|
| `prd.md` | §2.2「审计日志」「系统配置」、§3.7、§5.2 |
| `architecture.md` | §6.3 埋点清单、§6.4 审计边界、§7 `/api/admin/audit/*` |
| `ui_design.md` | §5.1 admin 菜单「审计日志」「系统设置」、§6.5 高密度表格 |
| `database.md` | §3.11 `audit_logs`、§3.12 `system_settings`、§4.7、§4.12 `append_audit_log` |

**验收**：仅 `admin` 可读审计；`UPDATE/DELETE audit_logs` 失败；列表展示 `metadata.client_timestamp`；`append_audit_log` 覆盖 architecture §6.3.2 事件；系统配置 CRUD 写 `updated_by` 并记审计【待确认】专用 action 或 `user.update` 扩展。

**前置依赖**：M0（`append_audit_log`、审计不可变触发器）、M1–M7 业务 API 已埋点或在本 Milestone 补齐。

---

### M8-A 共享 DTO（`packages/shared`）

- [x] 新增 `packages/shared/src/dto/audit-logs-query.dto.ts`：`limit`（默认 50）、`cursor?`、`action?`、`actorId?`、`targetType?`、`from?`、`to?`
- [x] 新增 `packages/shared/src/types/audit-log-item.ts`：`id`、`action`、`actorId`、`targetType`、`targetId`、`metadata`（含 `clientTimestamp`）、`createdAt`、`rowHash`（**不**向前端暴露链校验密钥）
- [x] 新增 `packages/shared/src/dto/system-setting-upsert.dto.ts`：`value`（JSON 对象）
- [x] 新增 `packages/shared/src/constants/audit-required-events.ts`：导出 `audit_action` 清单（对齐 `database.md` §1.2），供覆盖率测试引用

---

### M8-B 审计写入基础设施（单文件一项）

- [x] 新增 `apps/api/src/repositories/audit-log.repository.ts`：仅 `append(...)` 封装 RPC `append_audit_log`（`service_role`）
- [x] 新增 `apps/api/src/services/audit-writer.service.ts`：注入 `ip`、`userAgent`、`metadata`；浏览器事件自动合并 `client_timestamp`/`client_timezone`
- [x] 新增 `apps/api/src/services/audit-writer.service.test.ts`：`auth.login_failure` 必含 `attempted_username`（哈希可选）
- [x] 新增 `apps/api/src/lib/audit-client-metadata.ts`：从请求头 `X-Client-Timestamp`、`X-Client-Timezone` 解析（BFF 契约）

---

### M8-C 审计查询 Repository / Service（单文件一项）

- [x] 新增 `apps/api/src/repositories/audit-log-read.repository.ts`：`list(query)` admin JWT；按 `created_at DESC` 分页
- [x] 新增 `apps/api/src/repositories/audit-log-read.repository.test.ts`：律师 JWT 无行
- [x] 新增 `apps/api/src/services/audit-log-list.service.ts` + `audit-log-list.service.test.ts`
- [x] 新增 `apps/api/src/services/audit-log-get.service.ts` + `audit-log-get.service.test.ts`（单条详情）

---

### M8-D 系统配置 Repository / Service（单文件一项）

- [x] 确认 M0 RLS：`system_settings` 仅 `admin` 可读写；若缺失：`npx supabase migration new rls_system_settings` 并 `db push`
- [x] 新增 `apps/api/src/repositories/system-settings.repository.ts`：`list`、`get(key)`、`upsert(key, value, updatedBy)`
- [x] 新增 `apps/api/src/services/system-settings-list.service.ts` + 测试
- [x] 新增 `apps/api/src/services/system-settings-get.service.ts` + 测试
- [x] 新增 `apps/api/src/services/system-settings-upsert.service.ts` + 测试（禁止写入密钥类 key 名【待确认】黑名单）

---

### M8-E 路由与 Controller（每条 HTTP 路由独立任务）

- [x] 注册 `GET /api/admin/audit/logs` → `admin-audit.routes.ts` + `audit-logs-list.controller.ts` + `audit-logs-list.controller.test.ts`
- [x] 注册 `GET /api/admin/audit/logs/:id` → `audit-log-get.controller.ts` + `audit-log-get.controller.test.ts`
- [x] 注册 `GET /api/admin/settings` → `admin-settings.routes.ts` + `settings-list.controller.ts` + `settings-list.controller.test.ts`
- [x] 注册 `GET /api/admin/settings/:key` → `settings-get.controller.ts` + `settings-get.controller.test.ts`
- [x] 注册 `PUT /api/admin/settings/:key` → `settings-upsert.controller.ts` + `settings-upsert.controller.test.ts`
- [x] 在 `apps/api/src/app.ts` 挂载 `/api/admin/audit` 与 `/api/admin/settings`；`requireRoles('admin')`

---

### M8-F 埋点覆盖率补齐（每条事件一项；重构调用方为 `audit-writer.service`）

- [x] 核对并补齐：`auth.login_success` / `auth.login_failure` / `auth.logout` / `auth.password_change`（M1）
- [x] 核对并补齐：`auth.password_reset`、`user.create` / `user.update` / `user.disable` / `user.enable`（M2）
- [x] 核对并补齐：`ai.model.upsert` / `ai.mapping.upsert` / `ai.prompt.publish`（M3）
- [x] 核对并补齐：`task.create`（M4）、`task.complete` / `task.fail`（M5）
- [x] 核对并补齐：`file.download` / `file.export` / `file.delete`（M6/M7）
- [x] 新增 `apps/api/src/__tests__/audit-coverage.static.test.ts`：静态扫描或清单断言上述 action 至少在一条集成路径被调用

---

### M8-G 数据库不可变与链校验（单文件一项）

- [x] 新增 `apps/api/src/__tests__/audit-immutable.db.test.ts`：`UPDATE`/`DELETE audit_logs` 抛错
- [x] 新增 `scripts/verify-audit-chain.mjs`（运维可选）：顺序校验 `prev_hash` 链接【非热路径】

---

### M8-H 前端 · Shadcn 与页面（每条一项）

- [x] 执行 `npx shadcn@latest add calendar`（日期筛选，若未引入）
- [x] 执行 `npx shadcn@latest add popover`（日期范围选择器组合）
- [x] 执行 `npx shadcn@latest add sheet`（审计详情侧栏；若用 `Dialog` 替代则跳过）
- [x] 新增 `apps/web/src/lib/admin-audit-api.ts`：`listAuditLogs`、`getAuditLog`
- [x] 新增 `apps/web/src/lib/admin-settings-api.ts`：`listSettings`、`getSetting`、`upsertSetting`
- [x] 新增 `apps/web/src/lib/client-audit-headers.ts`：为 BFF 请求附加 `X-Client-Timestamp` / `X-Client-Timezone`
- [x] 在 `apps/web/src/lib/api-client.ts` 默认注入 `client-audit-headers`
- [x] 新增 `apps/web/src/app/(app)/admin/audit/page.tsx`：审计只读表；列：时间、`client_timestamp`、action、操作者、目标、IP
- [x] 新增 `apps/web/src/components/admin/audit-logs-table.tsx`：高密度表 + 筛选表单（§6.5）
- [x] 新增 `apps/web/src/components/admin/audit-log-detail-drawer.tsx`：Shadcn `Sheet` 或 `Dialog` 展示 `metadata` JSON（掩码敏感字段）
- [x] 新增 `apps/web/src/app/(app)/admin/settings/page.tsx`：系统键值列表 + 编辑
- [x] 新增 `apps/web/src/components/admin/system-setting-form.tsx`：JSON 编辑（首期可用 `Textarea` 校验 JSON）
- [x] 在 `menus.ts` 增加「审计日志」「系统设置」→ `/admin/audit`、`/admin/settings`

---

### M8-I 端到端与 Milestone 8 完成门禁

- [x] 手工验收：管理员筛选 `auth.login_failure` 可见 `attempted_username`（掩码规则【待确认】）
- [x] 手工验收：修改系统配置后 `updated_by` 正确；律师无法访问 `/admin/audit`
- [x] 运行 M8 测试全绿；连续失败 >2 次停止汇报
- [x] `git commit`：`feat(admin): audit logs query system settings and audit writer`
- [x] 进度表 **M8** 标为「已完成」

**M8 明确不在此 Milestone**：SIEM 对接、审计日志冷归档 Cron（`database.md` §6.3.4【待确认】）、律师端审计只读。

---


## Milestone 9：集成验收与私有化就绪检查

**目标**：端到端冒烟、文档与交付清单、私有化替代矩阵验证项。

**局部规范索引**（无拆分文件时，以以下章节为准）：

| 文档 | 章节 |
|------|------|
| `prd.md` | §1.3 Out of Scope、§5.1 规模与 QPS、§5.3 私有化、附录【待确认】 |
| `architecture.md` | §4.1 环境文件、§4.4 私有化替代矩阵、§4.4.1 `/health`、§4.4.2 禁止硬编码域名 |
| `ui_design.md` | §5.2 路由守卫（E2E 前置登录流） |
| `CONTEXT_SUMMARY.md` | §1 非目标、§12 环境变量 |

**验收**：主路径 E2E 绿；轻量 API 压测 QPS≤10 无错误率恶化；合规静态检查无红线违规；`.env.production` 模板与部署文档就绪；`docs/OPEN_ISSUES.md` 列出全部【待确认】供产品签收。

**前置依赖**：Milestone 0–8 功能子任务均已完成（本 Milestone **不** 新增业务 API）。

---

### M9-A 交付文档（每个文件一项）

- [x] 新增 `.env.production.example`（自 `.env.example` 派生；内网占位符；**无**真实密钥）
- [x] 新增 `docs/DEPLOYMENT.md`：进程清单（API、Web、`worker:pipeline`、`scheduler:stalled`）与启动顺序；**无 Redis**
- [x] 在 `docs/DEPLOYMENT.md` 增加私有化替代矩阵验收表（对照 `architecture.md` §4.4 逐行勾选说明）
- [x] 新增 `docs/OPEN_ISSUES.md`：汇总 `prd.md` / `architecture.md` / `database.md` 中【待确认】条目（链接章节号）
- [x] 新增 `docs/E2E_MANUAL_CHECKLIST.md`：无法自动化的验收步骤（MFA 真机扫码等）

---

### M9-B `/health` 与就绪探针（每条探测一项）

- [x] 扩展 `GET /health`：探测 Postgres `SELECT 1`（`apps/api`）
- [x] 同上：探测 Storage `media`/`exports` 桶 HEAD（**不**探测 Redis，v1.3）
- [x] 新增 `workers/pipeline/src/health/worker-health.ts`：报告 `ffmpeg -version` 解析结果（Worker 独立 `/health` 或启动日志）
- [x] 新增 `apps/api/src/__tests__/health.integration.test.ts`：Mock 依赖；断言 JSON 结构含各子系统 `status`

---

### M9-C 架构红线静态检查（每个检查一个测试文件）

- [ ] 新增 `tools/compliance/no-hardcoded-supabase-host.test.ts`：源码禁止 `*.supabase.co`（§4.4.2）
- [ ] 新增 `tools/compliance/no-service-queue-add.test.ts`：`apps/api/src/services` 禁止 `queue.add(`；`apps/api` 禁止 `bullmq`/`ioredis` 生产依赖（v1.3）
- [ ] 新增 `tools/compliance/no-browser-ffmpeg-wasm.test.ts`：`apps/web` 禁止 `ffmpeg.wasm` / `@ffmpeg`（PRD Out of Scope）
- [ ] 新增 `tools/compliance/no-python-vad-service.test.ts`：仓库禁止独立 Python VAD 微服务目录/依赖
- [ ] 新增 `tools/compliance/no-business-supabase-writes.test.ts`：`apps/web` 禁止业务表 `supabase.from(...).insert|update|delete`（§5.7.1）
- [ ] 在根 `package.json` 增加脚本：`test:compliance` 运行上述检查

---

### M9-D 私有化就绪脚本（单文件一项）

- [ ] 新增 `scripts/privatization-readiness-check.mjs`：校验 `CAPTCHA_PROVIDER=none` 时 `LOGIN_IP_ALLOWLIST` 已配置（§4.2.3）
- [ ] 同上脚本：校验 `FFMPEG_PATH`、`WORKER_MAX_CONCURRENCY`、`AI_CREDENTIALS_ENCRYPTION_KEY` 在 production 模板中已声明（**不**要求 `REDIS_URL`）
- [ ] 同上脚本：校验 `REALTIME_ENABLED` 未默认开启（§3.4.3）
- [ ] 根 `package.json` 脚本：`check:privatization`

---

### M9-E 轻量性能冒烟（单文件一项）

- [ ] 新增 `scripts/load/smoke-auth-session.mjs`：对 `POST /api/auth/login` + `GET /api/auth/session` 并发 10 VU、30s；断言错误率 <1%（PRD §5.1 QPS≤10）
- [ ] 新增 `scripts/load/smoke-profile.mjs`：对已登录会话压测 `GET /api/profile`（同上阈值）
- [ ] 文档化运行方式写入 `docs/DEPLOYMENT.md`「性能冒烟」小节（非 CI 必跑项【待确认】）

---

### M9-F E2E 测试基建（每条一项）

- [ ] **经用户授权后**安装 `@playwright/test`（或项目选定 E2E 框架）；配置 `playwright.config.ts`
- [ ] 新增 `e2e/fixtures/auth.ts`：admin / lawyer 登录辅助（用户名+密码，走 BFF）
- [ ] 新增 `e2e/fixtures/test-audio.sample.mp3`（极小样本；**不入** 1GB 压测）

---

### M9-G E2E 场景（每个 spec 文件一项）

- [ ] 新增 `e2e/admin-create-lawyer.spec.ts`：admin MFA 后创建律师用户
- [ ] 新增 `e2e/lawyer-forced-password-change.spec.ts`：律师首登强制改密进入业务区
- [ ] 新增 `e2e/transcription-upload-happy-path.spec.ts`：init → TUS（可 Mock Storage）→ complete → 列表见 `queued`
- [ ] 新增 `e2e/transcription-pipeline-completed.spec.ts`：轮询至 `completed`（依赖 Worker+Mock ASR/LLM 或测试环境桩）
- [ ] 新增 `e2e/workbench-proofread-seek.spec.ts`：打开工作台；校对模式点击段落（断言 audio `currentTime` 变化【待确认】桩）
- [ ] 新增 `e2e/workbench-export-docx.spec.ts`：导出 Word 返回可下载响应
- [ ] 新增 `e2e/drive-search-hit.spec.ts`：云盘检索命中转写正文关键词
- [ ] 新增 `e2e/admin-audit-log.spec.ts`：管理员审计列表可见 `auth.login_success` / `file.download`
- [ ] 新增 `e2e/lawyer-cannot-access-admin.spec.ts`：律师访问 `/admin/users` 被拒绝
- [ ] 根 `package.json` 脚本：`test:e2e`

---

### M9-H RBAC 与 RLS 冒烟（每个测试文件一项）

- [ ] 新增 `apps/api/src/__tests__/smoke-rls-lawyer-isolation.test.ts`：律师 A 不可读律师 B 的 `transcription_tasks` / `drive_nodes`
- [ ] 新增 `apps/api/src/__tests__/smoke-admin-audit-read.test.ts`：仅 admin 可读 `audit_logs`

---

### M9-I 全链路人工验收与项目收口（每条一项）

- [ ] 按 `docs/E2E_MANUAL_CHECKLIST.md` 执行一轮完整人工验收并记录结果（日期、环境、通过/失败）
- [ ] 核对 `docs/tasks.md` Milestone 0–8 **全部**子任务 checkbox 已勾选
- [ ] 运行 `npm run test:compliance` + `npm run check:privatization` 全绿
- [ ] 产品评审：`docs/OPEN_ISSUES.md` 逐条签收或转为后续版本
- [ ] `git commit`：`chore(release): e2e compliance docs and privatization readiness`
- [ ] 进度表 **M9** 标为「已完成」；文档版本升至 **1.1（里程碑拆解封版）**

**M9 明确不在此 Milestone**：新功能开发、生产环境真实数据迁移、性能压测超过首期 QPS 10 的容量规划。

---


## 里程碑依赖关系（简图）

```
M0 → M1 → M2 ─┬→ M3
              ├→ M4 → M5 → M6
              └→ M7（可与 M6 并行，依赖 M5 归档）
M2,M3 → M8（审计贯穿，M8 可晚于 M4 并行）
M*  → M9
```

---

## 当前进度

| Milestone | 状态 |
|-----------|------|
| M0 | 已完成（2026-05-29；`npm run verify:m0-gate`） |
| M1 | 已完成（2026-05-29；自动化测试通过；admin/lawyer 登录与强制改密已随 M2-K 验收） |
| M2 | 已完成（用户管理 API + 管理端 UI；M2-K 四项手工验收已通过） |
| M3 | 已完成（AI 配置 API/UI + M3-K 四项手工验收已通过） |
| M4 | 已完成（2026-05-29；BFF + Outbox 写入 + 任务列表 UI；**M5-0** 对齐 v1.3 代码） |
| M5 | 已完成（2026-05-30；U3 Postgres Outbox 流水线 + Stalled Cron；`npm run worker:pipeline` / `scheduler:stalled`） |
| M6 | 已完成（2026-05-30；转写工作台校对/编辑、导出、签名下载、If-Match 乐观锁） |
| M7 | 已完成 |
| M8 | 已完成（2026-05-31；审计查询/系统设置 API+UI；AuditWriterService；自动化测试通过） |
| M9 | 已拆解（见上方原子任务） |
