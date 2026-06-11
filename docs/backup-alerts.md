# Lexos 备份失败告警 Runbook

## 目标与边界

本文件用于私有化交付时核对备份失败告警制度。当前第一版只生成告警规则、责任人、渠道、阈值和人工处置清单，不发送邮件、不发短信、不调用 webhook、不连接外部监控平台，也不连接线上 Supabase。

告警对象包括数据库备份、Storage 对象备份、恢复演练、离线加密副本和备份静默超时。

## 核对命令

```bash
npm run backup:alert:check
```

该命令会读取环境变量并输出告警核对结果。缺少责任人会阻断，因为正式生产环境不能存在无人接收的备份失败告警。

## 环境变量

```env
LEXOS_BACKUP_ALERT_OWNER=
LEXOS_BACKUP_ALERT_CHANNELS=operations-log
LEXOS_BACKUP_ALERT_MAX_SILENCE_HOURS=24
LEXOS_BACKUP_ALERT_ESCALATION_HOURS=4
```

说明：

- `LEXOS_BACKUP_ALERT_OWNER`：备份失败告警责任人或值班组。
- `LEXOS_BACKUP_ALERT_CHANNELS`：逗号分隔的渠道代号，支持 `operations-log`、`email-manual`、`webhook-manual`、`duty-phone-manual`。
- `LEXOS_BACKUP_ALERT_MAX_SILENCE_HOURS`：最长无成功备份/演练/加密交接记录的静默小时数，默认 24。
- `LEXOS_BACKUP_ALERT_ESCALATION_HOURS`：严重失败后升级处理时限，默认 4。

第一版的 `email-manual`、`webhook-manual` 和 `duty-phone-manual` 都是人工渠道登记，不会发送真实通知。真实短信服务和短信审计仍属于本期暂缓范围。

## 必须覆盖的失败场景

- 数据库备份失败：`backup:db` 退出码非 0、未生成 `manifest.json`，或缺少 `schema.sql` / `data.sql`。
- Storage 对象备份失败：`backup:storage` 退出码非 0、未生成 `storage-manifest.json`，或对象文件缺失。
- 恢复演练报告未通过：`backup:rehearsal` 输出阻断项，或数据库/Storage 备份时间窗口不一致。
- 离线加密副本缺失：`backup:encrypt:check` 未通过，或加密副本数量、异地副本、密钥标识未完成交接。
- 备份静默超时：超过设定静默阈值仍无成功备份、演练或加密交接记录。

## 记录要求

告警记录应写入运维日志，并至少包含：

- 时间。
- 脚本名称或规则 ID。
- 退出码或阻断项摘要。
- 备份目录或 bucket 摘要。
- 最近成功备份时间。
- 责任人和处理人。
- 下一步动作和复核时间。

不得记录：

- 数据库连接串。
- service role key。
- 恢复确认口令。
- 客户大屏 token。
- 客户案件材料或附件正文。
- 真实短信服务商密钥或通知 token。

## 推荐交接流程

1. 执行 `npm run backup:schedule`、`npm run backup:task:check` 和 `npm run backup:run:check`，确认定时计划、运行账号、日志目录和最近成功运行证据。
2. 执行 `npm run backup:rehearsal -- --latest`，确认文件级恢复演练。
3. 执行 `npm run backup:encrypt:check`，确认加密副本交接。
4. 执行 `npm run backup:alert:check`，确认责任人、渠道和升级时限。
5. 将四份输出与运维日志制度、错误日志制度、备份目录策略一起归档。

## 后续扩展

后续可在用户明确需要时接入邮件、企业微信、飞书、Webhook 或监控平台。但这些集成必须单独设计密钥管理、脱敏、重试和审计规则；真实短信通知仍不进入当前开发计划。
