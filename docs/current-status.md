# Lexos 当前状态

## 当前阶段

## 2026-06-11 本轮更新：main 生产部署准备与 Vercel 环境对齐

用户已明确批准直接更新 `main` 分支并推进 Vercel 部署。本轮将部署目标从 Preview 切换为 production，并以 `vercel-git` 作为生产部署通道：提交到 `main` 后由 Vercel GitHub 集成自动触发生产构建。

Vercel 连接器已确认远端存在 `lexos` 项目，项目 ID 为 `prj_Rs9stBhpa6tOE6R1FGqrO6Y8oBp3`，团队 ID 为 `team_J5yWYtoyHhhDUvErX4yrduFy`。本地新增 `.vercel/project.json` 用于门禁识别项目绑定，但 `.vercel/` 已加入 `.gitignore` 和 `.vercelignore`，避免本地绑定文件进入 Git 或上传包。

本轮修正了部署通道门禁：`vercel-git` 代表 Vercel 通过 GitHub 集成构建部署，只需要有效 `origin` remote 和明确批准，不应强制要求本机 Vercel CLI 可用；`vercel-cli` 路径仍然要求本机 CLI。已补充对应回归测试。

生产 Vercel 环境变量需与真实 Supabase 模式对齐，至少包含 `NEXT_PUBLIC_DEMO_MODE=false`、`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`、`LEXOS_DEFAULT_ORGANIZATION_ID` 和 `LEXOS_AUTH_EMAIL_DOMAIN`。当前生产别名尚运行旧版本或受 Vercel Authentication 保护，部署后需通过 Vercel 认证 fetch `/api/health` 复核 `mode`、`ok` 和 `missingSupabaseEnvKeys`。

本轮部署前验证结果：
- `node --test tests/deployment-channel.test.ts` 通过，9 个测试全部通过。
- 临时设置生产部署批准变量后，`npm.cmd run deploy:channel:check` 通过。
- `npm.cmd run deploy:upload:check` 通过，216 个包含文件，0 个高风险路径，0 个敏感发现。
- `npm.cmd run release:sensitive:check` 通过，扫描 262 个文本文件，0 个阻断项，23 个既有人工复核项。
- `npm.cmd run typecheck` 通过。
- `npm.cmd run lint` 通过。
- `npm.cmd test` 通过，253 个测试全部通过。
- `npm.cmd run build` 通过，21 个静态页面生成完成，首页路由大小约 53 kB。

## 2026-06-11 本轮更新：UI 入口与移动端表格收口

UI 入口与移动端表格收口已完成。本轮继续按 `web-iterative-dev` Existing project 模式推进，在上一轮任务、结算、风控和客户门户重构基础上，补齐入口页、基础控件和通用表格的体验一致性。

登录页和首次改密页已接入统一输入、按钮和内联错误样式；全局错误提示也统一复用 `InlineError`，避免不同页面出现多套红色错误框。交付记录中的外部链接从小号文字链接升级为可聚焦、可触达的软性操作按钮。

通用工具栏选择器和日期输入内部高度已与 44px 外层触达节奏对齐；分页上一页/下一页按钮提升到 44px 点击区域，并补充 hover 状态。通用 `DataTable` 已新增小屏字段卡片视图，移动端优先展示字段和值，桌面端仍保持高密度表格，降低总览、客户、资金、审计和权限等页面在手机上的横向挤压。

本轮验证结果：
- `npm.cmd run typecheck` 通过。
- `npm.cmd run lint` 通过；本次 Windows 会话中耗时较长，但无规则失败。
- `npm.cmd test` 通过，252 个测试全部通过。
- `npm.cmd run build` 通过，21 个静态页面生成完成，首页路由大小约 53 kB。
- 沙箱外 `npm.cmd run test:e2e` 通过，1 个 Chromium 本地 Demo 冒烟用例通过。
- `npm.cmd run release:sensitive:check` 通过，扫描 262 个文本文件，0 个阻断项，23 个既有人工复核项。
- `npm.cmd run deploy:upload:check` 通过，216 个包含文件，0 个高风险路径，0 个敏感发现。

本轮 E2E 曾发现移动端字段卡片和桌面表格同时存在于 DOM 时，桌面测试会先命中隐藏的移动端文本。已改为基于媒体查询只渲染当前视图，避免隐藏副本影响可见性断言和无障碍树。

本轮未上传部署、未调用 Vercel、未连接线上 Supabase 写入业务数据。

## 2026-06-10 本轮更新：UI 重构交付收口

UI 重构交付收口已完成。本轮继续以 `web-iterative-dev` 为总调度，设计方向保持“克制的法律运营控制台”：优先服务任务处理、客户确认、结算、资金和风控等高频业务，而不是营销页式展示。

本轮重点统一了关键操作按钮体系，新增 `actionButtonClass` 作为任务、结算、风控、客户门户、用户、客户、审计和系统参数页面的共享操作样式；主操作提升到 44px 左右触达高度，保留紧凑表格密度，同时减少各页面零散 class 的维护成本。

任务卡片已升级为更清晰的工作单结构：任务元信息标签、展开详情、里程碑、交付记录、成果提交和验收/审核操作的视觉层级更稳定；文件附件错误改为统一内联错误提示。客户确认页/API 入口统一了验证码提示、项目卡片、交付附件行、下载入口和确认评分按钮，错误提示已接入 `role="alert"`。

结算页新增运营摘要条，进入页面即可看到待确认数量与预计实付、已确认实付、锁定/冻结数量和当前页可批量确认数量；结算导出、批量确认、单笔确认和扣罚锁定动作已统一到新的操作按钮体系。资金台账的账户卡片也同步调整为更清晰的主余额 + 辅助流水信息结构。

风控页完成登记入口、答辩、委员会裁决、办结/重开操作和空状态统一；系统参数、审计导出、用户运维、客户新增、任务大厅承接和总览逾期处理等残留小尺寸按钮也已收口。顶部运行态标签和提示关闭按钮同步做了尺寸整理。

本轮验证结果：
- `npm.cmd run typecheck` 通过。
- `npm.cmd run lint` 通过。
- `npm.cmd test` 通过，252 个测试全部通过。
- `npm.cmd run release:sensitive:check` 通过，扫描 262 个文本文件，0 个阻断项，23 个既有人工复核项。
- `npm.cmd run deploy:upload:check` 通过，216 个包含文件，0 个高风险路径，0 个敏感发现。
- `npm.cmd run build` 通过，21 个静态页面生成完成，首页路由大小 52.9 kB。
- 沙箱外 `npm.cmd run test:e2e` 通过，1 个 Chromium 本地 Demo 冒烟用例通过。

本轮未上传部署、未调用 Vercel、未连接线上 Supabase 写入业务数据。项目仍等待用户明确批准后，才能执行 Vercel Preview 上传部署。

## 2026-06-10 本轮更新：Vercel 部署通道核对第一版

Vercel 部署通道核对第一版已完成。系统新增 `npm run deploy:channel:check`，用于在上传当前私有项目到 Vercel 前，只读核对部署目标、部署方式、上传批准、批准引用、git remote、本地 `.vercel` 绑定、`.vercelignore` 上传排除清单和 Vercel CLI 可用性。

本轮新增 `src/lib/deployment/deployment-channel.ts`、`scripts/check-deployment-channel.ts`、`tests/deployment-channel.test.ts`、`.vercelignore` 和 `docs/deployment-channel.md`。`final:gate:check` 已新增 “Vercel deployment channel” 检查项；默认缺少 `LEXOS_DEPLOY_APPROVED_TO_UPLOAD=true` 和 `LEXOS_DEPLOY_APPROVAL_REF` 时会阻断，临时声明 `vercel-mcp` Preview 且补齐批准引用后可通过。

该检查不上传代码、不调用 Vercel API、不创建或链接项目、不推送 Git、不读取密钥值。生产部署仍必须额外设置 `LEXOS_DEPLOY_TARGET=production` 和 `LEXOS_DEPLOY_PRODUCTION_APPROVED=true`，且需要用户明确批准生产发布。

本轮验证结果：
- `node --test tests/deployment-channel.test.ts tests/final-gate.test.ts tests/release-package.test.ts` 通过，18 个测试全部通过。
- `npm.cmd run private:check` 通过，必要脚本 31 个、交付文档 25 个完整。
- `npm.cmd run deploy:channel:check` 默认阻断通过验证：当前缺少上传批准和批准引用时退出 1。
- 临时设置 `LEXOS_DEPLOY_PROVIDER=vercel`、`LEXOS_DEPLOY_TARGET=preview`、`LEXOS_DEPLOY_METHOD=vercel-mcp`、`LEXOS_DEPLOY_APPROVED_TO_UPLOAD=true`、`LEXOS_DEPLOY_APPROVAL_REF=chat-20260610-preview-approval` 后，`npm.cmd run deploy:channel:check` 通过。
- 临时补齐 Preview 最终验收、交付包、交付证据、部署后回归和部署通道元数据后，`npm.cmd run final:gate:check` 通过；不补部署批准时，最终门禁只剩 Vercel deployment channel 2 个阻断项。
- `npm.cmd test` 通过，231 个测试全部通过。
- `npm.cmd run typecheck` 通过。
- `npm.cmd run lint` 通过。
- `npm.cmd run build` 通过。

MVP v0.1 本地 demo + Supabase 接入基础层完成阶段，并已开始把前端接入真实 API。

当前已经完成 Next.js + TypeScript + Tailwind 项目骨架，以及可在本地运行的 Lexos MVP demo 工作台。此 demo 使用前端内存状态跑通任务承接、客户确认和结算闭环。

已经补上真实 Supabase 接入基础层：服务端 Supabase admin client、用户名登录 API、强制改密 API、用户 API、职级 API、客户 API、任务 API、客户确认页 API、结算 API、审计日志 API 和默认管理员初始化脚本。

最新一轮已经加入前端 API 模式：当 `NEXT_PUBLIC_DEMO_MODE=false` 时，登录、首次改密、用户、职级、客户、任务、客户确认页、结算和审计日志页面会通过 `/api/*` 访问真实后端；当该变量不是 `false` 时，仍保留原来的内存 demo，方便没有 Supabase 环境时演示。

线上 Supabase 项目 `LexOS` 已连接，项目 ref 为 `bkgtrmaiatyublrvujlq`。线上库原本已有空的 `profiles`、`audit_logs`、`legal_tasks`、`legal_sops` 等表，因此本轮采用非破坏性兼容迁移：保留既有空表和字段，只增补 Lexos MVP 缺失的表、列、索引、默认组织、角色和 9 档职级。

默认管理员已经在线上创建：`admin / 111111`。用户已完成首次登录改密，后续使用用户自己设置的新密码登录。

真实数据库 MVP 闭环已经跑通：管理员创建发起人、承办律师和财务账号；发起人创建客户和任务；承办律师承接并提交成果；发起人验收；客户通过 token + 手机号 + 验证码确认接收并评分；系统生成结算；财务确认结算。

基础审计日志已经接入真实后端：登录成功、首次改密、创建用户、创建客户、创建任务、承接、提交成果、任务验收、客户确认评分、财务确认结算和结算批量确认会写入 `audit_logs`；管理员和律所管理员可通过 `/api/audit-logs` 和前端“审计”页面查看最近 100 条记录。

RLS / Data API 安全边界已经加固：本项目的浏览器端不直接访问 Supabase 表，所有业务数据统一经过 Next.js API。线上已应用 `lock_down_direct_table_access` 迁移，撤销 `anon` 和 `authenticated` 对 public 内部表的直接访问权限，仅保留 `service_role` 给服务端 API 使用。

UI v0.2 已完成第三段收尾：后台主框架改为深色商务侧栏、紧凑顶部栏、宽内容区和更高密度的表格/面板；总览页新增任务状态分布、运营信号和最近任务扫描区；客户确认页预览从所有页面底部收回到总览页；登录页重设计为更符合律所行业的商务化入口；移动端新增顶部横向导航；用户、客户、任务大厅、我的任务、结算和审计日志页面已加入前端搜索、筛选、分页与小屏横向表格能力；任务列表新增展开详情、流程节点和成果区；创建、承接、提交、验收、结算等关键操作新增 loading、成功提示和内联确认；空状态升级为更正式的产品提示。

可演示阶段第一轮已补强：内存 demo 标准数据已扩充为 9 个用户、4 个客户、9 个任务，覆盖待承接、处理中、待验收、客户待确认、待结算、已结算和已取消状态；预置 L1C、L2B、L3A 三档结算样例、客户反馈和治理类审计日志；总览页新增“重置演示数据”入口；登录页固定展示核心演示账号；新增 `docs/demo-guide.md` 作为对外演示脚本和风险处理指南。

Vercel Preview demo 部署准备已推进到自检版：新增 `npm run preview:check` 和 `GET /api/health`，用于在部署前后确认当前运行模式、Supabase 变量完整性、缺失变量名、Vercel 环境、commit 和检查时间；健康检查接口不返回任何密钥值。第一版 Preview 默认建议继续使用内存 demo 模式，真实 Supabase Preview 作为后续联调选项。

Vercel Preview 远端 smoke 第一版已完成：新增 `npm run smoke:preview`、`playwright.preview.config.ts` 和 `tests/e2e/lexos-preview-smoke.spec.ts`。部署后设置 `LEXOS_PREVIEW_BASE_URL` 即可检查 `/api/health`、登录页、内存 demo 管理员首次改密、客户确认页 `LEXOS-DEMO-004 / 13800000000 / 111111` 校验和结算页可达性；该流程不会点击客户“确认接收并评分”，因此不改变标准演示数据。

可运营阶段第一张任务卡已开始落地：结算导出 CSV 第一版完成。新增 `/api/settlements/export`，支持按当前关键词和结算状态筛选导出，财务和管理员可导出本组织结算，承办律师只能导出自己的结算；前端结算页新增“导出 CSV”，真实 API 模式走服务端导出，Demo 模式按当前内存筛选结果生成 CSV。

客户与渠道基础统计第一版已完成：新增客户来源统计逻辑，总览页按 `customer.source` 汇总渠道来源、客户数、有效任务数、客户确认率、任务金额、结算金额和平均客户评分。当前先基于现有客户、任务、反馈和结算数据计算，不新增渠道商账号或数据库结构；后续可扩展为独立运营页、渠道商工作台和服务端聚合 API。

承办律师绩效统计第一版已完成：新增基于现有用户、任务、客户反馈和结算数据的绩效聚合逻辑，总览页按承办律师展示在办任务、完成任务、客户评分、任务金额和结算金额。当前不新增正式评分快照表，也不替代后续的律师个人工作台；后续可扩展为趋势、能力标签和服务端聚合 API。

列表排序第一版已完成：用户、客户、任务大厅、我的任务、结算和审计页面新增排序选择，Demo 模式会在本地按相同 sort key 排序，真实 API 模式会把 sort 传给服务端。服务端只接受每个列表定义内的白名单排序 key，非法排序会回退默认值；当前暂不做跨关系字段排序和导出排序。

结算批量确认第一版已完成：结算页为财务、律所管理员和系统管理员新增待结算勾选列与“批量确认”入口；真实 API 模式走 `POST /api/settlements/bulk-confirm`，Demo 模式同步更新内存结算和任务状态。批量确认复用单笔确认的组织边界、待确认状态、锁定期、任务状态推进和审计日志规则，一次最多确认 100 条。

用户运维第一版已完成：新增 `PATCH /api/users/:id`，支持系统管理员和律所管理员更新用户角色、职级和账号状态；用户页新增账号状态筛选、内联编辑、停用/启用二次确认。承办律师必须绑定职级，非承办律师会清空职级，当前登录账号不能停用自己或变更自身角色。

