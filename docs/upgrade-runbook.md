# Lexos 系统升级迁移 Runbook

## 目标与边界

本文件用于 Lexos 私有化或本地化环境的版本升级、迁移核对和回滚准备。当前第一版重点解决“升级前知道要核对什么、升级中知道哪些迁移待处理、升级后知道保留哪些证据”。

当前第一版只做本地只读核对和人工 runbook，不自动连接线上 Supabase，不执行 `supabase db push`，不读取远端业务表，不安装任务计划，不做真实恢复，也不运行会写入数据的真实 smoke。

本轮仍不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。

## 快速使用

配置正式环境变量后执行：

```bash
npm run upgrade:check
```

该命令会读取 `.env.local`，检查私有化交付前置条件、必需迁移文件、升级相关 npm scripts，并输出升级迁移核对计划。

如果已经从目标环境导出了迁移应用状态，可以用环境变量辅助计算待核对迁移：

```bash
LEXOS_UPGRADE_FROM_VERSION=0.0.9 \
LEXOS_UPGRADE_TARGET_VERSION=0.1.0 \
LEXOS_UPGRADE_APPLIED_MIGRATIONS=20260606020954_init_lexos_schema,20260606133522_lock_down_direct_table_access \
npm run upgrade:check
```

Windows PowerShell 示例：

```powershell
$env:LEXOS_UPGRADE_FROM_VERSION="0.0.9"
$env:LEXOS_UPGRADE_TARGET_VERSION="0.1.0"
$env:LEXOS_UPGRADE_APPLIED_MIGRATIONS="20260606020954_init_lexos_schema,20260606133522_lock_down_direct_table_access"
npm run upgrade:check
```

`LEXOS_UPGRADE_APPLIED_MIGRATIONS` 可以填写逗号、分号或空白分隔的迁移文件名；可以省略 `.sql` 后缀。未提供该变量时，脚本不会假装知道远端状态，而是把必需迁移标记为“需人工核对”。

## 标准升级流程

1. 记录当前版本、commit、部署人、目标版本和维护窗口。
2. 执行本地只读核对：

```bash
npm run private:check
npm run launch:check
npm run upgrade:check
```

3. 完成升级前备份：

```bash
npm run backup:db
npm run backup:storage
npm run backup:rehearsal -- --latest
```

4. 只读核对远端迁移状态：

```bash
supabase migration list
```

如果 Supabase CLI 尚未 link 到目标项目，至少保留 SQL Editor 执行记录、执行人、执行时间和执行结果。

5. 在预生产环境应用迁移并验证。正式环境执行迁移前，必须确认备份已完成、维护窗口已开始、回滚负责人在线。

6. 发布新应用版本后执行：

```bash
npm run build
npm run verify:rls
npm run smoke:real
```

`smoke:real` 会写入客户、任务、反馈和结算记录，只能在允许写入的验收库或预生产库执行。生产库如不允许演示数据，应保留验收库 smoke 结果，并在生产库只做管理员登录、列表读取和附件下载等非破坏性检查。

## 迁移核对口径

当前私有化升级必须核对以下必需迁移：

```text
20260606020954_init_lexos_schema.sql
20260606133522_lock_down_direct_table_access.sql
20260608132423_add_deliverable_files.sql
20260609042303_add_task_source_review_scores.sql
20260609042505_add_task_source_review_scores.sql
20260609061000_add_task_review_flow.sql
20260609091825_add_risk_cases.sql
20260609110310_add_risk_case_resolution_note.sql
20260609135059_add_risk_case_defense.sql
20260609144119_add_risk_case_committee_decision.sql
20260609153142_add_settlement_risk_deduction_lock.sql
20260609165248_add_fund_transactions.sql
```

兼容已有空表项目时还需要人工评估：

```text
20260606105523_lexos_online_compatibility_bootstrap.sql
```

该兼容迁移适用于当前线上 LexOS 这类已有空表的场景，干净库通常优先使用基础迁移顺序，不应在不了解目标库历史的情况下重复套用兼容迁移。

## 回滚准备

升级前必须归档：

- 当前应用版本、commit 和构建产物来源。
- 数据库备份目录和 manifest。
- Storage 备份目录和 `storage-manifest.json`。
- 本次迁移执行记录。
- `npm run upgrade:check` 输出。
- `npm run verify:rls` 输出。
- smoke 或只读验收结果。
- 回滚审批人、恢复负责人和预计恢复窗口。

如果升级失败，优先回滚应用版本；如果已经应用数据库迁移，需要按升级前备份恢复到新环境，或在律所确认后做手工修正。涉及客户确认、结算、扣罚资金流水和审计日志的数据，不得直接删除。

## 当前限制

- `upgrade:check` 不会连接远端 Supabase，也不会读取远端 `_supabase_migrations`。
- `upgrade:check` 不会执行 `supabase db push`；命令只作为人工升级阶段的提醒项输出。
- 第一版不会生成离线升级包、不会做数据库 schema diff、不会自动判断目标库是否为空。
- 第一版不会自动安装备份调度、不会加密备份目录、不会接入失败告警。
