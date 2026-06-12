# Lexos 上线黑盒测试证据（2026-06-12）

## 验证基线

- 黑盒验证提交：`4f9844f5264b24906ec4348b7a3144f40d7a643c`
- 黑盒验证提交信息：`test: add launch black-box e2e coverage`
- 远端 `origin/main` 在验证时已包含该提交。
- 证据归档提交：`75a099c542ce4be75e0a67066f34ce11b0d27c88`
- 远端 `origin/main` 在追加复跑时已对齐到证据归档提交。
- Vercel 项目：`prj_Rs9stBhpa6tOE6R1FGqrO6Y8oBp3`
- Vercel team：`team_J5yWYtoyHhhDUvErX4yrduFy`
- Production domain：`https://lexos-lemon.vercel.app`

## 黑盒覆盖范围

新增 Playwright 规格：`tests/e2e/lexos-launch-blackbox.spec.ts`。

覆盖范围：

- 角色菜单权限：主任、律师、配置管理员、财务。
- 主任全所视图：总览、人员、任务、风控、结算、资金、审计入口。
- 律师个人工作台：客户、任务大厅、任务、风控、结算；不再区分案源律师/办案律师。
- 配置管理员边界：人员、职级、审计、参数、权限；不能进入业务经营页面。
- 任务闭环：创建客户、发布任务、承接、提交成果、验收、客户 token 验证、客户确认评分、生成结算、财务确认。
- 风控闭环：登记、答辩、委员会裁决入口、结算扣罚、资金台账。
- 视觉 smoke：关键运营页无横向滚动、无失败图片资源、无大面积表格主导。
- 响应式 smoke：`1440x1024` 与 `390x844` 覆盖总览、律师工作台、结算、风控。

## 已通过命令

```powershell
npx.cmd playwright test tests/e2e/lexos-launch-blackbox.spec.ts --config=playwright.config.ts --project=chromium-desktop --workers=1 --reporter=line
```

结果：`5 passed`。

```powershell
npx.cmd playwright test --config=playwright.config.ts --project=chromium-desktop --workers=1 --reporter=line
```

结果：`6 passed`。

追加复跑：

```powershell
npx.cmd playwright test --config=playwright.config.ts --project=chromium-desktop --workers=1 --reporter=line
```

结果：`6 passed (1.5m)`。

说明：`npm.cmd run test:e2e` 在当前受限沙箱中因 Chromium `spawn EPERM` 无法启动浏览器；该失败发生在浏览器进程启动前，不是业务断言失败。随后已在允许启动浏览器的环境中使用单 worker 命令完成同一 Playwright 配置下的黑盒复跑。

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

结果：

- TypeScript typecheck 通过。
- Node test：`253 tests / 68 suites`，`253 pass`，`0 fail`。
- Next.js production build 通过，生成 21 个静态页面，核心 API routes 可识别。

```powershell
npm.cmd run deploy:upload:check
npm.cmd run private:check
npm.cmd run launch:check
```

结果：

- Vercel upload package check：`Status: passed`，高风险路径 `0`，敏感发现 `0`。
- 私有化部署自检：通过，真实 Supabase 模式，Supabase 变量完整。
- 上线前核对：可进入人工上线核对。

追加只读交付核对：

```powershell
npm.cmd run tenant:check
npm.cmd run upgrade:check
npm.cmd run release:sensitive:check
npm.cmd run ops:log:check
npm.cmd run error:log:check
npm.cmd run perf:check
```

结果：

- 租户隔离核对：可进入人工租户隔离核对。
- 升级迁移核对：可进入人工升级核对，远端迁移状态仍需人工核对。
- 交付包敏感扫描：通过，阻断项 `0`。
- 运维日志、错误日志、性能监控：均可进入交接。

## 本地生产只读 smoke

执行方式：`npm.cmd run build` 后使用 `next start -H 127.0.0.1 -p 3105`，只访问不写数据路径。