正式交付文件上传第一版已完成：新增私有 Supabase Storage bucket `lexos-deliverables` 和 `task_deliverables` 文件元数据字段；承办律师可在提交成果时上传 PDF、Word、Excel、图片或 ZIP 附件，单文件上限 6MB。浏览器不直连 Storage，上传和下载都经过 Next.js API + service role；内部下载使用 5 分钟签名链接，Demo 模式会模拟展示附件名和大小。本地迁移文件已生成，当前 Supabase CLI 未 link 到线上项目，线上库需先应用 `20260608132423_add_deliverable_files.sql` 后再切真实模式验证该功能。

客户侧验证码授权下载第一版已完成：客户通过 token + 手机号 + 验证码访问客户确认页后，可查看交付附件元数据；任务经发起人验收后，客户侧下载入口会通过 Next.js API 生成 5 分钟有效的 Storage signed URL。任务未验收时只展示附件信息，不开放下载。

律师个人工作台第一版已完成：总览页会根据当前登录角色展示个人范围内的任务数、待处理事项、任务金额、已确认结算、客户评分和下一步动作。承办律师优先看到已接单待提交任务，发起人优先看到待验收成果，财务和管理角色优先看到待确认结算与待验收压力；当前不新增数据库结构，基于现有任务、结算和客户反馈数据计算。

角色菜单权限第一版已完成：新增统一菜单权限模型，集中维护内部角色、菜单入口、默认入口、角色说明和菜单说明；后台新增“权限”页面，系统管理员和律所管理员可查看角色能力摘要与菜单权限矩阵。当前为只读权限矩阵，不新增数据库结构；后续可扩展为组织级可编辑配置、审批和审计。

客户逾期未确认自动视为交付第一版已完成：新增 `customer_auto_confirm_days` 系统参数，默认 7 天，0 表示停用；新增 `POST /api/tasks/auto-confirm-overdue`，系统管理员和律所管理员可触发处理已验收但客户超过确认期未确认的任务。系统会跳过已有结算记录的任务，只对符合条件的任务生成待结算记录、推进任务到待结算状态，并写入 `tasks.auto_confirm_overdue` 审计日志。总览页新增逾期待处理信号和处理入口，Demo 模式同步支持本地演示。当前第一版是管理员触发版，不接真实短信、不做客户通知、不新增定时器；后续可接 Vercel Cron 或私有化定时任务。

项目已完成切换到 `web-iterative-dev` 前的对齐整理，详见 `docs/web-iterative-dev-alignment.md`。后续按 Existing project 模式推进：先读取当前状态和 backlog，一轮只做一张确认过的任务卡，并按 UI、API、Supabase 或部署风险选择对应质量门槛。

本轮验证结果：

- Preview 自检第一版后 `npm run preview:check` 通过；当前本地 `.env.local` 被识别为真实 Supabase 模式，变量完整。
- 使用 shell 临时设置 `NEXT_PUBLIC_DEMO_MODE=true` 后，`npm run preview:check` 可切换到内存 demo 模式，并提示本地 Supabase 变量已配置，避免误把 service role key 放入不必要的 Preview 环境。
- Preview 自检第一版后 `npm run lint` 通过。
- Preview 自检第一版后 `npm run typecheck` 通过。
- Preview 自检第一版后 `npm test` 通过：36 个测试全部通过。
- Preview 自检第一版后 `npm run build` 通过，Next 已识别新增的 `/api/health` Route。
- Preview 远端 smoke 第一版后 `npm run lint` 通过。
- Preview 远端 smoke 第一版后 `npm run typecheck` 通过。
- Preview 远端 smoke 第一版后 `npm test` 通过：36 个测试全部通过。
- Preview 远端 smoke 第一版后 `npm run build` 通过。
- Preview 远端 smoke 第一版后 `LEXOS_PREVIEW_BASE_URL=https://example.com npm run smoke:preview -- --list` 通过，Playwright 正确发现 2 个远端 smoke 用例。
- 结算导出第一版后 `npm run lint` 通过。
- 结算导出第一版后 `npm run typecheck` 通过。
- 结算导出第一版后 `npm test` 通过：38 个测试全部通过。
- 结算导出第一版后 `npm run build` 通过，Next 已识别新增的 `/api/settlements/export` Route。
- 结算导出第一版后 `npm run test:e2e` 在沙箱外通过：1 个 Chromium 冒烟用例通过。本地 E2E 配置已排除远端 Preview smoke，避免两类测试互相污染。
- 客户与渠道统计第一版后 `npm run lint` 通过。
- 客户与渠道统计第一版后 `npm run typecheck` 通过。
- 客户与渠道统计第一版后 `npm test` 通过：40 个测试全部通过。
- 客户与渠道统计第一版后 `npm run build` 通过。
- 客户与渠道统计第一版后沙箱外 `npm run test:e2e` 通过：1 个 Chromium 冒烟用例通过。
- 系统参数接入真实业务规则第一版后 `npm run lint` 通过。
- 系统参数接入真实业务规则第一版后 `npm run typecheck` 通过。
- 系统参数接入真实业务规则第一版后 `npm test` 通过：43 个测试全部通过。
- 系统参数接入真实业务规则第一版后 `npm run build` 通过。
- 系统参数接入真实业务规则第一版后沙箱外 `npm run test:e2e` 通过：1 个 Chromium 冒烟用例通过。
- 承办律师绩效统计第一版后 `npm run lint` 通过；新增 E2E 断言后，本轮触碰文件的本地 ESLint 直接检查通过。
- 承办律师绩效统计第一版后 `npm run typecheck` 通过。
- 承办律师绩效统计第一版后 `npm test` 通过：45 个测试全部通过。
- 承办律师绩效统计第一版后 `npm run build` 通过。
- 承办律师绩效统计第一版后沙箱外 `npm run test:e2e` 通过：1 个 Chromium 冒烟用例通过，并覆盖“承办律师绩效”面板。
- 任务里程碑与交付记录第一版后 `npm run lint` 通过。
- 任务里程碑与交付记录第一版后 `npm run typecheck` 通过。
- 任务里程碑与交付记录第一版后 `npm test` 通过：47 个测试全部通过。
- 任务里程碑与交付记录第一版后 `npm run build` 通过。
- 任务里程碑与交付记录第一版后沙箱外 `npm run test:e2e` 通过：1 个 Chromium 冒烟用例通过，并覆盖“交付记录”面板。
- 本轮同步修正本地 E2E 配置：默认不再复用已有 3100 服务，避免误连到其他本地项目；如确需复用，可显式设置 `PLAYWRIGHT_REUSE_SERVER=true`。
- 列表排序第一版后 `npm run lint` 通过。
- 列表排序第一版后 `npm run typecheck` 通过。
- 列表排序第一版后 `npm test` 通过：49 个测试全部通过。
- 列表排序第一版后 `npm run build` 通过。
- 列表排序第一版后沙箱外 `npm run test:e2e` 通过：1 个 Chromium 冒烟用例通过，并覆盖“任务排序”和“结算排序”控件。
- 结算批量确认第一版后 `npm run lint` 通过。
- 结算批量确认第一版后 `npm run typecheck` 通过。
- 结算批量确认第一版后 `npm test` 通过：52 个测试全部通过。
- 结算批量确认第一版后 `npm run build` 通过，Next 已识别新增的 `/api/settlements/bulk-confirm` Route。
- 结算批量确认第一版后沙箱外 `npm run test:e2e` 通过：1 个 Chromium 冒烟用例通过，并覆盖“批量确认结算”入口。
- 用户运维第一版后 `npm run lint` 通过。
- 用户运维第一版后 `npm run typecheck` 通过。
- 用户运维第一版后 `npm test` 通过：55 个测试全部通过。
- 用户运维第一版后 `npm run build` 通过，Next 已识别新增的 `/api/users/[id]` Route。
- 用户运维第一版后沙箱外显式绕过本机代理执行 `npm run test:e2e` 通过：1 个 Chromium 冒烟用例通过，并覆盖用户运维入口。
- 正式交付文件上传第一版后 `npm run lint` 通过。
- 正式交付文件上传第一版后 `npm run typecheck` 通过。
- 正式交付文件上传第一版后 `npm test` 通过：60 个测试全部通过。
- 正式交付文件上传第一版后 `npm run build` 通过，Next 已识别新增的 `/api/tasks/[id]/deliverables` 和 `/api/tasks/[id]/deliverables/[deliverableId]/download` Route。
- 正式交付文件上传第一版后沙箱外显式绕过本机代理执行 `npm run test:e2e` 通过：1 个 Chromium 冒烟用例通过，并覆盖“交付附件”入口。
- 客户侧验证码授权下载第一版后 `npm run lint` 通过。
- 客户侧验证码授权下载第一版后 `npm run typecheck` 通过。
- 客户侧验证码授权下载第一版后 `npm test` 通过：61 个测试全部通过。
- 客户侧验证码授权下载第一版后 `npm run build` 通过，Next 已识别新增的 `/api/customer-portal/[token]/deliverables/[deliverableId]/download` Route。
- 客户侧验证码授权下载第一版后沙箱外显式绕过本机代理执行 `npm run test:e2e` 通过：1 个 Chromium 冒烟用例通过。
- 律师个人工作台第一版后 `npm run lint` 通过。
- 律师个人工作台第一版后 `npm run typecheck` 通过。
- 律师个人工作台第一版后 `npm test` 通过：64 个测试全部通过。
- 律师个人工作台第一版后 `npm run build` 通过。
- 律师个人工作台第一版后沙箱外显式绕过本机代理执行 `npm run test:e2e` 通过：1 个 Chromium 冒烟用例通过，并覆盖“个人工作台”入口。
- 角色菜单权限第一版后 `npm run typecheck` 通过。
- 角色菜单权限第一版后 `npm test` 通过：69 个测试全部通过。
- 角色菜单权限第一版后 `npm run build` 已完成 `Compiled successfully`，随后在 Next 内部 lint/type 校验阶段超出本机执行时限；外部 `typecheck` 已单独通过。
- 角色菜单权限第一版后 `npm run lint` 与 `npm run test:e2e` 在当前 Windows 会话中超时且无规则失败输出，需在系统负载恢复后复跑。
- `npm test` 通过：20 个测试全部通过。
- `npm run build` 通过，Next 已识别 auth、users、ranks、customers、tasks、customer-portal、settlements 和新增的 `audit-logs` API。
- `npm run verify:rls` 通过：17 张内部表中，service role 全部可读，anon 全部被拒绝，authenticated 全部被拒绝。
- UI v0.2 后 `npm test` 通过，20 个测试全部通过；`npx tsc --noEmit` 通过；本地首页 `http://127.0.0.1:3000` 返回 200。
- UI v0.2 第一段曾在旧 dev server 运行时卡在 Windows 环境的 `Collecting build traces` 阶段；停止占用 3000 端口的旧 Next dev server 后，第二段 `npm run build` 已完整通过。
- UI v0.2 第二段后 `npm test` 通过，20 个测试全部通过；`npx tsc --noEmit --pretty false` 通过；`npm run build` 通过。
- UI v0.2 第三段后本地 `node_modules/.bin/tsc.cmd --noEmit --pretty false` 通过；`npm test` 通过，20 个测试全部通过；`npm run build` 通过；本地首页 `http://127.0.0.1:3000` 返回 200；dev server 错误日志为空。
- UI v0.2 第三段中 `npm run lint` 未通过：当前 `next lint` 会进入交互式 ESLint 初始化流程，需后续迁移到 ESLint CLI 或补正式 lint 配置。
- UI v0.2 第三段中 Browser 插件验证未完成：内置浏览器会话初始化时底层 node_repl 内核退出，已用 HTTP 200、构建和 dev server 日志作为本轮最低页面验证。
- 工程化质量门槛已完成：新增 `eslint.config.mjs`，`npm run lint` 已迁移为非交互式 ESLint CLI；新增 `npm run typecheck` 和 `npm run verify`。`npm run verify` 已通过，包含 lint、typecheck、20 个测试和生产构建。
- Playwright E2E 已完成第一版：新增 `npm run test:e2e`、`playwright.config.ts`、`scripts/e2e-dev-server.mjs` 和 `tests/e2e/lexos-smoke.spec.ts`，覆盖本地 Demo 模式下的管理员登录、首次改密、我的任务页和结算页。已处理本机代理导致本地健康检查 502 的问题，E2E 配置会对 `127.0.0.1`、`localhost` 和 `::1` 绕过代理。
- `npm run test:e2e` 已通过：1 个 Chromium 冒烟用例通过。沙箱内启动 Chromium 会被 `EPERM` 拦截，因此本机浏览器 E2E 需要在沙箱外运行。
- Vercel Preview demo 部署准备已完成文档版：`docs/deployment.md`、`.env.example` 和 `README.md` 已补充内存 demo / 真实 Supabase 模式切换、Preview 环境变量、部署前检查、RLS 验证和私有化部署前置说明。
- 服务端分页与搜索第一版已完成：`/api/users`、`/api/customers`、`/api/tasks`、`/api/settlements` 和 `/api/audit-logs` 支持 `page`、`pageSize`、`search` / `keyword`，并返回 `pagination` 元数据；用户、任务和结算的跨表搜索采用先查相关 ID、再在主表用 `in` 过滤的方式，已通过真实 Supabase 只读查询验证。
- 前端真实 API 模式已开始接入服务端分页元数据：用户、客户、任务大厅、我的任务、结算和审计页面会按当前页、关键词和筛选条件请求后端，并显示服务端总数；Demo 模式仍保留前端内存分页。
- 审计与安全增强第一版已完成：已识别账号的失败登录会写入 `auth.login_failed` 审计日志，metadata 仅记录用户名和失败原因，不记录密码；新增 `/api/audit-logs/export` CSV 导出接口，支持 action、entityType 和 search 过滤，最多导出 1000 条。
- 审计页面已接入 CSV 导出入口，并新增动作、模块、开始日期和结束日期筛选；`/api/audit-logs` 与 `/api/audit-logs/export` 已同步支持 `startDate` 和 `endDate`。
- 任务接口新增 `scope=assigned` 查询参数，真实 API 模式下承办律师在“我的任务”只查询自己已接任务，任务大厅仍可查询开放任务。
- 系统参数第一版已完成：新增 `/api/system-settings` GET/PUT，支持组织级参数读取、保存、类型校验和 `system_settings.update` 审计；后台新增“参数”页，可维护客户访问验证码、结算锁定天数、默认分页数量和运行模式提示开关。
- 系统参数接入真实业务规则第一版已完成：客户确认页验证码会读取 `customer_portal_demo_code`；用户、客户、任务、结算和审计列表在未显式传 `pageSize` 时会读取 `default_page_size`；财务确认结算时会参考 `settlement_lock_days`。为不破坏当前演示闭环和历史 smoke，结算锁定期只有在数据库中显式保存该参数后才会阻断财务和律所管理员确认，系统管理员可应急越过锁定。
- UI 组件体系第一版已完成：新增 `src/features/demo/ui-tokens.ts` 和 `docs/design-system.md`，当前决定暂不引入 shadcn，先沉淀 Lexos 自有 Tailwind token；面板、输入框、通用表格、结算表和参数表已开始复用统一 token。
- 任务详情增强第一版已完成：我的任务展开区新增任务时间线和结算关联卡，能集中查看发布、接单、提交、验收、客户确认、结算生成与财务确认状态。
- 任务里程碑与交付记录第一版已完成：新增任务进度聚合逻辑，把任务状态转换为发布、接单、成果提交、发起人验收、客户确认和结算记录等里程碑；我的任务详情展示里程碑完成度、下一步和交付记录列表。Demo 模式提交成果会写入交付记录，真实 API 模式会保留 `task_deliverables` 返回的标题、说明、外部链接、附件元数据和提交时间；正式文件上传第一版已接入私有 Storage。
- `web-iterative-dev` 对齐文档已新增，当前未修改业务代码。
- 线上 Supabase 兼容迁移执行成功，默认组织和 L1A 至 L3C 职级已核对。
- `npm run seed:admin` 执行成功，`admin` profile 和 `system_admin` 组织成员关系已核对。
- 浏览器验证通过：真实 API 模式登录页可见，管理员账号已完成首次改密后可正常登录。
- `npm run smoke:real` 执行成功，真实闭环任务 `7892f865-1ea4-43f0-a179-d7770401bb4c` 已完成，结算 `9b21d929-6b07-429e-9209-baa11887a1fd` 最终状态为 `confirmed`。
- 本轮审计日志接入后再次执行 `npm run smoke:real` 成功，真实闭环任务 `2da423f8-0f0b-4075-bcc4-ec5fca12cd93` 已完成，结算 `f0f20aae-b701-42bb-9eef-f9528b05bb0b` 最终状态为 `confirmed`。
- `/api/audit-logs` 已用管理员会话验证成功，返回最近审计记录 12 条。
- `supabase migration list --local` 未完成：本地 Supabase Postgres 未启动，连接 `127.0.0.1:54322` 被拒绝。

