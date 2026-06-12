# Lexos Changelog

## 2026-06-11

### 交付：main 生产部署准备与 Vercel 环境对齐
- 用户已明确批准直接更新 `main` 分支并推进 Vercel 生产部署；部署方式切换为 `vercel-git`，由 GitHub `main` push 触发 Vercel production 构建。
- Vercel 远端 `lexos` 项目已确认：`prj_Rs9stBhpa6tOE6R1FGqrO6Y8oBp3`，团队 `team_J5yWYtoyHhhDUvErX4yrduFy`。
- 新增本地 `.vercel/project.json` 供门禁识别项目绑定，同时将 `.vercel/` 加入 `.gitignore` 和 `.vercelignore`，避免本地绑定文件进入 Git 或 Vercel 上传包。
- 修正 `deploy:channel:check`：`vercel-git` 路径不再错误依赖本机 Vercel CLI；`vercel-cli` 路径仍要求 CLI 可用。
- 补充 `vercel-git` 生产部署无本地 CLI 的回归测试。
- 生产 Vercel 环境变量需对齐真实 Supabase 模式：`NEXT_PUBLIC_DEMO_MODE=false`、`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`、`LEXOS_DEFAULT_ORGANIZATION_ID`、`LEXOS_AUTH_EMAIL_DOMAIN`；部署后通过 `/api/health` 复核。
- 验证通过：`node --test tests/deployment-channel.test.ts`（9 个测试）、生产批准变量下 `npm.cmd run deploy:channel:check`、`npm.cmd run deploy:upload:check`（0 高风险路径、0 敏感发现）、`npm.cmd run release:sensitive:check`（0 阻断）、`npm.cmd run typecheck`、`npm.cmd run lint`、`npm.cmd test`（253 个测试）、`npm.cmd run build`。

### UI：入口页与移动端表格收口
- 登录页和首次改密页接入统一 `lexosUi.input`、`actionButtonClass` 和 `InlineError`，减少入口体验与后台工作台之间的样式割裂。
- 全局应用错误提示改为复用 `InlineError`；交付记录中的“打开链接”升级为可聚焦、可触达的软性操作按钮。
- 工具栏选择器和日期输入内部高度与 44px 外层触达节奏对齐。
- 分页上一页/下一页按钮提升到 44px 点击区域，并补充 hover 状态。
- 通用 `DataTable` 新增小屏字段卡片视图；移动端展示字段和值，桌面端继续使用高密度表格，并基于媒体查询只渲染当前视图，避免隐藏副本干扰测试和无障碍树。
- E2E 曾捕获隐藏移动端字段卡片导致桌面断言命中隐藏文本的问题，已修复并复跑通过。
- 验证通过：`npm.cmd run typecheck`、`npm.cmd run lint`、`npm.cmd test`（252 个测试）、`npm.cmd run build`、沙箱外 `npm.cmd run test:e2e`、`npm.cmd run release:sensitive:check`（0 阻断）、`npm.cmd run deploy:upload:check`（0 高风险路径、0 敏感发现）。
- 本轮未上传部署、未调用 Vercel、未连接线上 Supabase 写入业务数据。

## 2026-06-10

### UI：交付前界面重构收口
- 继续按 `web-iterative-dev` Existing project 模式推进，设计方向固定为克制、高密度、可扫读的法律运营控制台。
- 新增共享 `actionButtonClass`，统一任务、结算、风控、客户门户、用户、客户、审计和系统参数页面的主操作、次操作、危险操作和下载操作样式。
- 任务卡片升级为更清晰的工作单结构：增强元信息标签、详情区、里程碑、交付记录、附件错误和成果提交区域的层级。
- 客户确认页/API 统一验证码提示、交付附件、下载入口、确认评分按钮和错误反馈样式。
- 结算页新增运营摘要条，覆盖待确认数量/金额、已确认实付、锁定/冻结和本页可批量确认数量；同时统一导出、批量确认、单笔确认和扣罚锁定控件。
- 资金台账账户卡片改为主余额 + 辅助流水信息结构，提升对账扫描效率。
- 风控页统一登记、答辩、委员会裁决、办结/重开和空状态；用户运维、客户新增、任务大厅、总览逾期处理、审计导出和系统参数保存按钮同步收口。
- 内联错误提示补充 `role="alert"`，关键操作按钮提升到更稳定的触达高度。
- 验证通过：`npm.cmd run typecheck`、`npm.cmd run lint`、`npm.cmd test`（252 个测试）、`npm.cmd run release:sensitive:check`（0 阻断）、`npm.cmd run deploy:upload:check`（0 高风险路径、0 敏感发现）、`npm.cmd run build`、沙箱外 `npm.cmd run test:e2e`（1 个 Chromium 冒烟用例）。
- 本轮未上传部署、未调用 Vercel、未连接线上 Supabase 写入业务数据。

### 交付：Vercel 部署通道核对第一版
- 新增 `src/lib/deployment/deployment-channel.ts`，集中维护 Vercel 部署通道只读核对：部署目标、部署方式、上传批准、批准引用、git remote、本地 `.vercel` 绑定、`.vercelignore` 上传排除清单和 Vercel CLI 可用性。
- 新增 `scripts/check-deployment-channel.ts` 和 `npm run deploy:channel:check`；该命令不上传代码、不调用 Vercel API、不创建项目、不推送 Git、不读取密钥值。
- `final:gate:check` 新增 “Vercel deployment channel” 检查项；默认缺少 `LEXOS_DEPLOY_APPROVED_TO_UPLOAD=true` 和 `LEXOS_DEPLOY_APPROVAL_REF` 时阻断，临时声明 `vercel-mcp` Preview 且有批准引用时通过。
- 新增 `tests/deployment-channel.test.ts` 并纳入 `npm test`；同步更新私有化、上线、升级、最终验收和交付包清单的必备脚本/文档 fixture。
- 新增 `.vercelignore` 和上传排除清单门禁，避免 `.env.local`、`backups`、`reports`、`.next`、`node_modules`、日志与测试产物进入 Vercel 上传包。
- 新增 `docs/deployment-channel.md`，并更新 `.env.example`、`docs/deployment.md`、`docs/release-package.md` 与 `docs/final-gate.md`。
- 验证通过：聚焦测试 18 个、`npm.cmd run private:check`、临时元数据 `npm.cmd run release:package:check`、默认部署通道阻断路径、临时 Preview 批准通过路径、默认最终门禁部署批准阻断路径、临时 Preview 元数据最终门禁通过路径、`npm.cmd test`（231 个测试）、`npm.cmd run typecheck`、`npm.cmd run lint`、`npm.cmd run build`。

### 交付：备份任务运行证据核对第一版

- 新增 `src/lib/operations/backup-run-evidence.ts`，集中维护备份任务运行证据核对的责任人、最近成功时间、最大允许间隔、计划任务导出/截图引用、运维日志引用、恢复演练引用、阻断规则和中文输出。
- 新增 `scripts/check-backup-run-evidence.ts` 和 `npm run backup:run:check`，用于在系统任务安装后核对最近成功备份和运维交接证据；该命令不读取日志原文、不上传证据、不执行真实备份、不连接线上 Supabase。
- 新增 `tests/backup-run-evidence.test.ts` 并纳入 `npm test`，覆盖通过路径、缺少证据阻断、最近成功时间过旧阻断、非法/未来时间阻断、敏感引用阻断和环境变量解析。
- 新增 `docs/backup-run-evidence.md`，并更新 `.env.example`、`README.md`、`docs/backup-operations.md`、`docs/backup-task-installation.md`、`docs/private-deployment.md`、`docs/deployment.md`、`docs/launch-readiness.md`、`docs/final-deployment-acceptance.md`、`docs/handover-evidence.md`、`docs/post-deployment-verification.md`、`docs/backup-restore.md`、`docs/storage-backup.md`、`docs/operations-log.md`、`docs/backup-alerts.md`、`docs/release-package.md`、`docs/backlog.md` 和 `docs/current-status.md`。
- `private:check`、`launch:check`、`final:acceptance`、`release:package:check`、`handover:evidence:check` 和 `postdeploy:check` 已把 `backup:run:check` 或 `docs/backup-run-evidence.md` 纳入交付闭环。
- 本轮不新增数据库迁移，不连接线上 Supabase，不执行 `supabase db push`，不写入业务数据，不读取或输出密钥值，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。
- 已按 `.agents` canonical `web-iterative-dev` skill 复核主说明、质量门槛、工具检测和 UI 路由，并更新 `docs/web-iterative-dev-alignment.md`。
- 验证通过：相关测试 38 个通过；`npm.cmd run backup:run:check` 默认阻断与临时证据元数据通过路径；`npm.cmd run typecheck`；`npm.cmd test`，222 个测试全部通过；`npm.cmd run lint`；`npm.cmd run private:check`；`npm.cmd run build` 放宽超时后通过。

### 交付：备份系统任务安装核对第一版

- 新增 `src/lib/operations/backup-task-installation.ts`，集中维护备份系统任务安装核对的责任人、运行账号、平台、日志目录、阻断规则、安装步骤和中文输出。
- 新增 `scripts/check-backup-task-installation.ts` 和 `npm run backup:task:check`，用于在 `backup:schedule` 之后生成 Windows Task Scheduler / Linux cron 人工安装核对清单；该命令不调用 `schtasks`、`crontab` 或 `systemctl`，不创建系统任务，不连接线上 Supabase，不执行真实备份。
- 新增 `tests/backup-task-installation.test.ts` 并纳入 `npm test`，覆盖通过路径、缺少责任人/运行账号阻断、公开目录阻断、调度计划阻断继承和环境变量解析。
- 新增 `docs/backup-task-installation.md`，并更新 `.env.example`、`README.md`、`docs/backup-operations.md`、`docs/private-deployment.md`、`docs/deployment.md`、`docs/final-deployment-acceptance.md`、`docs/handover-evidence.md`、`docs/post-deployment-verification.md`、`docs/release-package.md`、`docs/backlog.md` 和 `docs/current-status.md`。
- `private:check`、`launch:check`、`final:acceptance`、`release:package:check`、`handover:evidence:check` 和 `postdeploy:check` 已把 `backup:task:check` 或 `docs/backup-task-installation.md` 纳入交付闭环。
- 本轮不新增数据库迁移，不连接线上 Supabase，不执行 `supabase db push`，不写入业务数据，不读取或输出密钥值，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。
- 验证通过：相关测试 33 个通过；`npm.cmd run backup:task:check` 默认阻断与临时责任人/运行账号通过路径；`npm.cmd run typecheck`；`npm.cmd test`，218 个测试全部通过；`npm.cmd run lint`；`npm.cmd run build`；`npm.cmd run private:check`。

### 交付：部署后回归核对清单第一版

- 新增 `src/lib/deployment/post-deployment-verification.ts`，集中维护部署后回归核对项、负责人角色、命令、期望证据、人工项、写数据边界、元数据阻断规则和中文 Markdown 输出。
- 新增 `scripts/check-post-deployment.ts` 和 `npm run postdeploy:check`，用于部署完成后生成只读核对清单；缺少负责人、目标环境、发布版本、应用地址或回滚引用时阻断，元数据包含 token/secret/连接串/访问密钥/短信服务线索时阻断。
- 新增 `tests/post-deployment-verification.test.ts` 并纳入 `npm test`，覆盖通过路径、缺元数据阻断、敏感线索阻断、本机地址提示和 Markdown 输出。
- 新增 `docs/post-deployment-verification.md`，并更新 `README.md`、`.env.example`、`docs/private-deployment.md`、`docs/deployment.md`、`docs/final-deployment-acceptance.md`、`docs/final-gate.md`、`docs/handover-evidence.md`、`docs/release-package.md`、`docs/backlog.md` 和 `docs/current-status.md`。
- `private:check`、`final:acceptance`、`release:package:check`、`final:gate:check` 和 `handover:evidence:check` 已把 `postdeploy:check` 与 `docs/post-deployment-verification.md` 纳入交付必备项。
- 本轮不新增数据库迁移，不连接线上 Supabase，不执行 `supabase db push`，不运行真实 smoke，不写入业务数据，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。

### 交付：最终交付证据索引与签收清单第一版
- 新增 `src/lib/deployment/handover-evidence.ts`，集中维护最终交付证据项、负责人角色、命令、归档提示、人工项、写数据边界和中文 Markdown 输出。
- 新增 `scripts/check-handover-evidence.ts` 和 `npm run handover:evidence:check`，用于在客户签收前生成只读证据索引；缺少 `LEXOS_HANDOVER_OWNER` 或 `LEXOS_HANDOVER_CLIENT_SIGNOFF_REF` 时阻断，签收引用包含 token/secret/连接串/短信服务线索时阻断。
- 新增 `tests/handover-evidence.test.ts` 并纳入 `npm test`，覆盖通过路径、缺少签收元数据、敏感签收引用和 Markdown 输出。
- 新增 `docs/handover-evidence.md`，并更新 `README.md`、`.env.example`、`docs/private-deployment.md`、`docs/deployment.md`、`docs/final-deployment-acceptance.md`、`docs/final-gate.md`、`docs/release-package.md`、`docs/backlog.md` 和 `docs/current-status.md`。
- `private:check`、`final:acceptance`、`release:package:check` 和 `final:gate:check` 已把 `handover:evidence:check` 与 `docs/handover-evidence.md` 纳入交付必备项。
- 本轮不新增数据库迁移，不连接线上 Supabase，不执行 `supabase db push`，不运行真实 smoke，不写入业务数据，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。

