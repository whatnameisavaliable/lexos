# 03_DATA_AND_AI

> 数据与模型链路

## [Supabase 数据库表结构字典]

### `public.profiles`

| 列 | 类型 | 说明 |
|----|------|------|
| id | uuid PK → auth.users | 与 Auth 用户 1:1；**ON DELETE RESTRICT**（删 auth 不会级联删 profile） |
| username | text UNIQUE | `^[a-zA-Z0-9]+$`，不可变 |
| role | user_role | 单角色 |
| status | user_status | active / disabled / resigned / deleted |
| created_at / updated_at | timestamptz | |

约束：仅允许 `username=admin` 且 `role=admin`；全局唯一 admin（部分唯一索引）。

### `public.role_permissions`

角色 → `permission_key` 映射（支持多角色复用同一 permission）。

### `public.password_reset_tokens`

| 列 | 说明 |
|----|------|
| token_hash | SHA-256(hex) |
| expires_at | 创建后 60 分钟 |
| consumed_at | 单次消费时间 |

同一用户仅保留最后一个有效 token（新发时作废旧 token）。

### `public.audit_logs`

actor_id, target_id, action, diff(jsonb), ip_address, user_agent, created_at

### `public.app_settings`

| key | value 示例 |
|-----|------------|
| audit_log_retention_days | 180 |

## [行级安全策略 (RLS) 说明]

| 表 | 策略 |
|----|------|
| profiles | 本人 SELECT；admin SELECT 全部（`is_admin()` 内关闭 `row_security` 防递归）；写操作以 RPC + 服务端 Admin 为主 |
| role_permissions | 已登录可读自身角色权限；admin 可读全部 |
| audit_logs | 仅 admin SELECT（管理端列表用 Service Role 读取） |
| password_reset_tokens | 无客户端直连；RPC + Admin 服务端查询 hash |
| app_settings | 仅 admin SELECT |

敏感写操作：

- **用户创建 / 修复 / 列表补全**：Auth Admin API + `admin-user-service`（Service Role）
- **状态变更 / 发 token**：Session + SECURITY DEFINER RPC（`admin_update_user_status`、`issue_password_reset_token`）
- **重置密码消费**：`reset-token.ts`（Admin 查 token）+ Auth Admin `updateUserById`

## [数据库变更日志 (Migration Tracker)]

| 版本文件 | 说明 |
|----------|------|
| `20260527101500_user_management.sql` | 用户域表、RLS、RPC、权限种子 |
| `20260527120000_fix_auth_email_identity.sql` | GoTrue：`identities.provider_id` = 邮箱 |
| `20260527140000_reset_admin_for_auth_api.sql` | 清理损坏 admin 行以便 API 重建 |
| `20260527150000_auth_admin_api_flow.sql` | reset token resolve/consume；repair 清理 RPC（旧版） |
| `20260527160000_fix_cleanup_auth_audit_fk.sql` | repair 前 `audit_logs.actor_id` 置空 |
| `20260527170000_grant_issue_reset_token.sql` | GRANT `issue_password_reset_token` |
| `20260527180000_fix_is_admin_rls.sql` | `is_admin()` 绕过 RLS 递归 |
| `20260527190000_profiles_auth_fk_restrict.sql` | profiles FK `RESTRICT`；`cleanup_auth_user_for_repair` 仅删 token |

命令：`supabase db push`

**内置 admin 初始化**（勿依赖 SQL `crypt` 直写 auth）：

1. `supabase db push`
2. `npm run setup:admin`（需 `SUPABASE_SERVICE_ROLE_KEY`）
3. 使用 `admin` / `111111` 登录后尽快改密

`supabase/seed.sql`：遗留 SQL seed，生产以 `setup:admin` 为准。

> 新建迁移：`supabase migration new <migration_name>`

## [RAG 工程策略：文档分块 Chunking 规则与 Overlap 设定]
<!-- TODO: 待补充 -->

## [Embedding 向量模型维度定义]
<!-- TODO: 待补充 -->

## [大语言模型 (LLM) Prompt 模板及动态调用规范]
<!-- TODO: 待补充 -->

## [AI 引擎配置：公有模型 (如 Gemini) 与本地模型切换逻辑]

**M1 未接入 AI**。无新增 LLM/Embedding 环境变量。

## [核心 Prompt 模板库及输入输出 Interface 定义]
<!-- TODO: 待补充 -->

## [知识库源文件解析策略 (PDF/TXT 解析库选型)]
<!-- TODO: 待补充 -->

## [本地 AI 推理服务引擎定义 (如 Ollama/vLLM) 及其 Endpoint 默认映射]
<!-- TODO: 待补充 -->