## 2026-06-09 本轮更新：客户逾期未确认自动视为交付第一版

客户逾期未确认自动视为交付第一版已完成。系统参数新增 `customer_auto_confirm_days`，默认 7 天，设置为 0 时停用。任务经发起人验收后，如果客户超过配置天数仍未确认，系统管理员或律所管理员可以在总览页触发“逾期视为交付”处理。

真实 API 新增 `POST /api/tasks/auto-confirm-overdue`，会查询本组织内 `approved` 状态、已超过确认期、尚未客户确认且已绑定承办律师的任务；如果任务已经存在结算记录会跳过，避免重复生成资金记录。符合条件的任务会生成待结算记录，任务状态推进到待结算，并写入 `tasks.auto_confirm_overdue` 审计日志，metadata 记录确认天数、处理任务、结算记录和跳过数量。

总览页新增“逾期待处理”运营信号和管理员处理入口；Demo 模式会按同一规则在本地生成结算并写入审计日志。标准演示数据中的客户待确认任务已调整为超过默认 7 天确认期，便于演示该处理闭环。当前第一版不接真实短信、不做客户通知、不新增定时器；后续可在同一服务函数基础上接 Vercel Cron 或私有化定时任务。

本轮验证结果：
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过：85 个测试全部通过。
- `npm.cmd run lint` 通过。
- `npm.cmd run build` 通过，Next 已识别新增 `/api/tasks/auto-confirm-overdue` Route。
- `git diff --check -- package.json` 通过；由于当前仓库大量业务文件仍处于未跟踪状态，本轮另用只读脚本检查本轮触碰文件的尾随空白和文件末尾换行，结果通过。
- 沙箱外清空本机代理后执行 `npm.cmd run test:e2e` 通过，1 个 Chromium 冒烟用例通过，并覆盖总览页“逾期视为交付”入口。

## 2026-06-09 本轮更新：30 天风控锁定期第一版

30 天风控锁定期第一版已完成。现有系统参数 `settlement_lock_days` 的默认值 30 已正式进入结算确认规则：结算生成后，财务和律所管理员在锁定期内不能确认付款；系统管理员保留应急越过能力，用于演示、紧急处理或后续人工风控裁决场景。确认结算时会把锁定天数和是否越过锁定期写入审计 metadata。

结算管理页新增“风控锁定”列，会展示待确认结算的剩余锁定天数和预计解锁时间；锁定中的记录不能被普通批量确认选中，单笔确认入口也会显示“锁定中”。Demo 模式与真实 API 模式都保留同一业务口径；真实 smoke 脚本已改为由系统管理员完成最后确认，以覆盖应急越过路径。

本轮不新增数据库迁移，继续复用 `system_settings.settlement_lock_days` 与 `settlements.generated_at`。后续投诉、低分风控、扣罚或退款规则落地时，可以在此锁定期之上继续增加冻结原因、人工裁决和资金流向记录。

本轮验证结果：
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过，80 个测试全部通过。
- `npm.cmd run lint` 通过。

## 2026-06-09 本轮更新：律师评分近 30 单滚动平均第一版

律师评分近 30 单滚动平均第一版已完成。当前不新增数据库结构，直接基于现有任务、客户反馈、发起人验收评分和案件结果评分计算；系统会按评分相关时间倒序，为每名承办律师截取最近最多 30 个有评分任务，再聚合客户评分、案源评分和案件结果评分，得到滚动平均评分。

总览页“承办律师绩效”表格新增“近30单”列，展示该律师最近有评分任务数和滚动平均分；右侧运营信号新增“近30单评分”，用于管理层快速观察近期交付质量。该能力先作为绩效分析口径落地，后续如要做正式月度快照、风控阈值或扣罚规则，再单独增加快照表与审计流程。

本轮验证结果：
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过，79 个测试全部通过。
- `npm.cmd run lint` 通过。
- `npm.cmd run build` 通过。
- 沙箱外清空本机代理后执行 `npm.cmd run test:e2e` 通过，1 个 Chromium 冒烟用例通过。

## 2026-06-09 本轮更新：发起人评分 / 案件结果评分第一版

发起人评分 / 案件结果评分第一版已完成。发起人在“我的任务”中验收承办律师提交成果时，可以同时填写发起人验收评分、案源评语、案件结果评分和结果摘要；Demo 模式会同步写入内存任务，真实 API 模式会通过 `POST /api/tasks/:id/approve` 写入任务记录并继续推进既有验收、审计与结算闭环。

数据库侧新增兼容迁移 `20260609042505_add_task_source_review_scores.sql`，在 `tasks` 表增加 `source_review_score`、`source_review_comment`、`source_reviewed_at`、`case_result_score` 和 `case_result_summary`，并对两个评分字段增加 1 到 10 的范围约束。线上 Supabase 尚未自动应用该迁移；切换真实 API 验证前，需要先执行 `supabase db push` 或在 Supabase SQL Editor 应用该迁移 SQL。

承办律师绩效统计已纳入客户评分、案源评分和案件结果评分三类指标；总览页“承办律师绩效”表格和右侧运营信号会展示案源平均评分与结果平均评分。律师个人工作台的评分指标升级为“综合评分”，会基于客户反馈、发起人验收评分和案件结果评分聚合展示。

本轮验证结果：
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过，72 个测试全部通过。
- `npm.cmd run lint`、`npm.cmd run build` 和 `npm.cmd run test:e2e` 尚未在本轮完成复跑；上一轮在当前 Windows 会话中存在超时问题，后续可在系统负载稳定后继续复核。

## 2026-06-09 本轮更新：审核律师流程第一版

审核律师流程第一版已完成。任务发布时可以标记“需要主任复核”；承办律师提交成果后，任务保持在已提交状态，但复核状态进入“待审核”。主任、律所管理员或系统管理员可以在“我的任务”中审核通过或退回修改；审核通过后，发起人才能继续最终验收与评分；退回修改后，任务回到承办律师可重新提交的状态。

真实 API 新增 `POST /api/tasks/:id/review`，并在 `POST /api/tasks/:id/approve` 中增加审核前置保护。任务列表 API 已返回 `review_required`、`review_status`、`review_lawyer_id`、`reviewed_at` 和 `review_comment`；前端 API client、内存 Demo 数据、任务详情和里程碑均已同步展示审核状态。

数据库侧新增兼容迁移 `20260609061000_add_task_review_flow.sql`，在 `tasks` 表增加审核要求、审核状态、审核人、审核时间和审核意见字段，并建立审核队列索引。线上 Supabase 尚未自动应用该迁移；真实 API 模式验证前，需要先执行 `supabase db push` 或在 Supabase SQL Editor 应用该迁移 SQL。

本轮验证结果：
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过，78 个测试全部通过。
- `npm.cmd run lint` 通过。
- `git diff --check` 通过。
- `npm.cmd run build` 通过，Next 已识别新增 `/api/tasks/[id]/review` Route。
- 沙箱外清空本机代理后执行 `npm.cmd run test:e2e` 通过，1 个 Chromium 冒烟用例通过。

## 2026-06-09 本轮更新：投诉入口 / 风控工单第一版

投诉入口 / 风控工单第一版已完成。后台新增“风控”菜单，系统管理员、律所管理员、主任和发起人可进入“投诉与风控”页面，查看待处理风控、严重及以上风险、低分触发和已处理工单数量；页面支持手动登记客户投诉、低分风险和人工提醒，并提供搜索、状态筛选、级别筛选、来源筛选、排序和分页。

真实 API 新增 `GET /api/risk-cases` 和 `POST /api/risk-cases`。列表接口支持分页、搜索、状态、级别、来源和白名单排序；创建接口会校验组织边界、任务归属和客户归属，并写入 `risk_cases.create` 审计日志。客户评分、发起人验收评分或案件结果评分低于等于 6 分时，会自动创建低分风控工单并写入 `risk_cases.auto_create` 审计日志。Demo 模式同步预置投诉、低分和已处理样例，并支持本地低分触发演示。

数据库侧新增迁移 `20260609091825_add_risk_cases.sql`，创建 `risk_cases` 表，包含来源、四级严重程度、状态、任务、客户、登记人、负责人和处理时间字段；迁移已启用 RLS，并继续保持浏览器端不直接访问 Supabase 内部表、业务统一走 Next.js API + service role 的边界。线上 Supabase 尚未自动应用该迁移；真实 API 模式验证风控工单前，需要先执行 `supabase db push` 或在 Supabase SQL Editor 应用该迁移 SQL。

本轮验证结果：
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过，89 个测试全部通过。
- `npm.cmd run lint` 通过。
- `npm.cmd run build` 通过，Next 已识别新增 `/api/risk-cases` Route。
- 沙箱外清空本机代理后执行 `npm.cmd run test:e2e` 通过，1 个 Chromium 冒烟用例通过，并覆盖“风控”页面入口。

## 2026-06-09 本轮更新：风控工单状态流转第一版

风控工单状态流转第一版已完成。后台“风控”页面的工单列表升级为可操作表格，支持开始处理、填写处理意见、办结和重新打开。办结必须记录处理意见；重新打开会清空办结时间并回到处理中，保留原处理意见供后续追踪。

真实 API 新增 `PATCH /api/risk-cases/:id`，系统管理员、律所管理员、主任和发起人可更新工单状态；发起人只能处理自己登记的工单。服务端会校验 `open -> in_review -> resolved` 以及 `resolved -> in_review` 的允许流转，更新负责人、更新时间、办结时间和处理意见，并写入 `risk_cases.update_status` 审计日志。

数据库侧新增迁移 `20260609110310_add_risk_case_resolution_note.sql`，为 `risk_cases` 增加 `resolution_note` 字段，并补充按组织、处理人和状态查询的索引。线上 Supabase 尚未自动应用该迁移；真实 API 模式验证风控处理流转前，需要先应用 `20260609091825_add_risk_cases.sql` 和 `20260609110310_add_risk_case_resolution_note.sql`。

本轮验证结果：
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过：90 个测试全部通过。
- `npm.cmd run lint` 通过。
- `npm.cmd run build` 通过，Next 已识别新增 `/api/risk-cases/[id]` Route。
- 沙箱外清空本机代理后执行 `npm.cmd run test:e2e` 通过，1 个 Chromium 冒烟用例通过，并覆盖风控页面处理动作入口。
- 本轮触碰文件只读空白检查通过；全仓库 `git diff --check` 仍命中历史文件 `app/layout.tsx`、`app/page.tsx`、`next.config.mjs`、`postcss.config.mjs` 的 EOF 空行问题，本轮未触碰这些无关文件。

## 2026-06-09 本轮更新：任务金额冻结第一版

任务金额冻结第一版已完成。结算记录现在会读取关联任务的风控状态：只要任务存在 `open` 或 `in_review` 的风控工单，对应待确认结算金额即进入“风控冻结”。冻结期间单笔确认和批量确认都会在服务端被阻断，系统管理员也不能越过；需要先在“风控”页面办结工单，才可继续确认结算。

真实 API 继续复用现有 `risk_cases` 表，不新增数据库迁移。`GET /api/settlements` 每条记录新增 `risk_freeze` 摘要，前端结算页会展示冻结原因、未办结工单数量和最高风险级别。`POST /api/settlements/:id/confirm` 与 `POST /api/settlements/bulk-confirm` 共用确认服务，在任何数据库写入前检查任务冻结状态，避免有投诉或低分风控的任务被提前结算。

Demo 模式同步加入一条待结算任务的未办结风控样例，结算页可直接看到“风控冻结”；本地单笔和批量确认也会按同一规则阻断。30 天风控锁定期仍保留原逻辑：系统管理员可以越过 30 天锁定期，但不能越过未办结风控工单造成的任务金额冻结。

本轮验证结果：
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过：91 个测试全部通过。
- `npm.cmd run lint` 通过。
- `npm.cmd run build` 通过。
- 沙箱外清空本机代理后执行 `npm.cmd run test:e2e` 通过，1 个 Chromium 冒烟用例通过，并覆盖结算页“风控冻结”展示。
- 端口检查仅剩 3100 的 `TIME_WAIT` 连接，无监听中的 3005/3100 服务。
- 全仓库 `git diff --check` 仍命中历史文件 `app/layout.tsx`、`app/page.tsx`、`next.config.mjs`、`postcss.config.mjs` 的 EOF 空行问题；本轮未触碰这些无关文件，已用只读脚本检查本轮触碰文件。

## 2026-06-09 本轮更新：扣减比例配置第一版

扣减比例配置第一版已完成。系统参数新增四级风控扣减比例，分别对应一级关注、二级一般、三级严重和四级重大，单位为基点；默认值为 0%、5%、15% 和 30%。系统管理员和律所管理员可以在“参数”页维护这些比例，继续复用既有 `system_settings` 表、类型校验和 `system_settings.update` 审计日志。

真实 API 的 `GET /api/settlements` 会在每条结算的 `risk_freeze` 摘要中返回 `deduction_basis_points`、`suggested_deduction_cents` 和 `suggested_payable_cents`。这些字段仅作为风控建议扣减口径：任务金额冻结仍会阻断结算确认，但不会自动修改 `settlement_amount_cents`，实际扣款、资金流向和最终裁决仍留给后续风控委员会流程。

前端结算页在“风控冻结”下方展示建议扣减比例、建议扣减金额和扣后建议金额；风控页在关联任务旁按任务金额展示同一比例口径的预估扣减。Demo 模式会用内存中的系统参数即时计算，真实 API 模式下结算页优先使用服务端返回的建议值。当前不新增数据库迁移。

本轮验证结果：
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过：92 个测试全部通过。
- `npm.cmd run lint` 通过。
- `npm.cmd run build` 通过。
- 沙箱外清空本机代理后执行 `npm.cmd run test:e2e` 通过，1 个 Chromium 冒烟用例通过，并覆盖结算页“建议扣减”展示。
- 端口检查仅剩 3100 的 `TIME_WAIT` 连接，无监听中的 3005/3100 服务。
- 全仓库 `git diff --check` 仍命中历史文件 `app/layout.tsx`、`app/page.tsx`、`next.config.mjs`、`postcss.config.mjs` 的 EOF 空行问题；本轮未触碰这些无关文件，已用只读脚本检查本轮触碰文件。

## 2026-06-09 本轮更新：承办律师 48 小时答辩第一版

承办律师 48 小时答辩第一版已完成。承办律师现在可以进入“风控”页，但只能查看自己承办任务关联的风控工单；页面会展示每个工单的 48 小时答辩期限、截止时间、剩余小时数、已提交答辩内容和提交时间。未办结、未答辩且未超过期限的工单，承办律师可直接填写答辩说明并提交。