### 交付：最终部署验收门禁汇总第一版
- 新增 `src/lib/deployment/final-gate.ts`，聚合私有化交付自检、上线前 runbook、升级迁移核对、最终部署验收、私有化交付包清单和交付包敏感内容扫描，统一输出阻断项、提示项和人工复核项。
- 新增 `scripts/check-final-gate.ts` 和 `npm run final:gate:check`，用于签收前生成本地只读最终门禁汇总；该命令不连接线上 Supabase、不执行迁移、不运行真实闭环 smoke、不写入业务数据、不生成交付包。
- 新增 `tests/final-gate.test.ts` 并纳入 `npm test`，覆盖全部通过、验收/交付包元数据缺失、敏感扫描阻断和 Markdown 输出。
- 新增 `docs/final-gate.md`，并更新 `docs/private-deployment.md`、`docs/deployment.md`、`docs/final-deployment-acceptance.md`、`docs/release-package.md`、`README.md`、`docs/backlog.md` 和 `docs/current-status.md`。
- `private:check`、最终验收规则和交付包清单规则已把 `final:gate:check` 与 `docs/final-gate.md` 纳入交付必备项。
- 本轮不新增数据库迁移，不连接线上 Supabase，不执行 `supabase db push`，不开发真实短信接入、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。
- 验证通过：`npm.cmd run typecheck`、`npm.cmd test`、`npm.cmd run final:gate:check` 默认阻断与临时元数据通过路径、`npm.cmd run private:check`、`npm.cmd run release:package:check`、`npm.cmd run release:sensitive:check`、`npm.cmd run lint`、`npm.cmd run build`、本轮触碰文件 `git diff --check`。

### 交付：私有化交付包敏感内容扫描第一版
- 新增 `src/lib/deployment/release-sensitive-scan.ts`，集中维护交付允许扫描范围、排除路径、文本文件识别、真实凭据阻断规则、暂缓能力人工复核规则和中文 Markdown 输出。
- 新增 `scripts/check-release-sensitive-scan.ts` 和 `npm run release:sensitive:check`，用于只读扫描交付包源码、脚本、测试、迁移和文档；该命令不读取 `.env.local`，不扫描 `.next`、`node_modules`、`reports`、`backups`、`ops-logs`、`playwright-report`、`test-results`、`coverage`，不连接线上 Supabase，不执行迁移，不写入业务数据，不生成交付包。
- 新增 `tests/release-sensitive-scan.test.ts` 并纳入 `npm test`，覆盖无敏感内容通过、真实连接串阻断、排除路径跳过、真实短信/AI/新手保护期等暂缓能力线索进入人工复核项。
- 新增 `docs/release-sensitive-scan.md`，并更新 `docs/release-package.md`、`docs/private-deployment.md`、`docs/deployment.md`、`docs/final-deployment-acceptance.md`、`README.md`、`docs/backlog.md` 和 `docs/current-status.md`。
- `private:check`、最终验收规则和交付包清单规则已把 `release:sensitive:check` 与 `docs/release-sensitive-scan.md` 纳入交付必备项。
- 本轮不新增数据库迁移，不连接线上 Supabase，不执行 `supabase db push`，不开发真实短信接入、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。
- 验证通过：`node --test tests/release-sensitive-scan.test.ts tests/release-package.test.ts tests/private-readiness.test.ts tests/final-acceptance.test.ts tests/final-acceptance-archive.test.ts tests/launch-readiness.test.ts tests/upgrade-readiness.test.ts`；`npm.cmd run release:sensitive:check`；`npm.cmd run typecheck`；`npm.cmd test`；`npm.cmd run private:check`；本轮触碰文件 ESLint；`npm.cmd run build`；本轮触碰文件 `git diff --check`。

### 交付：私有化交付包清单核对第一版
- 新增 `src/lib/deployment/release-package.ts`，集中维护交付包根文件、目录、必备 npm scripts、关键迁移、必备文档、排除路径、交付元数据和中文 Markdown 输出。
- 新增 `scripts/check-release-package.ts` 和 `npm run release:package:check`，用于核对私有化交付包清单；该命令不生成压缩包、不读取密钥值、不连接线上 Supabase、不执行迁移、不写入业务数据、不运行真实 smoke。
- 新增 `tests/release-package.test.ts` 并纳入 `npm test`，覆盖完整清单通过、缺少交付元数据阻断、缺少根文件/目录/脚本/迁移/文档阻断、敏感字段阻断和本地排除路径提示。
- 新增 `docs/release-package.md`，并更新 `docs/private-deployment.md`、`docs/deployment.md`、`docs/final-deployment-acceptance.md`、`README.md`、`.env.example`、`docs/backlog.md` 和 `docs/current-status.md`。
- `private:check` 与最终验收规则已把 `release:package:check` 和 `docs/release-package.md` 纳入交付必备项。
- 本轮不新增数据库迁移，不连接线上 Supabase，不执行 `supabase db push`，不生成离线安装包，不读取或输出密钥值，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。
- 验证通过：`node --test tests/release-package.test.ts tests/private-readiness.test.ts tests/final-acceptance.test.ts tests/final-acceptance-archive.test.ts tests/launch-readiness.test.ts tests/upgrade-readiness.test.ts`；`npm.cmd run release:package:check` 默认阻断与临时元数据通过路径；`npm.cmd run typecheck`；`npm.cmd test`（198 个测试全部通过）；`npm.cmd run private:check`；本轮触碰文件 ESLint；`npm.cmd run build`；本轮触碰文件 `git diff --check`。

### 交付：最终验收证据包归档第一版
- 新增 `src/lib/deployment/final-acceptance-archive.ts`，集中维护归档目录解析、文件名生成、工作区边界校验、公有目录阻断、敏感目录阻断、Markdown/JSON 内容和写入逻辑。
- 新增 `scripts/archive-final-deployment-acceptance.ts` 和 `npm run final:acceptance:archive`，支持 `--output-dir=...` 和 `--no-write`，用于把最终部署验收报告归档为本地 Markdown + JSON。
- 新增 `tests/final-acceptance-archive.test.ts` 并纳入 `npm test`，覆盖写入通过、阻断不写入、只演练、公有目录/工作区外/敏感目录阻断和环境变量解析。
- 更新 `.gitignore`，默认忽略 `reports/`，避免最终验收证据包误提交到代码仓库。
- 更新 `docs/final-deployment-acceptance.md`、`docs/private-deployment.md`、`docs/deployment.md`、`README.md`、`.env.example`、`docs/backlog.md` 和 `docs/current-status.md`。
- `private:check` 已把 `final:acceptance:archive` 纳入私有化交付必备脚本。
- 本轮不新增数据库迁移，不连接线上 Supabase，不执行 `supabase db push`，不写入业务数据，不执行真实恢复，不执行真实跨云镜像，不发送真实通知，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。
- 验证通过：已按 Supabase skill 核对 Supabase changelog、官方 Database Backups 和 Storage Access Control 文档；`npm.cmd run typecheck`；`npm.cmd test`；`npm.cmd run final:acceptance:archive -- --no-write` 默认阻断和临时验收元数据通过路径；`npm.cmd run private:check`；本轮触碰文件 ESLint；`npm.cmd run build`；本轮触碰文件 `git diff --check`。

### 交付：最终部署验收第一版
- 新增 `src/lib/deployment/final-acceptance.ts`，集中维护最终验收元数据、必需脚本、必需文档、阻断规则、验收阶段和 Markdown 输出。
- 新增 `scripts/check-final-deployment-acceptance.ts` 和 `npm run final:acceptance`，生成最终部署验收报告；该命令不连接线上 Supabase、不执行迁移、不写入业务数据。
- 新增 `tests/final-acceptance.test.ts` 并纳入 `npm test`，覆盖完整通过、缺少验收元数据、缺少脚本/文档、证据归档敏感内容阻断、输出阶段和环境变量解析。
- 新增 `docs/final-deployment-acceptance.md`，并更新 `docs/private-deployment.md`、`docs/deployment.md`、`README.md`、`.env.example`、`docs/backlog.md` 和 `docs/current-status.md`。
- `private:check` 已把 `final:acceptance` 与 `docs/final-deployment-acceptance.md` 纳入私有化交付必备项。
- 本轮不新增数据库迁移，不执行 `supabase db push`，不启动生产部署，不执行真实数据库恢复，不执行真实 Storage 恢复，不执行真实跨云镜像，不发送真实通知，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。
- 验证通过：已按 Supabase skill 核对 Supabase changelog、官方 Database Backups 和 Storage Access Control 文档；`npm.cmd run typecheck`；`npm.cmd test`；`npm.cmd run final:acceptance` 默认阻断和临时验收元数据通过路径；`npm.cmd run private:check`；本轮触碰文件 ESLint；`npm.cmd run build`；本轮触碰文件 `git diff --check`。

### 交付：备份异地/跨云镜像核对第一版
- 新增 `src/lib/operations/backup-mirror.ts`，集中维护镜像目标类型、环境变量解析、目的地敏感内容阻断、镜像前置规则和中文输出。
- 新增 `scripts/check-backup-mirror.ts` 和 `npm run backup:mirror:check`，输出备份异地/跨云镜像只读核对清单；该命令不上传文件、不调用对象存储 SDK、不连接线上 Supabase。
- 新增 `tests/backup-mirror.test.ts` 并纳入 `npm test`，覆盖责任人/目的地通过路径、缺配置阻断、敏感目的地阻断、环境变量解析和输出边界。
- 新增 `docs/backup-mirror.md`，并更新 `docs/backup-operations.md`、`docs/private-deployment.md`、`docs/deployment.md`、`README.md`、`.env.example`、`docs/backlog.md` 和 `docs/current-status.md`。
- `private:check` 已把 `backup:mirror:check` 与 `docs/backup-mirror.md` 纳入私有化交付必备项。
- 本轮不新增数据库迁移，不连接线上 Supabase，不执行真实备份或真实恢复，不执行真实跨云上传，不保存对象存储访问密钥，不接入真实告警平台，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。
- 验证通过：已按 Supabase skill 核对 Supabase changelog、官方 Database Backups 和 Storage Access Control 文档；`npm.cmd run typecheck`；`npm.cmd test`；`npm.cmd run backup:mirror:check` 默认阻断和临时责任人/目的地通过路径；`npm.cmd run private:check`；本轮触碰文件 ESLint；`npm.cmd run build`；本轮触碰文件 `git diff --check`。

### 交付：备份失败告警核对第一版
- 新增 `src/lib/operations/backup-alerts.ts`，集中维护告警渠道、环境变量解析、静默阈值、升级时限、失败规则、敏感信息禁止记录和中文输出。
- 新增 `scripts/check-backup-alerts.ts` 和 `npm run backup:alert:check`，输出备份失败告警只读核对清单；该命令不发送邮件、不发短信、不调用 webhook、不连接外部监控平台。
- 新增 `tests/backup-alerts.test.ts` 并纳入 `npm test`，覆盖责任人/渠道通过路径、缺责任人/缺运维日志渠道/阈值阻断、环境变量解析和输出规则。
- 新增 `docs/backup-alerts.md`，并更新 `docs/backup-operations.md`、`docs/private-deployment.md`、`docs/deployment.md`、`README.md`、`.env.example`、`docs/backlog.md` 和 `docs/current-status.md`。
- `private:check` 已把 `backup:alert:check` 与 `docs/backup-alerts.md` 纳入私有化交付必备项。
- 本轮不新增数据库迁移，不连接线上 Supabase，不执行真实备份，不接入真实通知平台，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。
- 验证通过：已按 Supabase skill 核对 Supabase changelog、官方 Database Backups 和 Storage Access Control 文档；`npm.cmd run typecheck`；`npm.cmd test`，178 个测试全部通过；`npm.cmd run backup:alert:check` 默认阻断和临时责任人通过路径；`npm.cmd run private:check`；本轮触碰文件 ESLint；`npm.cmd run build`；本轮触碰文件 `git diff --check`。

### 交付：备份离线加密核对第一版
- 新增 `src/lib/operations/backup-encryption.ts`，集中维护备份加密方式、环境变量解析、公开目录风险、疑似密钥泄露阻断、命令示例和中文输出。
- 新增 `scripts/check-backup-encryption.ts` 和 `npm run backup:encrypt:check`，输出备份离线加密只读核对清单；该命令不读取真实备份文件、不执行压缩或加密、不保存密钥、不上传外部存储。
- 新增 `tests/backup-encryption.test.ts` 并纳入 `npm test`，覆盖默认计划、公开目录阻断、密钥标识敏感内容阻断、环境变量解析和 age/gpg/7z 命令示例。
- 新增 `docs/backup-encryption.md`，并更新 `docs/backup-operations.md`、`docs/private-deployment.md`、`docs/deployment.md`、`README.md`、`.env.example`、`docs/backlog.md` 和 `docs/current-status.md`。
- `private:check` 已把 `backup:encrypt:check` 与 `docs/backup-encryption.md` 纳入私有化交付必备项。
- 本轮不新增数据库迁移，不连接线上 Supabase，不执行真实备份或真实加密，不保存私钥、口令或恢复介质，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。
- 验证通过：已按 Supabase skill 核对 Supabase changelog、官方 Database Backups 和 Storage Access Control 文档；`npm.cmd run typecheck`；`npm.cmd test`，174 个测试全部通过；`npm.cmd run backup:encrypt:check`；`npm.cmd run private:check`；本轮触碰文件 ESLint；`npm.cmd run build`；本轮触碰文件 `git diff --check`。

