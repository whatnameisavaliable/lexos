# Lexos 部署通道核对

`npm run deploy:channel:check` 用于在上传到 Vercel 前做只读核对，确认部署目标、上传批准、部署方式、git remote、本地 `.vercel` 绑定、`.vercelignore` 上传排除清单和 Vercel CLI 可用性。

## 使用方式

Preview 部署前建议设置：

```powershell
$env:LEXOS_DEPLOY_PROVIDER="vercel"
$env:LEXOS_DEPLOY_TARGET="preview"
$env:LEXOS_DEPLOY_METHOD="vercel-mcp"
$env:LEXOS_DEPLOY_APPROVED_TO_UPLOAD="true"
$env:LEXOS_DEPLOY_APPROVAL_REF="chat-20260610-preview-approval"
npm.cmd run deploy:channel:check
```

生产部署还必须额外设置：

```powershell
$env:LEXOS_DEPLOY_TARGET="production"
$env:LEXOS_DEPLOY_PRODUCTION_APPROVED="true"
```

如果没有明确生产批准，默认只允许 Preview。

## 变量说明

- `LEXOS_DEPLOY_PROVIDER`：当前只支持 `vercel`。
- `LEXOS_DEPLOY_TARGET`：`preview` 或 `production`，默认 `preview`。
- `LEXOS_DEPLOY_METHOD`：可选 `vercel-cli`、`vercel-git`、`vercel-mcp`、`vercel-dashboard` 或 `manual`。
- `LEXOS_DEPLOY_APPROVED_TO_UPLOAD`：必须在用户明确批准上传当前私有项目后设置为 `true`。
- `LEXOS_DEPLOY_APPROVAL_REF`：批准记录引用，例如聊天记录、工单或签收编号。
- `LEXOS_DEPLOY_PRODUCTION_APPROVED`：仅生产部署需要，必须在用户明确批准生产发布后设置为 `true`。
- `LEXOS_DEPLOY_EXPECTED_URL`：可选，部署后预期 URL；未设置时会回退读取 `LEXOS_POST_DEPLOYMENT_BASE_URL` 或 `LEXOS_PREVIEW_BASE_URL`。

## Vercel 上传排除

仓库根目录必须保留 `.vercelignore`。`deploy:channel:check` 会阻断缺失或漏配关键排除项的情况，当前要求至少排除：

```text
.env
.env*.local
.git/
.next/
.tmp/
backups/
coverage/
dev-server*.log
dist/
node_modules/
playwright-report/
reports/
supabase/.temp/
test-results/
tests/
tsconfig.tsbuildinfo
*.log
```

这些路径可能包含本地环境变量、构建缓存、依赖、验收报告、备份原件、测试产物或运行日志。该校验仍然只读取本地文件名和忽略规则，不上传项目。

## 执行边界

- 不上传代码。
- 不调用 Vercel API。
- 不创建或链接 Vercel 项目。
- 不推送 Git。
- 不读取或输出密钥值。

该命令只是把当前部署通道是否可用、是否已有外部上传批准变成可归档证据。真正部署仍需由负责人在已批准的通道中执行，部署完成后再设置 `LEXOS_PREVIEW_BASE_URL` 运行 `npm run smoke:preview`。
# Vercel upload package dry run

Run `npm run deploy:upload:check` after `npm run deploy:channel:check` and before any real Vercel upload. It simulates the `.vercelignore` upload boundary, blocks high-risk local paths, and scans included text files for sensitive-looking content. It does not create a tarball, upload code, call Vercel APIs, link a project, push Git, or read `.env.local` values. Details are in `docs/vercel-upload-package.md`.