真实 API 新增 `POST /api/risk-cases/:id/defense`，仅允许关联任务的承办承办律师调用。服务端会校验组织边界、任务承办人、工单状态、是否已答辩和 48 小时期限；提交后写入 `defense_statement`、`defended_at`、`updated_at`，并记录 `risk_cases.submit_defense` 审计日志。`GET /api/risk-cases` 已允许承办律师读取本人任务范围内的风控工单。

数据库侧新增迁移 `20260609135059_add_risk_case_defense.sql`，为 `risk_cases` 增加答辩说明和答辩提交时间字段，并补充未答辩工单索引。线上 Supabase 尚未自动应用该迁移；真实 API 模式验证承办律师答辩前，需要先执行 `supabase db push` 或在 Supabase SQL Editor 应用该迁移 SQL。

该轮答辩第一版只记录答辩事实，不自动推进风控状态，也不自动改变扣减或结算金额；风控委员会裁决已在下一节完成第一版。

本轮验证结果：
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过：95 个测试全部通过。
- `npm.cmd run lint` 通过。
- `npm.cmd run build` 首次在 Next `Collecting build traces` 阶段超时；复跑通过，Next 已识别新增 `/api/risk-cases/[id]/defense` Route。
- 沙箱外清空本机代理后执行 `npm.cmd run test:e2e` 通过，1 个 Chromium 冒烟用例通过，并覆盖承办律师提交 48 小时答辩流程。

## 2026-06-09 本轮更新：风控委员会裁决第一版

风控委员会裁决第一版已完成。风控页新增“委员会裁决”列，系统管理员、律所管理员和主任可以在承办律师已答辩或 48 小时答辩期结束后提交裁决。当前支持四类裁决：无过错、警示记录、扣减裁决和升级处理。

真实 API 新增 `POST /api/risk-cases/:id/decision`。服务端会校验组织边界、角色权限、是否已有裁决、工单是否已办结、答辩是否提交或到期，并写入 `committee_decision`、`committee_decision_note`、`committee_deduction_basis_points`、`committee_decided_by` 和 `committee_decided_at`。提交会记录 `risk_cases.committee_decide` 审计日志。

无过错和警示记录会同步把风控工单推进到已处理，并写入处理意见；扣减裁决和升级处理会保持工单处理中，继续冻结对应结算。扣减裁决需要再通过结算页或 `POST /api/settlements/:id/risk-deduction` 锁定扣罚资金流向，才会固化扣减金额并办结对应工单。

数据库侧新增迁移 `20260609144119_add_risk_case_committee_decision.sql`，为 `risk_cases` 增加委员会裁决字段和裁决索引。线上 Supabase 尚未自动应用该迁移；真实 API 模式验证委员会裁决前，需要先执行 `supabase db push` 或在 Supabase SQL Editor 应用该迁移 SQL。

本轮验证结果：
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过：97 个测试全部通过。
- `npm.cmd run lint` 通过。
- `npm.cmd run build` 首次在 Next `Collecting build traces` 阶段超时；复跑通过，Next 已识别新增 `/api/risk-cases/[id]/decision` Route。
- 沙箱外清空本机代理后执行 `npm.cmd run test:e2e` 通过，1 个 Chromium 冒烟用例通过，并覆盖管理员提交委员会裁决与承办律师提交答辩流程。
- 端口检查仅剩 3100 的 `TIME_WAIT` 连接，无监听中的 3005/3100 服务。
- 全仓库 `git diff --check` 仍命中历史文件 `app/layout.tsx`、`app/page.tsx`、`next.config.mjs`、`postcss.config.mjs` 的 EOF 空行问题；本轮未修改这些无关文件，已用只读脚本检查本轮触碰文件。

## 2026-06-09 本轮更新：扣罚资金流向锁定第一版

扣罚资金流向锁定第一版已完成。结算页现在可以识别委员会扣减裁决产生的“待锁定扣罚”记录，财务、律所管理员和系统管理员可在行内选择扣罚去向、填写可选说明，并锁定扣减金额、律师实付金额和资金去向。

真实 API 新增 `POST /api/settlements/:id/risk-deduction`。服务端会校验结算状态、组织边界、关联任务、委员会扣减裁决和扣减比例；锁定成功后写入 `settlements.payable_amount_cents`、`risk_deduction_amount_cents`、`risk_penalty_destination`、`risk_deduction_locked_at` 等字段，并把对应风控工单办结为 `resolved`。如果同一任务仍有其他未办结风控工单，结算仍会继续冻结。

数据库侧新增迁移 `20260609153142_add_settlement_risk_deduction_lock.sql`，为结算表增加律师实付金额、扣罚工单关联、扣罚比例、扣罚金额、扣罚去向、说明、锁定人和锁定时间字段。现有结算会回填 `payable_amount_cents = settlement_amount_cents`，客户确认和客户逾期自动确认生成结算时也会显式写入实付金额。

前端 Demo 数据新增一条已委员会扣减裁决、等待锁定资金流向的待结算样例；结算导出 CSV 增加原结算金额、扣减金额、律师实付金额、扣罚去向和扣罚锁定时间。总览统计、渠道统计、律师绩效和个人工作台已改用扣后实付金额作为有效结算口径。

公共风险储备金账户与财务流水第一版已完成：新增服务端私有 `fund_transactions` 表、`GET /api/funds`、后台“资金”页和 Demo 本地入账逻辑。扣罚资金流向锁定后，真实库通过数据库触发器自动生成扣罚入账流水；前端可按公共风险储备金、质量督导基金、客户退费和律所留存查看余额与流水。当前仍不做真实付款、银行流水、真实客户退款打款和复杂基金审批。

本轮验证结果：
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过：98 个测试全部通过。
- `npm.cmd run lint` 通过。
- `npm.cmd run build` 通过，Next 已识别新增的 `/api/settlements/[id]/risk-deduction` Route。
- 沙箱外清空本机代理后执行 `npm.cmd run test:e2e` 通过：1 个 Chromium 冒烟用例通过，并覆盖结算页“待锁定扣罚”展示、锁定扣罚按钮和锁定后状态。
- 尝试用后台方式启动 3005 做额外浏览器检查时受到当前 Windows 会话 `Start-Process` 参数/环境限制影响，未形成监听；前台短时启动 `npm.cmd run dev -- -p 3005` 已显示 Next `Ready in 4.2s`，E2E 已完成实际页面交互验证。
- 端口检查无监听中的 3005/3100 服务。

## 2026-06-09 本轮更新：公共风险储备金账户 / 财务流水第一版

公共风险储备金账户 / 财务流水第一版已完成。后台新增“资金”菜单，系统管理员、律所管理员和财务可查看四类资金账户余额：公共风险储备金、质量督导基金、客户退费和律所留存。资金页提供账户筛选、关键词搜索、排序、分页和最近流水列表，重点展示扣罚入账时间、账户、金额、来源任务、经办人和状态。

真实 API 新增 `GET /api/funds`，按当前组织返回资金账户摘要和分页流水。浏览器端不直接访问 Supabase 表，仍通过 Next.js API + service role 读取；承办律师不能进入资金菜单，也不能读取全所资金台账。

数据库侧新增迁移 `20260609165248_add_fund_transactions.sql`，创建 `fund_transactions` 表并启用 RLS，仅授予 `service_role` 访问。迁移同时增加 `record_settlement_risk_deduction_fund_transaction()` 触发器：当结算扣罚资金流向被锁定、且扣减金额大于 0 时，自动写入一条 `risk_deduction` 入账流水；历史已锁定扣罚记录也会被回填到流水表。线上 Supabase 尚未自动应用该迁移；真实 API 模式验证资金页前，需要先应用该迁移。

Demo 模式同步支持资金闭环：在结算页锁定扣罚后，会立即新增一条资金入账流水，并在“资金”页展示；E2E 冒烟已覆盖从结算锁定扣罚到资金台账出现“扣罚入账”的流程。当前第一版只做资金透明和账内记录，不做真实付款、银行流水、客户退款打款、基金审批或复杂财务凭证。

本轮验证结果：
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过：101 个测试全部通过。
- `npm.cmd run lint` 通过。
- `npm.cmd run build` 通过，Next 已识别新增 `/api/funds` Route。
- 沙箱外清空本机代理后执行 `npm.cmd run test:e2e` 通过：1 个 Chromium 冒烟用例通过，并覆盖“资金”页入口与扣罚入账展示。
- 端口检查仅剩 3100 的 `TIME_WAIT` 连接，无监听中的 3005/3100 服务。

## 2026-06-10 本轮更新：承接权限限制第一版

承接权限限制第一版已完成。承办律师在存在未办结的三级严重或四级重大风控工单时，不能继续在任务大厅抢新任务；中低风险工单和已办结工单不影响承接。该规则用于把风控治理和人力调度闭环打通，避免严重投诉尚未处理时继续扩大承办风险。

真实 API 继续复用现有 `risk_cases` 与 `tasks` 表，不新增数据库迁移。`POST /api/tasks/:id/claim` 在原有任务开放状态、承办律师身份和最低职级校验后，会读取当前律师已承办任务关联的未办结高/重大风控工单；如存在限制，接口返回 `409 CONFLICT`，并在错误信息中提示需先处理风控工单。承接成功审计 metadata 会记录本次校验到的阻断风控数量。

Demo 模式同步接入同一规则：任务大厅顶部会展示风控暂停提示，相关承接按钮显示“风控暂停”并禁用；标准演示数据中 `lawyer01` 因已承办任务存在严重未结风控会被暂停承接，`lawyer02` 的中等级别风控不会误拦。当前第一版不做新手保护期、新兵引流池、强制降级、学习期和复杂累犯惩戒。

本轮验证结果：
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过：105 个测试全部通过。
- `npm.cmd run lint` 通过。
- `npm.cmd run build` 通过，Next 已识别 `/api/tasks/[id]/claim` Route。
- 沙箱外清空本机代理后执行 `npm.cmd run test:e2e` 通过：1 个 Chromium 冒烟用例通过。

## 2026-06-10 本轮更新：累犯加重惩戒建议第一版

累犯加重惩戒建议第一版已完成。系统现在会按承办律师维度统计近 90 天内的有效风控工单，排除委员会裁决为“无过错”的记录；高/重大风控、警示、扣减和升级处理会进入统计口径，并按单次复盘、限制建议和升级复盘三档给出运营建议。

本轮新增 `src/lib/risk/repeat-discipline.ts`，集中维护累犯识别、观察期、建议等级、汇总统计和建议动作文案。当前规则优先使用风控工单的 `taskAssignedLawyerId`，缺失时回退到关联任务的承办律师，避免仅靠单个工单页面人工判断。

前端已在总览页和“投诉与风控”页接入同一面板：总览页的运营信号会显示“累犯惩戒建议”人数；风控页顶部指标增加“累犯建议”，并展示观察周期、需处理律师、限制建议、升级复盘、最近工单和建议动作。承办律师视角只看到本人的建议结果，管理/主任视角可查看全体承办律师汇总。

当前第一版不新增数据库迁移，不修改真实结算金额，不自动扣款，不强制降级，不进入学习期，也不开发新手保护期、新兵引流池、真实短信、证据矩阵或 AI 辅助功能。后续如需要把建议固化为正式惩戒流程，应再设计审批表、审计记录和可申诉机制。

本轮验证结果：
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过，109 个测试全部通过。
- `npm.cmd run lint` 通过。
- `npm.cmd run build` 通过。
- 沙箱外清空本机代理后执行 `npm.cmd run test:e2e` 通过，1 个 Chromium 冒烟用例通过。

## 2026-06-10 本轮更新：审计报表第一版

审计报表第一版已完成。系统现在在“审计日志”页顶部展示审计事件总量、操作人数量、覆盖模块数和登录失败次数，并提供按模块、按动作和按日期的审计报表视图，方便律所管理员在交付、复盘和安全检查时快速判断平台使用情况。

本轮新增 `src/lib/audit/report.ts`，集中维护审计日志聚合规则。报表会基于现有 `AuditLog` 数据计算模块分布、动作分布、操作人分布、日期趋势、登录失败次数、客户侧事件和安全事件，不依赖新的数据库结构。

前端已在审计页接入报表：Demo 模式按当前筛选后的全部本地日志统计；真实 API 模式会在当前筛选条件下额外读取最多 100 条日志作为报表样本，同时保留原有服务端分页明细和 CSV 导出能力。当前第一版定位为运营审计摘要，不新增独立 `/api/audit-report` 接口，也不新增 Supabase 迁移。

本轮验证结果：
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过，113 个测试全部通过。
- `npm.cmd run lint` 通过。
- `npm.cmd run build` 通过。
- 沙箱外清空本机代理后执行 `npm.cmd run test:e2e` 通过，1 个 Chromium 冒烟用例通过。

## 2026-06-10 本轮更新：私有化交付自检第一版

私有化交付自检第一版已完成。系统新增 `npm run private:check`，用于正式私有化或本地化部署前检查是否显式处于真实 Supabase 模式、Supabase 必要变量是否完整、是否存在疑似公开的 service role / secret / database URL / password 变量、关键迁移文件是否齐全、必要 npm scripts 和交付文档是否存在。

本轮新增 `src/lib/deployment/private-readiness.ts` 和 `scripts/check-private-deploy.ts`，自检会自动读取 `.env.local`，但只输出变量名和检查结论，不打印任何密钥值。当前自检不连接远端 Supabase，不执行迁移，不写入数据库；上线前仍需执行迁移核对、`npm run verify:rls` 和允许写入验收库的 `npm run smoke:real`。

新增 `docs/private-deployment.md`，整理私有化部署 runbook，覆盖推荐部署形态、环境变量、交付前自检、标准部署流程、迁移核对、备份恢复第一版要求、升级回滚和运维交接清单。`docs/deployment.md`、`README.md` 和 backlog 已同步私有化交付入口及完整迁移清单。

当前第一版不新增数据库迁移，不连接线上库执行任何 Supabase 操作，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。备份恢复和升级迁移目前是人工 runbook，后续仍需补自动备份脚本、恢复演练脚本和迁移状态核对工具。

本轮验证结果：
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过，120 个测试全部通过。
- `npm.cmd run private:check` 通过，当前 `.env.local` 识别为真实 Supabase 模式，必要变量、关键迁移、脚本和交付文档完整，未发现公开密钥风险。
- `npm.cmd run lint` 通过。
- `npm.cmd run build` 通过。
- 沙箱外清空本机代理后执行 `npm.cmd run test:e2e` 通过，1 个 Chromium 冒烟用例通过。
- 端口检查确认 3005/3100 无监听或残留连接。
- `git diff --check -- .env.example README.md package.json scripts/check-private-deploy.ts src/lib/deployment/private-readiness.ts tests/private-readiness.test.ts docs/private-deployment.md docs/deployment.md docs/backlog.md docs/current-status.md docs/changelog.md` 通过，仅有 LF/CRLF 提示。

## 2026-06-10 本轮更新：数据库备份与恢复自动化第一版

数据库备份与恢复自动化第一版已完成。系统新增 `npm run backup:db` 和 `npm run restore:db`：备份脚本基于当前 Supabase CLI `db dump` 能力生成 `schema.sql`、`data.sql`、`roles.sql` 和 `manifest.json`；恢复脚本默认只做演练和文件校验，必须追加 `--execute` 并设置 `LEXOS_RESTORE_CONFIRM=RESTORE_LEXOS_DATABASE` 才会调用 `psql` 执行恢复。

本轮新增 `src/lib/operations/database-backup.ts`，集中维护数据库连接串读取、连接串打码、备份 schema 清理、备份计划、恢复计划、恢复确认口令和命令展示。脚本只在本地执行，不新增 API，不暴露数据库连接串，不连接线上 Supabase 执行真实备份或恢复。

新增 `docs/backup-restore.md`，整理备份演练、真实备份、恢复演练、显式确认恢复、恢复后 RLS/smoke 核对和当前限制。文档明确 Supabase 数据库备份不包含 Storage 对象本体；`lexos-deliverables` bucket 附件对象需要配合独立 Storage 备份脚本或律所对象存储策略。`.gitignore` 已加入 `backups/`，避免备份文件误提交。

