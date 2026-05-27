# 01_PRD_AND_UI

> 需求与前端工程

## [全局产品愿景]

LexOS 律所协作平台：单租户、多角色、企业级 UI，帮助律所数字化转型；本迭代聚焦用户与权限基线（不含 AI）。

## [用户故事与功能列表]

### 用户故事（M1：用户管理）

| ID | 角色 | 故事 | 验收要点 |
|----|------|------|----------|
| US-01 | 任意角色 | 使用用户名+密码登录 | 用户名大小写敏感；停用/离职/软删不可登录 |
| US-02 | admin | 创建用户（用户名+角色） | 无临时密码；返回 60 分钟一次性重置链接 |
| US-03 | admin | 重置他人密码 | 生成新链接；旧链接立即失效 |
| US-04 | admin | 停用/标记离职/软删除用户 | `admin` 不可操作 |
| US-05 | 任意已登录用户 | 侧栏账户菜单修改本人密码 | 必须输入旧密码 |
| US-06 | 持有重置链接者 | 设置新密码 | 单次有效；过期可让 admin 重发 |
| US-07 | admin | 查看用户列表与审计日志 | 保留期默认 180 天（可配置） |
| US-08 | admin | 修复用户登录 | 不删除 profile；重建/更新 Auth 并签发新重置链接 |

### 业务规则摘要

- 单租户；角色：`admin`（唯一内置 `admin`）、`lawyer`、`client`、`channel_partner`、`director`
- 单用户单角色；前台不可配置角色枚举
- 用户名：`^[a-zA-Z0-9]+$`，唯一、大小写敏感、不可修改
- 禁止第二个 `admin`；`admin` 不可删/停用/改名
- 打开用户列表时服务端自动 `reconcileOrphanedProfiles`（Auth 有账号但缺 profile 时补全）

## [Next.js 路由树 (App/Pages Router)]

```
/login                          # 登录（公开）
/reset-password?token=          # 一次性重置（公开）
/admin/users                    # 管理员：用户管理
/admin/audit                    # 管理员：审计日志
/lawyer                         # 律师工作台（占位）
/client                         # 客户门户（占位）
/channel                        # 外部渠道商（占位）
/director                       # 主任工作台（占位）
/api/admin/users                # GET 列表 / POST 创建
/api/admin/users/[id]/status    # PATCH 状态
/api/admin/users/[id]/reset     # POST 签发重置链接
/api/admin/users/[id]/repair    # POST 修复登录 + 新重置链接
/api/admin/audit                # GET 审计日志
/api/auth/reset-password        # POST 消费重置 token
/api/auth/sign-out              # POST 登出
/api/setup/sync-admin           # POST 同步内置 admin（需 SERVICE_ROLE，慎用）
```

登录后按 `profiles.role` 重定向至对应首页。未登录访问受保护路由由 `proxy` 重定向 `/login`。

## [UI/UX规范及组件复用原则]

- **风格**：法律行业企业级——冷色海军蓝主色、大量留白、清晰层级；避免花哨动效
- **组件库**： [shadcn/ui](https://ui.shadcn.com)（`base-nova` 风格）+ Tailwind CSS 4 + Lucide 图标
- **布局**：`AppShell`（深色侧栏 + 顶栏 + 主内容区）；角色菜单来自 `roleMenuTemplates`
- **主题**：`src/app/globals.css` 中 LexOS 法律企业色板（`--primary` / `--sidebar` 等 CSS 变量）
- **权限展示**：菜单按角色模板；接口层校验内置 `admin` 或 `permission_key`

## [业务 API 接口字典]

统一信封：`ApiResponse<T>` — 成功 `{ ok: true, data }`；失败 `{ ok: false, error: { code, message } }`。

### `POST /api/auth/reset-password`（公开）

| 字段 | 类型 | 说明 |
|------|------|------|
| token | string | 一次性重置 token（明文，服务端 SHA-256 比对） |
| password | string | 新密码（≥8） |

响应 `data`：`{ username: string }`  
常见错误码：`invalid_or_expired_token`、`password_too_short`

### `POST /api/auth/sign-out`

登出当前会话。响应 `{ ok: true }` 或 400。

### `GET /api/admin/users`（内置 admin）

先 `reconcileOrphanedProfiles`，再返回全部 profile。  
响应 `data`：`{ users: Profile[] }`

### `POST /api/admin/users`（内置 admin）

| 字段 | 类型 | 说明 |
|------|------|------|
| username | string | 字母数字 |
| role | CreatableUserRole | 非 admin |

响应 `data`：`{ userId, username, resetUrl }`  
常见错误码：`username_taken`、`auth_without_profile`、`invalid_username`、`invalid_role`

### `PATCH /api/admin/users/[id]/status`（内置 admin）

| 字段 | 类型 | 说明 |
|------|------|------|
| status | UserStatus | 不可作用于 admin |

经 RPC `admin_update_user_status`。

### `POST /api/admin/users/[id]/reset`（内置 admin）

响应 `data`：`{ resetUrl, username? }`

### `POST /api/admin/users/[id]/repair`（内置 admin）

修复 Auth（update/create）并 upsert profile，签发新重置链接。  
响应 `data`：`{ resetUrl, username, message? }`  
错误码：`cannot_repair_admin`、`user_not_found`

### `GET /api/admin/audit`（内置 admin）

响应 `data`：`{ logs: AuditLog[] }`（Service Role 读取，最多 200 条）

### `POST /api/setup/sync-admin`

开发/运维：通过 Auth Admin API 同步内置 admin 密码（`npm run setup:admin` 脚本同源逻辑）。
