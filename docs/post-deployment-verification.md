# Lexos 部署后回归核对清单

`npm run postdeploy:check` 用于在正式部署完成后，生成一份只读的上线后回归核对清单。它覆盖运行健康、登录与核心页面、真实业务闭环复核、RLS 边界、客户附件下载、审计与结算导出、备份恢复、日志性能、回滚窗口和观察期签收。

## 使用方式

```powershell
npm.cmd run postdeploy:check
```

命令默认读取 `.env.local` 中的元数据，但不会输出密钥值、数据库连接串、service role key 或其他敏感内容。若缺少负责人、目标环境、发布版本、应用地址或回滚引用，会以非 0 退出码阻断。

## 必填元数据

```env
LEXOS_POST_DEPLOYMENT_OWNER=交付负责人
LEXOS_POST_DEPLOYMENT_ENVIRONMENT=律所生产环境
LEXOS_POST_DEPLOYMENT_RELEASE_VERSION=v1.0-rc1
LEXOS_POST_DEPLOYMENT_BASE_URL=https://lexos.example.com
LEXOS_POST_DEPLOYMENT_ROLLBACK_REF=rollback-20260610
LEXOS_POST_DEPLOYMENT_OBSERVATION_OWNER=运维负责人
```

`LEXOS_POST_DEPLOYMENT_ENVIRONMENT` 和 `LEXOS_POST_DEPLOYMENT_RELEASE_VERSION` 未设置时，会分别回退读取 `LEXOS_FINAL_ACCEPTANCE_ENVIRONMENT` 与 `LEXOS_FINAL_ACCEPTANCE_RELEASE_VERSION`。`LEXOS_POST_DEPLOYMENT_BASE_URL` 必须是完整的 `http` 或 `https` URL；如果是 `localhost` 或 `127.0.0.1`，只作为本地演练提示，不作为生产验收地址。

发布版本、回滚引用和应用地址不得包含 `token`、`secret`、数据库连接串、访问密钥或短信服务信息。

## 覆盖范围

- `/api/health` 健康检查和首屏静态资源可访问性。
- 管理员登录、核心后台导航和律师个人工作台入口。
- `npm.cmd run private:check` 私有化交付自检复跑。
- `npm.cmd run smoke:real` 真实闭环 smoke 证据归档。
- `npm.cmd run verify:rls` RLS / Data API 负向验证。
- 客户交付附件授权下载复核，仍使用演示验证码链路，不接入真实短信。
- 审计报表、结算导出和批量确认留痕复核。
- `npm.cmd run backup:task:check`、`npm.cmd run backup:run:check` 与 `npm.cmd run backup:rehearsal` 证据复核。
- 运维日志、错误日志、性能阈值和观察期联系人。
- `npm.cmd run final:gate:check` 与 `npm.cmd run handover:evidence:check` 复跑。
- 回滚引用、回滚负责人、观察期和客户确认口径。

## 执行边界

- 本清单只输出部署后核对项，不自动访问线上接口。
- 不连接线上 Supabase，不执行 `supabase db push`。
- 不执行真实闭环 smoke，不写入客户、任务、反馈、结算、审计或 Storage 数据。
- `smoke:real` 仍是清单中的人工验收项，只能在允许写入的目标环境由负责人单独执行。
- 客户侧继续沿用 token + 手机号 + 演示验证码链路，不接入真实短信。
- 真实短信、新手保护期、新兵引流池、证据矩阵和 AI 辅助功能仍不在本期交付范围。

## 归档建议

建议在最终签收证据包中保留：

```text
release/
  post-deployment-verification.md
runtime/
  health-check.txt
  first-screen.png
security/
  rls-direct-access.txt
storage/
  customer-download-check.md
exports/
  audit-and-settlement-export.md
backup/
  schedule-and-rehearsal.md
operations/
  logs-performance-observation.md
signoff/
  rollback-window.md
```

证据包不应进入代码仓库；默认 `reports/` 已被 `.gitignore` 忽略，正式交付时应由交付负责人放入律所确认的归档介质。