本轮同步更新 `private:check`，把 `backup:db`、`restore:db` 和 `docs/backup-restore.md` 纳入私有化交付必备项。当前第一版不新增数据库迁移，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能；自动安装系统任务、离线加密和失败告警仍属于后续任务。

本轮验证结果：
- 已按 Supabase skill 核对 Supabase changelog、官方备份文档和本机 Supabase CLI `db dump --help`；相关 breaking change 与当前脚本无直接冲突，备份文档确认数据库备份不包含 Storage 对象本体。
- `npm.cmd run typecheck` 通过。曾与 `npm.cmd run build` 并行执行时因 `.next/types` 重建产生缺失文件竞态，单独复跑后通过。
- `npm.cmd test` 通过，130 个测试全部通过。
- `npm.cmd run private:check` 通过，备份/恢复脚本和 `docs/backup-restore.md` 已纳入私有化交付必备项。
- `npm.cmd run backup:db -- --dry-run` 通过，只输出备份计划，不生成备份文件，不连接线上库。
- `npm.cmd run restore:db -- --backup-dir=临时备份目录` 演练通过，只输出恢复计划，不执行数据库写入；临时目录已清理。
- `npm.cmd run lint` 通过。
- `npm.cmd run build` 通过。
- 沙箱外清空本机代理后执行 `npm.cmd run test:e2e` 通过，1 个 Chromium 冒烟用例通过。
- 端口检查确认 3005/3100 无监听或残留连接。
- `git diff --check -- .gitignore .env.example README.md package.json scripts/backup-database.ts scripts/restore-database.ts src/lib/operations/database-backup.ts src/lib/deployment/private-readiness.ts tests/database-backup.test.ts tests/private-readiness.test.ts docs/backup-restore.md docs/private-deployment.md docs/deployment.md docs/backlog.md docs/current-status.md docs/changelog.md` 通过，仅有 LF/CRLF 提示。

## 2026-06-10 本轮更新：Storage 交付附件对象备份第一版

Storage 交付附件对象备份第一版已完成。系统新增 `npm run backup:storage` 和 `npm run restore:storage`：备份脚本面向私有 Supabase Storage bucket `lexos-deliverables`，真实执行时会递归列出对象、下载对象本体，并生成 `storage-manifest.json`；恢复脚本默认只做演练和文件校验，必须追加 `--execute` 并设置 `LEXOS_STORAGE_RESTORE_CONFIRM=RESTORE_LEXOS_STORAGE` 才会上传对象。

本轮新增 `src/lib/operations/storage-backup.ts`，集中维护 Storage bucket 默认值、备份 ID、对象本地路径安全编码、manifest 汇总、恢复计划、显式确认口令、默认不覆盖同名对象和输出格式。对象路径会按片段编码写入 `objects/`，避免特殊字符或路径穿越导致文件写出备份目录。

新增 `scripts/backup-storage.ts` 和 `scripts/restore-storage.ts`。脚本只在 Node 运维环境运行，使用 `SUPABASE_SERVICE_ROLE_KEY` 创建服务端 Supabase client；service role 不进入浏览器端。备份 dry-run 不连接 Supabase，不生成文件；恢复 dry-run 只读取本地 manifest 和对象文件，不上传到远端。

新增 `docs/storage-backup.md`，并更新 `docs/backup-restore.md`、`docs/private-deployment.md`、`docs/deployment.md`、`README.md`、`.env.example`、`docs/backlog.md` 和私有化自检规则。`private:check` 已把 `backup:storage`、`restore:storage` 和 `docs/storage-backup.md` 纳入私有化交付必备项。

当前第一版不新增数据库迁移，不执行真实线上 Storage 下载或上传，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能；自动安装系统任务、离线加密、跨云镜像和失败告警仍属于后续任务。

本轮验证结果：
- 已按 Supabase skill 核对 Supabase Storage 官方 `list`、`download`、`upload` 文档；当前脚本与官方接口边界一致。
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过，139 个测试全部通过。
- `npm.cmd run backup:storage -- --dry-run` 通过，只输出备份计划，不连接 Supabase，不下载对象。
- `npm.cmd run restore:storage -- --backup-dir=临时 Storage 备份目录` 演练通过，只输出恢复计划，不执行上传；临时目录已清理。
- `npm.cmd run private:check` 通过，Storage 备份/恢复脚本和 `docs/storage-backup.md` 已纳入私有化交付必备项。
- `npm.cmd run lint` 通过。
- `npm.cmd run build` 通过。
- 沙箱外清空本机代理后执行 `npm.cmd run test:e2e` 通过，1 个 Chromium 冒烟用例通过。
- 端口检查确认 3005/3100 无监听或残留连接。
- `git diff --check -- .env.example README.md package.json scripts/backup-storage.ts scripts/restore-storage.ts src/lib/operations/storage-backup.ts src/lib/deployment/private-readiness.ts tests/storage-backup.test.ts tests/private-readiness.test.ts docs/storage-backup.md docs/backup-restore.md docs/private-deployment.md docs/deployment.md docs/backlog.md docs/current-status.md docs/changelog.md` 通过，仅有 LF/CRLF 提示。

## 2026-06-10 本轮更新：备份定时调度与恢复演练报告第一版

备份定时调度与恢复演练报告第一版已完成。系统新增 `npm run backup:schedule` 和 `npm run backup:rehearsal`：前者生成每日数据库备份、每日 Storage 对象备份和周期性恢复演练的调度计划，包含 Windows Task Scheduler 与 Linux cron 示例；后者校验数据库备份目录和 Storage 备份目录，并生成可归档的文件级恢复演练报告。

本轮新增 `src/lib/operations/backup-operations.ts`，集中维护备份调度计划、执行时间校验、保留期规则、恢复演练报告、数据库/Storage manifest 类型识别、文件缺失阻断和 Markdown/JSON 输出。调度计划默认只输出建议，不自动安装系统任务；恢复演练报告只做 manifest 和必要文件校验，不执行 `psql` 写入，也不上传 Storage 对象。

新增 `scripts/plan-backup-schedule.ts` 和 `scripts/create-backup-rehearsal-report.ts`。`backup:schedule -- --write` 可把调度计划写入 `backups/reports`；`backup:rehearsal -- --latest` 可从 `LEXOS_BACKUP_DIR` 下自动选择最新数据库备份和 Storage 备份，也支持显式传入 `--db-backup-dir` 与 `--storage-backup-dir`。

新增 `docs/backup-operations.md`，并更新 `docs/backup-restore.md`、`docs/storage-backup.md`、`docs/private-deployment.md`、`docs/deployment.md`、`README.md`、`.env.example`、`docs/backlog.md` 和私有化自检规则。`private:check` 已把 `backup:schedule`、`backup:rehearsal` 和 `docs/backup-operations.md` 纳入私有化交付必备项。

当前第一版不新增数据库迁移，不安装系统级定时任务，不执行真实备份或真实恢复，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能；自动安装任务、离线加密、跨云镜像和失败告警仍属于后续任务。

本轮验证结果：
- 已按 Supabase skill 核对 Supabase changelog、官方数据库备份文档和 Storage 文档；当前调度/报告脚本与数据库备份不含 Storage 对象本体的官方边界一致。
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过，144 个测试全部通过。
- `npm.cmd run backup:schedule` 通过，只输出调度计划，不安装系统任务。
- `npm.cmd run backup:rehearsal -- --db-backup-dir=临时数据库备份目录 --storage-backup-dir=临时 Storage 备份目录 --no-write` 演练通过，只输出报告，不执行真实恢复；临时目录已清理。
- `npm.cmd run private:check` 通过，备份调度/演练报告脚本和 `docs/backup-operations.md` 已纳入私有化交付必备项。
- `npm.cmd run lint` 通过。
- `npm.cmd run build` 通过。
- 沙箱外清空本机代理后执行 `npm.cmd run test:e2e` 通过，1 个 Chromium 冒烟用例通过。
- 端口检查确认 3005/3100 无监听或残留连接。
- `git diff --check -- .env.example README.md package.json scripts/plan-backup-schedule.ts scripts/create-backup-rehearsal-report.ts src/lib/operations/backup-operations.ts src/lib/deployment/private-readiness.ts tests/backup-operations.test.ts tests/private-readiness.test.ts docs/backup-operations.md docs/backup-restore.md docs/storage-backup.md docs/private-deployment.md docs/deployment.md docs/backlog.md docs/current-status.md docs/changelog.md` 通过，仅有 LF/CRLF 提示。

## 2026-06-10 本轮更新：私有化交付迁移核对与上线前 runbook 增强第一版

私有化交付迁移核对与上线前 runbook 增强第一版已完成。系统新增 `npm run launch:check`，用于在正式私有化上线前输出一份 Markdown 形式的只读核对 runbook，统一覆盖本地交付前置、数据库迁移核对、Storage bucket、安全边界、备份恢复演练、真实闭环 smoke 和运维交接证据。

本轮新增 `src/lib/deployment/launch-readiness.ts`，集中维护上线前核对阶段、证据项、只读边界、真实 smoke 写入提示和 Markdown 输出；新增 `scripts/check-launch-readiness.ts`，会读取 `.env.local` 并复用 `private:check` 的本地前置检查，但不连接线上 Supabase、不执行迁移、不写入业务数据。

新增 `docs/launch-readiness.md`，并同步更新 `docs/private-deployment.md`、`docs/deployment.md`、`README.md` 和 `.env.example`。`private:check` 已把 `launch:check` 与 `docs/launch-readiness.md` 纳入私有化交付必备项；关键迁移清单同步补齐案源评分相关两份迁移，避免部署文档与自检规则不一致。

当前第一版不新增数据库迁移，不执行 `supabase db push`，不运行真实 smoke，不安装系统任务，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。远端迁移应用状态、Storage bucket 私有性和真实闭环 smoke 仍需上线负责人在目标环境人工核对。

本轮验证结果：
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过，新增上线前核对 runbook 单元测试。
- `npm.cmd run launch:check` 通过，输出只读上线前核对 runbook。
- `npm.cmd run private:check` 通过，已纳入 `launch:check` 和 `docs/launch-readiness.md`。
- `npm.cmd run lint` 通过。
- `npm.cmd run build` 通过。
- 本轮触碰文件 `git diff --check` 通过，仅有既有 LF/CRLF 提示。

## 2026-06-10 本轮更新：系统升级迁移方案第一版

系统升级迁移方案第一版已完成。系统新增 `npm run upgrade:check`，用于私有化版本升级或补丁发布前输出只读升级迁移核对计划，统一覆盖来源版本、目标版本、必需迁移、已应用迁移清单、升级前备份、升级后验证和回滚证据。

本轮新增 `src/lib/deployment/upgrade-readiness.ts`，集中维护升级迁移清单、可选兼容迁移说明、`LEXOS_UPGRADE_APPLIED_MIGRATIONS` 解析、待应用/人工核对状态、升级前/后命令和 Markdown 输出；新增 `scripts/check-upgrade-readiness.ts`，会读取 `.env.local` 并复用私有化自检规则，但不连接线上 Supabase、不执行 `supabase db push`、不读取远端业务表。

新增 `docs/upgrade-runbook.md`，并同步更新 `docs/private-deployment.md`、`docs/deployment.md`、`README.md`、`.env.example` 和 backlog。`private:check` 已把 `upgrade:check` 与 `docs/upgrade-runbook.md` 纳入私有化交付必备项。

当前第一版不新增数据库迁移，不执行真实升级，不运行真实 smoke，不安装系统任务，不做 schema diff，不生成离线升级包，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。远端迁移应用状态仍需上线负责人通过 Supabase CLI、SQL Editor 记录或目标环境只读核对确认。

本轮验证结果：
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过，152 个测试全部通过。
- `npm.cmd run upgrade:check` 通过，输出只读升级迁移核对计划。
- `npm.cmd run private:check` 通过，已纳入 `upgrade:check` 和 `docs/upgrade-runbook.md`。
- 本轮触碰文件 ESLint 检查通过。
- `npm.cmd run build` 通过。
- 全量 `npm.cmd run lint` 在当前 Windows 会话中多次超时且无规则失败输出；清理本轮残留 Node 进程后，本轮触碰文件 ESLint 与生产构建内置 lint/type 阶段均已通过。

## 2026-06-10 本轮更新：运维日志第一版

运维日志第一版已完成。系统新增 `npm run ops:log:check`，用于私有化交付和运维交接前输出运维日志核对清单，统一覆盖应用发布与回滚、数据库迁移、数据库与 Storage 备份、恢复演练与真实恢复、安全边界核对、真实闭环 smoke、生产异常处置和运维访问权限变更。

本轮新增 `src/lib/operations/operations-log.ts`，集中维护运维日志必记事件、必填字段、留存证据、禁止记录敏感信息、保留期和复核周期规则；新增 `scripts/check-operations-log.ts`，会读取 `.env.local` 并输出 Markdown 形式的运维日志核对清单，但不会创建目录、写入日志文件、连接线上 Supabase 或上传外部日志平台。

新增 `docs/operations-log.md`，并同步更新 `docs/private-deployment.md`、`docs/deployment.md`、`README.md`、`.env.example` 和 backlog。`private:check` 已把 `ops:log:check` 与 `docs/operations-log.md` 纳入私有化交付必备项。

当前第一版不新增数据库迁移，不新增运维日志表，不采集 Next.js/Vercel/Nginx 日志，不接入错误监控或失败告警，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。

本轮验证结果：
- `npm.cmd run typecheck` 通过；曾与 `npm.cmd run build` 并行执行时因 `.next/types` 重建产生缺失文件竞态，单独复跑后通过。
- `npm.cmd test` 通过，156 个测试全部通过。
- `npm.cmd run ops:log:check` 通过，输出运维日志核对清单。
- `npm.cmd run private:check` 通过，已纳入 `ops:log:check` 和 `docs/operations-log.md`。
- 本轮触碰文件 ESLint 检查通过。
- `npm.cmd run build` 通过。
- 本轮触碰文件 `git diff --check` 通过，仅有既有 LF/CRLF 提示。

## 2026-06-10 本轮更新：错误日志第一版

错误日志第一版已完成。系统新增 `npm run error:log:check`，用于私有化交付和异常处置交接前输出错误日志分级与脱敏核对清单，统一覆盖应用运行时异常、业务 API 异常、数据库与 RLS 异常、Storage 附件异常、认证与权限异常、运维脚本与定时任务异常、外部平台与部署异常。

本轮新增 `src/lib/operations/error-log.ts`，集中维护错误分类、默认级别、必填字段、示例、立即处置动作、保留期和日志目标规则；提供 `redactErrorLogMetadata` 用于按 key 和手机号格式脱敏错误元数据。新增 `scripts/check-error-log.ts`，会读取 `.env.local` 并输出 Markdown 形式的错误日志核对清单，但不会创建目录、写入日志文件、连接线上 Supabase 或上传外部错误监控平台。

新增 `docs/error-log.md`，并同步更新 `docs/private-deployment.md`、`docs/deployment.md`、`README.md`、`.env.example` 和 backlog。`private:check` 已把 `error:log:check` 与 `docs/error-log.md` 纳入私有化交付必备项。

当前第一版不新增数据库迁移，不新增错误日志表，不自动拦截所有 API 异常，不采集 Next.js/Vercel/Nginx 日志，不接入 Sentry 或其他外部监控平台，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。

本轮验证结果：
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过，161 个测试全部通过。
- `npm.cmd run error:log:check` 通过，输出错误日志分级与脱敏核对清单。
- `npm.cmd run private:check` 通过，已纳入 `error:log:check` 和 `docs/error-log.md`。
- 本轮触碰文件 ESLint 检查通过。
- `npm.cmd run build` 通过；首次与差异检查并行执行时早退且无具体错误，单独复跑后完整通过。
- 本轮触碰文件 `git diff --check` 通过，仅有既有 LF/CRLF 提示。

