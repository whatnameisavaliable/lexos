# Lexos 备份系统任务安装核对

`npm run backup:task:check` 用于在私有化部署或上线交接前，生成 Windows Task Scheduler / Linux cron 安装核对清单。它承接 `npm run backup:schedule` 的调度建议，补充运行账号、日志目录、安装证据和安装后复核要求；安装完成后可继续执行 `npm run backup:run:check` 核对最近成功运行证据。

当前第一版只输出本地只读核对清单，不调用 `schtasks`、`crontab`、`systemctl`，不创建系统任务，不连接线上 Supabase，不执行真实备份，不读取或输出密钥值。

## 使用方式

```bash
npm run backup:schedule
npm run backup:task:check
npm run backup:run:check
```

PowerShell 可临时指定运行账号和责任人：

```powershell
$env:LEXOS_BACKUP_TASK_OWNER="运维负责人"
$env:LEXOS_BACKUP_TASK_RUN_AS="lexos-backup-runner"
$env:LEXOS_BACKUP_TASK_PLATFORM="windows"
$env:LEXOS_BACKUP_TASK_LOG_DIR="ops-logs/backups"
npm run backup:task:check
```

也可以使用命令行参数覆盖：

```bash
npm run backup:task:check -- --owner=运维负责人 --run-as=lexos-cron --platform=linux --log-dir=ops-logs/backups
```

## 环境变量

- `LEXOS_BACKUP_TASK_OWNER`：系统任务安装和交接责任人，正式交接前必填。
- `LEXOS_BACKUP_TASK_RUN_AS`：计划任务运行账号，正式交接前必填。
- `LEXOS_BACKUP_TASK_PLATFORM`：`windows`、`linux` 或 `both`，默认 `both`。
- `LEXOS_BACKUP_TASK_LOG_DIR`：备份任务日志目录，默认 `ops-logs/backups`。

责任人、运行账号和日志目录不能包含 token、secret、数据库连接串、service role、访问密钥或短信服务配置。日志目录不能位于 `public`、`app`、`src` 或 `.next` 等源码/发布目录。

## 核对内容

- 运行账号是否使用最小权限，并能读取运行环境、写入备份目录和日志目录。
- `.env.local` 或等效环境变量是否由服务器权限控制，密钥不进入系统任务命令行明文。
- stdout、stderr、退出码、最近成功备份时间和失败处理记录是否写入运维日志。
- Windows Task Scheduler 或 Linux cron 安装命令、任务名称、调度时间、安装人和复核人是否留痕。
- 安装后是否执行 `backup:run:check`、`backup:rehearsal`、`backup:alert:check` 和 `ops:log:check` 复核。

## 阻断规则

命令在以下情况下返回非 0 退出码：

- 未指定 `LEXOS_BACKUP_TASK_OWNER`。
- 未指定 `LEXOS_BACKUP_TASK_RUN_AS`。
- 责任人、运行账号或日志目录出现疑似密钥、连接串、token 或短信服务线索。
- 日志目录位于源码、发布或公开目录。
- 继承的 `backup:schedule` 调度计划存在阻断项，例如保留期或演练间隔过短。

## 交付边界

正式生产安装仍由律所运维在受控账号下执行。交付负责人应把本命令输出、`backup:schedule` 输出、任务计划器截图或导出文件、运行账号权限说明、首次手工触发结果和最近一次恢复演练报告一起归档。
