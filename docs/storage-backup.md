# Lexos Storage 交付附件对象备份与恢复

## 目标与边界

本文件记录 Lexos 第一版 Supabase Storage 对象备份与恢复方案。它用于补齐 `lexos-deliverables` 私有 bucket 中交付附件对象本体的备份，和 `docs/backup-restore.md` 中的数据库逻辑备份配套使用。

数据库备份会覆盖 `storage` schema 元数据，但不会包含 Storage 对象文件本体。因此正式私有化交付至少需要同时保留：

- 数据库逻辑备份：`npm run backup:db` 生成的 `schema.sql`、`data.sql`、`roles.sql` 和 `manifest.json`。
- Storage 对象备份：`npm run backup:storage` 生成的对象文件目录和 `storage-manifest.json`。

当前第一版不做定时调度、离线加密、病毒扫描、增量同步、跨云镜像或对象生命周期管理；这些仍由律所运维流程或后续版本补齐。

## 官方接口核对

本轮已按 Supabase 官方 JavaScript Storage 文档核对：

- `list` 可列出 bucket 某个路径下的文件和文件夹，并支持 `limit`、`offset`、`sortBy` 等分页选项。
- folder 条目的 `id`、`updated_at`、`created_at`、`last_accessed_at` 和 `metadata` 为 `null`，脚本据此递归目录。
- `download` 可从私有 bucket 下载指定完整路径的文件。
- `upload` 会把文件上传到已存在 bucket，`fileOptions` 支持 `contentType`、`upsert` 和 `metadata`。

因此第一版采用服务端 Node 脚本 + `SUPABASE_SERVICE_ROLE_KEY` 执行对象导出和恢复。service role 只在本地或服务器运维脚本中使用，不进入浏览器端。

## 环境变量

```env
NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
SUPABASE_SERVICE_ROLE_KEY=你的 service role key

LEXOS_STORAGE_BUCKET=lexos-deliverables
LEXOS_STORAGE_BACKUP_DIR=backups
LEXOS_STORAGE_BACKUP_DRY_RUN=true

LEXOS_STORAGE_RESTORE_BACKUP_DIR=
LEXOS_STORAGE_RESTORE_EXECUTE=false
LEXOS_STORAGE_RESTORE_CONFIRM=
LEXOS_STORAGE_RESTORE_UPSERT=false
```

说明：

- `LEXOS_STORAGE_BUCKET` 默认是 `lexos-deliverables`。
- `LEXOS_STORAGE_BACKUP_DIR` 默认是 `backups`，该目录已加入 `.gitignore`。
- `LEXOS_STORAGE_BACKUP_DRY_RUN=true` 时只输出计划，不连接 Supabase，不下载对象。
- `LEXOS_STORAGE_RESTORE_UPSERT=false` 是默认安全值，避免误覆盖目标 bucket 中同名对象。
- 真实恢复必须设置 `LEXOS_STORAGE_RESTORE_CONFIRM=RESTORE_LEXOS_STORAGE`。

## 备份演练

先执行演练：

```bash
npm run backup:storage -- --dry-run
```

演练模式只输出 bucket、备份目录、环境变量完整性和安全提示，不会列远端对象，也不会生成备份文件。

## 执行备份

确认 `NEXT_PUBLIC_SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY` 已配置后执行：

```bash
npm run backup:storage
```

默认输出目录类似：

```text
backups/lexos-storage-20260610-153000/
```

目录结构：

- `storage-manifest.json`：对象清单、bucket、对象数量、总字节数、对象元数据和安全提示。
- `objects/`：按 Supabase Storage 对象路径安全编码后的文件目录。

备份完成后需要人工执行：

1. 将备份目录复制到律所指定离线介质或受控对象存储。
2. 对备份目录加密。
3. 记录备份时间、执行人、Supabase 项目、应用版本、对象数量和校验结果。
4. 与同一时间点的数据库备份一起归档。

## 恢复演练

恢复默认只做演练：

```bash
npm run restore:storage -- --backup-dir=backups/lexos-storage-20260610-153000
```

演练会检查：

- 备份目录是否存在。
- `storage-manifest.json` 是否存在。
- manifest 中列出的本地对象文件是否齐全。
- 如果要真实执行，是否已设置 Supabase 变量和确认口令。

## 执行恢复

正式恢复前必须先确认目标 bucket 已存在并且处于私有模式。第一版脚本不会自动创建 bucket。

执行恢复需要显式确认：

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL="https://你的项目.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="你的 service role key"
$env:LEXOS_STORAGE_RESTORE_BACKUP_DIR="backups/lexos-storage-20260610-153000"
$env:LEXOS_STORAGE_RESTORE_CONFIRM="RESTORE_LEXOS_STORAGE"
npm run restore:storage -- --execute
```

如果确认要覆盖目标 bucket 中同名对象，追加：

```bash
npm run restore:storage -- --backup-dir=backups/lexos-storage-20260610-153000 --execute --upsert
```

默认不建议覆盖。正式恢复前应先恢复到验收 bucket 或新环境，完成附件下载核对后再进入生产窗口。

## 恢复后核对

Storage 对象恢复后，继续执行数据库恢复后核对流程：

```bash
npm run private:check
npm run verify:rls
```

在允许写入验收库的环境中执行：

```bash
npm run smoke:real
```

人工核对：

- 后台任务详情能看到交付附件元数据。
- 内部附件下载能生成短期 signed URL。
- 客户确认页在验证码校验后，已验收任务的附件下载入口可用。
- `task_deliverables.storage_bucket` 与 `storage_path` 对应的对象文件存在。
- 备份目录未被提交到 Git。

## 调度与演练报告

Storage 备份应与数据库备份使用同一业务时间窗口。生成调度计划：

```bash
npm run backup:schedule
npm run backup:task:check
npm run backup:run:check
```

完成数据库和 Storage 备份后，生成恢复演练报告：

```bash
npm run backup:rehearsal -- --latest
```

该报告只校验 manifest 和对象文件是否齐全，不执行真实上传。完整说明见 `docs/backup-operations.md`。

## 当前限制

- 第一版只处理 `lexos-deliverables` 单 bucket。
- 第一版不是增量备份，每次真实执行会导出当前 bucket 下全部对象。
- 第一版不会自动创建 bucket，不会自动修复 Storage policy。
- 第一版不会自动加密备份目录。
- 第一版只生成恢复演练报告、调度计划、安装核对清单和运行证据核对清单，不会自动安装系统级定时任务。
