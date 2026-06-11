# Lexos 上线前核对 Runbook

## 目标与边界

本文件用于私有化交付或正式验收前，把环境变量、迁移、RLS、真实闭环 smoke、备份恢复、Storage bucket 和运维交接统一到一份可归档核对流程。

当前第一版只生成只读核对清单和证据要求，不自动连接线上 Supabase，不执行 `supabase db push`，不安装系统任务，不执行真实恢复，也不运行会写入数据的真实 smoke。

本轮仍不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。

## 快速使用

配置正式环境变量后执行：

```bash
npm run launch:check
```

该命令会自动读取 `.env.local`，复用 `private:check` 的本地前置检查，并输出一份 Markdown 形式的上线前核对 runbook。输出内容只包含变量名、检查结论、命令和证据要求，不打印密钥值。

如果需要归档，可由运维把命令输出保存到受控目录或工单系统；不要把密钥、数据库连接串、客户数据或完整 smoke 业务数据写入公开文档。

## 核对阶段

`launch:check` 会生成以下阶段：

1. 本地交付前置：`private:check`、`verify`。
2. 数据库迁移核对：迁移文件完整性、远端迁移应用状态、干净库或兼容库策略。
3. Storage 与交付附件核对：`lexos-deliverables` 私有 bucket、Storage 备份计划。
4. 安全边界核对：`verify:rls`、密钥暴露复核。
5. 备份与恢复演练：备份调度计划、系统任务安装核对、恢复演练报告。
6. 真实闭环与部署后检查：真实 smoke、核心页面访问。
7. 运维交接：版本、迁移、备份、RLS、smoke 和管理员改密证据归档。

## 迁移核对

上线前必须确认仓库中的必需迁移已经应用到目标 Supabase / Postgres 环境。当前必需迁移包括：

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

如果 Supabase CLI 已 link 到目标项目，可先只读查看：

```bash
supabase migration list
```

如果项目尚未 link，至少需要保留 SQL Editor 的执行记录、执行人、执行时间和执行结果。正式应用迁移前应先完成数据库备份，并在维护窗口内操作。

## 必跑命令建议

只读或仅生成计划：

```bash
npm run private:check
npm run launch:check
npm run verify
npm run backup:storage -- --dry-run
npm run backup:schedule
npm run backup:task:check
npm run backup:run:check
npm run backup:rehearsal -- --latest
```

需要连接目标环境但不应写业务数据：

```bash
npm run verify:rls
```

会写入验收库，需人工确认后执行：

```bash
npm run smoke:real
```

`smoke:real` 会创建或复用演示账号，并写入客户、任务、反馈和结算记录。正式生产库如不允许产生演示数据，应在独立验收库完成真实闭环验证。

## 交付证据

上线前建议归档：

- `npm run private:check` 输出。
- `npm run launch:check` 输出。
- 目标版本号、commit、构建时间和部署人。
- 迁移应用状态或 SQL Editor 执行记录。
- `npm run verify:rls` 输出。
- 备份目录、Storage 备份目录、调度计划、系统任务安装核对和恢复演练报告。
- 真实 smoke 结果，或无法在生产库写入时的验收库 smoke 结果。
- 管理员已改密、业务用户不再使用默认密码的确认记录。
- 运维联系人、备份责任人、恢复窗口和升级审批人。

## 当前限制

- `launch:check` 不会调用 Supabase Management API，也不会判断远端项目是否已经 link。
- `launch:check` 不会查询远端 `_supabase_migrations` 或业务表，迁移应用状态仍需人工或 Supabase CLI 只读核对。
- Storage bucket 私有性需要在 Supabase Dashboard、SQL 或后续专用只读脚本中确认。
- 第一版不包含自动安装定时任务、离线加密执行器、真实告警发送、跨云镜像执行器、生产错误监控或完整升级包管理。