### 交付：多律所租户隔离核对第一版
- 新增 `src/lib/operations/tenant-isolation.ts`，集中维护租户表清单、全局表清单、关键 API 组织过滤 marker、Storage 路径 marker、本地迁移读取和 Markdown 输出。
- 新增 `scripts/check-tenant-isolation.ts` 和 `npm run tenant:check`，输出多律所租户隔离只读核对清单；该命令不连接线上 Supabase、不执行迁移、不创建组织、不读取真实租户数据。
- 新增 `tests/tenant-isolation.test.ts` 并纳入 `npm test`，覆盖完整通过、缺少租户表 `organization_id`、缺少 API 组织过滤和输出内容。
- 新增 `docs/tenant-isolation.md`，并更新 `docs/private-deployment.md`、`docs/deployment.md`、`README.md`、`.env.example`、`docs/backlog.md` 和 `docs/current-status.md`。
- `private:check` 已把 `tenant:check` 与 `docs/tenant-isolation.md` 纳入私有化交付必备项。
- 本轮不新增数据库迁移，不创建组织，不迁移真实数据，不实现多组织登录选择或组织切换，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。
- 验证通过：已按 Supabase skill 核对 Supabase changelog、Storage Access Control 和 Product Security 文档；`npm.cmd run typecheck`；`npm.cmd test`，169 个测试全部通过；`npm.cmd run tenant:check`；`npm.cmd run private:check`；本轮触碰文件 ESLint；`npm.cmd run build`；本轮触碰文件 `git diff --check`。

### 交付：性能监控第一版
- 新增 `src/lib/operations/performance-monitoring.ts`，集中维护性能指标分类、目标、预警阈值、严重阈值、留存证据、复核周期和样本保留期规则。
- 新增 `scripts/check-performance-monitoring.ts` 和 `npm run perf:check`，读取 `.env.local` 并输出 Markdown 形式的性能监控核对清单；该命令不采集真实用户数据、不写入数据库、不连接线上 Supabase、不上传外部 APM。
- 新增 `tests/performance-monitoring.test.ts` 并纳入 `npm test`，覆盖默认清单、复核周期/样本保留期阻断、责任人提示和输出内容。
- 新增 `docs/performance-monitoring.md`，并更新 `docs/private-deployment.md`、`docs/deployment.md`、`README.md`、`.env.example`、`docs/backlog.md` 和 `docs/current-status.md`。
- `private:check` 已把 `perf:check` 与 `docs/performance-monitoring.md` 纳入私有化交付必备项。
- 本轮不新增数据库迁移，不新增性能样本表，不接入 Web Vitals 自动采集，不采集真实用户监控数据，不接入外部 APM，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。
- 验证通过：`npm.cmd run typecheck`；`npm.cmd test`，165 个测试全部通过；`npm.cmd run perf:check`；`npm.cmd run private:check`；本轮触碰文件 ESLint；`npm.cmd run build`；本轮触碰文件 `git diff --check`。

### 交付：错误日志第一版
- 新增 `src/lib/operations/error-log.ts`，集中维护错误分类、默认级别、必填字段、示例、立即处置动作、保留期、日志目标和脱敏规则。
- 新增 `scripts/check-error-log.ts` 和 `npm run error:log:check`，读取 `.env.local` 并输出 Markdown 形式的错误日志分级与脱敏核对清单；该命令不创建目录、不写入日志、不连接线上 Supabase、不上传外部错误监控平台。
- 新增 `tests/error-log.test.ts` 并纳入 `npm test`，覆盖默认清单、保留期/公开目录阻断、critical 告警提示、敏感字段与手机号脱敏、输出内容。
- 新增 `docs/error-log.md`，并更新 `docs/private-deployment.md`、`docs/deployment.md`、`README.md`、`.env.example`、`docs/backlog.md` 和 `docs/current-status.md`。
- `private:check` 已把 `error:log:check` 与 `docs/error-log.md` 纳入私有化交付必备项。
- 本轮不新增数据库迁移，不新增错误日志表，不自动拦截所有 API 异常，不采集 Next.js/Vercel/Nginx 日志，不接入外部监控平台，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。
- 验证通过：`npm.cmd run typecheck`；`npm.cmd test`，161 个测试全部通过；`npm.cmd run error:log:check`；`npm.cmd run private:check`；本轮触碰文件 ESLint；`npm.cmd run build`；本轮触碰文件 `git diff --check`。

### 交付：运维日志第一版
- 新增 `src/lib/operations/operations-log.ts`，集中维护运维日志必记事件、必填字段、留存证据、禁止记录敏感信息、保留期和复核周期规则。
- 新增 `scripts/check-operations-log.ts` 和 `npm run ops:log:check`，读取 `.env.local` 并输出 Markdown 形式的运维日志核对清单；该命令不创建目录、不写入日志、不连接线上 Supabase、不上传外部日志平台。
- 新增 `tests/operations-log.test.ts` 并纳入 `npm test`，覆盖默认清单、保留期/复核周期阻断、公开目录提示和输出敏感信息边界。
- 新增 `docs/operations-log.md`，并更新 `docs/private-deployment.md`、`docs/deployment.md`、`README.md`、`.env.example`、`docs/backlog.md` 和 `docs/current-status.md`。
- `private:check` 已把 `ops:log:check` 与 `docs/operations-log.md` 纳入私有化交付必备项。
- 本轮不新增数据库迁移，不新增运维日志表，不采集 Next.js/Vercel/Nginx 日志，不接入错误监控或失败告警，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。
- 验证通过：`npm.cmd run typecheck`；`npm.cmd test`，156 个测试全部通过；`npm.cmd run ops:log:check`；`npm.cmd run private:check`；本轮触碰文件 ESLint；`npm.cmd run build`；本轮触碰文件 `git diff --check`。

### 交付：系统升级迁移方案第一版
- 新增 `src/lib/deployment/upgrade-readiness.ts`，集中维护升级迁移清单、可选兼容迁移说明、已应用迁移解析、升级前/后命令和 Markdown 输出。
- 新增 `scripts/check-upgrade-readiness.ts` 和 `npm run upgrade:check`，读取 `.env.local` 并输出只读升级迁移核对计划；该命令不连接线上 Supabase、不执行迁移、不写入业务数据。
- 新增 `tests/upgrade-readiness.test.ts` 并纳入 `npm test`，覆盖已应用迁移解析、完整升级计划、人工核对状态、缺失迁移/脚本阻断和输出内容。
- 新增 `docs/upgrade-runbook.md`，并更新 `docs/private-deployment.md`、`docs/deployment.md`、`README.md`、`.env.example`、`docs/backlog.md` 和 `docs/current-status.md`。
- `private:check` 已把 `upgrade:check` 与 `docs/upgrade-runbook.md` 纳入私有化交付必备项。
- 本轮不新增数据库迁移，不执行 `supabase db push`，不运行真实 smoke，不安装系统任务，不生成离线升级包，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。
- 验证通过：`npm.cmd run typecheck`；`npm.cmd test`，152 个测试全部通过；`npm.cmd run upgrade:check`；`npm.cmd run private:check`；本轮触碰文件 ESLint；`npm.cmd run build`。全量 `npm.cmd run lint` 在当前 Windows 会话中多次超时且无规则失败输出。

### 交付：私有化交付迁移核对与上线前 runbook 增强第一版
- 新增 `src/lib/deployment/launch-readiness.ts`，集中维护上线前核对阶段、证据项、只读边界、真实 smoke 写入提示和 Markdown 输出。
- 新增 `scripts/check-launch-readiness.ts` 和 `npm run launch:check`，读取 `.env.local` 并输出上线前只读核对 runbook；该命令不连接线上 Supabase、不执行迁移、不写入业务数据。
- 新增 `tests/launch-readiness.test.ts` 并纳入 `npm test`，覆盖完整核对阶段、缺少脚本阻断和真实 smoke 写入提示。
- 新增 `docs/launch-readiness.md`，并更新 `docs/private-deployment.md`、`docs/deployment.md`、`README.md`、`.env.example`、`docs/backlog.md` 和 `docs/current-status.md`。
- `private:check` 已把 `launch:check` 与 `docs/launch-readiness.md` 纳入私有化交付必备项；关键迁移清单同步补齐案源评分相关两份迁移。
- 本轮不新增数据库迁移，不执行 `supabase db push`，不运行真实 smoke，不安装系统任务，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。
- 验证通过：`npm.cmd run typecheck`；`npm.cmd test`，147 个测试全部通过；`npm.cmd run launch:check`；`npm.cmd run private:check`；`npm.cmd run lint`；`npm.cmd run build`；本轮触碰文件 `git diff --check`。

### 交付：备份定时调度与恢复演练报告第一版
- 新增 `src/lib/operations/backup-operations.ts`，集中维护备份调度计划、执行时间校验、保留期规则、恢复演练报告、数据库/Storage manifest 类型识别、文件缺失阻断和 Markdown/JSON 输出。
- 新增 `scripts/plan-backup-schedule.ts` 和 `npm run backup:schedule`，生成每日数据库备份、每日 Storage 对象备份和周期性恢复演练计划，并输出 Windows Task Scheduler 与 Linux cron 示例。
- 新增 `scripts/create-backup-rehearsal-report.ts` 和 `npm run backup:rehearsal`，支持显式传入数据库/Storage 备份目录或自动选择最新备份目录，生成可归档的文件级恢复演练报告。
- 新增 `tests/backup-operations.test.ts` 并纳入 `npm test`，覆盖时间解析、调度计划、保留期阻断、演练报告、缺失文件阻断和输出格式。
- 新增 `docs/backup-operations.md`，并更新 `docs/backup-restore.md`、`docs/storage-backup.md`、`docs/private-deployment.md`、`docs/deployment.md`、`README.md`、`.env.example`、`docs/backlog.md` 和 `docs/current-status.md`。
- `private:check` 已把 `backup:schedule`、`backup:rehearsal` 和 `docs/backup-operations.md` 纳入私有化交付必备项。
- 本轮不新增数据库迁移，不安装系统级定时任务，不执行真实备份或真实恢复，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。
- 验证通过：`npm.cmd run typecheck`；`npm.cmd test`，144 个测试全部通过；`npm.cmd run backup:schedule`；`npm.cmd run backup:rehearsal` 临时目录演练；`npm.cmd run private:check`；`npm.cmd run lint`；`npm.cmd run build`；沙箱外执行 `npm.cmd run test:e2e`，1 个 Chromium 冒烟用例通过；端口 3005/3100 无残留；本轮触碰文件 `git diff --check`。

### 交付：Storage 交付附件对象备份第一版
- 新增 `src/lib/operations/storage-backup.ts`，集中维护 Storage 备份 bucket、备份 ID、对象本地路径安全编码、manifest 汇总、恢复计划、恢复确认口令、默认不覆盖同名对象和命令输出。
- 新增 `scripts/backup-storage.ts` 和 `npm run backup:storage`，真实执行时递归列出 `lexos-deliverables` 私有 bucket 对象、下载对象本体，并生成 `storage-manifest.json`。
- 新增 `scripts/restore-storage.ts` 和 `npm run restore:storage`，默认只做恢复演练和文件校验；实际上传必须追加 `--execute` 并设置 `LEXOS_STORAGE_RESTORE_CONFIRM=RESTORE_LEXOS_STORAGE`，默认 `upsert=false`。
- 新增 `tests/storage-backup.test.ts` 并纳入 `npm test`，覆盖 dry-run 边界、执行阻断、对象路径安全编码、manifest 汇总、Storage folder/file 判定、恢复确认口令、缺失文件阻断和 upsert 标记。
- 新增 `docs/storage-backup.md`，并更新 `docs/backup-restore.md`、`docs/private-deployment.md`、`docs/deployment.md`、`README.md`、`.env.example`、`docs/backlog.md` 和 `docs/current-status.md`，说明数据库备份与 Storage 对象备份的边界和配套恢复流程。
- `private:check` 已把 `backup:storage`、`restore:storage` 和 `docs/storage-backup.md` 纳入私有化交付必备项。
- 本轮不新增数据库迁移，不执行真实线上 Storage 下载或上传，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。
- 验证通过：`npm.cmd run typecheck`；`npm.cmd test`，139 个测试全部通过；`npm.cmd run backup:storage -- --dry-run`；`npm.cmd run restore:storage` 临时目录演练；`npm.cmd run private:check`；`npm.cmd run lint`；`npm.cmd run build`；沙箱外执行 `npm.cmd run test:e2e`，1 个 Chromium 冒烟用例通过；端口 3005/3100 无残留；本轮触碰文件 `git diff --check`。

### 交付：数据库备份与恢复自动化第一版
- 新增 `src/lib/operations/database-backup.ts`，集中维护数据库连接串读取、打码、备份 schema 清理、备份计划、恢复计划、恢复确认口令和命令展示。
- 新增 `scripts/backup-database.ts` 和 `npm run backup:db`，基于 Supabase CLI `db dump` 生成 `schema.sql`、`data.sql`、`roles.sql` 和 `manifest.json`。
- 新增 `scripts/restore-database.ts` 和 `npm run restore:db`，默认只做恢复演练和文件校验；实际恢复必须追加 `--execute` 并设置 `LEXOS_RESTORE_CONFIRM=RESTORE_LEXOS_DATABASE`。
- 新增 `tests/database-backup.test.ts` 并纳入 `npm test`，覆盖连接串优先级、连接串打码、演练/执行阻断、schema 清理、恢复确认口令、roles 恢复和缺失文件校验。
- 新增 `docs/backup-restore.md`，并更新 `docs/private-deployment.md`、`docs/deployment.md`、`README.md`、`.env.example` 和 `.gitignore`，说明备份演练、真实备份、恢复演练、显式确认恢复、Storage 对象备份边界和恢复后核对。
- `private:check` 已把 `backup:db`、`restore:db` 和 `docs/backup-restore.md` 纳入私有化交付必备项。
- 本轮不新增数据库迁移，不连接线上库执行真实备份或恢复，不开发真实短信、新手保护、新兵引流池、证据矩阵或 AI 辅助功能。
- 验证通过：`npm.cmd run typecheck`；`npm.cmd test`，130 个测试全部通过；`npm.cmd run private:check`；`npm.cmd run backup:db -- --dry-run`；`npm.cmd run restore:db` 临时目录演练；`npm.cmd run lint`；`npm.cmd run build`；沙箱外执行 `npm.cmd run test:e2e`，1 个 Chromium 冒烟用例通过；本轮触碰文件 `git diff --check`。

