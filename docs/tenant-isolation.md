# Lexos 多律所租户隔离 Runbook

## 目标与边界

本文件用于多律所租户扩展上线前的第一版隔离核对。当前第一版只做本地迁移、关键 API 和 Storage 路径的静态核对，不连接线上 Supabase，不创建律所组织，不迁移真实数据，也不把当前系统升级为完整多租户运营后台。

当前 Lexos 仍以默认组织交付为主，`LEXOS_DEFAULT_ORGANIZATION_ID` 是登录会话的组织边界来源。正式开放多律所前，仍需要补齐组织创建、租户管理员初始化、跨组织数据迁移、租户切换策略和自动化隔离测试。

## 核对命令

```bash
npm run tenant:check
```

该命令会读取：

- `supabase/migrations/*.sql`
- 关键 `/api/*` 路由
- `src/lib/deliverables/files.ts`

该命令不会读取 `.env.local`，不会连接线上 Supabase，不会执行迁移，不会访问真实客户、任务、结算或附件对象。

## 当前核对范围

### 租户数据表

以下表必须具备 `organization_id` 边界，作为一库多租户模式下的最小隔离条件：

- `ranks`
- `organization_members`
- `customers`
- `matters`
- `tasks`
- `task_claims`
- `task_milestones`
- `task_deliverables`
- `customer_portal_links`
- `customer_feedback`
- `settlements`
- `audit_logs`
- `system_settings`
- `risk_cases`
- `fund_transactions`

### 全局表

以下表属于全局或跨租户基础身份表，正式上线前需要人工确认其访问口径：

- `organizations`
- `profiles`
- `roles`
- `customer_verification_codes`

`customer_verification_codes` 通过客户确认页链接关联到具体任务和组织，不能作为跨组织共享验证码池使用。

### API 组织过滤

关键内部 API 必须使用当前会话中的 `session.organizationId` 过滤或写入组织边界。客户侧 token API 必须使用 `link.organization_id` 作为下载、反馈和展示的组织来源。

第一版静态核对覆盖用户、客户、任务、结算、资金、风控、审计、系统参数、客户反馈和客户侧附件下载相关路由。

### Storage 对象路径

交付附件 bucket 保持私有。对象路径必须包含 `organizationId`，避免不同律所附件共用同一扁平命名空间。

正式迁移到多律所前，应对每个组织抽样验证：

- 内部用户只能下载本组织任务附件。
- 客户 token 只能下载其任务已验收附件。
- 其他组织用户即使知道 deliverable id，也不能获得 signed URL。

## 正式多律所上线前人工清单

1. 决定部署策略：一库多租户、单律所单库，或单独 schema。
2. 明确组织创建流程：组织名称、管理员账号、初始职级、系统参数和默认角色。
3. 明确登录后组织选择策略：单账号是否允许加入多个组织，是否需要组织切换入口。
4. 准备跨组织负向测试：A 组织用户访问 B 组织客户、任务、结算、风控、资金、审计和附件均应失败。
5. 准备客户侧负向测试：A 组织客户 token 不能读取 B 组织任务、反馈、验证码或附件。
6. 准备迁移方案：历史默认组织数据如何拆分、如何保留审计证据、如何处理冲突手机号和用户名。
7. 准备备份与恢复方案：数据库和 Storage 对象按组织维度保留核对证据。
8. 准备运维交接：租户开通、停用、管理员重置、密钥轮换和数据导出审批口径。

## 不包含内容

第一版不包含：

- 组织创建 UI。
- 租户管理员初始化向导。
- 多组织登录选择和组织切换。
- 跨组织数据迁移脚本。
- 自动化跨租户负向测试。
- 线上 Supabase 隔离状态查询。
- 真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。

## 与私有化交付的关系

`private:check` 已把 `tenant:check` 和 `docs/tenant-isolation.md` 纳入交付必备项。正式上线前建议按以下顺序执行：

```bash
npm run private:check
npm run tenant:check
npm run launch:check
npm run upgrade:check
```

这些命令只提供本地只读核对和计划输出。远端迁移应用状态、真实 RLS 边界、真实业务 smoke 和跨组织负向测试仍必须由上线负责人在目标环境中确认并归档。
