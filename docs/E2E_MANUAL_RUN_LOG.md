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
