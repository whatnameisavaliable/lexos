# LexOS 私有化部署指南

| 字段 | 内容 |
|------|------|
| 版本 | 1.0 |
| 基准 | `architecture.md` v1.3 · `CONTEXT_SUMMARY.md` v1.1 |
| 适用 | 单律所私有化内网部署 |

---

## 1. 部署单元与进程清单

LexOS v1.3 **不依赖 Redis / BullMQ**。异步流水线由 Postgres Outbox + U3 Worker 轮询驱动。

| 进程 ID | npm 脚本 | 工作目录 | 默认端口 | 说明 |
|---------|----------|----------|----------|------|
| **U1 Web** | `npm run start -w @lexos/web` | monorepo 根 | `3000` | Next.js 前端；会话 Cookie、Router Guard |
| **U2 API** | `npm run start -w @lexos/api` | monorepo 根 | `4000` | HTTP BFF；鉴权、CRUD、Outbox 生产 |
| **U3 Pipeline** | `npm run worker:pipeline` | monorepo 根 | — | Outbox 轮询；FFmpeg / ASR / LLM 编排 |
| **U3 Scheduler** | `npm run scheduler:stalled` | monorepo 根 | — | Stalled 任务补偿 Cron |

**外部依赖（非 Node 进程）**：

| 组件 | 说明 |
|------|------|
| PostgreSQL 15+ | Supabase DB 或自建；RLS 强制 |
| Supabase Auth / GoTrue | 虚拟邮箱登录 |
| Object Storage | Supabase Storage 或 MinIO / SeaweedFS（S3 API） |
| FFmpeg | U3 节点本地二进制（`FFMPEG_PATH`） |

---

## 2. 环境文件

1. 复制 `.env.production.example` → `.env.production`
2. 填写内网端点（**禁止**提交真实密钥至 Git）
3. 各进程启动时按 `NODE_ENV=production` 加载

详见 `architecture.md` §4.1–§4.2 完整变量清单。

---

## 3. 启动顺序

按以下顺序启动，确保依赖就绪后再接受业务流量：

```
1. PostgreSQL + Auth + Storage（基础设施）
2. 数据库迁移：npm run db:push
3. 种子管理员（首次）：npm run seed:admin
4. U2 API：npm run build:shared && npm run start -w @lexos/api
5. U1 Web：npm run build -w @lexos/web && npm run start -w @lexos/web
6. U3 Pipeline Worker：npm run worker:pipeline
7. U3 Stalled Scheduler：npm run scheduler:stalled
```

**健康检查**（启动后验证）：

- API：`GET {API_URL}/health` → `200`，`checks.postgres.ok` 与 `checks.storage` 均为 `true`
- Worker：启动日志含 `ffmpeg ok:` 行（见 `workers/pipeline/src/health/worker-health.ts`）

---

## 4. 生产构建

```bash
# 共享包
npm run build:shared

# API（TypeScript 编译，tsx 运行时）
npm run build -w @lexos/api

# Web（Next.js 静态优化）
npm run build -w @lexos/web
```

---

## 5. 运维建议

| 项 | 建议 |
|----|------|
| 进程守护 | systemd / supervisord 分别托管四个 Node 进程 |
| 日志 | stdout 采集；禁止输出 API Key / 密文 |
| 临时目录 | `WORKER_TMP_DIR` 定期清理；Worker 重启安全 |
| 并发 | `WORKER_MAX_CONCURRENCY=5`（首期上限，勿擅自提高） |
| 备份 | Postgres 全量 + WAL；Storage 桶同步策略由运维定义 |

---

## 7. 私有化替代矩阵验收表

对照 `architecture.md` §4.4 逐行验收。部署完成后由运维/产品在「验收」列勾选。

| 能力 | 开发期（云） | 私有化交付 | 代码耦合要求 | 验收 |
|------|--------------|------------|--------------|:----:|
| Auth | Supabase Auth | GoTrue 自建或 Supabase 内网实例 | 仅经 `AuthAdapter`；`AUTH_VIRTUAL_EMAIL_DOMAIN` 可配置 | ☐ |
| Postgres | Supabase DB | 自建 PostgreSQL 15+ | 标准 SQL + RLS；无 Supabase 专有扩展（除 `auth.uid()`） | ☐ |
| Storage | Supabase Storage | MinIO / SeaweedFS（S3 API） | `StorageAdapter` 抽象签名上传/下载 | ☐ |
| Realtime | 可选 | **默认关闭** | `REALTIME_ENABLED=false`；不写入核心业务路径 | ☐ |
| 异步调度 | Postgres Outbox | 同左（无额外组件） | U3 轮询 `outbox_events`；**禁止** Redis | ☐ |
| 验证码 | Turnstile/Geetest | `CAPTCHA_PROVIDER=none` + IP 白名单 | `CaptchaAdapter` 可空实现；`LOGIN_IP_ALLOWLIST` 已配置 | ☐ |
| ASR/LLM | 公网 API | 内网 HTTP 端点 | `AiAdapterFactory` + DB `base_url` / `ai_model_credentials` | ☐ |

**附加验收项**（§4.4.1–§4.4.2）：

| 检查项 | 说明 | 验收 |
|--------|------|:----:|
| `/health` Postgres | `GET /health` → `checks.postgres.ok === true` | ☐ |
| `/health` Storage | `checks.storage.media.ok` 与 `checks.storage.exports.ok` 均为 `true` | ☐ |
| Worker FFmpeg | 启动日志或 Worker health 含 FFmpeg 版本 | ☐ |
| 无 Redis 依赖 | 进程清单与 `.env.production` 均不含 `REDIS_URL` | ☐ |
| 无硬编码域名 | 源码扫描 `npm run test:compliance` 通过 | ☐ |

---

## 8. 性能冒烟

轻量 API 压测（PRD §5.1 · QPS≤10），**非 CI 必跑项**【待确认】；在预发/私有化环境手动执行。

**前置**：U2 API 已启动；`.env.development` 或 `.env.production` 已配置 `API_URL`、测试账号口令。

```bash
# 登录 + 会话（10 VU · 30s · 错误率 < 1%）
API_URL=http://localhost:4000 \
SMOKE_USERNAME=admin \
SMOKE_PASSWORD=your-password \
node scripts/load/smoke-auth-session.mjs

# 已登录 profile 读取
node scripts/load/smoke-profile.mjs
```

退出码 `0` = 通过；`1` = 错误率 ≥ 1% 或前置登录失败。

---

## 9. 相关文档

- 环境变量：`.env.production.example`
- 架构与私有化矩阵：`architecture.md` §4.4
- 待确认项签收：`OPEN_ISSUES.md`
- 人工 E2E 验收：`E2E_MANUAL_CHECKLIST.md`