## 2026-06-10 本轮更新：性能监控第一版

性能监控第一版已完成。系统新增 `npm run perf:check`，用于私有化交付和运维交接前输出性能监控核对清单，统一覆盖前端核心体验、核心 API 延迟、数据库查询与 RLS、Storage 附件访问、运维脚本耗时、容量与增长。

本轮新增 `src/lib/operations/performance-monitoring.ts`，集中维护性能指标分类、目标、预警阈值、严重阈值、留存证据、复核周期和样本保留期规则。新增 `scripts/check-performance-monitoring.ts`，会读取 `.env.local` 并输出 Markdown 形式的性能监控核对清单，但不会创建目录、写入数据库、采集真实用户数据、连接线上 Supabase 或上传外部 APM。

新增 `docs/performance-monitoring.md`，并同步更新 `docs/private-deployment.md`、`docs/deployment.md`、`README.md`、`.env.example` 和 backlog。`private:check` 已把 `perf:check` 与 `docs/performance-monitoring.md` 纳入私有化交付必备项。

当前第一版不新增数据库迁移，不新增性能样本表，不接入 Web Vitals 自动采集，不采集真实用户监控数据，不接入外部 APM，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。

本轮验证结果：
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过，165 个测试全部通过。
- `npm.cmd run perf:check` 通过，输出性能监控核对清单。
- `npm.cmd run private:check` 通过，已纳入 `perf:check` 和 `docs/performance-monitoring.md`。
- 本轮触碰文件 ESLint 检查通过。
- `npm.cmd run build` 通过。
- 本轮触碰文件 `git diff --check` 通过，仅有既有 LF/CRLF 提示。

## 2026-06-10 本轮更新：多律所租户隔离核对第一版

多律所租户隔离核对第一版已完成。系统新增 `npm run tenant:check`，用于多律所上线前输出只读租户隔离核对清单，统一覆盖租户表 `organization_id` 边界、关键 API 组织过滤、客户侧 token 组织来源、Storage 对象路径组织隔离和正式多律所上线前人工清单。

本轮新增 `src/lib/operations/tenant-isolation.ts`，集中维护租户表清单、全局表清单、关键 API marker、Storage 路径 marker、本地迁移读取和 Markdown 输出。新增 `scripts/check-tenant-isolation.ts`，只读取本地文件，不连接线上 Supabase、不执行迁移、不读取真实租户数据。

新增 `docs/tenant-isolation.md`，并同步更新 `docs/private-deployment.md`、`docs/deployment.md`、`README.md`、`.env.example`、`docs/backlog.md` 和私有化自检规则。`private:check` 已把 `tenant:check` 和 `docs/tenant-isolation.md` 纳入私有化交付必备项。

当前第一版不新增数据库迁移，不创建组织，不迁移真实数据，不实现多组织登录选择或组织切换，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。正式多律所上线前仍需在目标环境人工完成跨组织负向测试、组织创建流程和租户管理员初始化方案。

本轮验证结果：
- 已按 Supabase skill 核对 Supabase changelog、Storage Access Control 和 Product Security 文档；本轮不新增 Data API 暴露、不调整 RLS、不执行 Storage 远端操作。
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过，169 个测试全部通过。
- `npm.cmd run tenant:check` 通过，只读取本地迁移、关键 API 和 Storage 路径，输出“可进入人工租户隔离核对”。
- `npm.cmd run private:check` 通过，`tenant:check` 和 `docs/tenant-isolation.md` 已纳入私有化交付必备项。
- 本轮触碰文件 ESLint 检查通过。
- `npm.cmd run build` 通过；首次构建在 Windows `Collecting build traces` 阶段超时且无规则错误，延长时限单独复跑后完整通过。
- 本轮触碰文件 `git diff --check` 通过，仅有既有 LF/CRLF 提示。

## 2026-06-10 本轮更新：备份离线加密核对第一版

备份离线加密核对第一版已完成。系统新增 `npm run backup:encrypt:check`，用于私有化交付前输出备份离线加密核对清单，统一覆盖加密工具选择、密钥标识、副本数量、异地副本要求、公开目录阻断、命令示例和人工交接清单。

本轮新增 `src/lib/operations/backup-encryption.ts`，集中维护备份加密方式、环境变量解析、公开目录风险、疑似密钥泄露阻断、命令示例和中文输出。新增 `scripts/check-backup-encryption.ts`，只读取环境变量并输出计划，不读取真实备份文件、不执行压缩或加密、不保存密钥、不上传外部存储。

新增 `docs/backup-encryption.md`，并同步更新 `docs/backup-operations.md`、`docs/private-deployment.md`、`docs/deployment.md`、`README.md`、`.env.example`、`docs/backlog.md` 和私有化自检规则。`private:check` 已把 `backup:encrypt:check` 和 `docs/backup-encryption.md` 纳入私有化交付必备项。

当前第一版不新增数据库迁移，不连接线上 Supabase，不执行真实备份或真实加密，不保存私钥、口令或恢复介质，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。自动加密执行、跨云镜像和失败告警仍属于后续任务。

本轮验证结果：
- 已按 Supabase skill 核对 Supabase changelog、官方 Database Backups 和 Storage Access Control 文档；本轮不新增 Data API 暴露、不调整 RLS、不执行 Storage 远端操作。
- `npm.cmd run typecheck` 通过；曾与测试/构建并行执行时早退且无输出，单独顺序复跑后通过。
- `npm.cmd test` 通过，174 个测试全部通过。
- `npm.cmd run backup:encrypt:check` 通过，只输出离线加密核对清单，不读取真实备份文件、不执行真实加密。
- `npm.cmd run private:check` 通过，`backup:encrypt:check` 和 `docs/backup-encryption.md` 已纳入私有化交付必备项。
- 本轮触碰文件 ESLint 检查通过。
- `npm.cmd run build` 通过。
- 本轮触碰文件 `git diff --check` 通过，仅有既有 LF/CRLF 提示。

## 2026-06-10 本轮更新：备份失败告警核对第一版

备份失败告警核对第一版已完成。系统新增 `npm run backup:alert:check`，用于私有化交付前输出备份失败告警核对清单，统一覆盖数据库备份失败、Storage 对象备份失败、恢复演练报告未通过、离线加密副本缺失、备份静默超时、责任人、告警渠道和升级时限。

本轮新增 `src/lib/operations/backup-alerts.ts`，集中维护告警渠道、环境变量解析、静默阈值、升级时限、失败规则、敏感信息禁止记录和中文输出。新增 `scripts/check-backup-alerts.ts`，只读取环境变量并输出计划，不发送邮件、不发短信、不调用 webhook、不连接外部监控平台。

新增 `docs/backup-alerts.md`，并同步更新 `docs/backup-operations.md`、`docs/private-deployment.md`、`docs/deployment.md`、`README.md`、`.env.example`、`docs/backlog.md` 和私有化自检规则。`private:check` 已把 `backup:alert:check` 和 `docs/backup-alerts.md` 纳入私有化交付必备项。

当前第一版不新增数据库迁移，不连接线上 Supabase，不执行真实备份，不接入真实通知平台，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。自动安装任务、跨云镜像和真实通知平台集成仍属于后续任务。

本轮验证结果：
- 已按 Supabase skill 核对 Supabase changelog、官方 Database Backups 和 Storage Access Control 文档；本轮不新增 Data API 暴露、不调整 RLS、不执行 Storage 远端操作。
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过，178 个测试全部通过。
- `npm.cmd run backup:alert:check` 默认阻断通过验证：未配置 `LEXOS_BACKUP_ALERT_OWNER` 时会要求补齐责任人。
- 临时设置 `LEXOS_BACKUP_ALERT_OWNER=律所运维负责人` 后，`npm.cmd run backup:alert:check` 通过，只输出人工告警交接清单，不发送真实通知。
- `npm.cmd run private:check` 通过，`backup:alert:check` 和 `docs/backup-alerts.md` 已纳入私有化交付必备项。
- 本轮触碰文件 ESLint 检查通过。
- `npm.cmd run build` 通过。
- 本轮触碰文件 `git diff --check` 通过，仅有既有 LF/CRLF 提示。

## 2026-06-10 本轮更新：备份异地/跨云镜像核对第一版
备份异地/跨云镜像核对第一版已完成。系统新增 `npm run backup:mirror:check`，用于私有化交付前输出备份镜像只读核对清单，统一覆盖镜像责任人、目的地标识、最少副本数、RPO、恢复抽检周期、manifest 证据、数据库与 Storage 同窗口归档和凭据隔离。

本轮新增 `src/lib/operations/backup-mirror.ts`，集中维护镜像目标类型、环境变量解析、镜像前置规则、目的地敏感内容阻断和中文输出。新增 `scripts/check-backup-mirror.ts`，只读取环境变量并输出核对清单，不上传文件、不调用对象存储 SDK、不连接线上 Supabase。

新增 `docs/backup-mirror.md`，并同步更新 `docs/backup-operations.md`、`docs/private-deployment.md`、`docs/deployment.md`、`README.md`、`.env.example`、`docs/backlog.md` 和私有化自检规则。`private:check` 已把 `backup:mirror:check` 和 `docs/backup-mirror.md` 纳入私有化交付必备项。

当前第一版不新增数据库迁移，不连接线上 Supabase，不执行真实备份或真实恢复，不执行真实跨云上传，不保存对象存储访问密钥，不接入真实告警平台，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。跨云供应商 SDK、WORM/对象锁、带宽限速和自动镜像任务仍属于后续任务。

本轮验证结果：
- 已按 Supabase skill 核对 Supabase changelog、官方 Database Backups 和 Storage Access Control 文档；本轮不新增 Data API 暴露、不调整 RLS、不执行 Storage 远端操作。
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过。
- `npm.cmd run backup:mirror:check` 默认阻断通过验证：未配置 `LEXOS_BACKUP_MIRROR_OWNER` 和 `LEXOS_BACKUP_MIRROR_DESTINATION_REF` 时会要求补齐责任人与目的地标识。
- 临时设置 `LEXOS_BACKUP_MIRROR_OWNER=律所运维负责人`、`LEXOS_BACKUP_MIRROR_DESTINATION_REF=offsite-vault-01` 后，`npm.cmd run backup:mirror:check` 通过，只输出人工镜像交接清单。
- `npm.cmd run private:check` 通过。
- 本轮触碰文件 ESLint 检查通过。
- `npm.cmd run build` 通过。
- 本轮触碰文件 `git diff --check` 通过，仅有既有 LF/CRLF 提示。

## 2026-06-10 本轮更新：最终部署验收第一版
最终部署验收第一版已完成。系统新增 `npm run final:acceptance`，用于生成 Lexos 最终部署验收报告，统一汇总质量门槛、迁移应用状态、RLS / Data API 边界、Storage 交付附件、备份恢复、离线加密、失败告警、异地镜像、运维日志、错误日志、性能监控、租户隔离、真实闭环 smoke 和人工签收证据。

本轮新增 `src/lib/deployment/final-acceptance.ts`，集中维护最终验收元数据、必需脚本、必需文档、阻断规则、验收阶段和 Markdown 输出。新增 `scripts/check-final-deployment-acceptance.ts`，只读取本地环境变量和仓库清单并输出验收报告，不连接线上 Supabase、不执行迁移、不写入业务数据。

新增 `docs/final-deployment-acceptance.md`，并同步更新 `docs/private-deployment.md`、`docs/deployment.md`、`README.md`、`.env.example`、`docs/backlog.md` 和私有化自检规则。`private:check` 已把 `final:acceptance` 和 `docs/final-deployment-acceptance.md` 纳入私有化交付必备项。

当前第一版不新增数据库迁移，不执行 `supabase db push`，不启动生产部署，不执行真实数据库恢复，不执行真实 Storage 恢复，不执行真实跨云镜像，不发送真实通知，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。`smoke:real` 仍是需要人工确认后在验收库单独执行的写入动作。

本轮验证结果：
- 已按 Supabase skill 核对 Supabase changelog、官方 Database Backups 和 Storage Access Control 文档；本轮不新增 Data API 暴露、不调整 RLS、不执行 Storage 远端操作。
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过。
- `npm.cmd run final:acceptance` 默认阻断通过验证：未配置验收负责人、目标环境、发布版本和证据归档编号时会要求补齐。
- 临时设置 `LEXOS_FINAL_ACCEPTANCE_OWNER=交付负责人`、`LEXOS_FINAL_ACCEPTANCE_ENVIRONMENT=验收环境`、`LEXOS_FINAL_ACCEPTANCE_RELEASE_VERSION=v1.0-rc1`、`LEXOS_FINAL_ACCEPTANCE_EVIDENCE_REF=acceptance-20260610` 后，`npm.cmd run final:acceptance` 通过，只输出最终验收报告。
- `npm.cmd run private:check` 通过。
- 本轮触碰文件 ESLint 检查通过。
- `npm.cmd run build` 通过。
- 本轮触碰文件 `git diff --check` 通过，仅有既有 LF/CRLF 提示。

## 2026-06-10 本轮更新：最终验收证据包归档第一版
最终验收证据包归档第一版已完成。系统新增 `npm run final:acceptance:archive`，用于把最终部署验收报告归档为本地 Markdown + JSON 文件，默认输出到 `reports/final-acceptance`，该目录已加入 `.gitignore`，避免证据包误提交到代码仓库。

本轮新增 `src/lib/deployment/final-acceptance-archive.ts`，集中维护归档目录解析、文件名生成、工作区边界校验、公有目录阻断、敏感目录阻断、Markdown/JSON 内容和写入逻辑。新增 `scripts/archive-final-deployment-acceptance.ts`，支持 `--output-dir=...` 和 `--no-write`；当最终验收报告仍存在阻断项时不会写入正式归档。

新增 `tests/final-acceptance-archive.test.ts` 并纳入 `npm test`。同步更新 `docs/final-deployment-acceptance.md`、`docs/private-deployment.md`、`docs/deployment.md`、`README.md`、`.env.example`、`.gitignore`、`docs/backlog.md` 和私有化自检规则。`private:check` 已把 `final:acceptance:archive` 纳入私有化交付必备脚本。

当前第一版不新增数据库迁移，不连接线上 Supabase，不执行 `supabase db push`，不写入业务数据，不执行真实恢复，不执行真实跨云镜像，不发送真实通知，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。归档报告只保存报告文本和结构化 JSON，不应追加密钥、数据库连接串、恢复口令或客户材料原文。

本轮验证结果：
- 已按 Supabase skill 核对 Supabase changelog、官方 Database Backups 和 Storage Access Control 文档；本轮不新增 Data API 暴露、不调整 RLS、不执行 Storage 远端操作。
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过。
- `npm.cmd run final:acceptance:archive -- --no-write` 默认阻断通过验证：未配置最终验收元数据时不会写入正式归档。
- 临时设置 `LEXOS_FINAL_ACCEPTANCE_OWNER=交付负责人`、`LEXOS_FINAL_ACCEPTANCE_ENVIRONMENT=验收环境`、`LEXOS_FINAL_ACCEPTANCE_RELEASE_VERSION=v1.0-rc1`、`LEXOS_FINAL_ACCEPTANCE_EVIDENCE_REF=acceptance-20260610` 后，`npm.cmd run final:acceptance:archive -- --no-write` 通过，只演练归档路径和文件名。
- `npm.cmd run private:check` 通过。
- 本轮触碰文件 ESLint 检查通过。
- `npm.cmd run build` 通过。
- 本轮触碰文件 `git diff --check` 通过，仅有既有 LF/CRLF 提示。

