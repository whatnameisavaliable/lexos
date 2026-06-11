# Lexos 最终部署验收门禁汇总

`npm run final:gate:check` 用于在最终签收前汇总本地只读交付门禁。它不会替代真实上线操作，而是把现有检查结果集中到一份 Markdown 报告中，帮助交付负责人一次性看到阻断项、提示项和人工复核项。

## 覆盖范围

当前门禁聚合以下检查：

- `npm.cmd run private:check`：私有化交付自检。
- `npm.cmd run launch:check`：上线前 runbook 核对。
- `npm.cmd run upgrade:check`：升级迁移核对。
- `npm.cmd run deploy:channel:check`：Vercel 部署通道、上传批准、`.vercelignore` 上传排除清单和目标环境核对。
- `npm.cmd run final:acceptance`：最终部署验收报告。
- `npm.cmd run release:package:check`：私有化交付包清单核对。
- `npm.cmd run handover:evidence:check`：最终交付证据索引与客户签收材料核对。
- `npm.cmd run postdeploy:check`：部署后回归核对清单。
- `npm.cmd run release:sensitive:check`：交付包敏感内容扫描。

门禁会为每个检查项输出状态、阻断项数量、提示或人工复核项数量，并把所有阻断项加上来源前缀，便于定位。

## 使用方式

```powershell
npm.cmd run final:gate:check
```

默认会读取 `.env.local` 注入环境变量，供最终验收元数据、交付包元数据和私有化模式规则判断使用。报告不会输出密钥值、数据库连接串、service role key 或其他敏感值。

若需要让最终门禁通过，通常需要补齐以下元数据：

```powershell
$env:LEXOS_FINAL_ACCEPTANCE_OWNER="交付负责人"
$env:LEXOS_FINAL_ACCEPTANCE_ENVIRONMENT="律所验收环境"
$env:LEXOS_FINAL_ACCEPTANCE_RELEASE_VERSION="v1.0-rc1"
$env:LEXOS_FINAL_ACCEPTANCE_EVIDENCE_REF="acceptance-20260610"
$env:LEXOS_DEPLOY_PROVIDER="vercel"
$env:LEXOS_DEPLOY_TARGET="preview"
$env:LEXOS_DEPLOY_METHOD="vercel-mcp"
$env:LEXOS_DEPLOY_APPROVED_TO_UPLOAD="true"
$env:LEXOS_DEPLOY_APPROVAL_REF="chat-20260610-preview-approval"
$env:LEXOS_RELEASE_PACKAGE_VERSION="v1.0-rc1"
$env:LEXOS_RELEASE_PACKAGE_TARGET_ENV="律所验收环境"
$env:LEXOS_RELEASE_PACKAGE_MAINTAINER="交付负责人"
$env:LEXOS_HANDOVER_OWNER="交付负责人"
$env:LEXOS_HANDOVER_CLIENT_SIGNOFF_REF="signoff-20260610"
$env:LEXOS_POST_DEPLOYMENT_OWNER="交付负责人"
$env:LEXOS_POST_DEPLOYMENT_ENVIRONMENT="律所验收环境"
$env:LEXOS_POST_DEPLOYMENT_RELEASE_VERSION="v1.0-rc1"
$env:LEXOS_POST_DEPLOYMENT_BASE_URL="https://lexos.example.com"
$env:LEXOS_POST_DEPLOYMENT_ROLLBACK_REF="rollback-20260610"
$env:LEXOS_PREVIEW_BASE_URL="https://lexos-preview.vercel.app"
$env:LEXOS_PREVIEW_DEPLOYMENT_REF="dpl_example"
$env:LEXOS_PREVIEW_BUILD_LOG_REF="vercel-build-log-20260610"
$env:LEXOS_PREVIEW_SMOKE_REF="playwright-preview-smoke-20260610"
$env:LEXOS_PREVIEW_DEPLOYMENT_OWNER="delivery-owner"
$env:LEXOS_PREVIEW_DEPLOYED_AT="2026-06-10T14:00:00.000Z"
npm.cmd run final:gate:check
```

## 执行边界

- 不连接线上 Supabase。
- 不执行 `supabase db push`。
- 不执行真实闭环 smoke。
- 不写入客户、任务、结算、审计或 Storage 数据。
- 不生成交付压缩包。
- 不上传项目、不调用 Vercel API、不推送 Git；部署通道核对只读取本地配置和批准元数据。
- 不读取或输出密钥值。
- 不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。

## 签收前建议

最终门禁通过后，仍应由交付负责人按目标环境单独归档以下证据：

- 生产构建、类型检查、测试和 lint 输出。
- 远端迁移状态或 SQL Editor 执行记录。
- RLS / Data API 边界验证输出。
- 真实闭环 smoke 输出，仅在允许写入的验收库执行。
- 数据库和 Storage 备份、恢复演练、离线加密、失败告警和异地镜像核对记录。
- 最终验收报告与证据包归档。
# Vercel upload package gate

`npm run final:gate:check` includes `npm.cmd run deploy:upload:check` in addition to the deployment channel check. This keeps final signoff blocked when high-risk local paths or sensitive-looking included files would enter a Vercel upload package.

# Vercel Preview evidence gate

`npm run final:gate:check` also includes `npm.cmd run deploy:preview:evidence`. After Preview deployment, final signoff remains blocked until the public Preview URL, Vercel deployment reference, build log reference, Preview smoke result, owner, timestamp, and upload approval reference are recorded. This check only verifies local evidence metadata; it does not call Vercel or run smoke tests.