### 交付：私有化交付自检第一版
- 新增 `src/lib/deployment/private-readiness.ts`，集中维护私有化部署前置检查规则，覆盖真实 Supabase 模式、必要环境变量、公开密钥风险、关键迁移文件、必要 npm scripts 和交付文档。
- 新增 `scripts/check-private-deploy.ts` 和 `npm run private:check`，会自动读取 `.env.local`，但只输出变量名和检查结论，不打印任何密钥值。
- 新增 `tests/private-readiness.test.ts` 并纳入 `npm test`，覆盖通过路径、demo 模式误交付、缺少 Supabase 变量、公开 service role、anon/service role 混用、关键迁移/脚本/文档缺失和 Supabase URL 误填 REST endpoint。
- 新增 `docs/private-deployment.md`，整理私有化部署 runbook，覆盖环境变量、标准部署流程、迁移核对、备份恢复第一版要求、升级回滚和运维交接清单。
- 更新 `docs/deployment.md`、`README.md`、`docs/backlog.md` 和 `docs/current-status.md`，同步私有化交付入口和当前完整迁移清单。
- 本轮不新增数据库迁移，不连接线上库执行迁移，不开发真实短信、新手保护、新兵引流池、证据矩阵或 AI 辅助功能。
- 验证通过：`npm.cmd run typecheck`；`npm.cmd test`，120 个测试全部通过；`npm.cmd run private:check`；`npm.cmd run lint`；`npm.cmd run build`；沙箱外执行 `npm.cmd run test:e2e`，1 个 Chromium 冒烟用例通过；本轮触碰文件 `git diff --check`。

### 运营：审计报表第一版
- 新增 `src/lib/audit/report.ts`，集中维护审计日志聚合口径，输出模块分布、动作分布、操作人分布、日期趋势和审计摘要。
- “审计日志”页新增审计事件、操作人、覆盖模块、登录失败四个指标，并新增“审计报表”面板展示模块分布、动作分布、日期趋势和关键运营信号。
- Demo 模式按当前筛选后的本地日志统计；真实 API 模式在当前筛选条件下额外读取最多 100 条日志作为报表样本，同时保留原有服务端分页明细和 CSV 导出。
- 新增 `tests/audit-report.test.ts` 并纳入 `npm test`，覆盖总量、操作人、模块、安全事件、排序、占比、日期趋势和 Demo 样例。
- 本轮不新增数据库迁移，不新增独立报表 API，不开发真实短信、新手保护、新兵引流池、证据矩阵或 AI 辅助功能。
- 验证通过：`npm.cmd run typecheck`；`npm.cmd test`，113 个测试全部通过；`npm.cmd run lint`；`npm.cmd run build`；沙箱外执行 `npm.cmd run test:e2e`，1 个 Chromium 冒烟用例通过。

### 风控：累犯加重惩戒建议第一版
- 新增 `src/lib/risk/repeat-discipline.ts`，集中维护近 90 天有效风控工单统计、累犯建议等级、汇总指标和建议动作。
- 统计口径按承办律师归集，排除委员会裁决为“无过错”的工单；高/重大风控、警示、扣减和升级处理会进入有效风控口径。
- 总览页新增“累犯惩戒建议”运营信号和建议面板，展示观察周期、需处理律师、限制建议、升级复盘、最近工单和建议动作。
- “投诉与风控”页新增“累犯建议”指标，并复用同一建议面板；承办律师视角只展示本人结果，管理/主任视角展示全体承办律师汇总。
- 新增 `tests/repeat-discipline.test.ts` 并纳入 `npm test`，覆盖限制建议、升级复盘、排除无过错/过期工单和 Demo 样例。
- 本轮不新增数据库迁移，不自动扣款，不强制降级，不进入学习期，也不开发新手保护期、新兵引流池、真实短信、证据矩阵或 AI 辅助功能。
- 验证通过：`npm.cmd run typecheck`；`npm.cmd test`，109 个测试全部通过；`npm.cmd run lint`；`npm.cmd run build`；沙箱外执行 `npm.cmd run test:e2e`，1 个 Chromium 冒烟用例通过。

### 风控：承接权限限制第一版
- 新增 `src/lib/tasks/claim-restrictions.ts`，集中维护承接风控限制规则：未办结三级严重或四级重大风控工单会暂停承办律师抢新任务，中低风险和已办结工单不影响承接。
- `POST /api/tasks/:id/claim` 在原有开放状态、承办律师身份和最低职级校验后，增加当前律师已承办任务的高/重大未结风控校验；被限制时返回 `409 CONFLICT`。
- Demo 任务大厅接入同一规则，顶部展示风控暂停提示，按钮显示“风控暂停”并禁用；标准演示数据中 `lawyer01` 可演示被严重未结风控拦截，`lawyer02` 的中等风控不拦截。
- 新增 `tests/claim-restrictions.test.ts` 并纳入 `npm test`，覆盖阻断规则、非阻断规则、统一承接判断和 Demo 样例。
- 本轮不新增数据库迁移，不开发新手保护期、新兵引流池、真实短信、证据矩阵和 AI 辅助能力。
- 验证通过：`npm.cmd run typecheck`；`npm.cmd test`，105 个测试全部通过；`npm.cmd run lint`；`npm.cmd run build`；沙箱外清空本机代理后执行 `npm.cmd run test:e2e`，1 个 Chromium 冒烟用例通过。

## 2026-06-09

### 财务：公共风险储备金账户 / 财务流水第一版

- 新增 `src/lib/funds/ledger.ts`，集中维护资金账户类型、流水类型、扣罚入账生成和账户余额汇总。
- 新增 Supabase 迁移 `20260609165248_add_fund_transactions.sql`，创建 `fund_transactions` 表，启用 RLS，仅授予 `service_role` 访问。
- 新增数据库触发器 `record_settlement_risk_deduction_fund_transaction()`，当结算扣罚资金流向被锁定且扣减金额大于 0 时，自动写入一条 `risk_deduction` 入账流水，并回填历史已锁定扣罚记录。
- 新增 `GET /api/funds`，系统管理员、律所管理员和财务可读取本组织四类账户摘要和分页资金流水；承办律师不可访问资金台账。
- 后台新增“资金”菜单和“资金台账”页面，展示公共风险储备金、质量督导基金、客户退费、律所留存余额，并支持账户筛选、搜索、排序和分页查看流水。
- Demo 模式下，结算页锁定扣罚后会同步生成一条本地资金入账流水，并在资金页展示。
- 角色菜单权限、权限矩阵、API client、RLS 验证脚本、数据库/API/部署/演示文档已同步新增资金台账能力。
- 当前第一版只做内部资金透明和扣罚入账，不做真实付款、银行流水、客户退款打款、基金审批或财务凭证。
- 验证通过：`npm.cmd run typecheck`；`npm.cmd test`，101 个测试全部通过；`npm.cmd run lint`；`npm.cmd run build`；沙箱外清空代理后执行 `npm.cmd run test:e2e`，1 个 Chromium 冒烟用例通过。

### 风控：扣罚资金流向锁定第一版

- 新增 `src/lib/settlements/risk-deduction.ts`，集中维护扣罚去向、锁定输入清洗、扣减金额计算、实付金额口径和可锁定状态判断。
- 新增 `src/lib/settlements/risk-deduction-service.ts` 和 `POST /api/settlements/:id/risk-deduction`，财务、律所管理员和系统管理员可把委员会扣减裁决锁定到结算记录，并写入 `settlements.lock_risk_deduction` 审计日志。
- 新增迁移 `20260609153142_add_settlement_risk_deduction_lock.sql`，为 `settlements` 增加 `payable_amount_cents`、扣罚工单关联、扣罚比例、扣罚金额、扣罚去向、说明、锁定人和锁定时间字段，并回填历史结算实付金额。
- `GET /api/settlements` 返回扣罚锁定字段和 `risk_freeze.deduction_lock_candidate`；`GET /api/settlements/export` 和 Demo CSV 导出新增原结算金额、扣减金额、律师实付金额、扣罚去向和扣罚锁定时间。
- 结算页新增“待锁定扣罚”行内处理入口，可选择公共风险储备金、质量督导基金、客户退费或律所留存；锁定后展示“扣罚已锁定”，并允许继续确认结算。
- 客户确认生成结算和客户逾期自动确认生成结算时，都会显式写入 `payable_amount_cents`，避免新增非空字段后出现默认 0 污染。
- 总览统计、客户渠道统计、承办律师绩效和个人工作台改用扣后实付金额作为有效结算口径。
- Demo 数据新增一条委员会扣减裁决、等待锁定资金流向的待结算样例；E2E 冒烟覆盖结算页“锁定扣罚”流程。
- 公共基金账户与财务流水已在后一张任务卡完成第一版；真实付款、银行流水和客户退款打款仍属于后续能力。线上 Supabase 使用真实 API 前需先应用相关迁移。
- 验证通过：`npm.cmd run typecheck`；`npm.cmd test`，98 个测试全部通过；`npm.cmd run lint`；`npm.cmd run build`；沙箱外清空代理后执行 `npm.cmd run test:e2e`，1 个 Chromium 冒烟用例通过。

### 风控：风控委员会裁决第一版

- 新增 `src/lib/risk/committee-decision.ts`，集中维护委员会裁决类型、标签、输入清洗、答辩等待规则和后续状态推导。
- 新增迁移 `20260609144119_add_risk_case_committee_decision.sql`，为 `risk_cases` 增加委员会裁决、裁决意见、扣减基点、裁决人和裁决时间字段。
- 新增 `POST /api/risk-cases/:id/decision`，系统管理员、律所管理员和主任可在承办律师已答辩或 48 小时答辩期结束后提交裁决，提交会写入 `risk_cases.committee_decide` 审计日志。
- 风控页新增“委员会裁决”列，展示既有裁决结果、意见、裁决人和裁决时间；具备权限的角色可直接选择无过错、警示记录、扣减裁决或升级处理。
- 无过错和警示记录会同步办结风控工单；扣减裁决和升级处理会保持处理中并继续冻结结算，其中扣减裁决需要通过结算页或 `POST /api/settlements/:id/risk-deduction` 锁定扣罚资金流向。
- Demo 数据新增已答辩待裁决样例，E2E 冒烟流程覆盖管理员提交委员会裁决。
- 当前第一版不自动修改结算金额、不生成扣款流水；线上 Supabase 使用真实 API 前需先应用本轮迁移。
- 验证通过：`npm.cmd run typecheck`；`npm.cmd test`，97 个测试全部通过；`npm.cmd run lint`；`npm.cmd run build` 复跑通过；沙箱外清空本机代理后执行 `npm.cmd run test:e2e`，1 个 Chromium 冒烟用例通过。

### 风控：承办律师 48 小时答辩第一版

- 新增 `src/lib/risk/defense.ts`，集中维护 48 小时答辩期限、是否可提交、已提交/超时状态和答辩输入清洗。
- 新增迁移 `20260609135059_add_risk_case_defense.sql`，为 `risk_cases` 增加 `defense_statement` 和 `defended_at` 字段，并补充未答辩工单索引。
- `GET /api/risk-cases` 新增承办律师读取范围：只返回本人承办任务关联的风控工单。
- 新增 `POST /api/risk-cases/:id/defense`，承办律师可在工单创建后 48 小时内提交本人任务答辩，提交会写入 `risk_cases.submit_defense` 审计日志。
- 后台“风控”菜单对承办律师开放；风控页新增“48 小时答辩”列，展示截止时间、剩余小时、答辩内容和提交入口。
- Demo 数据新增一条承办律师可答辩样例，E2E 冒烟流程已覆盖承办律师提交答辩。
- 当前不自动推进风控状态、不触发裁决、不改变结算金额；后续风控委员会裁决可读取答辩内容。
- 验证通过：`npm.cmd run typecheck`；`npm.cmd test`，95 个测试全部通过；`npm.cmd run lint`；`npm.cmd run build` 复跑通过；沙箱外清空本机代理后执行 `npm.cmd run test:e2e`，1 个 Chromium 冒烟用例通过。

### 风控：扣减比例配置第一版

- 新增四级风控扣减比例系统参数：`risk_deduction_low_basis_points`、`risk_deduction_medium_basis_points`、`risk_deduction_high_basis_points`、`risk_deduction_critical_basis_points`，默认值分别为 0、500、1500 和 3000 基点。
- 新增 `src/lib/risk/deductions.ts` 和 `src/lib/risk/deductions-service.ts`，集中维护扣减比例读取、默认值和建议扣减金额计算。
- `GET /api/settlements` 的 `risk_freeze` 摘要新增 `deduction_basis_points`、`suggested_deduction_cents` 和 `suggested_payable_cents`，供财务侧展示建议扣减。
- 结算页在风控冻结记录下展示建议扣减比例、建议扣减金额和扣后建议金额；风控页在关联任务旁展示按任务金额预估的建议扣减。
- 当前只生成建议扣减口径，不自动修改结算金额，不处理真实扣款和资金流向；后续风控委员会裁决可复用同一计算模块。
- 本轮不新增数据库迁移，继续复用 `system_settings` 与既有 `risk_cases`。
- 验证通过：`npm.cmd run typecheck`；`npm.cmd test`，92 个测试全部通过；`npm.cmd run lint`；`npm.cmd run build`；沙箱外清空本机代理后执行 `npm.cmd run test:e2e`，1 个 Chromium 冒烟用例通过。

