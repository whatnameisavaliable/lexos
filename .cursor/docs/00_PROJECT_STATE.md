# 00_PROJECT_STATE

> 全局路由与状态板

## [当前迭代目标]

用户管理 M1 已闭环；下一迭代：案件 / 知识库等业务模块（占位路由已预留）。

## [已完成功能列表]

- Git 仓库 + 安全 `.gitignore`
- Next.js 16（TypeScript / Tailwind 4 / App Router / `src/`）
- 线上 Supabase 环境变量（`.env.example` / `.env.local`）
- Supabase CLI `init` + `link`（`xnhrzlmqgtaeguhdlbty`）
- `@supabase/ssr` 客户端（browser / server / admin）
- `src/proxy.ts` Auth 会话刷新
- 首页连接状态自检
- **用户管理 M1（已闭环）**
  - 用户名 + 密码登录（`{username}@lexos.internal`）
  - 多角色路由与 `AppShell` / 侧栏登出
  - 管理员：用户列表、创建、状态变更、重置链接、修复登录、审计日志
  - 一次性密码重置（60 分钟 / 单次）；本人改密（需旧密码）
  - Auth Admin API 创建用户 / 设密；`npm run setup:admin` 初始化内置 admin
  - 孤儿 Auth 自动补 `profiles`；修复登录不再删除 `auth.users`（FK `RESTRICT`）
  - Migrations `20260527101500` … `20260527190000`；Vitest 用例通过

## [正在开发功能]

<!-- 无 -->

## [已知技术债务/待办事项]

- 内置 `admin` / `111111` 为弱口令，生产环境应尽快修改
- `purge_expired_audit_logs` 需配置 Supabase Cron / 外部定时任务
- 角色枚举变更需改代码发版（前台不提供角色配置 UI）
- `findAuthUserByEmail` / `reconcileOrphanedProfiles` 通过分页 `listUsers` 扫描，用户量大时需改为按邮箱查询或专用 RPC
- `cleanup_auth_user_for_repair` 已改为仅清理 token（兼容旧客户端）；历史文档若提及「删 auth 用户」以当前迁移为准
- 系统内 AI 配置表与设置 UI 待设计
- `02` 中 NFR、Git 流程细目仍为占位，下一迭代可补

## [最后更新时间戳]

2026-05-27T12:00:00+08:00（用户管理 M1 闭环：文档对齐 + 首次 Git 基线）
