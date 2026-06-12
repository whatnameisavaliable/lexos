# Lexos 与 web-iterative-dev 对齐说明

## 对齐目的

后续 Lexos 开发从 `node-supabase-iterative-dev` 的项目启动模式，切换到 `web-iterative-dev` 的全生命周期 Web 迭代模式。

这份文档用于固定后续协作规则：每次只推进一个确认过的功能、修复或变更；以仓库文档为事实源；按变更风险选择质量门槛；结束时同步状态、变更记录、风险和下一步。

## 复核来源

本对齐文档已按用户指定的 skill 路径复核：

```text
C:\Users\wallo\.agents\skills\web-iterative-dev\SKILL.md
```

同时复核了该 skill 下的关键参考文件：

- `references/quality-gates.md`
- `references/tooling-detection.md`
- `references/ui-routing.md`

注意：本机同时存在 `.codex` 与 `.agents` 两份 `web-iterative-dev` skill，后续以用户指定的 `.agents` 路径为准。

2026-06-10 已再次按 `.agents` canonical 路径复核 `SKILL.md`、`references/quality-gates.md`、`references/tooling-detection.md` 和 `references/ui-routing.md`。后续继续以 `package.json` 和仓库文档为事实源，不依赖聊天上下文或 `.codex` 同名副本。

## 当前项目模式

Lexos 当前属于 `web-iterative-dev` 的 Existing project 模式。

启动任意新迭代前，优先读取：

- `docs/current-status.md`
- `docs/backlog.md`
- `docs/project-overview.md`
- 与本轮相关的模块文档，例如 `docs/api.md`、`docs/database.md`、`docs/deployment.md`

聊天历史只能作为辅助上下文，不能替代仓库里的文档和代码。

## 技术与工具检测

当前检测结果：

- 前端与应用框架：Next.js + React + TypeScript
- 包管理器：npm，存在 `package-lock.json`
- 数据库与认证：Supabase Auth + Postgres
- 部署倾向：Next.js 项目，测试 demo 默认走 Vercel
- 文档目录：已存在 `docs/`
- 迁移目录：已存在 `supabase/migrations/`
- 当前没有 `vercel.json`，后续 Vercel 可先按默认 Next.js 部署路径推进

当前脚本以 `package.json` 的 `scripts` 为准。执行任何 format、lint、typecheck、test、preflight 或交付检查前，先按 `tooling-detection.md` 读取 `package.json`，不要沿用旧聊天里的脚本清单。

当前固定质量门槛：

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

浏览器冒烟验证命令：
```powershell
npm.cmd run test:e2e
```

聚合验证命令：

```powershell
npm.cmd run verify
```

## 后续迭代协议

每次迭代按以下流程推进：

1. 读取当前状态与 backlog。
2. 归类本轮请求：UI、API、Supabase、部署、Bug、PR 或文档。
3. 如涉及产品规则、权限、数据库结构或结算逻辑歧义，先向用户确认。
4. 形成一张本轮任务卡，至少包含目标、范围、不包含内容、影响文件、验收标准和质量门槛。
5. 范围确认后主动实现，不停在方案阶段。
6. 运行与风险匹配的质量门槛。
7. 更新 `docs/current-status.md`、`docs/changelog.md`，必要时更新 `docs/backlog.md`、`docs/api.md`、`docs/database.md`、`docs/deployment.md`。
8. 结束时说明已改内容、验证结果、未跑检查、风险和建议下一步。

## 质量门槛映射

### 通用最小门槛

适用于每一轮代码迭代：

- 范围已确认。
- 只修改本轮相关文件。
- TypeScript 检查通过。
- 相关测试通过。
- 相关文档和 changelog 已更新。
- 写出用户可手动验收的步骤。