### 风控：任务金额冻结第一版

- 新增 `src/lib/risk/task-freeze.ts`，集中维护任务金额冻结判断、最高风险级别、冻结摘要和错误提示。
- 新增 `src/lib/risk/task-freeze-service.ts`，按任务批量读取未办结风控工单并生成冻结状态。
- `confirmSettlements` 在任何结算写入前检查关联任务是否存在 `open` 或 `in_review` 风控工单；若存在，单笔和批量确认都会返回冲突错误，系统管理员也不能越过。
- `GET /api/settlements` 每条结算新增 `risk_freeze` 摘要，前端可展示未办结工单数量、最高风险级别和冻结标题。
- 结算页将“风控锁定”升级为“冻结状态”，优先展示“风控冻结”；冻结行不可勾选、不可批量确认、不可单笔确认。
- Demo 模式新增待结算任务的未办结风控样例，并按同一规则阻断本地结算确认。
- 新增任务金额冻结单元测试，E2E 冒烟用例补充结算页“风控冻结”可见性断言。
- 当前不新增数据库迁移，依赖上一轮 `risk_cases` 表；真实 API 模式使用前仍需应用风控相关迁移。
- 验证通过：`npm.cmd run typecheck`；`npm.cmd test`，91 个测试全部通过；`npm.cmd run lint`；`npm.cmd run build`；沙箱外清空本机代理后执行 `npm.cmd run test:e2e`，1 个 Chromium 冒烟用例通过。
- 全仓库 `git diff --check` 仍命中历史文件 `app/layout.tsx`、`app/page.tsx`、`next.config.mjs`、`postcss.config.mjs` 的 EOF 空行问题；本轮未修改这些无关文件，已用只读脚本检查本轮触碰文件。

### 风控：工单状态流转第一版

- `risk_cases` 新增 `resolution_note` 处理意见字段，迁移文件为 `20260609110310_add_risk_case_resolution_note.sql`。
- `src/lib/risk/cases.ts` 新增风控处理动作、状态流转校验和办结意见校验，支持开始处理、办结和重新打开。
- 新增共享的风控记录补全模块 `src/lib/risk/records.ts`，列表 API 和详情状态更新 API 返回统一的任务、客户、登记人和处理人信息。
- 新增 `PATCH /api/risk-cases/:id`，按组织、角色和发起人登记人边界更新工单状态，并写入 `risk_cases.update_status` 审计日志。
- 前端“投诉与风控”页面升级为可操作表格，每行支持填写处理意见、开始处理、办结和重新打开；Demo 模式与真实 API 模式保持同一状态流转口径。
- API client、Demo 类型和演示数据已同步 `resolutionNote`、`updatedAt`、处理人等字段。
- 风控单元测试新增状态流转、办结意见和演示数据处理意见断言；E2E 冒烟用例新增风控处理动作入口断言。
- 验证通过：`npm.cmd run typecheck`；`npm.cmd test`，90 个测试全部通过；`npm.cmd run lint`；`npm.cmd run build`；沙箱外清空本机代理后执行 `npm.cmd run test:e2e`，1 个 Chromium 冒烟用例通过。
- 本轮触碰文件只读空白检查通过；全仓库 `git diff --check` 仍命中历史文件 `app/layout.tsx`、`app/page.tsx`、`next.config.mjs`、`postcss.config.mjs` 的 EOF 空行问题，本轮未修改这些无关文件。

### 风控：投诉入口 / 风控工单第一版

- 新增 `src/lib/risk/cases.ts`，集中维护风控工单来源、四级严重程度、状态、低分阈值、输入清洗和低分工单草稿生成规则。
- 新增 `src/lib/risk/low-score-service.ts`，客户评分、案源评分或案件结果评分低于等于 6 分时，可自动创建低分风控工单并写入 `risk_cases.auto_create` 审计日志。
- 新增 Supabase 迁移 `20260609091825_add_risk_cases.sql`，创建 `risk_cases` 表，启用 RLS，并仅授予 `service_role` 直接表访问权限。
- 新增 `GET /api/risk-cases` 和 `POST /api/risk-cases`，支持分页、搜索、状态、级别、来源、排序和创建风控工单；创建会写入 `risk_cases.create` 审计日志。
- 后台新增“风控”菜单和“投诉与风控”页面，系统管理员、律所管理员、主任和发起人可查看风险指标、登记工单并筛选列表。
- Demo 数据新增投诉、低分和已处理风控样例；Demo 评分路径也会在低分时生成风控工单。
- RLS 验证脚本已纳入 `risk_cases` 内部表检查清单。
- 新增 `tests/risk-cases.test.ts` 并纳入 `npm test`；E2E 冒烟用例新增“风控”页面入口断言。
- 验证通过：`npm.cmd run typecheck`；`npm.cmd test`，89 个测试全部通过；`npm.cmd run lint`；`npm.cmd run build`；沙箱外清空本机代理后执行 `npm.cmd run test:e2e`，1 个 Chromium 冒烟用例通过。
- 注意：线上 Supabase 尚未自动应用本轮迁移，真实 API 模式使用风控工单前需要先执行 `supabase db push` 或在 Supabase SQL Editor 应用迁移 SQL。

### 运营：客户逾期未确认自动视为交付第一版

- 新增 `src/lib/tasks/customer-auto-confirm.ts`，集中维护客户逾期确认到期时间、可处理状态和停用规则。
- 新增 `src/lib/tasks/customer-auto-confirm-service.ts` 和 `POST /api/tasks/auto-confirm-overdue`，系统管理员和律所管理员可触发处理超过确认期的客户待确认任务。
- 新增系统参数 `customer_auto_confirm_days`，默认 7 天，设置为 0 时停用；该参数已进入系统参数页面。
- 真实 API 处理会跳过已有结算记录的任务，避免重复生成资金记录；符合条件的任务会生成待结算记录、推进任务状态，并写入 `tasks.auto_confirm_overdue` 审计日志。
- 总览页新增“逾期待处理”运营信号和“逾期视为交付”处理入口；Demo 模式同步生成结算和审计日志。
- 标准演示数据中的客户待确认任务已调整为超过默认 7 天确认期，便于演示该闭环。
- 当前第一版不接真实短信、不做客户通知、不新增定时器；后续可复用服务函数接 Vercel Cron 或私有化定时任务。
- 新增 `tests/customer-auto-confirm.test.ts` 并纳入 `npm test`。
- 验证通过：`npm.cmd run typecheck`；`npm.cmd test`，85 个测试全部通过；`npm.cmd run lint`；`npm.cmd run build`；`git diff --check -- package.json`；本轮触碰文件只读空白检查；沙箱外清空本机代理后执行 `npm.cmd run test:e2e`，1 个 Chromium 冒烟用例通过。

### 计划：本期暂缓范围确认

- 本期明确暂缓新手保护期、新兵引流池、真实短信接入与真实短信相关功能、证据矩阵、AI 辅助相关功能。
- 后续开发计划继续保留这些能力作为远期 backlog，但当前阶段任务选择不再主动推进这些条目。
- 客户侧安全访问本期继续使用现有 token + 手机号 + 临时验证码机制，不接入真实短信 MFA 或短信服务商。

### 风控：30 天风控锁定期第一版
- `settlement_lock_days` 默认 30 天正式进入结算确认规则，非系统管理员在锁定期内不能确认结算；系统管理员可应急越过。
- `confirmSettlements` 改为读取默认系统参数值，并在审计 metadata 中记录 `settlementLockDays` 和 `settlementRiskLockBypassed`。
- 结算页新增“风控锁定”列，展示剩余锁定天数和预计解锁时间；锁定中的待确认结算不能被普通批量确认选中，单笔确认入口显示锁定状态。
- Demo 模式生成结算时记录 `generatedAt`，确认时记录 `confirmedAt`，并和真实 API 模式一样执行风控锁定规则。
- 真实 smoke 脚本改为由系统管理员完成最后结算确认，以覆盖应急越过路径，避免默认 30 天规则导致即时 smoke 被误拦截。
- 新增 30 天风控锁定期剩余天数单元测试。
- 当前不新增数据库迁移，继续复用 `system_settings.settlement_lock_days` 与 `settlements.generated_at`。
- 验证通过：`npm.cmd run typecheck`；`npm.cmd test`，80 个测试全部通过；`npm.cmd run lint`。

### 运营：律师评分近 30 单滚动平均第一版
- 承办律师绩效统计新增 `rollingAverageScore` 和 `rollingTaskCount`，基于现有客户反馈、发起人验收评分和案件结果评分计算近期交付质量。
- “近 30 单”按评分相关时间倒序截取每名承办律师最近最多 30 个有评分任务；同一任务可聚合客户评分、案源评分和案件结果评分。
- 总览页“承办律师绩效”表格新增“近30单”列，右侧运营信号新增“近30单评分”，方便管理层快速观察近期质量。
- 新增 `tests/lawyer-rolling-score.test.ts`，覆盖 35 个任务中只统计最近 30 个有评分任务的边界；工作流测试补充标准演示数据下的滚动评分断言。
- 当前不新增数据库迁移，先作为分析口径落地；后续如需月度快照、风控阈值或扣罚规则，再设计独立快照表与审计流程。
- 验证通过：`npm.cmd run typecheck`；`npm.cmd test`，79 个测试全部通过；`npm.cmd run lint`；`npm.cmd run build`；沙箱外清空本机代理后执行 `npm.cmd run test:e2e`，1 个 Chromium 冒烟用例通过。

### 协作：审核律师流程第一版
- 新增 `src/lib/tasks/review.ts`，集中维护审核结论校验、可审核角色、审核权限判断和发起人验收前置判断。
- 新增 Supabase 迁移 `20260609061000_add_task_review_flow.sql`，为 `tasks` 增加 `review_required`、`review_status`、`review_lawyer_id`、`reviewed_at` 和 `review_comment` 字段，并建立审核队列索引。
- `POST /api/tasks` 支持创建需要主任复核的任务；普通成果提交和附件成果提交会在任务需要审核时把复核状态重置为“待审核”。
- 新增 `POST /api/tasks/:id/review`，主任、律所管理员和系统管理员可以审核通过或退回修改；退回后任务回到承办律师可重新提交状态。
- `POST /api/tasks/:id/approve` 增加审核前置保护：需要复核的任务必须审核通过后，发起人才能最终验收与评分。
- “我的任务”允许主任和律所管理员进入；任务行新增审核状态徽标、审核意见表单、审核通过/退回修改按钮，以及详情中的审核状态、审核时间和审核意见。
- 任务里程碑中的“发起人验收”升级为“审核与发起人验收”，可展示待审核、退回修改、待发起人验收和已验收状态。
- 标准演示数据新增待审核任务和审核通过历史样例，方便主任/发起人视角演示。
- 新增 `tests/task-review.test.ts`，并扩展权限和 workflow 测试，覆盖审核权限、验收前置、演示数据和里程碑显示。
- 验证通过：`npm.cmd run typecheck`；`npm.cmd test`，78 个测试全部通过；`npm.cmd run lint`；`git diff --check`；`npm.cmd run build`；沙箱外清空本机代理后执行 `npm.cmd run test:e2e`，1 个 Chromium 冒烟用例通过。
- 注意：线上 Supabase 尚未自动应用本轮迁移，真实 API 模式验证审核字段前需要先执行 `supabase db push` 或在 Supabase SQL Editor 应用迁移 SQL。

### 运营：发起人评分 / 案件结果评分第一版
- 新增 `src/lib/reviews/source-review.ts`，统一校验发起人验收评分、案件结果评分、案源评语和结果摘要；评分限定为 1 到 10 的整数，文本字段会清理空白并限制长度。
- 新增 Supabase 迁移 `20260609042505_add_task_source_review_scores.sql`，为 `tasks` 增加案源评分、案源评语、案源评分时间、案件结果评分和结果摘要字段，并增加评分范围约束。
- `POST /api/tasks/:id/approve` 支持在发起人验收时一并保存评分和评价摘要，并把评分写入审计 metadata；任务列表 API 与前端 API client 已补充新字段映射。
- “我的任务”中的验收动作升级为评分表单，发起人可在确认验收前填写案源评分、案件结果评分、案源评语和结果摘要；任务详情会展示已采集评分。
- 承办律师绩效统计新增案源平均评分和案件结果平均评分；总览页表格和运营信号同步展示，律师个人工作台的“综合评分”纳入客户评分、案源评分和结果评分。
- 新增 `tests/source-review.test.ts`，并扩展工作流和个人工作台测试，覆盖评分校验、统计聚合和综合评分展示。
- 验证通过：`npm.cmd run typecheck`；`npm.cmd test`，72 个测试全部通过。
- 注意：线上 Supabase 尚未自动应用本轮迁移，真实 API 模式保存新评分字段前需要先执行 `supabase db push` 或在 Supabase SQL Editor 应用迁移 SQL。

## 2026-06-08

### 运营：角色菜单权限第一版

- 新增 `src/lib/permissions/menu.ts`，集中维护内部角色、角色说明、菜单入口、默认入口和菜单可访问角色。
- 后台导航改为从统一权限模型生成，减少菜单权限散落在组件中的硬编码。
- 新增“权限”页面，系统管理员和律所管理员可查看角色能力摘要、菜单权限矩阵和菜单说明。
- 律所管理员补齐“结算”入口，和既有结算确认业务权限保持一致。
- 新增角色菜单权限单元测试，覆盖默认入口、承办律师边界、律所管理员权限、客户/渠道商不能进入内部后台和菜单 key 唯一性。
- 本地 E2E 冒烟用例新增“权限”页面入口断言。
- 验证结果：`npm run typecheck` 通过；`npm test` 通过，69 个测试全部通过；`npm run build` 已完成 `Compiled successfully`，随后在 Next 内部 lint/type 阶段超时；`npm run lint` 与 `npm run test:e2e` 在当前 Windows 会话中超时，需后续复跑。

