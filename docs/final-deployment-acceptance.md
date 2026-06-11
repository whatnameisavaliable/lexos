# 最终部署验收

## 目标

`npm run final:acceptance` 用于生成 Lexos 最终部署验收报告。它汇总私有化自检、上线 runbook、升级迁移、备份恢复、Storage、日志、性能、租户隔离、真实闭环 smoke 和人工签收证据。

`npm run final:gate:check` 用于最终签收前聚合 `private:check`、`launch:check`、`upgrade:check`、`final:acceptance`、`release:package:check`、`handover:evidence:check`、`postdeploy:check` 和 `release:sensitive:check` 的本地只读结果，集中输出阻断项、提示项和人工复核项。

第一版只生成验收报告，不连接线上 Supabase，不执行迁移，不写入业务数据，不上传备份文件，不安装系统任务，不调用对象存储 SDK，也不保存任何访问密钥。

## 使用方式

正式验收前需要设置验收元数据：

```bash
LEXOS_FINAL_ACCEPTANCE_OWNER=交付负责人
LEXOS_FINAL_ACCEPTANCE_ENVIRONMENT=验收环境
LEXOS_FINAL_ACCEPTANCE_RELEASE_VERSION=v1.0-rc1
LEXOS_FINAL_ACCEPTANCE_EVIDENCE_REF=acceptance-20260610
npm run final:acceptance
npm run final:gate:check
npm run handover:evidence:check
npm run postdeploy:check
```

如果缺少负责人、目标环境、发布版本或证据归档编号，命令会返回阻断项。

`LEXOS_FINAL_ACCEPTANCE_EVIDENCE_REF` 只能填写工单编号、归档目录或证据包编号，不得填写 token、secret、数据库连接串、service role、访问密钥、恢复口令或短信服务配置。

## 归档证据包

最终验收报告通过后，可以生成本地证据包：

```bash
npm run final:acceptance:archive
```

默认输出到 `reports/final-acceptance`，生成 Markdown 和 JSON 两个文件。该目录已被 `.gitignore` 忽略，避免把验收证据、环境名或人工备注误提交到代码仓库。

可用环境变量或命令参数指定输出目录：

```bash
LEXOS_FINAL_ACCEPTANCE_ARCHIVE_DIR=reports/final-acceptance npm run final:acceptance:archive
npm run final:acceptance:archive -- --output-dir=reports/final-acceptance --no-write
```

`--no-write` 只演练路径、文件名和阻断项，不写入文件。归档目录必须位于当前项目工作区内，不能位于 `public`、`.next`、`app` 或 `src` 等可发布/源码目录，也不能包含 token、secret、连接串、访问密钥或短信服务信息。

## 最终验收顺序

1. `npm run private:check`：确认真实 Supabase 模式、变量、迁移文件、脚本和交付文档完整。
2. `npm run launch:check`：生成上线前只读 runbook。
3. `npm run upgrade:check`：生成升级迁移核对计划。
4. `npm run typecheck`、`npm test`、`npm run build`：确认质量门槛。
5. `npm run verify:rls`：确认 anon/authenticated 不能直接读内部表。
6. `npm run backup:schedule`、`npm run backup:task:check`、`npm run backup:run:check`、`npm run backup:rehearsal -- --latest`、`npm run backup:encrypt:check`、`npm run backup:alert:check`、`npm run backup:mirror:check`：归档备份调度、系统任务安装核对、运行证据、演练、加密、告警和异地镜像证据。
7. `npm run ops:log:check`、`npm run error:log:check`、`npm run perf:check`、`npm run tenant:check`：归档运维、错误、性能和租户隔离证据。
8. 在允许写入的验收库执行 `npm run smoke:real`，归档真实闭环结果。
9. 执行 `npm run final:acceptance`，生成最终验收报告。
10. 执行 `npm run final:acceptance:archive`，归档 Markdown + JSON 证据包并由负责人签收。
11. 执行 `npm run handover:evidence:check`，生成最终交付证据索引，确认交付负责人和客户签收引用已留痕。
12. 执行 `npm run final:gate:check`，汇总所有本地只读验收门禁，确认不存在阻断项。
13. 执行 `npm run postdeploy:check`，生成部署后回归核对清单，确认上线后健康检查、核心页面、RLS、客户附件、导出审计、备份恢复、日志性能、回滚窗口和观察期证据口径。
14. 执行 `npm run release:package:check`，核对私有化交付包清单，确认源码、脚本、迁移、测试和文档齐全，并排除 `.env.local`、`reports`、`backups`、`node_modules`、`.next` 等本地路径。
15. 执行 `npm run release:sensitive:check`，扫描交付允许范围内的文本文件，确认不存在疑似真实密钥、私钥、数据库连接串或访问令牌，并人工复核真实短信、AI 辅助、新手保护期、新兵引流池和证据矩阵相关线索。

## 必须归档的证据

- 发布版本、Git commit、构建时间、部署环境和回滚目标版本。
- 目标 Supabase 项目 ref、迁移应用记录、RLS 验证输出。
- 数据库备份、Storage 备份、恢复演练报告、离线加密清单、告警清单和异地镜像清单。
- 真实闭环 smoke 的任务 ID、结算 ID 和最终 `confirmed` 状态。
- 核心页面人工验收记录：登录、用户、客户、任务、客户大屏、结算、资金、审计、风控、权限、参数。
- 运维联系人、升级/回滚负责人、备份负责人、异常处置负责人。
- 剩余风险和暂缓范围确认。
- 交付包敏感内容扫描输出，以及人工复核项处理结论。

## 会写入数据的命令

`npm run smoke:real` 会写入客户、任务、反馈和结算记录，只能在验收库或明确允许写入演示数据的环境执行。最终验收报告命令本身不会写入业务数据。

## 当前暂缓范围

最终验收第一版继续不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。客户侧访问继续使用现有 token + 手机号 + 演示验证码机制；与短信 MFA、短信服务商、短信审计相关能力仍放到后续版本。

## 当前边界

- 不执行 `supabase db push`。
- 不自动判断远端迁移是否已应用。
- 不自动启动生产服务或部署 Vercel。
- 不执行真实数据库恢复。
- 不执行真实 Storage 恢复。
- 不执行真实跨云镜像。
- 不发送真实通知。
- 不把归档证据包提交到代码仓库。

正式上线签收必须由交付负责人基于目标环境的实际输出和人工验收记录完成。
