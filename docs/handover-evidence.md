# Lexos 最终交付证据索引

`npm run handover:evidence:check` 用于在最终部署验收和客户签收前，生成一份结构化的证据留存清单。它把质量门槛、迁移/RLS、备份恢复、Storage 交付附件、运维日志、租户边界、真实闭环 smoke、交付包扫描和客户签收材料统一到一张索引里，便于归档和签收复核。

## 执行边界

- 只读取环境变量名称和值用于元数据判断，不输出密钥值。
- 不连接线上 Supabase。
- 不执行 `supabase db push`。
- 不运行 `smoke:real`，不写入客户、任务、反馈或结算记录。
- 不生成压缩交付包，不上传外部存储。
- 不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。

## 命令

```powershell
npm.cmd run handover:evidence:check
```

默认缺少交付负责人或客户签收引用时会以非 0 退出码阻断：

```powershell
$env:LEXOS_HANDOVER_OWNER="交付负责人"
$env:LEXOS_HANDOVER_CLIENT_SIGNOFF_REF="signoff-20260610"
npm.cmd run handover:evidence:check
```

建议同时补齐以下责任人，便于交接留痕：

```powershell
$env:LEXOS_HANDOVER_RELEASE_APPROVER="发布批准人"
$env:LEXOS_HANDOVER_OPERATIONS_OWNER="运维负责人"
$env:LEXOS_HANDOVER_SECURITY_REVIEWER="安全复核人"
```

## 必填元数据

- `LEXOS_HANDOVER_OWNER`：最终交付证据索引负责人。
- `LEXOS_HANDOVER_CLIENT_SIGNOFF_REF`：客户签收编号、签收文件引用或交付工单编号。

`LEXOS_HANDOVER_CLIENT_SIGNOFF_REF` 只能填写归档编号或路径，不能包含 `token`、`secret`、数据库连接串、访问密钥、短信服务信息或其他敏感内容。

## 证据项

索引覆盖以下证据：

- 发布基线与版本记录。
- `npm.cmd run typecheck`。
- `npm.cmd test`。
- `npm.cmd run lint` 与 `npm.cmd run build`。
- `npm.cmd run private:check`。
- `npm.cmd run launch:check`。
- `npm.cmd run verify:rls`。
- `npm.cmd run backup:task:check`、`npm.cmd run backup:run:check` 与 `npm.cmd run backup:rehearsal`。
- `npm.cmd run backup:encrypt:check`、`npm.cmd run backup:alert:check`、`npm.cmd run backup:mirror:check`。
- Storage 私有交付附件和备份 manifest。
- `npm.cmd run ops:log:check`、`npm.cmd run error:log:check`、`npm.cmd run perf:check`。
- `npm.cmd run tenant:check`。
- `npm.cmd run smoke:real`。
- `npm.cmd run release:package:check` 与 `npm.cmd run release:sensitive:check`。
- `npm.cmd run final:gate:check`。
- `npm.cmd run postdeploy:check`。
- 客户签收与剩余风险确认。

其中 `smoke:real` 会写入验收库，只能由交付负责人在允许写入的验收环境单独执行。证据索引只提示归档口径，不自动运行该命令。

## 归档建议

建议在最终签收证据包中保留以下结构：

```text
release/
  final-gate.md
  post-deployment-verification.md
  package-and-sensitive-scan.md
quality/
  typecheck.txt
  node-test.txt
  lint-build.txt
deployment/
  private-check.md
  launch-readiness.md
security/
  rls-direct-access.txt
  tenant-isolation.md
backup/
  rehearsal-report.md
  hardening-checks.md
storage/
  deliverables-storage.md
operations/
  logging-and-performance.md
smoke/
  real-flow.txt
signoff/
  client-signoff.md
```

证据包不应进入代码仓库。默认 `reports/` 已被 `.gitignore` 忽略，正式交付时应由交付负责人放入律所确认的归档介质。