结果：

- `GET /`：`200`
- `GET /api/health`：`200`
- health 摘要：`mode=supabase`，`ok=true`，`supabaseConfigured=true`，`missingSupabaseEnvKeys=[]`
- 端口 `3105` 已释放。

## 线上 production 只读 smoke

Vercel MCP fetch：

- `GET https://lexos-lemon.vercel.app/`：`200`
- `GET https://lexos-lemon.vercel.app/api/health`：`200`

health 返回：

```json
{
  "app": "lexos",
  "mode": "supabase",
  "ok": true,
  "supabaseConfigured": true,
  "missingSupabaseEnvKeys": [],
  "commit": "de4ee22",
  "vercelEnv": "production"
}
```

结论：production 服务健康，但仍运行旧提交 `de4ee22`，没有部署最新交付提交 `4f9844f` 或证据归档提交 `75a099c`。

追加只读远端 smoke：

```powershell
$env:LEXOS_PREVIEW_BASE_URL="https://lexos-lemon.vercel.app"
$env:LEXOS_PREVIEW_EXPECT_MODE="supabase"
npx.cmd playwright test --config=playwright.preview.config.ts --project=chromium-preview --workers=1 --reporter=line
```

结果：`1 passed`，`1 skipped`。
说明：真实 Supabase 模式下远端 smoke 只检查 `/api/health`；登录、客户确认和结算闭环用例按配置跳过，避免对生产环境写入数据。

## Vercel 部署状态

Vercel deployments 最近 production：

- deployment id：`dpl_7eiuBhUsHytni8FGYH3SwsUKY4Lx`
- state：`READY`
- target：`production`
- commit：`de4ee22799ffc7a0fd3111e02ebdfd74fee8c2a6`
- domain 包含：`lexos-lemon.vercel.app`

未发现 `4f9844f5264b24906ec4348b7a3144f40d7a643c` 或 `75a099c542ce4be75e0a67066f34ce11b0d27c88` 的 Vercel deployment 记录。

最近 30 分钟 production runtime logs：未发现 `error` / `fatal`。

本机部署能力：

- `.vercel/project.json` 已 link 到正确 project/team。
- 本机未安装 Vercel CLI。
- 本机未配置 `VERCEL_TOKEN`、`VERCEL_ORG_ID`、`VERCEL_PROJECT_ID`。
- Vercel MCP `_deploy_to_vercel` 因私有项目不确定上传路径被安全策略拒绝，不能作为正式 production 部署方式。

## 未执行项与原因

```powershell
npm.cmd run smoke:real
```

结果：未进入写入步骤，启动阶段阻断。

阻断原因：

- 缺少 `LEXOS_SMOKE_ADMIN_PASSWORD`
- 缺少 `LEXOS_SMOKE_TEST_PASSWORD`
- 缺少 `LEXOS_SMOKE_BASE_URL`

说明：`smoke:real` 会创建或更新真实 Supabase 中的用户、客户、任务、客户反馈和结算记录。只能在明确允许写入的验收库执行。

```powershell
npm.cmd run verify:rls
```

结果：未执行。

阻断原因：

- 缺少 `LEXOS_RLS_TEST_PASSWORD` 或 `LEXOS_SMOKE_TEST_PASSWORD`

## 最小剩余动作

1. 在 Vercel Dashboard 对 `main` 最新提交 `75a099c` 执行 Production Redeploy，或配置 Vercel CLI/token 并限定部署到现有 `lexos` project。
2. 提供 `LEXOS_SMOKE_BASE_URL`、`LEXOS_SMOKE_ADMIN_PASSWORD`、`LEXOS_SMOKE_TEST_PASSWORD`，并确认目标是允许写入的验收库。
3. 部署后执行：

```powershell
npm.cmd run verify:rls
npm.cmd run smoke:real
npm.cmd run postdeploy:check
npm.cmd run final:gate:check
```