## 2026-06-10 本轮更新：私有化交付包清单核对第一版
私有化交付包清单核对第一版已完成。系统新增 `npm run release:package:check`，用于在最终部署验收和证据包归档之后，核对交付包应包含的源码、配置、脚本、迁移、测试和文档是否齐全，并列出 `.env.local`、`reports`、`backups`、`node_modules`、`.next`、`ops-logs`、`playwright-report` 等不得进入交付包的本地路径。

本轮新增 `src/lib/deployment/release-package.ts`，集中维护交付包根文件、目录、必备 npm scripts、关键迁移、必备文档、排除路径、交付元数据和中文 Markdown 输出。新增 `scripts/check-release-package.ts` 和 `npm run release:package:check`，只读取本地仓库结构与环境变量名称，不生成压缩包、不读取密钥值、不连接线上 Supabase、不执行迁移、不写入业务数据、不运行真实 smoke。

新增 `docs/release-package.md`，并同步更新 `docs/private-deployment.md`、`docs/deployment.md`、`docs/final-deployment-acceptance.md`、`README.md`、`.env.example`、`docs/backlog.md` 和私有化自检规则。`private:check` 与最终验收规则已把 `release:package:check` 和 `docs/release-package.md` 纳入交付必备项。

当前第一版不安装系统任务，不生成离线安装包，不执行真实备份、真实恢复、真实镜像或真实通知，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。

本轮验证结果：
- `node --test tests/release-package.test.ts tests/private-readiness.test.ts tests/final-acceptance.test.ts tests/final-acceptance-archive.test.ts tests/launch-readiness.test.ts tests/upgrade-readiness.test.ts` 通过，31 个测试全部通过。
- `npm.cmd run release:package:check` 默认阻断通过验证：未配置发布版本、目标环境和交付维护人时会要求补齐，且不会生成交付包。
- 临时设置 `LEXOS_RELEASE_PACKAGE_VERSION=v1.0-rc1`、`LEXOS_RELEASE_PACKAGE_TARGET_ENV=律所验收环境`、`LEXOS_RELEASE_PACKAGE_MAINTAINER=交付负责人` 后，`npm.cmd run release:package:check` 通过，只输出交付包清单和必须排除路径。
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过，198 个测试全部通过。
- `npm.cmd run private:check` 通过，`release:package:check` 和 `docs/release-package.md` 已纳入私有化交付必备项。
- 本轮触碰文件 ESLint 检查通过。
- `npm.cmd run build` 通过。
- 本轮触碰文件 `git diff --check` 通过，仅有既有 LF/CRLF 提示。

## 2026-06-10 本轮更新：私有化交付包敏感内容扫描第一版

私有化交付包敏感内容扫描第一版已完成。系统新增 `npm run release:sensitive:check`，用于在交付包清单核对之后，只读扫描允许进入交付包的源码、脚本、测试、迁移和文档，发现疑似真实密钥、私钥、带密码数据库连接串、JWT/Supabase key、GitHub token、AWS access key 等阻断项。

本轮新增 `src/lib/deployment/release-sensitive-scan.ts`，集中维护扫描范围、排除路径、文本文件识别、阻断规则、人工复核规则和中文 Markdown 输出。新增 `scripts/check-release-sensitive-scan.ts` 和 `npm run release:sensitive:check`，不读取 `.env.local`，不扫描 `.next`、`node_modules`、`reports`、`backups`、`ops-logs`、`playwright-report`、`test-results`、`coverage`，不连接线上 Supabase，不执行迁移，不写入业务数据，不生成交付包。

新增 `docs/release-sensitive-scan.md`，并同步更新 `docs/release-package.md`、`docs/private-deployment.md`、`docs/deployment.md`、`docs/final-deployment-acceptance.md`、`README.md`、`docs/backlog.md` 和私有化/最终验收规则。`private:check`、最终验收规则和交付包清单规则已把 `release:sensitive:check` 与 `docs/release-sensitive-scan.md` 纳入交付必备项。

本轮不新增数据库迁移，不连接线上 Supabase，不执行 `supabase db push`，不开发真实短信接入、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。真实短信、AI 辅助和暂缓功能相关命中只作为人工复核项，用于防止交付包误带未启用能力。

本轮验证结果：
- `node --test tests/release-sensitive-scan.test.ts tests/release-package.test.ts tests/private-readiness.test.ts tests/final-acceptance.test.ts tests/final-acceptance-archive.test.ts tests/launch-readiness.test.ts tests/upgrade-readiness.test.ts` 通过，35 个测试全部通过。
- `npm.cmd run release:sensitive:check` 通过，只扫描交付允许范围内的文本文件；当前仓库无阻断项。
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过。
- `npm.cmd run private:check` 通过，`release:sensitive:check` 和 `docs/release-sensitive-scan.md` 已纳入私有化交付必备项。
- 本轮触碰文件 ESLint 检查通过。
- `npm.cmd run build` 通过。
- 本轮触碰文件 `git diff --check` 通过，仅有既有 LF/CRLF 提示。

## 2026-06-10 本轮更新：最终部署验收门禁汇总第一版

最终部署验收门禁汇总第一版已完成。系统新增 `npm run final:gate:check`，用于在签收前聚合私有化交付自检、上线前 runbook、升级迁移核对、最终部署验收、私有化交付包清单和交付包敏感内容扫描，集中输出阻断项、提示项和人工复核项。

本轮新增 `src/lib/deployment/final-gate.ts`，集中维护最终门禁检查项、来源前缀、阻断项汇总、提示/人工复核项汇总和中文 Markdown 输出。新增 `scripts/check-final-gate.ts` 和 `npm run final:gate:check`，只读取本地仓库结构、环境变量和交付允许范围内的文本文件，不连接线上 Supabase、不执行迁移、不运行真实闭环 smoke、不写入业务数据、不生成交付包。

新增 `tests/final-gate.test.ts` 并纳入 `npm test`。新增 `docs/final-gate.md`，并同步更新 `docs/private-deployment.md`、`docs/deployment.md`、`docs/final-deployment-acceptance.md`、`docs/release-package.md`、`README.md`、`docs/backlog.md` 和私有化/最终验收/交付包清单规则。`private:check`、最终验收规则和交付包清单规则已把 `final:gate:check` 与 `docs/final-gate.md` 纳入交付必备项。

当前第一版不新增数据库迁移，不连接线上 Supabase，不执行 `supabase db push`，不开发真实短信接入、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。`smoke:real` 仍是需要人工确认后在验收库单独执行的写入动作，本门禁只聚合本地只读检查。

本轮验证结果：
- `node --test tests/final-gate.test.ts tests/private-readiness.test.ts tests/final-acceptance.test.ts tests/final-acceptance-archive.test.ts tests/release-package.test.ts tests/launch-readiness.test.ts tests/upgrade-readiness.test.ts` 通过。
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过，206 个测试全部通过。
- `npm.cmd run final:gate:check` 默认阻断通过验证：未配置最终验收元数据和交付包元数据时会汇总 7 个阻断项。
- 临时设置 `LEXOS_FINAL_ACCEPTANCE_OWNER=交付负责人`、`LEXOS_FINAL_ACCEPTANCE_ENVIRONMENT=律所验收环境`、`LEXOS_FINAL_ACCEPTANCE_RELEASE_VERSION=v1.0-rc1`、`LEXOS_FINAL_ACCEPTANCE_EVIDENCE_REF=acceptance-20260610`、`LEXOS_RELEASE_PACKAGE_VERSION=v1.0-rc1`、`LEXOS_RELEASE_PACKAGE_TARGET_ENV=律所验收环境`、`LEXOS_RELEASE_PACKAGE_MAINTAINER=交付负责人` 后，`npm.cmd run final:gate:check` 通过。
- `npm.cmd run private:check` 通过，`final:gate:check` 和 `docs/final-gate.md` 已纳入私有化交付必备项。
- 临时设置交付包元数据后，`npm.cmd run release:package:check` 通过，`final:gate:check` 和 `docs/final-gate.md` 已纳入交付包必备项。
- `npm.cmd run release:sensitive:check` 通过，0 个阻断项，10 个本期暂缓功能边界人工复核项。
- `npm.cmd run lint` 通过。
- `npm.cmd run build` 通过。
- 本轮触碰文件 `git diff --check` 通过，仅有既有 LF/CRLF 提示。

## 2026-06-10 本轮更新：最终交付证据索引与签收清单第一版

最终交付证据索引与签收清单第一版已完成。系统新增 `npm run handover:evidence:check`，用于在最终签收前汇总质量门槛、迁移/RLS、备份恢复、Storage 交付附件、运维日志、租户边界、真实闭环 smoke、交付包扫描和客户签收材料的归档口径。

本轮新增 `src/lib/deployment/handover-evidence.ts`，集中维护证据项、负责人角色、命令、期望证据、归档提示、人工项、写数据边界、阻断规则和 Markdown 输出。新增 `scripts/check-handover-evidence.ts`，只读取环境变量用于元数据判断并输出证据索引；缺少 `LEXOS_HANDOVER_OWNER` 或 `LEXOS_HANDOVER_CLIENT_SIGNOFF_REF` 时阻断，客户签收引用包含 token、secret、连接串、访问密钥或短信服务线索时阻断。

新增 `docs/handover-evidence.md`，并同步更新 `README.md`、`.env.example`、`docs/private-deployment.md`、`docs/deployment.md`、`docs/final-deployment-acceptance.md`、`docs/final-gate.md`、`docs/release-package.md`、`docs/backlog.md` 和 `docs/changelog.md`。`private:check`、`final:acceptance`、`release:package:check` 和 `final:gate:check` 已把 `handover:evidence:check` 与 `docs/handover-evidence.md` 纳入交付必备项。

当前第一版不新增数据库迁移，不连接线上 Supabase，不执行 `supabase db push`，不运行真实闭环 smoke，不写入业务数据，不读取或输出密钥值，不生成压缩交付包，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。`smoke:real` 仍只是证据索引中的人工验收项，必须由交付负责人在允许写入的验收库单独执行并归档输出。

本轮验证结果：
- `node --test tests/handover-evidence.test.ts tests/final-gate.test.ts tests/private-readiness.test.ts tests/final-acceptance.test.ts tests/final-acceptance-archive.test.ts tests/release-package.test.ts tests/launch-readiness.test.ts tests/upgrade-readiness.test.ts` 通过。
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过，210 个测试全部通过。
- `npm.cmd run handover:evidence:check` 默认阻断通过验证：未配置交付负责人和客户签收引用时退出 1；临时设置 `LEXOS_HANDOVER_OWNER`、`LEXOS_HANDOVER_CLIENT_SIGNOFF_REF`、`LEXOS_HANDOVER_RELEASE_APPROVER`、`LEXOS_HANDOVER_OPERATIONS_OWNER`、`LEXOS_HANDOVER_SECURITY_REVIEWER` 后通过。
- `npm.cmd run final:gate:check` 默认阻断通过验证：缺最终验收、交付包和交付证据索引元数据时汇总 9 个阻断项；临时补齐最终验收、交付包和交付证据索引元数据后通过，0 个阻断项。
- `npm.cmd run private:check` 通过，`handover:evidence:check` 与 `docs/handover-evidence.md` 已纳入私有化交付必备项。
- 临时设置交付包元数据后，`npm.cmd run release:package:check` 通过。
- `npm.cmd run release:sensitive:check` 通过，0 个阻断项，17 个本期暂缓功能边界人工复核项。
- `npm.cmd run lint` 通过。
- `npm.cmd run build` 通过。
- 全量 `git diff --check` 仍被既有未触碰文件 `app/layout.tsx`、`app/page.tsx`、`next.config.mjs`、`postcss.config.mjs` 的 EOF 空行问题阻断；本轮触碰文件范围的 `git diff --check -- ...` 通过，仅有既有 LF/CRLF 提示。

## 已确认信息

- 项目名称：Lexos
- 产品方向：律所协作平台
- 目标用户：律师事务所
- 技术方向：Node.js + TypeScript + Supabase
- Demo 部署目标：Vercel
- 长期部署目标：律所私有化或本地化部署
- 交互与文档语言：中文
- UI 方向：法律行业审美，简洁、商务、专业、有高级感
- 第一版同时做内部任务承接与客户确认页
- 第一版客户访问方式：带验证码的安全访问链接
- 第一版结算规则：任务金额 × 律师职级比例 = 律师待结算金额
- 默认密码：管理员和新用户均为 111111
- 首次登录：必须强制修改密码，且不能继续使用 111111
- 第一版交付成果：文字说明 + 外部链接 + 私有附件，客户侧下载需先完成验证码校验且任务已由发起人验收
- 用户名登录：系统内部将用户名映射为认证邮箱，用户仍只输入用户名
- 默认管理员初始化：通过 `npm run seed:admin` 创建 `admin / 111111`

## 本期暂缓范围

本期先不开发以下能力：新手保护期、新兵引流池、真实短信接入与真实短信相关功能、证据矩阵、AI 辅助相关功能。后续任务选择和开发计划应避开这些能力，除非用户重新明确恢复。

客户侧安全访问在本期继续沿用现有 token + 手机号 + 临时验证码机制；与真实短信 MFA、短信服务商、动态验证码发送、短信审计相关的能力统一放到后续版本。

## 当前 MVP 判断

第一版以“内部任务承接与结算”为主闭环，以“客户确认页交付体验”为副闭环。

第一版不是完整律所 ERP，也不是完整案卷系统。它的重点是证明以下业务价值：

- 发起人可以透明发单。
- 承办律师可以按条件承接。
- 任务状态可以被追踪。
- 客户可以看到交付进度并确认接收。
- 结算金额可以自动生成并由财务确认。

## 暂缓到后续版本的能力

- 动态 SKU 拖拽表单
- 常法套餐工时和次数抵扣
- 虚拟团队复杂分成
- 律师评分滚动平均
- 新手保护期和新兵引流池（本期暂缓）
- 投诉分级、资金冻结与扣罚（风控工单、金额冻结、48 小时答辩、委员会裁决、扣罚资金流向锁定、公共基金账户和财务流水第一版已完成；真实付款、退款打款和复杂基金审批仍后续）
- 公共风险储备金与质量督导基金复杂运营规则（账户余额与扣罚入账流水已完成第一版）
- 复杂锁定期自动调度和定时处理（客户逾期未确认自动视为交付已完成管理员触发第一版）
- 客户完整账号体系
- 真实短信 MFA 服务商集成（本期暂缓）
- AI 辅助生成、证据矩阵和复杂可视化（AI 与证据矩阵本期暂缓）
- 完整私有化部署安装、升级和备份方案（私有化部署自检和 runbook 已完成第一版；数据库备份与恢复脚本已完成第一版；Storage 对象备份与恢复脚本已完成第一版；备份调度计划与恢复演练报告已完成第一版；自动安装任务、离线加密和升级包仍后续）

## 2026-06-10 本轮更新：部署后回归核对清单第一版

部署后回归核对清单第一版已完成。系统新增 `npm run postdeploy:check`，用于在正式部署完成后生成上线后只读回归核对清单，覆盖健康检查、核心页面、真实闭环 smoke 证据、RLS、客户附件下载、审计/结算导出、备份调度与恢复演练、错误/性能/运维日志、回滚窗口和签收后观察期。

本轮新增 `src/lib/deployment/post-deployment-verification.ts`、`scripts/check-post-deployment.ts`、`tests/post-deployment-verification.test.ts` 和 `docs/post-deployment-verification.md`。`private:check`、`final:acceptance`、`release:package:check`、`final:gate:check` 和 `handover:evidence:check` 已纳入 `postdeploy:check` 与对应文档。

当前第一版只生成核对清单，不连接线上 Supabase，不执行 `supabase db push`，不运行真实闭环 smoke，不写入业务数据，不安装系统任务，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。

## 2026-06-10 本轮更新：备份系统任务安装核对第一版

