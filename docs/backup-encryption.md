# Lexos 备份离线加密 Runbook

## 目标与边界

本文件用于私有化交付时核对数据库备份和 Storage 对象备份的离线加密要求。当前第一版只生成加密策略、命令示例和人工交接清单，不读取真实备份文件，不执行压缩或加密，不保存密钥，不上传外部存储，也不安装系统级任务。

正式环境中的备份文件可能包含客户资料、案件信息、Auth 用户、附件元数据和交付附件对象本体，必须在离线或受控介质中加密保存。

## 核对命令

```bash
npm run backup:encrypt:check
```

该命令会读取环境变量并输出加密核对计划。默认使用 `manual` 方式，表示由律所运维按内部工具完成加密交接。

## 环境变量

```env
LEXOS_BACKUP_ENCRYPTION_METHOD=manual
LEXOS_BACKUP_ENCRYPTION_KEY_REF=
LEXOS_BACKUP_ENCRYPTED_DIR=backups/encrypted
LEXOS_BACKUP_ENCRYPTED_COPY_COUNT=2
LEXOS_BACKUP_OFFSITE_COPY_REQUIRED=true
```

说明：

- `LEXOS_BACKUP_ENCRYPTION_METHOD`：支持 `manual`、`age`、`gpg`、`7z`。
- `LEXOS_BACKUP_ENCRYPTION_KEY_REF`：只填写密钥标识、证书指纹、收件人 ID 或保管位置，不填写私钥、口令、service role 或数据库连接串。
- `LEXOS_BACKUP_ENCRYPTED_DIR`：加密归档目录，不得位于 `public`、`.next`、`out` 或 `app` 等可能被静态服务或构建产物暴露的位置。
- `LEXOS_BACKUP_ENCRYPTED_COPY_COUNT`：加密副本数量，正式交付建议不少于 2。
- `LEXOS_BACKUP_OFFSITE_COPY_REQUIRED`：是否要求异地或离线副本，正式生产环境建议保持 `true`。

## 推荐流程

1. 执行数据库和 Storage 备份：

```bash
npm run backup:db
npm run backup:storage
```

2. 生成恢复演练报告：

```bash
npm run backup:rehearsal -- --latest
```

3. 执行离线加密核对：

```bash
npm run backup:encrypt:check
```

4. 由运维使用律所指定工具加密备份目录，并记录归档文件的 SHA-256、大小、备份时间、执行人和复核人。

5. 至少保留一份本地受控介质和一份离线或异地加密副本。

6. 定期抽样解密到隔离环境，再执行 `restore:db`、`restore:storage`、`verify:rls` 和真实闭环 smoke。

## 工具选择

第一版只输出命令示例，不强制安装工具。

- `age`：适合现代文件加密和清晰的收件人密钥管理。
- `gpg`：适合已有 PGP 运维体系的律所。
- `7z`：适合 Windows 运维环境，但必须启用文件名加密并使用强口令。
- `manual`：表示使用律所已有离线加密流程，由运维另行记录。

## 禁止事项

- 不得把私钥、口令、数据库连接串或 service role 写入 `.env.example`、README、工单、截图或 Git。
- 不得把未加密备份放入 Web 静态目录、公开对象存储或共享网盘公开链接。
- 不得只备份数据库而忽略 Storage 对象本体。
- 不得在生产库直接做恢复验证；恢复演练应先在隔离验收环境执行。

## 与现有备份脚本的关系

`backup:db` 负责数据库逻辑备份，`backup:storage` 负责交付附件对象备份，`backup:rehearsal` 负责文件级恢复演练报告，`backup:encrypt:check` 负责离线加密交接核对。

当前第一版不会自动串联这些命令。正式上线前应由运维负责人把备份、演练、加密、异地副本和抽样恢复写入运维制度。