### 运营：律师个人工作台第一版

- 新增 `src/lib/analytics/personal-workbench.ts`，按当前登录角色汇总个人任务、待办、任务金额、已确认结算和客户评分。
- 总览页新增“个人工作台”面板：承办律师看到待提交成果，发起人看到待验收成果，财务和管理角色看到待确认结算与待验收压力。
- 当前不新增数据库结构，先基于现有任务、结算和客户反馈数据支撑日常工作视角；后续可扩展为个人趋势、能力标签、提醒和服务端聚合 API。
- 新增律师个人工作台单元测试，覆盖承办律师、发起人和财务三类核心角色。
- 本地 E2E 冒烟用例新增“个人工作台”可见性断言。
- 验证通过：`npm run lint`、`npm run typecheck`、`npm test`、`npm run build`、沙箱外显式绕过本机代理执行 `npm run test:e2e`。

### 客户确认页：验证码授权下载第一版

- 新增 `canCustomerDownloadDeliverable`，统一规则为任务经发起人验收后才向客户开放附件下载。
- 新增 `GET /api/customer-portal/:token/deliverables/:deliverableId/download`，客户链接 active、已完成验证码校验且任务已验收时，生成 5 分钟 Storage signed URL 并重定向。
- 客户侧下载会写入 `customer_portal.deliverable_download` 审计日志，metadata 记录客户、任务和文件名，不暴露 token 明文。
- 客户确认页 API 映射交付附件元数据；已验收任务显示下载入口，未验收任务显示“发起人验收后开放”。
- 内存 Demo 客户确认页同步展示模拟附件，保持真实 API 模式和 Demo 模式体验一致。
- 验证通过：`npm run lint`、`npm run typecheck`、`npm test`、`npm run build`、沙箱外显式绕过本机代理执行 `npm run test:e2e`。

### 协作：正式交付文件上传第一版

- 新增 Supabase 迁移 `20260608132423_add_deliverable_files.sql`，创建私有 Storage bucket `lexos-deliverables`，并为 `task_deliverables` 增加附件元数据字段。
- 新增 `src/lib/deliverables/files.ts`，统一 6MB 上限、允许 MIME 类型、文件名清洗、Storage 路径生成和文件大小展示。
- 新增 `POST /api/tasks/:id/deliverables`，承办律师可提交带附件的成果；服务端校验任务归属和状态后上传私有 Storage、写入交付记录并推进任务状态。
- 新增 `GET /api/tasks/:id/deliverables/:deliverableId/download`，系统管理员、律所管理员、任务发起人和任务承办律师可通过 5 分钟 signed URL 下载内部交付附件。
- 我的任务提交成果表单新增附件选择、6MB 前端校验和文件摘要；交付记录面板展示文件名、大小和真实模式下载入口，Demo 模式显示模拟附件。
- 新增交付附件单元测试，覆盖文件名清洗、MIME fallback、超限拒绝、Storage 路径生成和大小格式化。
- 当前暂不做客户侧验证码授权下载、批量附件、病毒扫描和文件版本管理。
- 线上迁移尚未自动推送：当前 Supabase CLI 未 link 到项目，需后续执行 `supabase link` 后 `supabase db push`，或在 Supabase SQL Editor 应用迁移 SQL。
- 验证通过：`npm run lint`、`npm run typecheck`、`npm test`、`npm run build`、沙箱外显式绕过本机代理执行 `npm run test:e2e`。

### 运营：用户运维第一版

- 新增 `PATCH /api/users/:id`，系统管理员和律所管理员可更新用户角色、职级和账号状态。
- 用户页新增账号状态筛选、内联编辑、停用/启用二次确认；当前登录账号行不可编辑，避免误停用自己。
- 承办律师必须绑定有效职级；非承办律师会自动清空职级，避免结算口径误用。
- 更新会同步 `profiles.status` 和 `organization_members.status`，并写入 `users.update`、`users.disable` 或 `users.enable` 审计日志。
- 新增用户更新输入单元测试，覆盖非承办律师清空职级、承办律师必须绑定职级和非法状态拒绝。
- 当前暂不做批量停用、角色审批流和历史职级调整记录。
- 验证通过：`npm run lint`、`npm run typecheck`、`npm test`、`npm run build`、沙箱外显式绕过本机代理执行 `npm run test:e2e`。

### 运营：结算批量确认第一版

- 新增 `POST /api/settlements/bulk-confirm`，财务、律所管理员和系统管理员可一次确认最多 100 条待结算记录。
- 抽出 `src/lib/settlements/confirm.ts`，单笔确认和批量确认共用组织边界、状态校验、锁定期、任务状态推进和审计日志规则。
- 结算页新增待确认记录勾选列和“批量确认”入口；真实 API 模式走服务端批量接口，Demo 模式同步更新内存结算与任务状态。
- 新增批量确认 ID 清理、去重和数量限制测试；本地 E2E 冒烟用例补充批量确认入口断言。
- 当前暂不做跨页全选、部分成功回写和批量付款，后续可在财务运营增强阶段继续推进。
- 验证通过：`npm run lint`、`npm run typecheck`、`npm test`、`npm run build`、沙箱外 `npm run test:e2e`。

### 运营：列表排序第一版

- 新增 `parseListSort`，服务端列表排序只接受白名单 sort key，非法排序会回退默认值。
- `/api/users`、`/api/customers`、`/api/tasks`、`/api/settlements` 和 `/api/audit-logs` 接入排序参数。
- 用户、客户、任务大厅、我的任务、结算和审计页面新增排序选择控件。
- Demo 模式会在前端按相同 sort key 排序，真实 API 模式会把 sort 参数传给服务端。
- 新增排序参数单元测试，覆盖白名单解析和非法排序回退。
- 当前暂不做跨关系字段排序和导出排序，后续可在服务端聚合 API 或数据库视图稳定后补齐。
- 验证通过：`npm run lint`、`npm run typecheck`、`npm test`、`npm run build`、沙箱外 `npm run test:e2e`。

### 协作：任务里程碑与交付记录第一版

- 新增 `src/lib/tasks/progress.ts`，统一把任务状态转换为发布、接单、成果提交、发起人验收、客户确认和结算记录里程碑。
- `Task` 类型新增可选 `deliverables`，真实 API 模式会保留 `task_deliverables` 返回的标题、说明、外部链接和提交时间。
- Demo 模式提交成果时会同步生成交付记录，避免“成果区”只有单个字段。
- 我的任务详情新增里程碑完成度、下一步和“交付记录”面板，并继续保留结算关联卡。
- 新增单元测试覆盖已结算任务完成全部里程碑、处理中任务停在成果提交节点、交付记录生成和空记录口径。
- E2E 冒烟用例新增“交付记录”可见性断言。
- 修正本地 Playwright 配置，默认不再复用已有 3100 服务，避免误连到其他本地项目；如确需复用，可显式设置 `PLAYWRIGHT_REUSE_SERVER=true`。
- 验证通过：`npm run lint`、`npm run typecheck`、`npm test`、`npm run build`、沙箱外 `npm run test:e2e`。

### 运营：承办律师绩效统计第一版

- 新增 `src/lib/analytics/lawyer-performance.ts`，基于现有用户、任务、客户反馈和结算数据聚合承办律师绩效。
- 总览页新增“承办律师绩效”面板，展示律师、职级、在办/完成任务、客户评分、任务金额和结算金额。
- 右侧信号栏新增绩效领先律师、有效承办律师、客户平均评分、在办任务、已完成任务和已确认结算。
- 当前不新增数据库结构，先用现有数据支撑管理层演示和运营判断；后续可扩展为律师个人工作台、正式评分快照和服务端聚合 API。
- 新增律师绩效单元测试，覆盖标准 demo 数据的任务金额、客户评分、结算金额、已取消任务排除和排序口径。
- 验证通过：`npm run lint`、本轮触碰文件的本地 ESLint 直接检查、`npm run typecheck`、`npm test`、`npm run build`、沙箱外 `npm run test:e2e`。

### 运营：系统参数接入真实业务规则第一版

- 新增 `src/lib/settings/runtime.ts`，提供组织级系统参数运行时读取、显式配置识别和结算锁定期计算。
- 客户确认页验证码校验接入 `customer_portal_demo_code`，默认仍为 `111111`，真实 API 模式可通过“参数”页修改。
- 用户、客户、任务、结算和审计日志列表在未显式传 `pageSize` 时会读取 `default_page_size`，仍保留最大 100 条的接口上限。
- 财务确认结算接入 `settlement_lock_days`；为兼容当前演示闭环，只有数据库中显式保存该参数后才会阻断财务和律所管理员确认，系统管理员可应急越过锁定。
- 新增单元测试覆盖系统参数默认分页、客户确认页验证码覆盖和结算锁定期边界。
- 更新 README、API 文档、演示指南、当前状态和 backlog。
- 验证通过：`npm run lint`、`npm run typecheck`、`npm test`、`npm run build`、沙箱外 `npm run test:e2e`。

### 运营：客户与渠道基础统计第一版

- 新增 `src/lib/analytics/customer-channels.ts`，按客户来源汇总客户、有效任务、客户确认任务、任务金额、结算金额和评分。
- 总览页新增“渠道来源”指标和“客户与渠道贡献”面板，展示来源、客户数、有效任务、确认率、任务金额、结算金额和平均评分。
- 当前统计基于现有 `customer.source`、任务、反馈和结算数据，不新增渠道商账号或数据库结构。
- 新增客户与渠道统计单元测试，覆盖任务金额排序、已取消任务排除、结算金额和评分汇总。
- 更新 README、当前状态和 backlog。
- 验证通过：`npm run lint`、`npm run typecheck`、`npm test`、`npm run build`、沙箱外 `npm run test:e2e`。

### 运营：结算导出 CSV 第一版

- 新增通用 CSV 转义工具 `src/lib/csv.ts`，审计导出和结算导出共用同一套转义逻辑。
- 新增 `src/lib/settlements/export.ts`，统一维护结算导出字段、金额格式和中文状态文案。
- 新增 `GET /api/settlements/export`，支持 `search` / `keyword` 和 `status` 筛选，最多导出 1000 条。
- 结算导出权限沿用结算列表：管理员、律所管理员和财务可导出本组织结算；承办律师只能导出自己的结算。
- 结算页新增“导出 CSV”入口，真实 API 模式走服务端导出，Demo 模式按当前筛选结果即时生成 CSV。
- 本地 Playwright E2E 默认配置排除远端 Preview smoke，避免 `npm run test:e2e` 误跑远端部署检查。
- 更新 README、部署文档、API 文档、当前状态和 backlog。
- 新增结算导出单元测试，覆盖金额元格式、中文状态和 CSV 转义。
- 验证通过：`npm run lint`、`npm run typecheck`、`npm test`、`npm run build`、沙箱外 `npm run test:e2e`。

### 部署：Vercel Preview 远端 smoke 第一版

- 新增 `playwright.preview.config.ts`，远端 Preview smoke 不启动本地 dev server，只访问 `LEXOS_PREVIEW_BASE_URL`。
- 新增 `npm run smoke:preview`，用于部署后检查 Preview URL。
- 新增 `tests/e2e/lexos-preview-smoke.spec.ts`，覆盖 `/api/health`、登录页、内存 demo 管理员首次改密、总览页、客户确认页入口和结算页。
- Preview smoke 支持可选 `LEXOS_PREVIEW_EXPECT_MODE`，第一版公开演示建议设置为 `demo`。
- 当 `LEXOS_PREVIEW_EXPECT_MODE=supabase` 时，远端 smoke 只检查健康接口；真实登录和业务闭环仍使用 `npm run smoke:real`。
- 客户确认页校验使用 `LEXOS-DEMO-004 / 13800000000 / 111111`，不点击“确认接收并评分”，避免改变标准演示数据。
- 更新 `.env.example`、README、测试文档、部署文档、当前状态和 backlog。
- 验证通过：`npm run lint`、`npm run typecheck`、`npm test`、`npm run build`，以及 `LEXOS_PREVIEW_BASE_URL=https://example.com npm run smoke:preview -- --list`。

### 部署：Vercel Preview 自检第一版

- 新增 `src/lib/deployment/preview-readiness.ts`，统一判断 Preview 当前是内存 demo 模式还是真实 Supabase 模式。
- 新增 `npm run preview:check`，部署前可检查 Supabase 变量完整性、缺失变量名和配置提示。
- 新增 `GET /api/health`，部署后可确认运行模式、Preview 自检状态、Vercel 环境、commit 和时间戳。
- 健康检查接口只返回变量名称与状态，不返回任何密钥值。
- 更新 README、部署文档、API 文档、当前状态和 backlog，明确第一版 Vercel Preview 默认使用内存 demo 模式。
- 新增 Preview 自检单元测试，覆盖内存 demo、缺省变量、真实 Supabase 缺变量和真实 Supabase 变量完整四种场景。
- 验证通过：`npm run preview:check`、`npm run lint`、`npm run typecheck`、`npm test`、`npm run build`。
- 本地 `.env.local` 被识别为真实 Supabase 模式；临时设置 `NEXT_PUBLIC_DEMO_MODE=true` 时可切换为内存 demo 模式，并给出 Supabase 变量已配置提示。

### 运营：可演示到可运营第一轮