Lexos 当前推荐命令：

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
```

涉及完整应用或部署前：

```powershell
npm.cmd run build
```

### UI / 前端变更

适用于登录页、后台工作台、表格、表单、客户确认页、移动端适配：

- 桌面端与移动端都要检查。
- 按钮、表格、卡片、表单不能出现明显文字溢出。
- 需要覆盖空状态、加载态、错误态和成功态。
- 关键流程尽量用 Browser 或 Playwright 做页面验证。
- 如果浏览器自动化工具不可用，至少记录 HTTP 验证和手动验收步骤。

UI skill 路由：

- Lexos 后台属于产品型管理系统，优先走 `shadcn` 风格和数据表/表单模式。
- 当前项目尚未引入 shadcn，现阶段先延续 Tailwind 自定义设计系统；下一次大规模组件化前，再决定是否正式引入 shadcn。
- 设计 token 统一维护在 Tailwind / 全局样式中，避免组件里散落随机颜色。
- 落地页或品牌页才使用更强视觉表达；后台页面保持简洁、商务、高信息密度。

### API / Node.js 变更

适用于 `/api/*` 路由、输入校验、认证、权限、业务状态流转：

- API 边界必须做输入校验。
- 错误响应不能泄露密钥、token、密码或 service role 信息。
- 至少考虑成功、校验失败、无权限、未找到四类情况。
- 列表接口应分页或限制返回数量。
- 影响真实业务闭环时，优先补测试或 smoke 脚本。

### Supabase / 数据库变更

适用于表结构、迁移、RLS、索引、策略、权限：

- service role 只能出现在服务端代码。
- 浏览器端不直接访问内部业务表。
- 迁移采用向前兼容策略，尤其是当前线上 LexOS 项目已有历史空表。
- 涉及 RLS 或 Data API 边界时运行：

```powershell
npm.cmd run verify:rls
```

- 涉及完整真实闭环时运行：

```powershell
$env:LEXOS_SMOKE_ADMIN_PASSWORD="管理员当前密码"
$env:LEXOS_SMOKE_TEST_PASSWORD="演示账号密码"
npm.cmd run smoke:real
```

### 部署变更

适用于 Vercel preview、production、Supabase remote migration：

- 默认先做 preview，不直接上 production。
- production 必须由用户明确确认。
- 部署前必须确认环境变量，不把 `.env.local` 或 service role key 提交到 Git。
- 部署后至少验证首页、登录、一个核心业务路径和关键 API。
- 部署后更新 `docs/deployment.md` 和 `docs/current-status.md`。

## 当前与 web-iterative-dev 的差距

以下不是阻塞项，但建议逐步补齐：

- 尚未建立每轮独立任务卡文件；短期可把任务卡写在 `docs/current-status.md` 或本对齐文档的“下一轮任务卡”中。
- 已新增 Playwright e2e 第一版，当前覆盖本地 Demo 登录、首次改密、任务页和结算页；沙箱内启动 Chromium 可能被 `EPERM` 拦截，需要在获得确认后沙箱外运行。
- lint 门槛已迁移到 ESLint CLI，并纳入 `npm run verify`。
- 当前 UI 是自定义 Tailwind 组件；如果后续表格、弹窗、表单持续增多，建议决定是否引入 shadcn。
- 服务端分页与搜索第一版已覆盖用户、客户、任务、结算和审计；真实 API 模式前端已开始接入服务端 `pagination` 元数据，后续按需补排序和更细权限视图。
- Vercel Preview demo 部署准备已完成文档版；实际项目链接、环境变量截图/位置和回滚步骤还需要在第一次真实部署时补齐。

## 下一轮建议任务卡

任务名称：UI v0.2 收尾与可演示稳定性增强

目标：在现有后台视觉基础上，补齐关键操作确认、错误提示、空状态、任务详情体验和手动验收路径，让测试 demo 更适合给律所用户演示。

范围：

- 优化任务详情或任务行展开体验。
- 给关键操作增加确认或明确反馈。
- 补齐主要页面错误态和空状态文案。
- 复核移动端布局和文字溢出。
- 更新文档与 changelog。

不包含：

- 不做新的数据库表。
- 不接真实短信服务商。
- 不做完整文件上传。
- 不做 Vercel production 部署。

建议质量门槛：

- `npx.cmd tsc --noEmit --pretty false`
- `npm.cmd test`
- `npm.cmd run build`
- 本地页面 HTTP 200
- 浏览器或手动验收登录页、总览页、任务页、结算页
