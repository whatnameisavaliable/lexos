# Lexos 律所协作平台

Lexos 是面向律师事务所内部使用的协作管理平台。当前版本是 MVP v0.1 demo + 真实 Supabase API 基础层，用于验证“任务抢单、客户确认、结算生成、审计留痕”的第一条业务闭环。

## 当前能力

- 管理员、案源律师、办案律师、财务四类 demo 角色。
- 默认密码均为 `111111`。
- 首次登录强制修改密码，且不能继续使用默认密码。
- 管理员可以创建用户，新用户默认密码为 `111111`。
- 案源律师可以创建客户和任务。
- 办案律师可以在任务大厅抢单并提交成果。
- 案源律师可以验收任务。
- 我的任务详情可以查看任务里程碑、下一步、结算关联和交付记录。
- 客户可以通过任务 token、手机号和验证码访问客户大屏；默认演示验证码为 `111111`，真实 API 模式可通过系统参数调整。
- 客户确认接收并评分后，系统生成待结算记录。
- 财务可以确认结算。
- 总览页已提供客户与渠道贡献统计，按客户来源汇总客户数、任务数、任务金额、结算金额和评分。
- 总览页已提供办案律师绩效统计，按律师汇总在办任务、完成任务、客户评分、任务金额和结算金额。
- 关键写操作会写入基础审计日志。
- 系统参数已接入真实业务规则第一版，可影响客户大屏验证码、列表默认分页数量和显式结算锁定期。
- Supabase 迁移文件已包含 MVP 表结构、索引、默认角色/职级、RLS 和 Data API 访问边界加固。
- 前端可在内存 demo 与真实 Supabase API 两种模式之间切换。
- 已提供 Vercel Preview 自检脚本和 `/api/health` 健康检查接口，用于部署前后确认运行模式。
- 已提供私有化部署自检脚本和中文 runbook，用于正式交付前检查真实 Supabase 模式、密钥暴露风险、关键迁移和交付文档。
- 已提供上线前核对 runbook 脚本，用于把迁移、RLS、真实闭环 smoke、备份恢复、Storage bucket 和运维交接证据统一输出为只读清单。
- 已提供升级迁移核对脚本和 runbook，用于版本升级前生成迁移状态、备份、验证和回滚证据清单。
- 已提供私有化交付包清单核对脚本和 runbook，用于最终验收后确认源码、脚本、迁移、测试、文档齐全，并列出不得进入交付包的本地路径。
- 已提供运维日志核对脚本和 runbook，用于明确发布、迁移、备份、恢复、安全核对、真实 smoke 和异常处置的记录口径。
- 已提供错误日志核对脚本和 runbook，用于明确错误分级、脱敏规则和异常处置证据。
- 已提供性能监控核对脚本和 runbook，用于明确前端体验、核心 API、数据库、Storage、运维脚本和容量增长指标。
- 已提供多律所租户隔离核对脚本和 runbook，用于上线前检查本地迁移、关键 API 组织过滤和 Storage 对象路径边界。
- 已提供数据库备份与恢复第一版脚本，用于生成 Supabase/Postgres 逻辑备份、manifest 和恢复演练计划。
- 已提供 Storage 交付附件对象备份与恢复第一版脚本，用于导出 `lexos-deliverables` 私有 bucket 对象本体和恢复演练。
- 已提供备份调度计划、系统任务安装核对、运行证据核对与恢复演练报告第一版脚本，用于生成 Windows/Linux 调度建议、运行账号/日志目录核对、最近成功备份证据和可归档的文件级演练报告。
- 已提供备份离线加密核对第一版脚本，用于输出加密工具、密钥标识、副本数量和人工交接清单。
- 已提供备份失败告警核对第一版脚本，用于输出责任人、告警渠道、静默阈值、升级时限和失败处置规则。

## Demo 账号

| 用户名 | 默认密码 | 角色 |
| --- | --- | --- |
| admin | 111111 | 系统管理员 |
| source01 | 111111 | 案源律师 |
| lawyer01 | 111111 | 办案律师 |
| finance01 | 111111 | 财务 |