- 前端真实 API 模式开始读取服务端 `pagination` 元数据，用户、客户、任务大厅、我的任务、结算和审计页面不再只依赖前端本地分页。
- 审计日志页面新增动作筛选、模块筛选、开始日期、结束日期和 CSV 导出入口。
- `/api/audit-logs` 和 `/api/audit-logs/export` 新增 `startDate`、`endDate` 日期范围过滤，页面筛选和导出使用同一套查询参数。
- `/api/tasks` 新增 `minRankId` 查询参数，任务大厅真实 API 模式可按最低职级服务端过滤。
- 列表页新增真实 API 加载提示和内联错误提示，Demo 模式仍保留原本前端内存分页与筛选。
- 新增日期范围标准化 helper，并补充单元测试。

### 演示：标准 Demo 数据与演示指南

- 扩充内存 demo 标准数据：9 个用户、4 个客户、9 个任务，覆盖待承接、处理中、待验收、客户待确认、待结算、已结算和已取消状态。
- 新增 L1C、L2B、L3A 三档结算样例，演示职级比例对资金分配的影响。
- 新增客户反馈、审计日志和治理类审计事件样例，包括登录失败、首次改密、创建用户、创建客户、取消任务和系统参数更新。
- 审计日志 demo 数据新增 `actionCode`，Demo 模式下动作筛选可与真实 API 的动作 code 对齐，同时仍展示中文动作。
- 总览页新增“重置演示数据”入口，仅本地 Demo 模式显示，可将任务、客户、结算、反馈和审计恢复到标准脚本状态。
- 登录页固定展示核心演示账号，避免因为数据顺序变化漏掉承办律师和财务账号。
- 新增 `docs/demo-guide.md`，整理演示目标、推荐账号、标准脚本、客户确认页演示、风险处理和进入可运营阶段检查清单。

### 验证

- `npm run lint` 通过。
- `npm run typecheck` 通过。
- `npm test` 通过，32 个测试全部通过。
- `npm run build` 通过。
- `npm run test:e2e` 通过，1 个 Chromium 冒烟用例通过。

## 2026-06-07

### 任务：第 8 轮任务详情页增强

- 我的任务列表展开区新增任务时间线，展示发布任务、办案接单、成果提交、发起人验收、客户确认和结算记录状态。
- 任务详情新增结算关联卡，集中展示任务金额、结算状态、结算比例和律师待结算金额。
- 我的任务页开始接收结算数据，并按任务 ID 关联到任务详情。
- Playwright 冒烟用例新增任务时间线和结算关联可见性断言。

### 验证

- `npm run verify` 通过：lint、typecheck、29 个测试和生产构建全部通过。
- `npm run test:e2e` 通过，1 个 Chromium 冒烟用例覆盖登录、首次改密、参数页、任务详情和结算页。

### UI：第 7 轮组件体系与规范化

- 新增 `src/features/demo/ui-tokens.ts`，集中维护 Lexos 后台常用 panel、input、table token。
- 面板、输入框、通用表格、结算表、系统参数表和搜索框开始复用统一 token，减少重复 Tailwind class。
- 新增 `docs/design-system.md`，记录 Lexos 当前 UI 方向、视觉原则、代码约定和后续组件化方向。
- 完成 shadcn 引入判断：当前阶段暂不引入 shadcn，先延续自定义 Tailwind 体系；后续出现大量弹窗、复杂选择器、日期范围或可组合数据表时再评估。

### 验证

- `npm run lint` 通过。
- `npm run typecheck` 通过。
- `npm test` 通过，29 个测试全部通过。
- `npm run build` 通过。
- `npm run test:e2e` 通过，1 个 Chromium 冒烟用例通过。

### 运营：第 6 轮系统参数页面

- 新增 `src/lib/settings/definitions.ts`，集中维护系统参数 key、类型、默认值、范围和中文说明。
- 新增 `GET /api/system-settings`，系统管理员和律所管理员可读取本组织参数，响应会合并数据库值与默认值。
- 新增 `PUT /api/system-settings`，支持保存组织级系统参数，并写入 `system_settings.update` 审计日志。
- 后台新增“参数”导航和系统参数页面，可维护客户访问验证码、结算锁定天数、默认分页数量和运行模式提示开关。
- 本地 Demo 模式下参数保存走前端内存状态，真实 API 模式下保存到 Supabase `system_settings`。
- Playwright 冒烟用例新增“参数”页可达性检查。
- 更新 `docs/api.md`，补充系统参数 API。

### 验证

- `npm run lint` 通过。
- `npm run typecheck` 通过。
- `npm test` 通过，29 个测试全部通过。
- `npm run build` 通过，Next 已识别新增 `/api/system-settings` Route。
- `npm run test:e2e` 通过，1 个 Chromium 冒烟用例覆盖登录、首次改密、参数页、任务页和结算页。

### 安全：第 5 轮审计与安全增强

- 登录接口新增失败登录审计：当用户名已匹配到系统内账号，但账号停用或密码错误时，写入 `auth.login_failed`。
- 失败登录 metadata 只记录用户名和失败原因，不记录密码。
- 失败登录审计写入失败不会改变登录接口原本的 401 响应，避免审计系统故障影响登录安全路径。
- 新增 `GET /api/audit-logs/export`，系统管理员和律所管理员可导出审计日志 CSV。
- 审计导出支持 `search` / `keyword`、`action`、`entityType` 过滤，最多导出 1000 条，文件名为 `lexos-audit-logs-YYYY-MM-DD.csv`。
- 新增 CSV 转义工具，正确处理逗号、引号和换行。
- 更新 `docs/api.md`，补充审计导出接口和失败登录审计说明。

### 验证

- `npm run lint` 通过。
- `npm run typecheck` 通过。
- `npm test` 通过，26 个测试全部通过。
- `npm run build` 通过，Next 已识别新增 `/api/audit-logs/export` Route。

### API：第 4 轮服务端分页与搜索

- 新增 `src/lib/api/pagination.ts`，统一解析 `page`、`pageSize`、`search` / `keyword`，默认每页 50 条，最大 100 条。
- `/api/users` 支持服务端分页、角色筛选、状态筛选和搜索，并返回 `pagination` 元数据。
- `/api/customers` 支持服务端分页、状态筛选和搜索，并返回 `pagination` 元数据。
- `/api/tasks` 支持服务端分页、状态筛选和搜索，同时保留发起人、承办律师、财务和管理员的可见性规则。
- `/api/settlements` 支持服务端分页、状态筛选和搜索，同时保留承办律师只能看自己结算的规则。
- `/api/audit-logs` 支持服务端分页、action 筛选、entityType 筛选和搜索，默认不再固定只返回最近 100 条。
- 用户、任务和结算的跨表搜索改为“先查询相关 ID，再在主表 `or + in` 过滤”，避免 PostgREST 跨嵌套表 `or` 解析失败。
- 更新 `docs/api.md`，补充分页响应格式和列表查询参数。

### 验证

- `npm run lint` 通过。
- `npm run typecheck` 通过。
- `npm test` 通过，25 个测试全部通过。
- `npm run build` 通过。
- 真实 Supabase 只读查询验证通过：users、customers、tasks、settlements、auditLogs 的 `select + count + range + search` 查询形状均可执行。
- 承办律师任务可见性叠加搜索的多重 `or` 只读查询验证通过。

### 测试：第 2 轮 Playwright E2E

- 新增 `@playwright/test`，并加入 `npm run test:e2e`。
- 新增 `playwright.config.ts`，固定 Chromium 桌面冒烟项目，默认使用 `http://127.0.0.1:3100`。
- 新增 `scripts/e2e-dev-server.mjs`，E2E 自动启动 Next.js dev server，并强制 `NEXT_PUBLIC_DEMO_MODE=true`，避免写入线上 Supabase。
- 新增 `tests/e2e/lexos-smoke.spec.ts`，覆盖本地 Demo 模式下管理员登录、首次改密、进入总览、我的任务和结算管理页面。
- Playwright 配置中显式对 `127.0.0.1`、`localhost` 和 `::1` 绕过本机代理，避免本地健康检查因 `http_proxy/https_proxy` 返回 502。
- 新增 `docs/testing.md`，说明单元测试、真实 Supabase smoke 和 Playwright E2E 的边界。

### 验证

- `npm run lint` 通过。
- `npm run typecheck` 通过。
- `npm test` 通过，20 个测试全部通过。
- `npm run build` 通过。
- `npm run verify` 通过。
- `npm run test:e2e` 通过：1 个 Chromium 冒烟用例通过。沙箱内启动 Chromium 会被 `EPERM` 拦截，本轮已在沙箱外运行该命令完成验证。

### 部署：第 3 轮 Vercel Preview demo 准备

- 更新 `docs/deployment.md`，补充内存 demo / 真实 Supabase 模式切换、Vercel Preview 环境变量、部署前检查、RLS 验证和私有化部署前置说明。
- 更新 `.env.example`，补齐 Preview、真实 Supabase、seed、smoke 和 RLS 验证相关变量示例。
- 更新 `README.md`，同步当前真实 API、Supabase、审计日志、Demo / 真实模式和 Vercel Preview demo 入口。
- 本轮未创建 `vercel.json`，当前 Next.js 项目可先使用 Vercel 默认框架识别。

### 验证

- `git diff --check -- docs/deployment.md .env.example README.md` 通过。
- 部署文档轮次仅修改文档和环境变量样例，未改业务代码。

### 工程化：第 1 轮质量门槛

- 新增 `eslint.config.mjs`，用 ESLint 9 flat config 兼容 Next.js `core-web-vitals` 与 TypeScript 规则。
- 将 `npm run lint` 从交互式 `next lint` 迁移为非交互式 ESLint CLI，并限定代码目录，避免全仓库扫描超时。
- 新增 `npm run typecheck` 和 `npm run verify`，后续迭代可用一条命令执行 lint、类型检查、测试和生产构建。
- 对 React bootstrap effect 增加明确的 hooks 规则例外说明，保持初始化只随 API mode 启动的行为。

### 验证

- `npm run lint` 通过。
- `npm run typecheck` 通过。
- `npm test` 通过，20 个测试全部通过。
- `npm run build` 通过。
- `npm run verify` 通过。

### 继续迭代：UI v0.2 第三段 - 可演示稳定性收尾

- 后台新增全局成功提示，创建用户、创建客户、发布任务、承接、提交成果、任务验收、客户确认和财务结算等关键操作完成后会给出明确反馈。
- 关键操作新增 loading 状态，避免重复点击；任务验收和财务确认结算新增内联二次确认。
- 我的任务列表新增任务详情展开区，展示任务流程节点、客户、承办律师、任务类型、金额、职级、截止日期、客户 token、验收时间和成果链接。
- 发布任务在无客户时显示正式空状态，避免出现不可用但看似可提交的表单。
- 空状态组件升级为图标、标题和说明组合，减少 demo 占位感。

### 验证

- `node_modules/.bin/tsc.cmd --noEmit --pretty false` 通过。
- `npm test` 通过，20 个测试全部通过。
- `npm run build` 通过。
- 本地首页 `http://127.0.0.1:3000` 返回 200，dev server 错误日志为空。
- `npm run lint` 未通过：当前 `next lint` 会进入交互式 ESLint 初始化流程，需后续迁移到 ESLint CLI 或补正式 lint 配置。
- Browser 插件验证未完成：内置浏览器会话初始化时底层 node_repl 内核退出。

### 项目流程：切换到 web-iterative-dev 前的对齐

- 新增 `docs/web-iterative-dev-alignment.md`，记录 Lexos 在 `web-iterative-dev` 下的项目模式、工具检测、迭代协议、质量门槛和后续任务卡模板。
- 明确 Lexos 当前属于 Existing project 模式，后续以仓库文档为事实源，一轮只推进一个确认过的功能、修复或变更。
- 固定当前推荐验证命令：`npx.cmd tsc --noEmit --pretty false`、`npm.cmd test`、必要时 `npm.cmd run build`、`npm.cmd run verify:rls` 和 `npm.cmd run smoke:real`。
- 记录当前流程差距：lint 脚本需复核、尚未引入 e2e、UI 是否引入 shadcn 需在大规模组件化前确认、Vercel preview 信息待首次部署补齐。

### 验证

- 本次只更新流程文档，未修改业务代码。

### 继续迭代：UI v0.2 第二段 - 登录页、移动端与列表效率

- 重设计登录页，改为深色律所品牌入口 + 真实 API 模式提示 + 紧凑登录表单。
- 新增移动端横向导航，手机和平板可直接切换总览、用户、客户、任务、结算和审计等页面。
- 用户列表新增关键词搜索、角色筛选和分页。
- 客户列表新增关键词搜索和分页。
- 任务大厅新增关键词搜索、最低职级筛选和分页。
- 我的任务新增关键词搜索、任务状态筛选和分页；系统管理员视角可查看全部任务。
- 结算页面新增关键词搜索、状态筛选、分页和移动端横向表格。
- 审计日志页面新增关键词搜索、模块筛选和分页。
- 通用表格组件增加空状态和小屏横向滚动，降低表格在移动端挤压变形的风险。

### 验证

- `npm test` 通过，20 个测试全部通过。
- `npx tsc --noEmit --pretty false` 通过。
- `npm run build` 通过，已完成编译、类型检查、静态页面生成和 build traces 收集。

### 继续迭代：UI v0.2 管理后台重设计

- 将后台主框架改为深色商务侧栏、紧凑顶部栏和更宽的运营内容区。
- 统一面板、表格、输入框、状态标签和指标卡样式，降低无效留白，提高扫描效率。
- 总览页新增任务状态分布、运营信号和最近任务列表，弱化早期 demo 卡片感。
- 任务大厅和我的任务改为更紧凑的行式布局，适合律师快速浏览金额、职级、截止时间和任务状态。
- 结算和审计日志页面沿用统一密集表格视觉。
- 客户确认页预览只在总览页展示，不再附着到每个后台页面底部。

### 验证

