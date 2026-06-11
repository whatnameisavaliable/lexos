# Lexos 私有化部署 Runbook

## 目标与边界

本文件用于 Lexos 第一版私有化或本地化交付前的部署准备、环境自检和上线核对。当前第一版重点保障“能部署、能迁移、能验证、能回滚到人工处理”，不包含完全离线安装包、真实短信服务、AI 辅助、证据矩阵、银行付款或复杂基金审批。

Vercel Preview 只适合测试 demo 和对外演示；律所正式交付环境必须使用真实 Supabase / Postgres 数据库，并显式设置：

```env
NEXT_PUBLIC_DEMO_MODE=false
```

## 推荐部署形态

第一阶段建议采用以下结构：

- Next.js 应用：运行在律所内网服务器、私有云或受控容器平台。
- 数据库：干净 Supabase 项目、私有 Supabase 实例，或兼容 PostgreSQL 的受控数据库。
- 文件存储：私有 Supabase Storage bucket `lexos-deliverables`，内部上传和客户下载都经过 Next.js API。
- 反向代理：使用 Nginx、Caddy 或平台网关提供 HTTPS、访问日志和请求体大小限制。
- 密钥管理：通过服务器环境变量或平台 Secret Manager 注入，不写入 Git、README、截图或 Issue。

## 环境变量

正式交付至少需要：

```env
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 anon key
SUPABASE_SERVICE_ROLE_KEY=你的 service role key
LEXOS_DEFAULT_ORGANIZATION_ID=00000000-0000-0000-0000-000000000001
LEXOS_AUTH_EMAIL_DOMAIN=lexos.local
```

安全要求：

- `SUPABASE_SERVICE_ROLE_KEY` 只能存在于服务端环境变量，不能带 `NEXT_PUBLIC_` 前缀。
- `NEXT_PUBLIC_SUPABASE_URL` 使用项目根 URL，不填写 `/rest/v1`。
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 和 `SUPABASE_SERVICE_ROLE_KEY` 不能相同。
- 客户大屏链接必须部署在 HTTPS 域名下，避免 token 在明文链路中传播。

## 交付前自检

配置环境变量后执行：

```bash
npm run private:check
npm run launch:check
```

`private:check` 会检查：

- 是否显式处于真实 Supabase 模式。
- Supabase 必要变量是否完整。
- 是否存在疑似公开的 service role、secret、database URL 或 password 变量。
- 关键迁移文件是否齐全。
- 交付所需 npm scripts 是否存在。
- 部署、数据库、测试和私有化文档是否齐全。

`launch:check` 会在此基础上生成上线前核对 runbook，覆盖本地质量门槛、迁移应用状态、Storage bucket、RLS、真实闭环 smoke、备份恢复演练和运维交接证据。两条命令都不会连接远端数据库，也不会确认迁移是否已经应用；上线前仍必须执行迁移核对、RLS 验证和真实闭环 smoke。完整上线前核对说明见 `docs/launch-readiness.md`。

版本升级或补丁发布前执行：

```bash
npm run upgrade:check
npm run ops:log:check
npm run error:log:check
npm run perf:check
npm run tenant:check
```

该命令会生成升级迁移核对计划，帮助确认必需迁移、升级前备份、升级后 RLS/smoke 和回滚证据。完整说明见 `docs/upgrade-runbook.md`。

`ops:log:check` 会生成运维日志核对清单，明确发布、迁移、备份、恢复、安全核对、真实 smoke、异常处置和运维访问变更的记录口径。完整说明见 `docs/operations-log.md`。

`error:log:check` 会生成错误日志分级与脱敏核对清单，明确 runtime、API、数据库/RLS、Storage、认证权限、运维脚本和部署平台异常的记录口径。完整说明见 `docs/error-log.md`。

`perf:check` 会生成性能监控核对清单，明确前端体验、核心 API、数据库、Storage、运维脚本和容量增长的监控口径。完整说明见 `docs/performance-monitoring.md`。

`tenant:check` 会生成多律所租户隔离核对清单，静态检查本地迁移、关键 API 组织过滤和 Storage 对象路径边界。完整说明见 `docs/tenant-isolation.md`。

## 标准部署流程

1. 准备 Node.js、npm、数据库访问权限和 Supabase CLI 或 SQL Editor 权限。
2. 从代码仓库拉取目标版本，并在服务器上配置正式环境变量。
3. 安装依赖并完成基础质量门槛：