客户大屏 demo 默认验证码为 `111111`；真实 API 模式可在“参数”页修改客户大屏演示验证码。

## 本地运行

```bash
npm install
npm run dev
```

访问：

```text
http://127.0.0.1:3000
```

## 验证命令

```bash
npm run verify
npm run preview:check
npm run private:check
npm run launch:check
npm run upgrade:check
npm run final:acceptance
npm run final:acceptance:archive -- --no-write
npm run final:gate:check
npm run handover:evidence:check
npm run postdeploy:check
npm run release:package:check
npm run release:sensitive:check
npm run ops:log:check
npm run error:log:check
npm run perf:check
npm run tenant:check
npm run backup:db -- --dry-run
npm run backup:storage -- --dry-run
npm run backup:schedule
npm run backup:task:check
npm run backup:run:check
npm run backup:encrypt:check
npm run backup:alert:check
npm run backup:mirror:check
```

`npm run verify` 会执行 lint、typecheck、测试和生产构建。
`npm run preview:check` 会自动读取本地 `.env.local`，检查当前环境是内存 demo 还是真实 Supabase 模式，并提示 Preview 变量缺口。
`npm run private:check` 用于私有化交付前自检，正式部署时要求 `NEXT_PUBLIC_DEMO_MODE=false` 且 Supabase 变量完整。
`npm run launch:check` 用于生成上线前只读核对 runbook，不连接远端 Supabase，也不执行迁移或真实 smoke。
`npm run upgrade:check` 用于生成升级迁移核对计划，不连接远端 Supabase，也不执行 `supabase db push`。
`npm run final:acceptance` 用于生成最终部署验收报告，汇总质量门槛、迁移、RLS、备份、Storage、日志、性能、租户、真实闭环 smoke 和人工签收证据。
`npm run final:acceptance:archive` 用于把最终验收报告归档为 Markdown 和 JSON；加 `-- --no-write` 时只演练路径和阻断项，不写入文件。
`npm run final:gate:check` 用于最终签收前汇总私有化自检、上线 runbook、升级核对、最终验收、交付包清单和敏感扫描，只读输出阻断项和人工复核项。
`npm run postdeploy:check` 用于部署完成后生成上线后回归核对清单，覆盖健康检查、核心页面、RLS、客户附件、导出审计、备份恢复、日志性能、回滚窗口和观察期。
`npm run release:package:check` 用于核对私有化交付包清单，确认源码、脚本、迁移、测试和文档齐全，并列出 `.env.local`、`reports`、`backups`、`node_modules` 等不得进入交付包的路径；该命令不生成压缩包、不读取密钥值、不连接线上 Supabase。
`npm run ops:log:check` 用于生成运维日志核对清单，不创建目录、不写入日志、不上传外部日志平台。
`npm run error:log:check` 用于生成错误日志分级和脱敏核对清单，不采集运行时日志、不上传外部错误监控平台。
`npm run perf:check` 用于生成性能监控指标清单，不采集真实用户数据、不接入外部 APM。
`npm run tenant:check` 用于生成多律所租户隔离核对清单，只读取本地迁移、关键 API 和 Storage 路径，不连接线上 Supabase。
`npm run backup:db -- --dry-run` 用于检查数据库备份命令计划，不会生成备份文件。
`npm run backup:storage -- --dry-run` 用于检查交付附件对象备份计划，不会连接 Supabase 或下载对象。
`npm run backup:schedule` 用于生成备份调度建议，不会安装系统任务。
`npm run backup:task:check` 用于生成备份系统任务安装核对清单，不会调用 schtasks、crontab 或 systemctl。
`npm run backup:run:check` 用于生成备份任务运行证据核对清单，不读取日志原文、不执行真实备份。
`npm run backup:encrypt:check` 用于生成备份离线加密核对清单，不读取真实备份文件、不保存密钥、不执行真实加密。
`npm run backup:alert:check` 用于生成备份失败告警核对清单，不发送邮件、不发短信、不调用 webhook。
`npm run backup:mirror:check` 用于生成备份异地/跨云镜像核对清单，不上传文件、不调用对象存储 SDK、不连接线上 Supabase。