- `npm test` 通过，20 个测试全部通过。
- `npx tsc --noEmit` 通过。
- 本地首页 `http://127.0.0.1:3000` 返回 200。
- `npm run build` 已完成编译、类型检查、页面生成和页面优化，但在 Windows 环境的 `Collecting build traces` 阶段超过 5 分钟超时。

## 2026-06-06

### 继续迭代：RLS / Data API 安全边界

- 新增迁移 `20260606133522_lock_down_direct_table_access.sql`，撤销 `anon` 和 `authenticated` 对 public 内部表的直接访问权限。
- 保留 `service_role` 对内部表的访问，确保 Next.js API 服务端业务路径继续可用。
- 新增 `npm run verify:rls`，用于验证 anon、authenticated 和 service role 的真实线上访问边界。
- 将 RLS 策略说明更新为“前端不直连表，业务统一走 Next.js API”。

### 验证

- 线上 Supabase 已应用远程迁移 `lock_down_direct_table_access`。
- `npm run verify:rls` 通过：17 张内部表中 service role 全部可读，anon 全部被拒绝，authenticated 全部被拒绝。
- `npm run smoke:real` 通过，真实任务 `66154cd0-f020-4473-87d6-df1ad2c71dff` 已完成，结算 `6f71a645-c1cb-4176-8e27-adb61f21b2b8` 最终状态为 `confirmed`。

### 继续迭代：基础审计日志

- 新增统一审计日志 helper，关键业务 API 通过统一入口写入 `audit_logs`。
- 新增 `/api/audit-logs`，系统管理员和律所管理员可查询本组织最近 100 条审计记录。
- 真实 API 模式下，前端“审计”页面已接入后端审计日志。
- 已记录登录成功、修改密码、创建用户、创建客户、创建任务、承接、提交成果、任务验收、客户确认评分和财务确认结算。
- 审计日志 metadata 不记录密码和客户确认页 token 明文。

### 验证

- `npm test` 通过，20 个测试全部通过。
- `npm run build` 通过，Next 已识别新增 `/api/audit-logs` Route。
- `npm run smoke:real` 通过，真实任务 `2da423f8-0f0b-4075-bcc4-ec5fca12cd93` 已完成，结算 `f0f20aae-b701-42bb-9eef-f9528b05bb0b` 最终状态为 `confirmed`。
- 管理员会话访问 `/api/audit-logs` 成功，返回最近审计记录 12 条。

### 继续迭代：真实数据库闭环验证

- 新增 `npm run smoke:real`，用于通过本地 API 对线上 Supabase 执行端到端 smoke 测试。
- Smoke 脚本不写死密码，通过 `LEXOS_SMOKE_ADMIN_PASSWORD` 和 `LEXOS_SMOKE_TEST_PASSWORD` 环境变量读取。
- Smoke 脚本会创建/复用 `lawyer04`、`lawyer01`、`finance01` 三个演示账号，并清除默认密码强制改密状态。
- 真实闭环已跑通：创建客户、发布任务、承接、提交成果、发起人验收、客户验证码确认、评分、生成结算、财务确认结算。

### 验证

- `npm run smoke:real` 通过。
- 真实任务 ID：`7892f865-1ea4-43f0-a179-d7770401bb4c`。
- 真实结算 ID：`9b21d929-6b07-429e-9209-baa11887a1fd`。
- 结算金额：`960000` 分。
- 最终结算状态：`confirmed`。

### 继续迭代：连接线上 Supabase

- 识别并修正 `.env.local` 中 Supabase URL 使用 `/rest/v1/` endpoint 的问题，统一规范化为项目根 URL。
- 将本地真实 API 模式切到 `NEXT_PUBLIC_DEMO_MODE=false`。
- 新增 Supabase URL 规范化工具和测试。
- 发现线上 `LexOS` 项目已有空的旧表 `profiles`、`audit_logs`、`legal_tasks`、`legal_sops`，因此新增非破坏性兼容迁移 `20260606105523_lexos_online_compatibility_bootstrap.sql`。
- 在线上 Supabase 应用兼容迁移，创建/补齐 Lexos MVP 所需表、列、索引、默认组织、角色和 L1A 至 L3C 职级。
- 执行 `npm run seed:admin` 创建默认管理员 `admin / 111111`。
- 修复 Node 脚本无法解析 `@/` 路径别名的问题。
- 调整真实 API 模式启动体验：登录页优先显示，后台尝试恢复已有会话，避免 `/api/auth/me` 慢请求导致页面一直停在加载状态。

### 验证

- 线上项目 `bkgtrmaiatyublrvujlq` 状态为 `ACTIVE_HEALTHY`。
- 线上表和 9 档职级已通过 SQL 核对。
- `admin` 的 profile、Auth 用户和 `system_admin` 组织成员关系已核对。
- 本地 API 登录 `POST /api/auth/login` 成功，`GET /api/auth/me` 成功。
- 浏览器验证通过：真实 API 登录页可见，`admin / 111111` 登录后进入首次改密页。

### 继续迭代：前端真实 API 模式

- 新增 `/api/auth/me`，前端可读取当前登录用户的角色、职级和首次改密状态。
- 新增 `/api/auth/logout`，用于清理 Supabase 登录会话。
- 登录 API 返回完整内部用户身份，支持按角色展示菜单。
- 前端新增 API client 和数据适配层，将 Supabase 原始字段转换为现有工作台模型。
- 前端工作台支持 `NEXT_PUBLIC_DEMO_MODE=false` 的真实 API 模式。
- API 模式已接入登录、首次改密、用户列表/创建、职级、客户列表/创建、任务列表/创建/承接/提交/验收、客户确认页验证码/评分、结算列表/确认。
- 保留原有内存 demo 模式，方便没有 Supabase 环境时继续演示。
- 任务列表 API 补充成果交付字段，提交成果后刷新页面仍能显示成果说明和外部链接。

### 验证

- `npm test` 通过，18 个测试全部通过。
- `tsc --noEmit` 通过，没有类型错误。
- Next 构建日志显示构建完整完成，并识别新增 API Route；本次轮询构建脚本的外层退出码异常，需在接入线上 Supabase 后再做一次常规 `npm run build` 复核。

### 继续迭代：Supabase 接入基础层

- 新增用户名到 Supabase Auth 邮箱的映射工具。
- 新增创建用户输入校验：默认密码 `111111`、首次登录强制改密、承办律师必须绑定职级。
- 新增服务端 Supabase admin client，service role 仅在服务端使用。
- 新增内部会话和角色校验 helper。
- 新增 API：用户名登录、修改密码、用户列表、创建用户、职级列表。
- 新增 API：客户列表、创建客户。
- 新增 API：任务列表、创建任务、承接、提交成果、发起人验收。
- 新增 API：客户确认页验证码校验、客户确认页数据、客户确认评分。
- 新增 API：结算列表、财务确认结算。
- 新增 token hash 工具，客户确认页 token 明文不入库。
- 新增默认管理员初始化脚本 `npm run seed:admin`。
- 更新迁移授权，显式授予 `service_role` 表访问权限。
- 新增部署与 Supabase 接入文档。

### 验证

- `npm test` 通过，18 个测试全部通过。
- `npm run build` 通过，Next 已识别新增 API Route。
- `supabase migration list --local` 未完成，因为本地 Supabase Postgres 未启动。
- 已查看 Supabase changelog，注意到 2026-04-28 起新表不会自动暴露到 Data/GraphQL API，因此迁移中保留显式授权和 RLS。

---

### 新增

- 搭建 Next.js + TypeScript + Tailwind 项目骨架。
- 新增 Lexos MVP 本地 demo 工作台。
- 实现默认密码 `111111` 与首次登录强制改密体验。
- 实现管理员创建用户，新用户默认密码为 `111111`。
- 实现发起人创建客户和任务。
- 实现承办律师任务大厅承接和成果提交。
- 实现发起人验收任务。
- 实现客户确认页：任务 token + 手机号 + 固定验证码 `111111`。
- 实现客户确认接收、评分、自动生成待结算记录。
- 实现财务确认结算。
- 新增核心业务规则测试：结算金额、强制改密、承接权限、任务状态流转、客户验证码。
- 新增 Supabase 迁移文件，包含 MVP 表结构、索引、默认角色、默认职级和 RLS 草案。

### 验证

- `npm test` 通过，9 个测试全部通过。
- `npm run build` 通过。
- 本地临时 dev server HTTP 验证通过，访问 `/` 返回 200，页面内容包含 Lexos。

### 说明

- 当前前端 demo 使用内存数据，尚未连接真实 Supabase 项目。
- 真实短信服务商、文件上传、投诉扣罚、虚拟团队和复杂分账仍在后续 backlog 中。
# 2026-06-10 Vercel upload package dry run

- Added `src/lib/deployment/vercel-upload-package.ts`, `scripts/check-vercel-upload-package.ts`, `tests/vercel-upload-package.test.ts`, and `docs/vercel-upload-package.md`.
- Added `npm run deploy:upload:check`, a local-only dry run that simulates `.vercelignore`, blocks high-risk local paths, and scans included text files before any Vercel upload.
- Added `tests/` to `.vercelignore` and to the required Vercel ignore patterns so test fixtures are not uploaded to Vercel Preview.
- Integrated the upload package check into `final:gate:check`, private readiness, launch readiness, final acceptance, and release package readiness.
- Verified `deploy:upload:check`, `release:sensitive:check`, temporary Preview final gate pass path, `private:check`, full `npm test` with 236 passing tests, `typecheck`, `lint`, and `build`.
- No Vercel upload was performed; deployment remains gated on explicit user approval.

# 2026-06-10 Vercel Preview deployment request

- Added `src/lib/deployment/preview-deployment-request.ts`, `scripts/request-preview-deployment.ts`, `tests/preview-deployment-request.test.ts`, and `docs/vercel-preview-request.md`.
- Added `npm run deploy:preview:request`, a local-only approval packet that combines Preview readiness, deployment channel readiness, and the Vercel upload package dry run.
- Integrated the Preview request into private readiness, launch readiness, final acceptance, and release package readiness.
- Verified focused readiness tests, `deploy:preview:request`, `private:check`, `release:sensitive:check`, full `npm test` with 241 passing tests, `typecheck`, `lint`, and `build`.
- Verified `final:gate:check` with all non-upload Preview metadata set: the only remaining blockers are missing external upload approval and missing approval reference.
- No Vercel upload was performed; deployment remains gated on explicit user approval.

# 2026-06-10 Vercel Preview deployment evidence

- Added `src/lib/deployment/preview-deployment-evidence.ts`, `scripts/check-preview-deployment-evidence.ts`, `tests/preview-deployment-evidence.test.ts`, and `docs/vercel-preview-evidence.md`.
- Added `npm run deploy:preview:evidence`, a local-only post-upload evidence gate for Preview URL, deployment reference, build log reference, smoke result, owner, timestamp, and upload approval reference.
- Integrated the Preview evidence gate into private readiness, launch readiness, final acceptance, release package readiness, and `final:gate:check`.
- Verified focused readiness tests, `private:check`, `deploy:preview:request`, `release:sensitive:check`, `typecheck`, full `npm test` with 246 passing tests, `lint`, and `build`.
- Confirmed `deploy:preview:evidence` blocks by default until real Preview deployment evidence exists, and `final:gate:check` now reports 11 checks with Vercel upload authorization and Preview evidence as the remaining deployment blockers.
- No Vercel upload was performed; deployment remains gated on explicit user approval.

# 2026-06-10 Preview smoke JSON evidence

- Updated `playwright.preview.config.ts` so `npm run smoke:preview` writes JSON evidence to `reports/preview-smoke/results.json` by default, with `LEXOS_PREVIEW_SMOKE_REPORT_PATH` as an override.
- Updated `docs/vercel-preview-evidence.md` to use the JSON report as `LEXOS_PREVIEW_SMOKE_REF`.
- Added `tests/preview-smoke-config.test.ts` and included it in `npm test`.
- Verified focused Preview smoke config tests, `typecheck`, full `npm test` with 248 passing tests, `release:sensitive:check`, `deploy:preview:request`, `lint`, and `build`.
- Confirmed `final:gate:check` still blocks only on upload authorization and missing real Preview deployment evidence after all local readiness checks pass.
- No Vercel upload was performed; deployment remains gated on explicit user approval.

# 2026-06-10 Preview and final gate env templates

- Added Preview deployment evidence variables to `.env.example`, including the stable `reports/preview-smoke/results.json` smoke report path, deployment references, build log reference, owner, timestamp, and optional claim URL.
- Added `tests/preview-env-template.test.ts` and included it in `npm test`.
- Added `tests/final-gate-env-template.test.ts` to guard final acceptance, release package, handover, and post-deployment metadata variables in `.env.example`.
- Verified focused Preview/final-gate env tests, `typecheck`, full `npm test` with 252 passing tests, `lint`, `release:sensitive:check`, `deploy:preview:request`, and `build`.
- Confirmed `final:gate:check` still blocks on external upload approval, real Preview deployment evidence, and human final-delivery metadata rather than local package cleanliness.
- No Vercel upload was performed; deployment remains gated on explicit user approval.

# 2026-06-10 UI pre-delivery refactor

- Refined the Lexos workspace toward a restrained legal-operations console: stronger global surface layering, clearer navigation state, and denser dashboard signal hierarchy.
- Added a skip link, reduced-motion handling, larger auth/navigation touch targets, top-bar runtime mode visibility, and `aria-current` for active navigation.
- Upgraded shared UI tokens for inputs, panels, tables, toolbars, pagination, badges, and empty states.
- Added a dashboard operations cue strip for settlement, customer confirmation, open task, and risk workload status.
- Verified `typecheck`, `lint`, elevated Playwright E2E, full `npm test` with 252 passing tests, and `build`.
