# Lexos 测试说明

## 测试分层

Lexos 当前保留三类测试：

- 单元与领域测试：使用 Node.js 原生 test runner，覆盖权限、环境变量、任务流转、客户大屏和审计日志等纯逻辑。
- 真实 Supabase 冒烟测试：使用 `npm run smoke:real`，面向线上 Supabase 测试闭环，执行前必须确认 `.env.local` 和测试密码环境变量。
- Playwright E2E：使用 `npm run test:e2e`，只跑本地 Demo 模式，不写入线上 Supabase 数据。
- Vercel Preview 远端冒烟测试：使用 `npm run smoke:preview`，只访问已部署 URL，不启动本地服务。

## 常用命令

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

完整工程质量门槛：

```powershell
npm.cmd run verify
```

本地浏览器冒烟测试：

```powershell
npm.cmd run test:e2e
```

远端 Preview 冒烟测试：

```powershell
$env:LEXOS_PREVIEW_BASE_URL="https://你的-preview-url"
$env:LEXOS_PREVIEW_EXPECT_MODE="demo"
npm.cmd run smoke:preview
```

## Playwright E2E 规则

`npm run test:e2e` 会通过 `scripts/e2e-dev-server.mjs` 启动 Next.js dev server，并强制设置：

```text
NEXT_PUBLIC_DEMO_MODE=true
```

因此 E2E 默认使用前端内存 Demo 数据，覆盖登录、首次改密、任务页面、风控答辩/裁决、结算页面可达性和扣罚资金流向锁定，不会污染真实 Supabase 项目。

Playwright 配置会对 `127.0.0.1`、`localhost` 和 `::1` 绕过本机代理。原因是本机如果设置了 `http_proxy` 或 `https_proxy`，Playwright 的 dev server 健康检查可能会把本地请求转发到代理，导致 `502`。

如果本机尚未安装 Playwright 浏览器，需要先执行：

```powershell
npx.cmd playwright install chromium
```

在 Codex 沙箱内运行时，Chromium 可能因为本机执行权限被 `EPERM` 拦截。遇到这种情况，应在获得确认后于沙箱外运行：

```powershell
npm.cmd run test:e2e
```

## Vercel Preview 远端冒烟测试

`npm run smoke:preview` 使用独立的 `playwright.preview.config.ts`，不会启动本地 Next.js dev server。它依赖：

```text
LEXOS_PREVIEW_BASE_URL=https://你的-preview-url
LEXOS_PREVIEW_EXPECT_MODE=demo
```

其中 `LEXOS_PREVIEW_EXPECT_MODE` 可选，常用值为 `demo` 或 `supabase`。

当 `LEXOS_PREVIEW_EXPECT_MODE=supabase` 时，远端 smoke 只检查 `/api/health`，真实登录和业务闭环仍使用 `npm run smoke:real` 验证。

当前远端 smoke 会检查：

- `/api/health` 可访问，且返回 `app=lexos`、`ok=true`、运行模式、commit、环境和时间戳。
- 登录页可见，并处于本地 Demo 模式。
- 使用 `admin / 111111` 登录后完成首次改密。
- 总览页可见，客户大屏 demo 可用 `LEXOS-DEMO-004 / 13800000000 / 111111` 校验。
- 结算管理页面可访问。

该流程不会点击“确认接收并评分”，因此不会改变标准演示数据。

## 真实 Supabase 冒烟测试

真实闭环测试仍使用：

```powershell
$env:LEXOS_SMOKE_ADMIN_PASSWORD="管理员当前密码"
$env:LEXOS_SMOKE_TEST_PASSWORD="演示账号密码"
npm.cmd run smoke:real
```

该命令会创建测试用户、客户、任务、客户确认和结算记录，属于真实数据写入。每次执行前应确认目标项目、账号和用途。
