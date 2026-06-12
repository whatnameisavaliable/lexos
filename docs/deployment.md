# Lexos 部署与 Supabase 接入

## 当前阶段

Lexos 当前已经具备本地内存 demo、Supabase 迁移、服务端 Supabase client、用户名登录 API、改密 API、用户 API、职级 API、客户 API、任务 API、客户确认页 API、结算 API、投诉与风控 API、审计日志 API、系统参数 API 和 Preview 健康检查 API。

前端支持两种运行模式：

| 模式 | `NEXT_PUBLIC_DEMO_MODE` | Supabase 变量 | 用途 |
| --- | --- | --- | --- |
| 内存 demo 模式 | `true` 或不配置 | 不需要 | 适合 Vercel Preview 快速演示，不写入真实数据库。 |
| 真实 Supabase 模式 | `false` | 必须配置 | 适合联调、验收和真实闭环 smoke，数据会写入 Supabase。 |

代码判断逻辑是精确判断 `NEXT_PUBLIC_DEMO_MODE === "false"`。因此只有显式配置为字符串 `false` 时，前端才会通过 `/api/*` 访问真实 Supabase 后端。

## Vercel Preview demo

第一轮 Vercel Preview 建议先使用内存 demo 模式，验证页面、交互和业务讲解链路；确认演示稳定后，再切换到独立 Supabase demo 项目做真实 API Preview。

### Preview 环境变量

在 Vercel Project Settings 的 Environment Variables 中优先选择 `Preview` 环境，不要直接写入 Production。

内存 demo Preview 只需要：

```env
NEXT_PUBLIC_DEMO_MODE=true
```

真实 Supabase Preview 需要：

```env
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 anon key
SUPABASE_SERVICE_ROLE_KEY=你的 service role key
LEXOS_DEFAULT_ORGANIZATION_ID=00000000-0000-0000-0000-000000000001
LEXOS_AUTH_EMAIL_DOMAIN=lexos.local
```

变量说明：