```bash
npm ci
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
npm run verify
```

4. 初始化或升级数据库：

- 干净项目：按 `supabase/migrations` 顺序应用全部迁移。
- 兼容已有空表项目：先评估是否需要使用 `20260606105523_lexos_online_compatibility_bootstrap.sql` 这类兼容迁移。
- 正式环境不要直接复用公开演示库。

5. 创建默认管理员：

```bash
npm run seed:admin
```

默认账号为 `admin / 111111`，首次登录后必须修改密码。

6. 执行一次数据库备份演练，并在验收环境执行真实备份：

```bash
npm run backup:db -- --dry-run
npm run backup:db
npm run backup:storage -- --dry-run
npm run backup:storage
npm run backup:schedule
npm run backup:task:check
npm run backup:run:check
npm run backup:encrypt:check
npm run backup:alert:check
npm run backup:mirror:check
```

数据库备份和恢复细节见 `docs/backup-restore.md`，Storage 交付附件对象备份和恢复细节见 `docs/storage-backup.md`，备份调度与演练报告见 `docs/backup-operations.md`，备份系统任务安装核对见 `docs/backup-task-installation.md`，备份运行证据核对见 `docs/backup-run-evidence.md`，备份离线加密核对见 `docs/backup-encryption.md`，备份失败告警核对见 `docs/backup-alerts.md`，备份异地/跨云镜像核对见 `docs/backup-mirror.md`。注意：数据库备份只覆盖 Storage 元数据，不包含附件对象本体。

7. 验证直接表访问边界：

```bash
npm run verify:rls
```

期望 anon 和 authenticated 都不能直接读取内部 public 表，业务访问统一走 Next.js API。

8. 启动应用并执行真实闭环 smoke：

```bash
npm run build
npm run start
npm run smoke:real
```

`smoke:real` 会写入真实客户、任务、反馈和结算记录，只能在验收库或已允许产生演示数据的环境中运行。

## 数据库迁移核对

当前私有化交付必须重点确认以下能力对应的迁移已经应用：

- MVP 基础表、角色、职级和 RLS。
- Data API 直接表访问加固。
- 私有交付附件和 Storage 元数据。
- 案源评分、案件结果评分和主任复核。
- 风控工单、处理意见、48 小时答辩、委员会裁决。
- 结算扣罚锁定和资金流水。

如果线上 Supabase 尚未 link 到仓库，至少需要在 Supabase SQL Editor 中逐个应用迁移 SQL，并保留执行记录。正式交付前建议用干净项目或独立 schema 策略，避免历史空表和 demo 数据污染生产库。

上线前应再执行：

```bash
npm run launch:check
npm run final:acceptance
npm run final:acceptance:archive -- --no-write
npm run final:gate:check
npm run handover:evidence:check
npm run postdeploy:check
npm run release:package:check
npm run release:sensitive:check
```

并把输出中的“数据库迁移核对”阶段作为人工 checklist 使用。该阶段只列出必需迁移和证据要求，不会自动执行 `supabase db push`。
最终验收说明见 `docs/final-deployment-acceptance.md`。`final:acceptance` 只生成最终验收报告，不连接远端 Supabase、不执行迁移、不写入业务数据；`final:acceptance:archive` 用于把报告写成本地 Markdown + JSON 证据包，默认目录 `reports/final-acceptance` 已被忽略。`final:gate:check` 说明见 `docs/final-gate.md`，用于签收前聚合私有化自检、上线 runbook、升级核对、最终验收、交付包清单、最终交付证据索引、部署后回归核对和敏感扫描的阻断项。最终交付证据索引说明见 `docs/handover-evidence.md`，`handover:evidence:check` 只输出证据归档口径和客户签收核对，不运行会写数据的命令。部署后回归核对说明见 `docs/post-deployment-verification.md`，`postdeploy:check` 只生成上线后核对清单，不连接线上 Supabase、不执行真实 smoke、不写入业务数据。真实闭环 smoke 和人工页面复核仍需交付负责人单独执行并归档。

