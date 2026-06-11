# Lexos 备份调度与恢复演练报告

## 目标与边界

本文件记录 Lexos 第一版备份调度计划和恢复演练报告方案。它建立在以下能力之上：

- 数据库逻辑备份：`npm run backup:db`
- 数据库恢复演练：`npm run restore:db`
- Storage 对象备份：`npm run backup:storage`
- Storage 恢复演练：`npm run restore:storage`

本轮新增的能力是：

- `npm run backup:schedule`：生成每日备份和周期性恢复演练的调度计划，包含 Windows Task Scheduler 和 Linux cron 示例。
- `npm run backup:task:check`：生成系统任务人工安装核对清单，覆盖运行账号、日志目录、安装证据和安装后复核。
- `npm run backup:run:check`：生成备份任务运行证据核对清单，覆盖最近成功备份时间、任务导出/截图引用、日志引用和演练引用。
- `npm run backup:rehearsal`：校验数据库备份目录和 Storage 备份目录，并生成可归档的恢复演练报告。

当前第一版不会自动安装系统定时任务，不会自动执行真实恢复，不会连接 Supabase Management API，也不会自动加密或上传备份目录。正式环境仍需由律所运维在受控账号下安装计划任务，并纳入审批、日志、离线加密、失败告警和异地保管制度。系统任务安装核对见 `docs/backup-task-installation.md` 和 `npm run backup:task:check`，运行证据核对见 `docs/backup-run-evidence.md` 和 `npm run backup:run:check`，离线加密核对见 `docs/backup-encryption.md` 和 `npm run backup:encrypt:check`，失败告警核对见 `docs/backup-alerts.md` 和 `npm run backup:alert:check`，异地/跨云镜像核对见 `docs/backup-mirror.md` 和 `npm run backup:mirror:check`。

## 官方边界核对

本轮已按 Supabase 官方资料确认：

- Supabase Pro、Team、Enterprise 项目提供日备份；更细粒度恢复可考虑 PITR。
- 免费或私有化场景仍建议定期使用 `supabase db dump` 导出逻辑备份并保留离线副本。
- 数据库备份不包含 Storage API 对象本体，只包含对象元数据。
- Storage 是独立文件存储能力，交付附件对象需要单独备份和恢复。

因此 Lexos 的第一版运维策略采用“数据库逻辑备份 + Storage 对象备份 + 恢复演练报告 + 人工调度安装”的组合。

## 环境变量

```env
LEXOS_BACKUP_SCHEDULE_TIME=02:30
LEXOS_BACKUP_TIMEZONE=Asia/Shanghai
LEXOS_BACKUP_RETENTION_DAYS=30
LEXOS_BACKUP_REHEARSAL_INTERVAL_DAYS=30
LEXOS_BACKUP_REPORT_DIR=backups/reports
```

说明：

- `LEXOS_BACKUP_SCHEDULE_TIME` 使用 `HH:mm` 24 小时格式。
- `LEXOS_BACKUP_RETENTION_DAYS` 第一版建议不少于 30 天，脚本会阻断小于 7 天的配置。
- `LEXOS_BACKUP_REHEARSAL_INTERVAL_DAYS` 第一版建议每 30 天至少演练一次，脚本会阻断小于 7 天的配置。
- `LEXOS_BACKUP_REPORT_DIR` 默认在 `backups/reports`，已被 `.gitignore` 覆盖，不应提交到 Git。

## 生成调度计划

执行：

```bash
npm run backup:schedule
npm run backup:task:check
npm run backup:run:check
```

该命令只输出计划，不写文件。需要归档计划时执行：

```bash
npm run backup:schedule -- --write
```

默认会写入：

```text
backups/reports/backup-schedule-plan.json
backups/reports/backup-schedule-plan.md
```

计划中会包含：

- 每日数据库备份命令。
- 每日 Storage 对象备份命令。
- 周期性恢复演练报告命令。
- Windows Task Scheduler 示例。
- Linux cron 示例。

正式安装任务前，运维应把命令改造成符合律所服务器规范的脚本，至少补齐：

- 运行账号和权限。
- `.env.local` 或 Secret 注入方式。
- 日志文件路径。
- 失败告警责任人、渠道、静默阈值和升级时限。
- 备份目录离线加密、密钥标识、副本数量和异地保管方式。
- 异地/跨云镜像目的地标识、RPO、恢复抽检周期和凭据隔离说明。

## 生成恢复演练报告

如果已经有数据库和 Storage 备份目录，可显式传入：

```bash
npm run backup:rehearsal -- --db-backup-dir=backups/lexos-db-20260610-023000 --storage-backup-dir=backups/lexos-storage-20260610-023500
```

也可以让脚本从 `LEXOS_BACKUP_DIR` 下自动选择最新的数据库和 Storage manifest：

```bash
npm run backup:rehearsal -- --latest
```

默认会写入：

```text
backups/reports/lexos-rehearsal-YYYYMMDD-HHMMSS/
```

目录内容：

- `backup-rehearsal-report.json`
- `backup-rehearsal-report.md`

报告会校验：

- 数据库备份目录是否存在。
- `manifest.json`、`schema.sql`、`data.sql` 是否齐全。
- Storage 备份目录是否存在。
- `storage-manifest.json` 是否存在。
- Storage manifest 中列出的对象文件是否齐全。

报告不会执行：

- `psql` 数据库写入。
- Storage 对象上传。
- 真实 Supabase 查询。
- RLS 或业务 smoke。

## 完整恢复演练建议流程

第一版建议每月至少执行一次：

1. 在生产或验收环境完成一组数据库备份和 Storage 对象备份。
2. 执行 `npm run backup:rehearsal -- --latest`，生成文件级演练报告。
3. 准备隔离验收库和隔离 Storage bucket。
4. 在隔离环境执行 `npm run restore:db -- --execute` 和 `npm run restore:storage -- --execute`。
5. 执行 `npm run verify:rls`。
6. 在允许写入的验收库执行 `npm run smoke:real`。
7. 人工核对管理员登录、任务列表、客户大屏、附件下载、结算、资金和审计页面。
8. 将演练报告、恢复结果、执行人、执行时间、应用版本和异常处理记录归档。

## 当前限制

- 第一版只生成调度计划，不自动安装定时任务。
- 第一版报告只做文件级校验，不执行真实恢复。
- 第一版不自动清理过期备份目录，只输出保留天数策略。
- 第一版不自动执行加密，也不上传到异地存储；离线加密交接可先使用 `npm run backup:encrypt:check` 核对。
- 第一版不接入真实告警系统；可先用 `npm run backup:alert:check` 核对人工告警制度，真实通知平台仍需后续单独接入。
- 第一版不执行真实跨云镜像；可先用 `npm run backup:mirror:check` 核对目的地标识、副本数量、RPO 和抽检周期。