备份系统任务安装核对第一版已完成。系统新增 `npm run backup:task:check`，用于在 `backup:schedule` 生成调度建议之后，输出 Windows Task Scheduler / Linux cron 人工安装核对清单，覆盖责任人、运行账号、日志目录、安装证据、安装后演练和告警复核。

本轮新增 `src/lib/operations/backup-task-installation.ts`、`scripts/check-backup-task-installation.ts`、`tests/backup-task-installation.test.ts` 和 `docs/backup-task-installation.md`。`private:check`、`launch:check`、`final:acceptance`、`release:package:check`、`handover:evidence:check` 和 `postdeploy:check` 已纳入该核对项或对应文档。

当前第一版只生成本地只读核对清单，不调用 `schtasks`、`crontab` 或 `systemctl`，不创建系统任务，不连接线上 Supabase，不执行真实备份，不读取或输出密钥值，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。

本轮验证结果：
- `node --test tests/backup-task-installation.test.ts tests/private-readiness.test.ts tests/launch-readiness.test.ts tests/final-acceptance.test.ts tests/release-package.test.ts tests/handover-evidence.test.ts tests/post-deployment-verification.test.ts` 通过，33 个测试全部通过。
- `npm.cmd run backup:task:check` 默认阻断通过验证：未配置责任人和运行账号时会返回阻断项，且不会安装系统任务。
- 临时设置 `LEXOS_BACKUP_TASK_OWNER=运维负责人`、`LEXOS_BACKUP_TASK_RUN_AS=lexos-backup-runner`、`LEXOS_BACKUP_TASK_PLATFORM=windows` 后，`npm.cmd run backup:task:check` 通过，只输出人工安装核对清单。
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过，218 个测试全部通过。
- `npm.cmd run lint` 通过。
- `npm.cmd run build` 通过；Next 仍提示当前 ESLint 配置未检测到 Next.js 插件，这是既有提示，不影响本轮构建结果。
- `npm.cmd run private:check` 通过，`backup:task:check` 和 `docs/backup-task-installation.md` 已纳入私有化交付必备项。

## 2026-06-10 本轮更新：备份任务运行证据核对第一版

备份任务运行证据核对第一版已完成。系统新增 `npm run backup:run:check`，用于在备份系统任务安装后核对最近成功备份时间、计划任务导出/截图引用、运维日志引用和恢复演练引用，帮助上线后确认计划任务已经被运维接手并成功运行过。

本轮新增 `src/lib/operations/backup-run-evidence.ts`、`scripts/check-backup-run-evidence.ts`、`tests/backup-run-evidence.test.ts` 和 `docs/backup-run-evidence.md`。`private:check`、`launch:check`、`final:acceptance`、`release:package:check`、`handover:evidence:check` 和 `postdeploy:check` 已纳入该核对项或对应文档。

当前第一版只读取证据引用和时间戳，不读取日志原文，不上传证据，不执行真实备份，不连接线上 Supabase，不写入业务数据，不读取或输出密钥值，不开发真实短信、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。

本轮验证结果：
- 已按 `.agents` canonical `web-iterative-dev` skill 复核 `SKILL.md`、`quality-gates.md`、`tooling-detection.md` 和 `ui-routing.md`，并更新 `docs/web-iterative-dev-alignment.md`。
- `node --test tests/backup-run-evidence.test.ts tests/private-readiness.test.ts tests/launch-readiness.test.ts tests/final-acceptance.test.ts tests/release-package.test.ts tests/handover-evidence.test.ts tests/post-deployment-verification.test.ts tests/operations-log.test.ts` 通过，38 个测试全部通过。
- `npm.cmd run backup:run:check` 默认阻断通过验证：未配置责任人、最近成功备份时间、任务导出引用和运维日志引用时会返回阻断项。
- 临时设置 `LEXOS_BACKUP_RUN_OWNER`、`LEXOS_BACKUP_RUN_LAST_SUCCESS_AT`、`LEXOS_BACKUP_RUN_TASK_EXPORT_REF`、`LEXOS_BACKUP_RUN_LOG_REF` 和 `LEXOS_BACKUP_RUN_REHEARSAL_REF` 后，`npm.cmd run backup:run:check` 通过，只输出运行证据核对清单。
- `npm.cmd run typecheck` 通过。
- `npm.cmd test` 通过，222 个测试全部通过。
- `npm.cmd run lint` 通过。
- `npm.cmd run private:check` 通过，`backup:run:check` 和 `docs/backup-run-evidence.md` 已纳入私有化交付必备项。
- `npm.cmd run build` 首次在 5 分钟限制内超时于静态页生成阶段；放宽超时重跑后通过。

## 当前工作区说明

本阶段已经新增项目代码、测试、Supabase 迁移和中文文档。

检查工作区时，Git 中已有一批历史文件处于删除状态。本阶段为了启动新项目，重新创建了必要的 Next.js、Supabase 和文档文件；未尝试恢复旧文件内容。

## 下一步建议

后续按“先可演示、再可运营、再可交付”的顺序推进：

1. 可演示：继续打磨演示数据、核心页面质感、客户确认页体验，并准备 Vercel Preview demo。
2. 可运营：补强权限运营、律师评分快照、更多批量操作和更细角色视图。
3. 可交付：推进生产安全、运维日志、错误监控、离线加密、失败告警和升级迁移核对。

## 当前开放问题

- 私有化部署第一阶段是否要求完全离线运行。
- Vercel Preview 第一版是否只启用内存 demo，还是连接独立 Supabase demo 库。
- 如果使用真实 Supabase Preview，是否复用当前 `LexOS` 项目，还是新建独立演示项目。
- 是否要增加正式初始化向导尚未决定。
- 线上库已有旧空表，本轮使用兼容迁移；后续正式生产部署建议使用干净项目或单独 schema 策略。
- 正式交付附件、案源评分、审核流程、风控工单、风控处理意见、扣罚锁定和资金流水相关迁移已在仓库生成，但线上 Supabase 项目还需要执行 link 后 `supabase db push`，或在 Supabase SQL Editor 中应用这些迁移 SQL。
# 2026-06-10 deployment readiness update: Vercel upload package dry run

This round adds a local-only Vercel upload package dry run before any real Vercel upload. New files include `src/lib/deployment/vercel-upload-package.ts`, `scripts/check-vercel-upload-package.ts`, `tests/vercel-upload-package.test.ts`, and `docs/vercel-upload-package.md`. The command `npm run deploy:upload:check` reads `.vercelignore`, simulates the upload boundary, blocks high-risk local paths, and scans included text files for sensitive-looking content. It does not create an archive, upload code, call Vercel, link a project, push Git, or read `.env.local` values.

The deployment channel gate now requires `tests/` in `.vercelignore`, and the final gate includes a new `Vercel upload package` check. `private:check`, `launch:check`, `final:acceptance`, `release:package:check`, and `final:gate:check` now treat `deploy:upload:check` and `docs/vercel-upload-package.md` as part of the local deployment readiness closure.

Verification for this round:
- `npm.cmd run deploy:upload:check` passed: 210 included files, 1,583,308 included bytes, 17 ignore patterns, 0 high-risk included paths, 0 sensitive findings.
- `npm.cmd run private:check` passed: 32 required scripts and 26 required docs complete.
- `npm.cmd run release:sensitive:check` passed: 251 scanned files, 0 blockers, 23 manual review items for already-documented postponed capability traces.
- `npm.cmd run final:gate:check` with temporary Preview signoff metadata passed all 10 checks locally.
- Default `npm.cmd run deploy:channel:check` still blocks, as intended, until external upload is explicitly approved and an approval reference is recorded.
- Full verification passed: `npm.cmd test` passed 236 tests, `npm.cmd run typecheck`, `npm.cmd run lint`, and `npm.cmd run build`.

Deployment is still not uploaded. The remaining external step is explicit user approval to upload the current private Lexos project to Vercel Preview.

# 2026-06-10 UI readiness update: pre-delivery workspace refactor

This round focuses on the pre-delivery UI polish pass for the Lexos internal workspace. The design direction is a restrained legal-operations console: dense enough for repeated use, quieter than a landing page, and optimized for scanning tasks, settlement state, customer confirmation, and risk signals.

Changes include a more stable global visual layer, safer focus/reduced-motion handling, larger touch targets for primary navigation and auth flows, a skip link, clearer desktop and mobile navigation current states, a top-bar runtime mode indicator, upgraded table/input/pagination tokens, and a new dashboard operations cue strip for pending settlements, customer confirmation, open tasks, and unresolved risk cases.

Verification for this round:
- `npm.cmd run typecheck` passed.
- `npm.cmd run lint` passed.
- `npm.cmd run test:e2e` first hit the known sandbox `EPERM` Chromium launch restriction; after running with approved elevated browser permission, it passed: 1 Playwright flow.
- `npm.cmd test` passed: 252 tests.
- `npm.cmd run build` passed; the app route size is now 52.6 kB and all 21 static pages generated.

Deployment is still not uploaded. The remaining external step is explicit user approval to upload the current private Lexos project to Vercel Preview.

# 2026-06-10 deployment readiness update: Vercel Preview deployment evidence

This round adds a local-only Vercel Preview deployment evidence gate for the post-upload phase. New files include `src/lib/deployment/preview-deployment-evidence.ts`, `scripts/check-preview-deployment-evidence.ts`, `tests/preview-deployment-evidence.test.ts`, and `docs/vercel-preview-evidence.md`. The command `npm run deploy:preview:evidence` verifies that the upload approval reference, public Preview URL, Vercel deployment reference, build log reference, Preview smoke result, deployment owner, and deployment timestamp are present. It does not upload code, call Vercel, link a project, push Git, run Playwright, or write evidence files.

`private:check`, `launch:check`, `final:acceptance`, `release:package:check`, and `final:gate:check` now treat `deploy:preview:evidence` and `docs/vercel-preview-evidence.md` as required deployment-readiness artifacts. The final gate now has 11 checks, including the new `Vercel Preview deployment evidence` check.

Verification for this round:
- Focused node tests for Preview evidence and readiness integrations passed: 36 tests.
- `npm.cmd run deploy:preview:evidence` correctly blocks by default because no real Preview upload evidence exists yet.
- `npm.cmd run private:check` passed: 34 required scripts and 28 required docs complete.
- `npm.cmd run deploy:preview:request` passed locally and remains ready for approval.
- `npm.cmd run release:sensitive:check` passed: 259 scanned files, 0 blockers, 23 manual review items for already-documented postponed capability traces.
- `npm.cmd run typecheck` passed.
- `npm.cmd test` passed: 246 tests.
- `npm.cmd run lint` passed.
- `npm.cmd run build` passed.
- `npm.cmd run final:gate:check` with non-upload readiness metadata now reports 11 checks, with remaining blockers in the Vercel deployment channel and Vercel Preview deployment evidence checks.

Deployment is still not uploaded. The remaining external step is explicit user approval to upload the current private Lexos project to Vercel Preview; after upload, the new evidence gate must be completed with the returned Preview URL and smoke result.

# 2026-06-10 deployment readiness update: Preview smoke JSON evidence

This round updates `playwright.preview.config.ts` so `npm run smoke:preview` writes a stable JSON report to `reports/preview-smoke/results.json` by default, while still keeping the HTML report for manual inspection. The report path can be overridden with `LEXOS_PREVIEW_SMOKE_REPORT_PATH`.

`docs/vercel-preview-evidence.md` now recommends using `reports/preview-smoke/results.json` as `LEXOS_PREVIEW_SMOKE_REF` after the Preview smoke run. A new `tests/preview-smoke-config.test.ts` guards the JSON reporter path and the `LEXOS_PREVIEW_BASE_URL` dependency.

Verification for this round so far:
- Focused node tests for Preview smoke config, Preview evidence, and final gate passed: 12 tests.
- `npm.cmd run typecheck` passed.
- `npm.cmd test` passed: 248 tests.
- `npm.cmd run release:sensitive:check` passed: 260 scanned files, 0 blockers, 23 manual review items for already-documented postponed capability traces.
- `npm.cmd run deploy:preview:request` passed locally and remains ready for approval.
- `npm.cmd run lint` passed.
- `npm.cmd run build` passed.
- `npm.cmd run final:gate:check` with non-upload readiness metadata still reports 11 checks; local readiness checks pass, while deployment channel and Preview evidence remain blocked until upload approval and real Preview deployment evidence exist.

Deployment is still not uploaded. The next external step remains explicit approval to upload the current private Lexos project to Vercel Preview.

# 2026-06-10 deployment readiness update: Vercel Preview deployment request

This round adds a local-only Vercel Preview deployment request packet. New files include `src/lib/deployment/preview-deployment-request.ts`, `scripts/request-preview-deployment.ts`, `tests/preview-deployment-request.test.ts`, and `docs/vercel-preview-request.md`. The command `npm run deploy:preview:request` combines Preview readiness, deployment channel readiness, and the Vercel upload package dry run into a single approval packet. It does not upload code, push Git, link a Vercel project, create an archive, read `.env.local` secret values, or contact Vercel.

`private:check`, `launch:check`, `final:acceptance`, and `release:package:check` now treat `deploy:preview:request` and `docs/vercel-preview-request.md` as required deployment-readiness artifacts.

Verification for this round:
- Focused node tests for Preview request and readiness integrations passed: 41 tests.
- `npm.cmd run deploy:preview:request` passed locally and reported the request ready for approval.
- `npm.cmd run private:check` passed: 33 required scripts and 27 required docs complete.
- `npm.cmd run release:sensitive:check` passed: 255 scanned files, 0 blockers, 23 manual review items for already-documented postponed capability traces.
- `npm.cmd test` passed: 241 tests.
- `npm.cmd run typecheck` passed.
- `npm.cmd run lint` passed after rerunning with a longer timeout; the first attempt was interrupted by the outer 3-minute timeout, not by a lint rule failure.
- `npm.cmd run build` passed.
- `npm.cmd run final:gate:check` with all non-upload Preview metadata set still blocks only on missing external upload approval and missing approval reference. This confirms the remaining blocker is authorization, not local readiness.

Deployment is still not uploaded. The remaining external step is explicit user approval to upload the current private Lexos project to Vercel Preview.

# 2026-06-10 deployment readiness update: Preview and final gate env templates

This round adds the post-upload Preview evidence variables to `.env.example` and guards them with `tests/preview-env-template.test.ts`. The template now documents `LEXOS_PREVIEW_SMOKE_REPORT_PATH`, deployment reference fields, build log reference, smoke evidence reference, deployment owner, deployed timestamp, and optional claim URL. Upload approval remains explicitly off by default with `LEXOS_DEPLOY_APPROVED_TO_UPLOAD=false`.

The same round also adds `tests/final-gate-env-template.test.ts` to guard all non-secret final gate metadata variables in `.env.example`, including final acceptance owner/version/evidence fields, release package metadata, handover signoff fields, and post-deployment rollback/base URL fields.

`npm test` now includes both env template guards, so future changes cannot accidentally remove the evidence variables, change safe deployment defaults, or drop the stable smoke report path without a test failure.

Verification for this round:
- Focused Preview and final-gate env tests passed: 11 tests.
- `npm.cmd run typecheck` passed.
- `npm.cmd test` passed: 252 tests.
- `npm.cmd run lint` passed.
- `npm.cmd run release:sensitive:check` passed: 262 scanned text files, 0 blockers, 23 manual review items for already-documented postponed capability traces.
- `npm.cmd run deploy:preview:request` passed locally and remains ready for approval.
- `npm.cmd run build` passed after rerunning with a longer timeout; the first attempt timed out during `Collecting build traces` after compilation and static page generation had already completed.
- `npm.cmd run final:gate:check` still reports 11 checks with local readiness checks passing; remaining blockers are external upload approval, real Preview deployment evidence, and human final-delivery metadata such as owner/version/signoff/rollback references.

Deployment is still not uploaded. The remaining external step is explicit user approval to upload the current private Lexos project to Vercel Preview.
