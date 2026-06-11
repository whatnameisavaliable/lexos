# Lexos 私有化交付包清单核对

## 目标

`npm run release:package:check` 用于在最终部署验收之后，核对私有化交付包应包含的源码、脚本、迁移、测试和文档是否齐全，并明确哪些本地文件不能进入交付包。

该命令只读取本地仓库结构和环境变量名称，不生成压缩包，不读取密钥值，不连接线上 Supabase，不执行数据库迁移，不写入业务数据，也不运行真实闭环 smoke。

## 使用方式

```bash
npm run release:package:check
npm run final:gate:check
npm run handover:evidence:check
npm run postdeploy:check
npm run release:sensitive:check
```

交付负责人应在 `.env.local` 或运行环境中设置：

```env
LEXOS_RELEASE_PACKAGE_VERSION=v1.0-rc1
LEXOS_RELEASE_PACKAGE_TARGET_ENV=律所验收环境
LEXOS_RELEASE_PACKAGE_MAINTAINER=交付负责人
```

如果未设置 `LEXOS_RELEASE_PACKAGE_VERSION` 或 `LEXOS_RELEASE_PACKAGE_TARGET_ENV`，命令会回退读取最终验收变量 `LEXOS_FINAL_ACCEPTANCE_RELEASE_VERSION` 和 `LEXOS_FINAL_ACCEPTANCE_ENVIRONMENT`。维护人必须显式设置。

## 核对范围

命令会核对：

- 根文件：`package.json`、`package-lock.json`、Next/TypeScript/Tailwind/ESLint/Playwright 配置、`.vercelignore`、`.env.example` 和 `README.md`。
- 目录：`app`、`src`、`scripts`、`tests`、`docs`、`supabase/migrations`。
- npm scripts：构建、启动、测试、自检、最终验收、最终门禁、交付包核对、备份恢复、系统任务安装核对、运行证据核对、RLS 验证和真实 smoke 入口。
- 关键迁移：私有化交付必需的 Supabase SQL 迁移文件。
- 文档：部署、私有化 runbook、上线核对、升级、最终验收、最终门禁、交付包、备份恢复、备份系统任务安装核对、备份运行证据核对、运维日志、错误日志、性能、租户隔离、测试和数据库文档。

## 必须排除

正式交付包不得包含：

- `.env`、`.env.local`、`.env.production`
- `.next`
- `node_modules`
- `reports`
- `backups`
- `ops-logs`
- `playwright-report`
- `test-results`
- `coverage`

这些路径可能包含本地构建缓存、依赖、验收证据、备份原件、运维日志或真实环境变量。交付包应由干净工作区生成，并在归档前人工复核。

## 边界

本核对第一版不安装系统任务，不生成离线安装包，不执行真实备份、真实恢复、真实镜像或真实通知，也不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。

上线前仍需单独完成并归档证据：

- `npm run private:check`
- `npm run launch:check`
- `npm run upgrade:check`
- `npm run final:acceptance`
- `npm run final:acceptance:archive`
- `npm run final:gate:check`
- `npm run handover:evidence:check`
- `npm run postdeploy:check`
- `npm run release:package:check`
- `npm run release:sensitive:check`
- `npm run verify:rls`
- 在允许写入的验收库执行 `npm run smoke:real`
# Vercel upload package dry run

Run `npm run deploy:upload:check` alongside `npm run release:package:check` before any Vercel upload. The upload package dry run uses `.vercelignore` to simulate what Vercel would receive and blocks local-only paths or sensitive-looking included text files. Details are in `docs/vercel-upload-package.md`.
