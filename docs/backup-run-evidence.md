# Lexos 备份任务运行证据核对

`npm run backup:run:check` 用于在备份系统任务安装后，核对上线交接所需的运行证据。它关注最近成功备份时间、任务导出或截图引用、运维日志引用和恢复演练引用，帮助判断计划任务是否真的被运维接手并成功运行过。

当前第一版只读取环境变量或命令行参数中的证据引用，不读取日志原文，不上传证据，不执行真实备份，不连接线上 Supabase，不写入业务数据。

## 使用方式

```bash
npm run backup:task:check
npm run backup:run:check
```

PowerShell 示例：

```powershell
$env:LEXOS_BACKUP_RUN_OWNER="运维负责人"
$env:LEXOS_BACKUP_RUN_LAST_SUCCESS_AT="2026-06-10T02:30:00.000Z"
$env:LEXOS_BACKUP_RUN_TASK_EXPORT_REF="task-export-20260610"
$env:LEXOS_BACKUP_RUN_LOG_REF="ops-log-20260610-backup"
$env:LEXOS_BACKUP_RUN_REHEARSAL_REF="rehearsal-20260610"
npm run backup:run:check
```

命令行参数示例：

```bash
npm run backup:run:check -- --owner=运维负责人 --last-success-at=2026-06-10T02:30:00.000Z --task-export-ref=task-export-20260610 --log-ref=ops-log-20260610-backup
```

## 环境变量

- `LEXOS_BACKUP_RUN_OWNER`：备份运行证据责任人，正式交接前必填。
- `LEXOS_BACKUP_RUN_LAST_SUCCESS_AT`：最近成功备份时间，必须是可解析的 ISO 时间。
- `LEXOS_BACKUP_RUN_MAX_AGE_HOURS`：最近成功备份最大允许间隔，默认 48 小时，不能小于 12 小时。
- `LEXOS_BACKUP_RUN_TASK_EXPORT_REF`：Windows Task Scheduler / Linux cron 导出、截图或工单引用，必填。
- `LEXOS_BACKUP_RUN_LOG_REF`：运维日志引用，必填。
- `LEXOS_BACKUP_RUN_REHEARSAL_REF`：最近一次恢复演练报告引用，建议填写。

以上字段只填写证据编号、归档引用、工单号或受控目录编号，不能填写 token、secret、数据库连接串、service role、访问密钥或短信服务配置。

## 阻断规则

命令在以下情况下返回非 0 退出码：

- 未指定责任人。
- 未提供最近成功备份时间。
- 最近成功备份时间无法解析，或晚于当前核对时间。
- 最近成功备份时间超过最大允许间隔。
- 未提供计划任务导出/截图引用。
- 未提供运维日志引用。
- 责任人或证据引用包含疑似密钥、连接串、token 或短信服务线索。

## 证据清单

- 系统计划任务导出或截图：任务名称、运行账号、调度时间、命令摘要、安装人和复核人。
- 最近成功备份记录：成功时间、数据库 manifest、Storage manifest、退出码、执行人或任务账号。
- 运维日志记录：日志引用、stdout/stderr 摘要、失败处理路径、最近成功时间。
- 恢复演练报告引用：演练 ID、数据库备份目录、Storage 备份目录、文件缺失为 0。

## 交付边界

本命令不能替代真实备份、真实恢复或运维平台监控。正式上线后仍需由运维负责人定期复核任务计划器运行状态、备份目录容量、告警触发记录和恢复演练结果。