部署后远端冒烟测试：

```bash
LEXOS_PREVIEW_BASE_URL=https://你的-preview-url npm run smoke:preview
```

Windows PowerShell：

```powershell
$env:LEXOS_PREVIEW_BASE_URL="https://你的-preview-url"
$env:LEXOS_PREVIEW_EXPECT_MODE="demo"
npm run smoke:preview
```

## Supabase

环境变量示例见 `.env.example`。

当前迁移文件：

```text
supabase/migrations/20260606020954_init_lexos_schema.sql
supabase/migrations/20260606105523_lexos_online_compatibility_bootstrap.sql
supabase/migrations/20260606133522_lock_down_direct_table_access.sql
supabase/migrations/20260608132423_add_deliverable_files.sql
supabase/migrations/20260609042303_add_task_source_review_scores.sql
supabase/migrations/20260609042505_add_task_source_review_scores.sql
supabase/migrations/20260609061000_add_task_review_flow.sql
supabase/migrations/20260609091825_add_risk_cases.sql
supabase/migrations/20260609110310_add_risk_case_resolution_note.sql
supabase/migrations/20260609135059_add_risk_case_defense.sql
supabase/migrations/20260609144119_add_risk_case_committee_decision.sql
supabase/migrations/20260609153142_add_settlement_risk_deduction_lock.sql
supabase/migrations/20260609165248_add_fund_transactions.sql
```

前端默认使用内存 demo。将环境变量 `NEXT_PUBLIC_DEMO_MODE=false` 后，登录、首次改密、用户、职级、客户、任务、客户大屏、结算和审计日志页面会通过 `/api/*` 访问真实 Supabase 后端。

配置 `.env.local` 后，可以执行：

```bash
npm run seed:admin
```

该命令会创建默认管理员 `admin / 111111`，并要求首次登录后改密。