交付包清单说明见 `docs/release-package.md`。`release:package:check` 用于确认源码、配置、脚本、迁移、测试和文档齐全，并列出 `.env.local`、`reports`、`backups`、`node_modules`、`.next` 等不得进入交付包的路径；第一版只输出 checklist，不生成压缩包、不读取密钥值、不连接线上 Supabase、不执行迁移或真实 smoke。敏感内容扫描说明见 `docs/release-sensitive-scan.md`。`release:sensitive:check` 用于扫描交付允许范围内的文本文件，发现疑似真实密钥、私钥、连接串和本期暂缓功能线索；该命令不读取 `.env.local`、不扫描备份/报告/依赖目录。

## 备份与恢复第一版要求

当前已提供 `npm run backup:db`、`npm run restore:db`、`npm run backup:storage`、`npm run restore:storage`、`npm run backup:schedule`、`npm run backup:task:check`、`npm run backup:run:check`、`npm run backup:rehearsal`、`npm run backup:encrypt:check`、`npm run backup:alert:check` 和 `npm run backup:mirror:check` 第一版自动化脚本。正式库上线前至少建立以下机制：

- 数据库每日全量备份，关键验收前额外手工备份。
- 交付附件 bucket 定期导出或镜像到律所指定存储，并与数据库备份按同一时间窗口归档。
- 备份调度计划由律所运维安装到 Windows Task Scheduler、Linux cron、CI 或服务器任务计划器，并归档 `backup:task:check` 输出、`backup:run:check` 输出、运行账号、日志目录、最近成功备份和安装复核证据。
- 数据库和 Storage 备份完成后执行离线加密核对，并把加密归档校验值、执行人、复核人、密钥标识和副本位置纳入运维日志。
- 备份、演练或加密任一环节失败时，必须有责任人、运维日志记录、升级时限和人工补救流程。
- 加密备份进入异地或跨云镜像前，必须记录目的地标识、副本数量、RPO 和恢复抽检周期，但不得记录访问密钥、token、连接串或恢复口令。
- 每次升级前生成数据库备份和当前构建版本记录。
- 每月至少做一次恢复演练，先生成 `backup:rehearsal` 文件级报告，再确认能恢复到新环境并完成管理员登录、任务列表读取和附件下载。

第一版脚本不会自动安装系统定时任务、不会自动加密备份目录、不会自动创建 Storage bucket、不会自动判断目标库是否为空，也不会调用 Supabase Management API 触发 PITR，也不会执行真实跨云上传或发送真实告警通知。后续仍需补自动调度安装、自动加密执行、供应商级镜像同步和真实通知平台集成。

## 升级与回滚

升级建议流程：

1. 记录当前版本、环境变量清单和数据库迁移状态。
2. 备份数据库和交付附件。
3. 在预生产环境应用新迁移并运行 `npm run verify`、`npm run verify:rls` 和必要的 smoke。
4. 正式环境停写或进入维护窗口。
5. 应用迁移、发布新构建、启动服务。
6. 复核登录、用户、任务、客户大屏、结算、资金和审计页面。

如果升级失败，优先回滚应用版本；如果迁移已经改变数据结构，需要按本次升级前备份执行数据库恢复或手工修正。涉及客户确认、结算、扣罚资金流水的数据问题不得直接删除，应先导出审计记录并由律所确认处理口径。

升级迁移第一版 runbook 和只读核对脚本见 `docs/upgrade-runbook.md` 与 `npm run upgrade:check`。该脚本不会连接远端 Supabase，也不会执行迁移。

## 运维交接清单

- 管理员账号已改密。
- 业务用户不再使用默认密码。
- `.env.local` 或服务器 Secret 中没有 `NEXT_PUBLIC_SERVICE_ROLE` 这类公开密钥。
- HTTPS、域名、反向代理、请求体大小和日志保留策略已配置。
- `npm run private:check` 通过。
- `npm run verify:rls` 通过。
- 真实闭环 smoke 已在允许写入的验收库通过。
- 审计日志导出和审计报表可用。
- 运维日志责任人、保留期、复核周期和禁止记录敏感信息边界已确认。
- 错误日志级别、保留期、critical 告警和脱敏规则已确认。
- 性能监控责任人、复核周期、样本保留期和核心指标口径已确认。
- 多律所租户隔离核对、跨组织负向测试计划和组织开通边界已确认。
- 备份责任人、恢复窗口和升级审批人已确认。
- 备份离线加密工具、密钥保管人、副本数量和抽样解密演练计划已确认。
- 备份失败告警责任人、渠道、静默阈值和升级时限已确认。
- 最终交付证据索引、客户签收引用、剩余风险和本期暂缓范围已归档。
