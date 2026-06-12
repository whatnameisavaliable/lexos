# Lexos 数据库备份与恢复

## 目标与边界

本文件记录 Lexos 第一版数据库备份与恢复自动化方案。当前能力面向私有化交付和验收环境，提供逻辑备份脚本、恢复演练脚本和人工核对清单。

当前第一版数据库脚本只处理 PostgreSQL / Supabase 数据库逻辑备份。Supabase Storage 中的交付附件对象本体不在数据库备份里，数据库只保存附件元数据；附件对象备份已在 `docs/storage-backup.md` 和 `npm run backup:storage` / `npm run restore:storage` 中单独落地第一版。

## 官方边界核对

本轮已核对 Supabase 官方备份文档和本机 Supabase CLI 帮助信息：

- Supabase Pro、Team、Enterprise 项目提供日备份，PITR 可提供更细粒度恢复点。
- 免费或私有化场景应定期导出逻辑备份并保存离线副本。
- 数据库备份不包含 Storage API 对象本体，Storage 对象需使用独立对象备份脚本或律所对象存储策略。
- 本机 CLI 当前支持 `supabase db dump --db-url --file --schema --data-only --use-copy --role-only --dry-run`。

因此 Lexos 第一版采用“应用级逻辑备份 + manifest + 恢复演练”的方式落地，不替代 Supabase Dashboard 日备份、PITR 或律所基础设施层快照。

## 环境变量

备份和恢复脚本使用以下变量：

```env
LEXOS_DATABASE_URL=postgresql://postgres@你的主机:5432/postgres
LEXOS_BACKUP_DIR=backups
LEXOS_BACKUP_SCHEMAS=public,auth,storage
LEXOS_BACKUP_DRY_RUN=true
LEXOS_RESTORE_BACKUP_DIR=
LEXOS_RESTORE_EXECUTE=false
LEXOS_RESTORE_CONFIRM=
LEXOS_RESTORE_APPLY_ROLES=false
```

说明：

- `LEXOS_DATABASE_URL` 必须是 Postgres 直连连接串，密码中如有特殊字符需要 percent-encoded。
- `LEXOS_BACKUP_SCHEMAS` 默认包含 `public`、`auth`、`storage`，用于覆盖业务表、Auth 用户和 Storage 元数据。
- 备份文件包含客户、案件、任务、结算、审计、Auth 用户等敏感数据，必须离线加密保存。
- `backups/` 已加入 `.gitignore`，不得提交备份文件。

## 备份演练

先执行演练，确认命令计划和连接串打码效果：

```bash
npm run backup:db -- --dry-run
```

或者：

```powershell
$env:LEXOS_BACKUP_DRY_RUN="true"
npm run backup:db
```

演练模式会输出将要执行的 `supabase db dump` 命令，但不会生成备份文件。

## 执行备份

配置真实 `LEXOS_DATABASE_URL` 后执行：

```bash
npm run backup:db
```

默认输出目录类似：

```text
backups/lexos-db-20260610-153000/
```

目录内容：

- `schema.sql`：指定 schema 的结构备份。
- `data.sql`：指定 schema 的数据备份，使用 COPY 方式导出。
- `roles.sql`：角色定义备份。
- `manifest.json`：备份清单、schema、文件列表、打码后的来源连接串和安全提示。

备份完成后需要人工执行：

1. 将备份目录复制到律所指定离线介质或受控对象存储。
2. 对备份目录进行加密。
3. 记录备份时间、执行人、数据库环境、应用版本和校验结果。
4. 执行 `npm run backup:storage`，单独备份 `lexos-deliverables` Storage bucket 中的附件对象。

## 恢复演练

恢复脚本默认只做演练：

```bash
npm run restore:db -- --backup-dir=backups/lexos-db-20260610-153000
```

或：

```powershell
$env:LEXOS_RESTORE_BACKUP_DIR="backups/lexos-db-20260610-153000"
npm run restore:db
```

演练会检查：

- 备份目录是否存在。
- `manifest.json`、`schema.sql`、`data.sql` 是否齐全。
- 是否请求恢复 `roles.sql`。
- 实际执行时是否已经设置确认口令。

## 执行恢复

恢复建议只在空库、新建验收库或维护窗口中的目标库执行。正式执行前必须先完成当前目标库备份。

执行恢复需要显式确认：

```powershell
$env:LEXOS_DATABASE_URL="postgresql://postgres@目标主机:5432/postgres"
$env:LEXOS_RESTORE_BACKUP_DIR="backups/lexos-db-20260610-153000"
$env:LEXOS_RESTORE_CONFIRM="RESTORE_LEXOS_DATABASE"
npm run restore:db -- --execute
```

默认恢复顺序：

1. `schema.sql`
2. `data.sql`

如果需要尝试恢复角色定义，追加：

```bash
npm run restore:db -- --backup-dir=backups/lexos-db-20260610-153000 --execute --apply-roles
```

注意：Supabase 官方文档提示日备份不保存自定义角色密码；逻辑恢复后涉及自定义角色、认证配置和外部登录设置时，仍需人工复核和重置。

## 恢复后核对

恢复完成后执行：

```bash
npm run private:check
npm run verify:rls
```

然后在允许写入验收库的环境中执行：

```bash
npm run smoke:real
```

人工核对：

- 管理员可登录并完成用户列表读取。
- 客户、任务、结算、资金、风控、审计页面可读取。
- 客户确认页验证码链路可访问。
- 私有交付附件元数据存在，并已按对象存储备份恢复策略恢复对象本体。
- 审计日志导出和审计报表可用。

## Storage 对象配套备份

数据库备份完成后，继续执行：

```bash
npm run backup:storage -- --dry-run
npm run backup:storage
```

Storage 恢复默认也是演练：

```bash
npm run restore:storage -- --backup-dir=backups/lexos-storage-20260610-153000
```

实际恢复必须追加 `--execute` 并设置 `LEXOS_STORAGE_RESTORE_CONFIRM=RESTORE_LEXOS_STORAGE`。完整步骤见 `docs/storage-backup.md`。

## 调度计划与演练报告

数据库和 Storage 备份脚本就绪后，生成运维调度计划：

```bash
npm run backup:schedule
npm run backup:task:check
npm run backup:run:check
```

需要归档计划时追加 `--write`，默认写入 `backups/reports`。

完成一组数据库备份和 Storage 备份后，可生成恢复演练报告：

```bash
npm run backup:rehearsal -- --latest
```

也可以显式传入目录：

```bash
npm run backup:rehearsal -- --db-backup-dir=backups/lexos-db-20260610-023000 --storage-backup-dir=backups/lexos-storage-20260610-023500
```

演练报告只校验 manifest 和必要文件，不执行数据库写入或 Storage 上传。完整调度和演练制度见 `docs/backup-operations.md`，系统任务安装核对见 `docs/backup-task-installation.md`，运行证据核对见 `docs/backup-run-evidence.md`。

## 当前限制

- 第一版不调用 Supabase Management API 自动触发 Dashboard 备份或 PITR 恢复。
- 第一版不自动判断目标库是否为空。
- 第一版只生成定时调度计划、安装核对清单和运行证据核对清单，不自动安装系统定时任务，需要由律所运维、CI 或服务器任务计划器定期调用。
- 第一版不自动加密备份目录，加密与离线保管由运维流程执行。
