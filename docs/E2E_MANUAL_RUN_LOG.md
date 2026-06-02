# E2E 人工验收执行记录

| 字段 | 值 |
|------|-----|
| 验收日期 | 2026-05-31 |
| 环境 | development（本地 monorepo） |
| 执行人 | 工程自动化 + 待产品补签 |

## 自动化已覆盖（M9）

| 项 | 结果 | 说明 |
|----|:----:|------|
| `npm run test:compliance` | 通过 | 7 文件 / 14 测试 |
| `npm run check:privatization` | 通过 | CAPTCHA/FFMPEG/REALTIME 三项 |
| RLS 律师隔离冒烟 | 通过 | `smoke-rls-lawyer-isolation.test.ts` |
| admin 审计只读冒烟 | 通过 | `smoke-admin-audit-read.test.ts` |
| `/health` 集成测试 | 通过 | Postgres + Storage 结构断言 |
| Playwright E2E 基建 | 就绪 | `npm run test:e2e`（需 Web/API 在线；部分场景需 `E2E_*` 环境变量） |

## 人工清单（`E2E_MANUAL_CHECKLIST.md`）

以下须产品/QA 在目标环境逐条勾选：

| 章节 | 状态 | 备注 |
|------|:----:|------|
| §1 认证与 MFA 真机扫码 | 待执行 | 首期 MFA UI 未强制；1.2 可跳过或延期 |
| §2 用户管理 | 部分 | admin 创建用户已由 Playwright 覆盖 |
| §3 转写上传与流水线 | 部分 | 上传 happy path E2E 含 TUS Mock |
| §4 工作台 | 待执行 | 需 `E2E_WORKBENCH_TASK_ID` |
| §5 云盘 | 待执行 | 需 `E2E_DRIVE_SEARCH_KEYWORD` |
| §6 审计 | 部分 | API 层冒烟已通过 |
| §7 AI 配置 | 待执行 | — |
| §8 私有化就绪 | 通过 | compliance + privatization 脚本 |

## `OPEN_ISSUES.md` 产品签收

全部条目当前状态为 `open`，待产品评审会议逐条标记 `accepted` / `deferred`。

---

**结论**：M9 工程交付项已完成；人工清单与 OPEN_ISSUES 签收需产品下一步确认。

---

## M10 — SOP 基础设施（2026-06-02）

| 字段 | 值 |
|------|-----|
| 验收日期 | 2026-06-02 |
| 环境 | Supabase 联调（`supabase db push --include-all` 已应用） |
| 执行人 | 工程自动化（CLI 核对）+ 产品人工黑盒签收 |

### 自动化 / CLI 已核对

| 项 | 结果 | 说明 |
|----|:----:|------|
| M10 迁移 `20260602100001`～`20260602100011` | 通过 | `supabase migration list` 本地与远端均为 applied |
| 五张 SOP 表存在 | 通过 | `pg_class` 查询五表均存在 |
| RLS 已启用 | 通过 | 五表 `relrowsecurity = true` |
| `sop.deep_research_enabled` | 通过 | `system_settings` 值为 `true` |
| `packages/shared` M10 单测 | 通过 | 仓库根目录 `vitest run packages/shared/src/...`（53 passed，1 skipped 无 DB URL） |

### 【人工黑盒验收签收】（2026-06-02）

| 项 | 结果 | 备注 |
|----|:----:|------|
| 五张 SOP 表存在且 RLS 已启用 | 通过 | Studio / psql 人工确认 |
| 律师 A 无法读律师 B `case_pipelines` / `pipeline_artifacts` | 通过 | 双律师 JWT 人工验证 |
| Storage `exports` 桶 + 路径以 `{owner_id}/` 开头；违规路径拒绝 | 通过 | 策略抽查 + 试传违规路径被拒 |
| `system_settings.sop.deep_research_enabled` 默认 `true` | 通过 | 人工确认 |
| **签收结论** | **通过** | M10 里程碑可关闭，可进入 M11 |

**结论**：M10 工程交付与人工黑盒验收均已通过。