- `NEXT_PUBLIC_DEMO_MODE`：演示模式开关。`true` 或不配置为内存 demo；`false` 为真实 API 模式。
- `NEXT_PUBLIC_SUPABASE_URL`：Supabase 项目根 URL，建议使用 `https://xxx.supabase.co`，不要填写 `/rest/v1` endpoint。
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`：浏览器可见的 Supabase anon key。本项目浏览器端不直接读写内部表，但 Supabase SSR client 需要它完成会话处理。
- `SUPABASE_SERVICE_ROLE_KEY`：服务端 API 使用的高权限 key，只能配置为服务端环境变量，不能以 `NEXT_PUBLIC_` 开头，不能提交到 Git。
- `LEXOS_DEFAULT_ORGANIZATION_ID`：默认组织 ID。当前 demo 使用 `00000000-0000-0000-0000-000000000001`。
- `LEXOS_AUTH_EMAIL_DOMAIN`：用户名登录映射用的内部邮箱域名，例如 `admin` 会映射为 `admin@lexos.local`。用户界面仍只输入用户名。

注意事项：

- `NEXT_PUBLIC_*` 变量会进入前端构建产物；修改后需要重新部署 Preview。
- 真实 Supabase Preview 不建议复用正式生产库。演示库可以使用当前 LexOS demo 项目，或由主线程新建隔离的 demo 项目。
- 如果只做公开演示，优先使用内存 demo 模式，避免 service role key 出现在 Vercel 项目配置里。
- 不要上传 `.env.local`，也不要把任何真实 key 写入 README、Issue、PR 或截图。

### Preview 部署前检查

部署前建议确认：

1. 分支上已通过 `npm run verify`，至少包含 lint、typecheck、测试和生产构建。
2. 已执行 `npm run preview:check`，确认当前环境变量符合目标 Preview 模式。
3. 已执行 `npm run deploy:channel:check`，确认 Vercel 上传已被明确批准，`.vercelignore` 上传排除清单完整，且部署方式、目标环境和批准引用已归档。
4. 部署后已通过 `npm run smoke:preview` 检查 Preview URL 的健康接口、登录页、客户确认页入口和结算页。
5. 如果使用真实 Supabase 模式，迁移已经应用到目标 Supabase 项目。
6. 如果使用真实 Supabase 模式，默认管理员已经创建，并完成首次改密。
7. 如果需要给外部人员演示真实闭环，先跑一次 `npm run smoke:real`，确认任务、客户确认和结算流程正常。
8. 如果启用真实 Supabase 模式，先跑 `npm run verify:rls`，确认 anon 和 authenticated 不能直接访问内部表。

### Preview 自检

本地部署前执行：

```bash
npm run preview:check
```

输出会说明当前运行模式、自检是否通过、Supabase 变量是否完整，以及是否存在需要注意的 Preview 配置提示。

本地存在 `.env.local` 时，脚本会自动读取该文件；已经由 shell 或 Vercel 注入的环境变量优先级更高。

部署到 Vercel 后访问：

```text
https://你的-preview-url/api/health
```

`/api/health` 返回内容包含：

- `mode`：`demo` 或 `supabase`。
- `ok`：当前 Preview 配置是否通过自检。
- `supabaseConfigured`：Supabase 三件套变量是否完整。
- `missingSupabaseEnvKeys`：缺失的变量名，只返回名称，不返回值。
- `warnings`：配置提示，例如 demo 模式下不建议配置 service role key。
- `vercelEnv`、`commit`、`timestamp`：部署环境、提交短哈希和检查时间。

健康检查接口不读取业务数据，也不会返回任何密钥值。

## 私有化交付自检

律所正式私有化或本地化部署不应使用内存 demo 模式。配置正式环境变量后，先执行：

```bash
npm run private:check
```

该命令会检查真实 Supabase 模式、必要环境变量、公开密钥风险、关键迁移文件、必要 npm scripts 和交付文档完整性。自检不会连接远端数据库，也不会确认迁移是否已经应用；上线前仍需执行数据库迁移核对、`npm run verify:rls` 和允许写入验收库的 `npm run smoke:real`。

上线前还可以执行：

```bash
npm run launch:check
```

该命令会生成一份只读上线前核对 runbook，覆盖本地前置、迁移状态、Storage bucket、RLS、备份恢复、真实 smoke 和运维交接证据。完整说明见 `docs/launch-readiness.md`。

版本升级或补丁发布前执行：

```bash
npm run upgrade:check
```

该命令会生成只读升级迁移核对计划，覆盖来源版本、目标版本、必需迁移、升级前备份、升级后验证和回滚证据。完整说明见 `docs/upgrade-runbook.md`。

运维交接前执行：

```bash
npm run ops:log:check
```

该命令会生成运维日志核对清单，覆盖发布、迁移、备份、恢复、安全核对、真实 smoke、生产异常和运维访问变更。完整说明见 `docs/operations-log.md`。

错误日志交接前执行：

```bash
npm run error:log:check
```

该命令会生成错误日志分级与脱敏核对清单，覆盖 runtime、API、数据库/RLS、Storage、认证权限、运维脚本和部署平台异常。完整说明见 `docs/error-log.md`。

性能监控交接前执行：

```bash
npm run perf:check
```

该命令会生成性能监控核对清单，覆盖前端体验、核心 API、数据库、Storage、运维脚本和容量增长。完整说明见 `docs/performance-monitoring.md`。

多律所上线前执行：

```bash
npm run tenant:check
```

该命令会生成多律所租户隔离核对清单，只读取本地迁移、关键 API 和 Storage 路径，不连接线上 Supabase、不创建组织、不迁移真实数据。完整说明见 `docs/tenant-isolation.md`。

最终验收后执行：

```bash
npm run release:package:check
npm run final:gate:check
npm run handover:evidence:check
npm run postdeploy:check
npm run release:sensitive:check
```

`release:package:check` 会生成私有化交付包清单核对，确认源码、配置、脚本、迁移、测试和文档齐全，并列出 `.env.local`、`reports`、`backups`、`node_modules`、`.next` 等不得进入交付包的路径。第一版只输出 checklist，不生成压缩包、不读取密钥值、不连接线上 Supabase、不执行迁移或真实 smoke。完整说明见 `docs/release-package.md`。
`final:gate:check` 会在最终签收前聚合私有化自检、上线 runbook、升级核对、最终验收、交付包清单和敏感扫描的本地只读结果，集中展示阻断项、提示项和人工复核项。完整说明见 `docs/final-gate.md`。
`handover:evidence:check` 会生成最终交付证据索引，汇总质量门槛、迁移/RLS、备份恢复、Storage 附件、运维日志、租户边界、真实闭环 smoke、交付包扫描和客户签收材料的归档口径；该命令不运行真实 smoke、不写入业务数据。完整说明见 `docs/handover-evidence.md`。
`postdeploy:check` 会生成部署后回归核对清单，覆盖健康检查、核心页面、RLS、客户附件、导出审计、备份恢复、日志性能、回滚窗口和观察期；该命令不连接线上 Supabase、不运行真实 smoke、不写入业务数据。完整说明见 `docs/post-deployment-verification.md`。
`release:sensitive:check` 会只读扫描交付允许范围内的文本文件，阻断疑似真实密钥、私钥、连接串和访问令牌，并把真实短信、AI 辅助、新手保护期、新兵引流池和证据矩阵线索列为人工复核项；该命令不读取 `.env.local`，不扫描备份、报告、依赖或构建产物。完整说明见 `docs/release-sensitive-scan.md`。

完整私有化部署 runbook 见 `docs/private-deployment.md`。

## 数据库备份与恢复

正式交付前建议至少完成一次备份演练：

```bash
npm run backup:db -- --dry-run
```

配置 `LEXOS_DATABASE_URL` 后可执行真实逻辑备份：

```bash
npm run backup:db
```

数据库备份不包含交付附件对象本体。配置 Supabase URL 和 service role 后，继续执行 Storage 对象备份演练与真实备份：

```bash
npm run backup:storage -- --dry-run
npm run backup:storage
```

恢复脚本默认只做演练：

```bash
npm run restore:db -- --backup-dir=backups/lexos-db-YYYYMMDD-HHMMSS
npm run restore:storage -- --backup-dir=backups/lexos-storage-YYYYMMDD-HHMMSS
```

实际恢复必须追加 `--execute`，数据库恢复设置 `LEXOS_RESTORE_CONFIRM=RESTORE_LEXOS_DATABASE`，Storage 恢复设置 `LEXOS_STORAGE_RESTORE_CONFIRM=RESTORE_LEXOS_STORAGE`。详细步骤见 `docs/backup-restore.md` 和 `docs/storage-backup.md`。

生成备份调度计划和恢复演练报告：

```bash
npm run backup:schedule
npm run backup:task:check
npm run backup:run:check
npm run backup:rehearsal -- --latest
npm run backup:encrypt:check
npm run backup:alert:check
npm run backup:mirror:check
```

调度计划只输出 Windows Task Scheduler / Linux cron 示例；任务安装核对只输出运行账号、日志目录和安装证据清单；运行证据核对只读取证据引用，不读取日志原文、不执行真实备份；演练报告只校验备份目录和 manifest，不执行真实恢复；加密核对只输出策略和命令示例，不保存密钥或执行真实加密；告警核对只输出责任人和处置规则，不发送真实通知；镜像核对只输出目的地标识、副本数量、RPO 和抽检周期，不上传文件或调用对象存储 SDK。完整说明见 `docs/backup-operations.md`、`docs/backup-task-installation.md`、`docs/backup-run-evidence.md`、`docs/backup-encryption.md`、`docs/backup-alerts.md` 和 `docs/backup-mirror.md`。

### Preview 远端冒烟测试

部署完成并拿到 Vercel Preview URL 后执行：

```powershell
$env:LEXOS_PREVIEW_BASE_URL="https://你的-preview-url"
$env:LEXOS_PREVIEW_EXPECT_MODE="demo"
npm run smoke:preview
```

`LEXOS_PREVIEW_EXPECT_MODE` 可选。第一版公开演示建议设置为 `demo`，用于确认 Preview 没有误切到真实 Supabase 模式。
如果设置为 `supabase`，远端 smoke 只检查 `/api/health`，真实业务闭环继续用 `npm run smoke:real` 验证。

远端 smoke 会检查：

- `/api/health` 返回 `ok=true`，并且运行模式符合 `LEXOS_PREVIEW_EXPECT_MODE`。
- 登录页、默认管理员首次改密、总览页可访问。
- 客户确认页 可用 `LEXOS-DEMO-004 / 13800000000 / 111111` 校验。
- 结算管理页面可访问。

该流程只校验客户确认页访问，不点击“确认接收并评分”，不会改变标准演示数据。

## 本地环境变量

本地开发创建 `.env.local`，完整示例见 `.env.example`。

内存 demo 模式：

```env
NEXT_PUBLIC_DEMO_MODE=true
```

真实 Supabase 模式：

```env
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 anon key
SUPABASE_SERVICE_ROLE_KEY=你的 service role key
LEXOS_DEFAULT_ORGANIZATION_ID=00000000-0000-0000-0000-000000000001
LEXOS_AUTH_EMAIL_DOMAIN=lexos.local
```

## 初始化数据库

当前有两类迁移文件：

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

说明：

- `20260606020954_init_lexos_schema.sql` 适合干净 Supabase 项目。
- `20260606105523_lexos_online_compatibility_bootstrap.sql` 适合当前线上 LexOS 项目这类已有空表的兼容场景，采用只增不删策略。
- `20260606133522_lock_down_direct_table_access.sql` 用于收紧 Data API 直接表访问边界，业务访问统一走 Next.js API。
- `20260608132423_add_deliverable_files.sql` 创建私有交付附件 bucket 和附件元数据字段。
- `20260609042303_add_task_source_review_scores.sql` 和 `20260609042505_add_task_source_review_scores.sql` 属于发起人评分相关兼容迁移，正式环境按迁移目录顺序核对应用状态。
- `20260609061000_add_task_review_flow.sql` 为任务主任复核和案件结果评分增加字段。
- `20260609091825_add_risk_cases.sql` 创建风控工单表，启用 RLS，并保持仅服务端 API 访问。
- `20260609110310_add_risk_case_resolution_note.sql` 为风控工单增加处理意见字段和处理人状态索引。
- `20260609135059_add_risk_case_defense.sql` 为风控工单增加承办律师答辩字段。
- `20260609144119_add_risk_case_committee_decision.sql` 为风控工单增加委员会裁决字段。
- `20260609153142_add_settlement_risk_deduction_lock.sql` 为结算记录增加律师实付金额、扣罚金额、扣罚去向和资金流向锁定字段。
- `20260609165248_add_fund_transactions.sql` 创建资金流水表，并在扣罚资金流向锁定后自动生成扣罚入账流水。

应用迁移后，数据库会包含：

- Lexos Demo 律所组织
- 默认角色
- L1A 至 L3C 默认职级
- MVP 表结构、索引和 RLS 策略
- 基础审计日志表和关键写操作日志

## 创建默认管理员

配置 `.env.local` 后执行：

```bash
npm run seed:admin
```

默认管理员：

```text
admin / 111111
```

首次登录后必须修改密码，且不能继续使用 `111111`。

## 真实闭环 Smoke

本地服务启动后，可以用下面的脚本验证真实 Supabase 闭环：

```bash
LEXOS_SMOKE_ADMIN_PASSWORD=你的管理员密码 \
LEXOS_SMOKE_TEST_PASSWORD=演示账号新密码 \
npm run smoke:real
```

Windows PowerShell 示例：

```powershell
$env:LEXOS_SMOKE_ADMIN_PASSWORD="你的管理员密码"
$env:LEXOS_SMOKE_TEST_PASSWORD="演示账号新密码"
npm run smoke:real
```

脚本会通过 `/api/*` 完成以下流程：

- 管理员创建或复用 `lawyer04`、`lawyer01`、`finance01`。
- 发起人创建客户和任务。
- 承办律师承接并提交成果。
- 发起人验收。
- 客户用 token、手机号和固定验证码 `111111` 确认并评分。
- 财务确认结算。

注意：该脚本会在真实数据库中留下带时间戳的客户、任务、反馈和结算记录。

## RLS 验证

使用以下命令验证线上 Supabase 的直接表访问边界：

```powershell
$env:LEXOS_RLS_TEST_PASSWORD="演示用户密码"
npm run verify:rls
```

期望结果：

- `serviceRoleReadable` 等于 19
- `anonBlocked` 等于 19
- `authenticatedBlocked` 等于 19
- `ok` 为 `true`

## 现有 API

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
- `POST /api/tasks/auto-confirm-overdue`
- `POST /api/tasks/:id/claim`
- `POST /api/tasks/:id/submit`
- `POST /api/tasks/:id/approve`
- `GET /api/customer-portal/:token`
- `POST /api/customer-portal/:token/verify-code`
- `POST /api/customer-portal/:token/feedback`
- `GET /api/settlements`
- `GET /api/settlements/export`
- `POST /api/settlements/:id/confirm`
- `POST /api/settlements/:id/risk-deduction`
- `POST /api/settlements/bulk-confirm`
- `GET /api/funds`
- `GET /api/risk-cases`
- `POST /api/risk-cases`
- `PATCH /api/risk-cases/:id`
- `POST /api/risk-cases/:id/defense`
- `POST /api/risk-cases/:id/decision`
- `GET /api/audit-logs`
- `GET /api/audit-logs/export`
- `GET /api/system-settings`
- `PUT /api/system-settings`
- `GET /api/health`

## 当前线上 Supabase 状态

- Supabase 项目：LexOS
- Project ref：`bkgtrmaiatyublrvujlq`
- 默认管理员：`admin`，已完成首次改密
- 本地真实 API 模式：`.env.local` 中 `NEXT_PUBLIC_DEMO_MODE=false`
- 真实闭环 smoke：已通过，最终结算状态为 `confirmed`
- 基础审计日志：已接入关键写操作和 `/api/audit-logs`
- RLS / Data API 边界：已执行 `lock_down_direct_table_access` 迁移，anon 和 authenticated 不能直接访问内部表
- 注意：风控工单迁移 `20260609091825_add_risk_cases.sql`、处理意见迁移 `20260609110310_add_risk_case_resolution_note.sql`、承办律师答辩迁移 `20260609135059_add_risk_case_defense.sql`、委员会裁决迁移 `20260609144119_add_risk_case_committee_decision.sql`、结算扣罚锁定迁移 `20260609153142_add_settlement_risk_deduction_lock.sql` 和资金流水迁移 `20260609165248_add_fund_transactions.sql` 已在仓库生成，线上 Supabase 尚未自动应用；切换真实 API 验证风控、任务金额冻结、承办律师答辩、委员会裁决、扣罚资金流向锁定和资金台账前需先应用。
- 任务金额冻结第一版不新增迁移，结算确认接口会读取 `risk_cases` 中未办结工单并阻断对应任务结算。
- 扣减比例配置第一版不新增迁移，继续复用 `system_settings`；未保存参数时会使用系统默认扣减比例生成建议扣减字段。
- 公共风险储备金账户 / 财务流水第一版新增 `GET /api/funds` 和资金流水迁移；当前只做扣罚入账台账，不做真实付款、银行流水、客户退款打款或基金审批。

## 本地化部署前置说明

Vercel Preview 只用于测试 demo 和对外演示，不等同于律所正式私有化部署。当前已提供 `npm run private:check`、`npm run final:acceptance`、`npm run final:gate:check`、`npm run handover:evidence:check`、`npm run postdeploy:check`、`npm run release:package:check`、`npm run release:sensitive:check`、`docs/private-deployment.md`、`docs/final-deployment-acceptance.md`、`docs/final-gate.md`、`docs/handover-evidence.md`、`docs/post-deployment-verification.md`、`docs/release-package.md` 和 `docs/release-sensitive-scan.md` 作为交付自检、最终验收、最终门禁、证据索引、部署后回归、交付包清单、敏感内容扫描与 runbook。正式本地化或私有化部署前，仍需要项目负责人确认以下前置条件：

1. 部署形态：完全离线、律所内网、私有云，还是 Vercel + Supabase 云端托管。
2. 数据库形态：新建干净 Supabase/Postgres 项目，还是兼容已有库和已有表。
3. 密钥管理：service role key、数据库连接串、短信服务商 key 和未来 AI key 的存放、轮换和审计方式。
4. 域名与 HTTPS：客户确认页访问链接必须使用可信域名和 HTTPS，避免 token 在不安全链路中传播。
5. 备份与恢复：正式库需要备份频率、恢复演练、迁移回滚和演示数据清理策略。
6. 运维观测：生产错误日志、访问日志、审计日志导出和告警渠道需要单独设计。
7. 租户边界：正式多律所部署前，需要确认一库多租户、单律所单库或单独 schema 策略。
8. 多律所隔离核对：执行 `npm run tenant:check`，并在验收库补充跨组织负向测试证据。
9. 最终部署验收：执行 `npm run final:acceptance` 和 `npm run final:acceptance:archive`，并归档质量门槛、迁移、RLS、备份、Storage、日志、性能、租户、真实闭环 smoke 和人工页面复核证据。
10. 最终交付证据索引：执行 `npm run handover:evidence:check`，确认交付负责人、客户签收引用和证据归档口径。
11. 最终门禁：执行 `npm run final:gate:check`，汇总本地只读门禁并确认不存在阻断项。
12. 部署后回归核对：执行 `npm run postdeploy:check`，确认上线后健康检查、核心页面、RLS、客户附件、导出审计、备份恢复、日志性能、回滚窗口和观察期证据口径。
13. 交付包清单与敏感内容核对：执行 `npm run release:package:check` 和 `npm run release:sensitive:check`，确认交付包包含源码、脚本、迁移、测试和文档，排除 `.env.local`、`reports`、`backups`、`node_modules`、`.next` 等本地路径，并复核疑似真实密钥、连接串或暂缓功能线索。

## 待确认事项

- 如果使用真实 Supabase Preview，是否复用当前 `LexOS` 项目，还是新建独立演示项目。
- 对外演示账号是否继续使用 `admin`、`lawyer04`、`lawyer01`、`finance01`，以及是否需要重置演示密码。
- 私有化部署第一阶段是否要求完全离线运行。
# Vercel upload package dry run

Before any Vercel upload, run `npm run deploy:upload:check` after `npm run deploy:channel:check`. The command verifies the local `.vercelignore` upload boundary and scans included text files for sensitive-looking content without creating an archive or contacting Vercel. Full notes are in `docs/vercel-upload-package.md`.

# Vercel Preview deployment request

Before uploading this private project to Vercel Preview, run `npm run deploy:preview:request`. The command builds a local-only approval packet from Preview readiness, deployment channel readiness, and the upload package dry run. It does not upload code, push Git, link Vercel, create an archive, read `.env.local` secret values, or contact Vercel.

The request is ready only when local blockers are clear. Actual upload still requires an explicit approval statement from the project owner. Full notes are in `docs/vercel-preview-request.md`.

# Vercel Preview deployment evidence

After a real Vercel Preview upload, run `npm run deploy:preview:evidence`. The command verifies that the approval reference, Preview URL, deployment reference, build log reference, Preview smoke result, deployment owner, and deployment timestamp have been recorded. It is read-only and does not upload code, call Vercel, run Playwright, link a project, push Git, or write evidence files. Full notes are in `docs/vercel-preview-evidence.md`.
