# 备份异地/跨云镜像核对

## 目标

`npm run backup:mirror:check` 用于私有化交付前生成备份异地/跨云镜像核对清单，覆盖责任人、镜像目的地标识、副本数量、RPO、恢复抽检周期和交接证据。

第一版只做只读核对，不上传备份文件，不调用 S3、NAS、对象存储或云厂商 SDK，不连接线上 Supabase，不创建 bucket，不保存访问密钥、token、数据库连接串或恢复口令。

## 使用方式

```bash
npm run backup:mirror:check
```

默认未配置责任人和目的地标识时会返回阻断项。正式交接前至少补齐：

```bash
LEXOS_BACKUP_MIRROR_OWNER=律所运维负责人
LEXOS_BACKUP_MIRROR_TARGET=manual-offsite
LEXOS_BACKUP_MIRROR_DESTINATION_REF=offsite-vault-01
LEXOS_BACKUP_MIRROR_MIN_COPIES=2
LEXOS_BACKUP_MIRROR_RPO_HOURS=24
LEXOS_BACKUP_MIRROR_VERIFY_INTERVAL_DAYS=30
```

`LEXOS_BACKUP_MIRROR_DESTINATION_REF` 只填写目的地标识，例如异地保险箱编号、离线硬盘编号、NAS 归档路径代号或对象存储 bucket 代号。不要填写 access key、secret、token、连接串、service role 或任何短信服务配置。

## 镜像前置顺序

1. 执行数据库备份和 Storage 对象备份。
2. 执行 `npm run backup:rehearsal -- --latest` 生成文件级恢复演练报告。
3. 执行 `npm run backup:encrypt:check`，确认只镜像加密后的备份材料。
4. 执行 `npm run backup:alert:check`，确认镜像失败或静默超时有人工告警交接。
5. 执行 `npm run backup:mirror:check`，输出异地/跨云镜像核对清单。

## 验收证据

- 数据库备份 ID、Storage 备份 ID 和恢复演练报告 ID 能一一对应。
- 异地副本包含 `manifest.json`、`storage-manifest.json`、对象数量或校验摘要。
- 运维日志记录镜像责任人、目的地标识、副本数量、镜像时间和抽检周期。
- 凭据、访问密钥、恢复确认口令和 service role 不进入镜像核对清单。
- 至少每 90 天从异地副本抽取一次恢复演练材料；建议 30 天一轮。

## 阻断规则

- 未配置 `LEXOS_BACKUP_MIRROR_OWNER`。
- 未配置 `LEXOS_BACKUP_MIRROR_DESTINATION_REF`。
- 目的地标识疑似包含 token、secret、连接串、访问密钥或短信服务信息。
- `LEXOS_BACKUP_MIRROR_MIN_COPIES` 小于 2。
- `LEXOS_BACKUP_MIRROR_RPO_HOURS` 大于 48。
- `LEXOS_BACKUP_MIRROR_VERIFY_INTERVAL_DAYS` 大于 90。

## 当前边界

当前版本不做真实跨云镜像，不执行对象上传，不安装系统任务，不修改 Supabase 项目，不新增加密执行器，也不接入真实通知平台。跨云自动同步、供应商 SDK、WORM/对象锁、带宽限速和真实告警发送仍属于后续任务。
