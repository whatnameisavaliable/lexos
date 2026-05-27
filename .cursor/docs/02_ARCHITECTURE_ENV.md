# 02_ARCHITECTURE_ENV

> 架构与工程环境

## [系统架构说明 (前后端分层与依赖)]

- **前端**: Next.js 16 App Router (`src/app`)，Tailwind CSS 4
- **数据层**: 线上 Supabase（PostgreSQL + Auth + Storage + pgvector 预留）
- **SSR 会话**: `@supabase/ssr` + `src/proxy.ts` 自动刷新 Auth Cookie
- **迁移**: Supabase CLI `supabase link` + `supabase db push`（无需 `DATABASE_URL`）
- **AI 配置**: 应用内系统设置（数据库），不通过 `.env` 配置（M1 未接入）

### Supabase 客户端分层

| 模块 | 路径 | 用途 |
|------|------|------|
| Browser | `src/lib/supabase/client.ts` | Client Components |
| Server | `src/lib/supabase/server.ts` | RSC / Route Handlers（用户 Session + RLS） |
| Admin | `src/lib/supabase/admin.ts` | **仅服务端特权路径**（绕过 RLS） |

### 特权路径（必须使用 Admin Client + 已校验内置 admin）

| 场景 | 实现 |
|------|------|
| 创建用户 / 设密 | `admin-user-service` → Auth Admin API + `profiles` insert/upsert |
| 用户列表 / 审计列表 | `listAllProfiles` / audit GET |
| 重置 token 解析 | `reset-token.ts` 查 `password_reset_tokens` |
| 修复登录 | `repairAppUserAuth`（updateUserById，不删 `auth.users`） |
| 孤儿 profile 修复 | `reconcileOrphanedProfiles` on `GET /api/admin/users` |
| 初始化 admin | `scripts/sync-admin-password.mjs` / `POST /api/setup/sync-admin` |

业务写状态、发 token 仍可通过 **Session Client + SECURITY DEFINER RPC**（如 `admin_update_user_status`）。

## [环境变量字典 (仅 Key 及作用)]

| Key | 作用 | 提交 Git |
|-----|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | 项目 API 根 URL（不含 `/rest/v1`） | 否（`.env.local`） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 公开匿名 Key，浏览器 + 服务端 RLS 查询 | 否 |
| `SUPABASE_SERVICE_ROLE_KEY` | 服务端特权 Key，仅 Admin Client | 否 |
| `NEXT_PUBLIC_APP_URL` | 生成密码重置链接的站点根 URL（如 `http://localhost:3000`） | 否 |

`DATABASE_URL`：可选，仅 psql / ORM 直连时需要；日常 `supabase db push` 不需要。

> **客户端读取注意**：`NEXT_PUBLIC_*` 在浏览器 bundle 中必须由 `process.env.NEXT_PUBLIC_XXX` **静态属性**访问（见 `src/lib/env.ts`），修改 `.env.local` 后需重启 `npm run dev`。

## [单分支 Git 提交流程规范]

- 单分支 `main`，语义化提交：`feat:` / `fix:` / `docs:` / `chore:`
- 禁止提交 `.env.local` 与 `SUPABASE_SERVICE_ROLE_KEY`
- 数据库变更必须带 `supabase/migrations/<timestamp>_*.sql`，合并前 `supabase db push` 与目标库对齐
- 推荐：`git add . && git commit -m "feat: ..." && git push origin main`

## [TypeScript 核心 Interface 字典]

### 用户域（`src/types/user.ts`）

```ts
type UserRole = 'admin' | 'lawyer' | 'client' | 'channel_partner' | 'director';
type UserStatus = 'active' | 'disabled' | 'resigned' | 'deleted';
type CreatableUserRole = Exclude<UserRole, 'admin'>;

interface Profile {
  id: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

interface CreateUserRpcResult {
  user_id: string;
  username: string;
  reset_token: string;
}

interface ResetUserRpcResult {
  user_id: string;
  username: string;
  reset_token: string;
}

interface PasswordResetCompleteResult {
  user_id: string;
  username: string;
}
```

### 权限（`src/lib/permissions.ts`）

```ts
type PermissionKey =
  | 'dashboard.view'
  | 'users.manage'
  | 'users.view'
  | 'audit.view'
  | 'cases.view'
  | 'cases.view_own'
  | 'referrals.view'
  | 'reports.view';
```

### API 信封（`src/types/api.ts`）

```ts
interface ApiSuccess<T> { ok: true; data: T }
interface ApiErrorBody { code: string; message: string }
interface ApiFailure { ok: false; error: ApiErrorBody }
type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
```

### 认证辅助（`src/lib/auth/username.ts`）

```ts
function usernameToEmail(username: string): string; // `${username}@lexos.internal`
function isValidUsername(username: string): boolean;
```

## [并发与性能基准 (NFRs)]

<!-- TODO: 下一迭代补充 -->

## [全局错误处理与日志机制]

- Route Handlers：`try/catch` + `src/lib/logger.ts` 结构化 JSON（`level`, `message`, `userId`, `meta`）
- 客户端：表单错误就地展示；列表加载失败在 `AdminUsersPanel` 展示 `error.message`
- 业务错误：`AuthServiceError.code` 或 RPC 消息映射为稳定 `error.code`（如 `username_taken`、`forbidden`）