当前已提供这些服务端 API：

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/auth/change-password`
- `GET /api/users`
- `POST /api/users`
- `GET /api/ranks`
- `GET /api/customers`
- `POST /api/customers`
- `GET /api/tasks`
- `POST /api/tasks`
- `POST /api/tasks/:id/claim`
- `POST /api/tasks/:id/submit`
- `POST /api/tasks/:id/approve`
- `GET /api/customer-portal/:token`
- `POST /api/customer-portal/:token/verify-code`
- `POST /api/customer-portal/:token/feedback`
- `GET /api/settlements`
- `GET /api/settlements/export`
- `POST /api/settlements/:id/confirm`
- `GET /api/audit-logs`
- `GET /api/audit-logs/export`
- `GET /api/system-settings`
- `PUT /api/system-settings`
- `GET /api/health`

## Demo / 真实模式

内存 demo 模式适合本地预览和 Vercel Preview 快速演示：

```env
NEXT_PUBLIC_DEMO_MODE=true
```

真实 Supabase 模式适合联调和验收：

```env
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 anon key
SUPABASE_SERVICE_ROLE_KEY=你的 service role key
```

`SUPABASE_SERVICE_ROLE_KEY` 只能用于服务端，不能提交到 Git，也不能配置成 `NEXT_PUBLIC_` 变量。

## Vercel Preview demo

Vercel Preview 第一版建议先启用内存 demo 模式，只配置 `NEXT_PUBLIC_DEMO_MODE=true`。如需验证真实 API，再为 Preview 环境补齐 Supabase 变量并重新部署。

部署前本地执行：

```bash
npm run preview:check
```

部署后访问：

```text
https://你的-preview-url/api/health
```

返回内容只包含运行模式、自检状态、缺失变量名、commit 和时间戳，不会返回任何密钥值。

完整部署说明见 `docs/deployment.md`。

## 私有化部署

正式私有化或本地化部署前，先阅读 `docs/private-deployment.md`，并执行：

```bash
npm run private:check
npm run launch:check
npm run upgrade:check
npm run final:acceptance
npm run final:acceptance:archive -- --no-write
npm run final:gate:check
npm run postdeploy:check
npm run release:package:check
npm run release:sensitive:check
npm run ops:log:check
npm run error:log:check
npm run perf:check
npm run tenant:check
```

该自检不会连接远端数据库，也不会打印密钥值；它用于确认交付前置条件，真正上线前仍需要执行迁移核对、RLS 验证和真实闭环 smoke。最终门禁说明见 `docs/final-gate.md`，最终交付证据索引见 `docs/handover-evidence.md`，部署后回归核对见 `docs/post-deployment-verification.md`，交付包清单说明见 `docs/release-package.md`；敏感内容扫描说明见 `docs/release-sensitive-scan.md`。第一版 `final:gate:check` 只聚合本地只读检查，不执行迁移或真实 smoke；`handover:evidence:check` 只输出签收证据索引，不运行会写数据的命令；`postdeploy:check` 只生成上线后回归核对清单，不连接线上 Supabase、不执行真实 smoke、不写入业务数据；`release:package:check` 只输出 checklist，不生成离线安装包或压缩包；`release:sensitive:check` 只扫描交付允许范围内的文本文件，不读取 `.env.local`。

上线前核对说明见 `docs/launch-readiness.md`。第一版 `launch:check` 只输出 checklist 和证据要求，`smoke:real` 等会写入验收库的动作需要人工单独确认后执行。

升级迁移说明见 `docs/upgrade-runbook.md`。第一版 `upgrade:check` 只读取本地迁移目录、package scripts 和可选的 `LEXOS_UPGRADE_APPLIED_MIGRATIONS`，不会自动判断远端迁移状态。

运维日志说明见 `docs/operations-log.md`。第一版 `ops:log:check` 只输出制度清单，不采集 server log、Nginx access log、Vercel log 或错误监控数据。

错误日志说明见 `docs/error-log.md`。第一版 `error:log:check` 只输出分级和脱敏清单，不自动拦截 API 异常、不写入 JSONL 或数据库表。

性能监控说明见 `docs/performance-monitoring.md`。第一版 `perf:check` 只输出指标和阈值清单，不采集真实用户数据、不写入数据库、不接入外部 APM。

多律所租户隔离说明见 `docs/tenant-isolation.md`。第一版 `tenant:check` 只核对本地迁移、关键 API 组织过滤和 Storage 对象路径，不创建组织、不迁移真实数据、不验证线上租户。

数据库备份与恢复说明见 `docs/backup-restore.md`。第一版备份脚本会生成 `schema.sql`、`data.sql`、`roles.sql` 和 `manifest.json`；恢复脚本默认只做演练，必须追加 `--execute` 并设置 `LEXOS_RESTORE_CONFIRM=RESTORE_LEXOS_DATABASE` 才会执行。

Storage 交付附件对象备份与恢复说明见 `docs/storage-backup.md`。第一版对象备份会生成 `storage-manifest.json` 和 `objects/` 文件目录；恢复脚本默认只做演练，必须追加 `--execute` 并设置 `LEXOS_STORAGE_RESTORE_CONFIRM=RESTORE_LEXOS_STORAGE` 才会上传对象。

备份调度与恢复演练报告说明见 `docs/backup-operations.md`，系统任务安装核对说明见 `docs/backup-task-installation.md`，运行证据核对说明见 `docs/backup-run-evidence.md`。第一版调度脚本只生成 Windows Task Scheduler / Linux cron 示例，安装核对脚本只输出运行账号、日志目录和安装证据清单，运行证据脚本只核对最近成功备份、任务导出和日志引用，不自动安装系统任务；演练报告只校验备份目录和 manifest，不执行真实恢复。

备份离线加密说明见 `docs/backup-encryption.md`。第一版加密核对脚本只输出策略和命令示例，不执行压缩或加密，不保存私钥、口令或恢复介质。

备份失败告警说明见 `docs/backup-alerts.md`。第一版告警核对脚本只输出责任人、渠道、阈值和处置规则，不接入真实通知平台。

## 下一步

建议下一轮继续推进：

1. 继续补权限运营、排序、批量选择和更细的角色视图。
2. 推进正式文件上传、律师评分快照和个人绩效趋势。
3. 继续补离线加密、运维监控、错误告警和正式升级回滚方案。
