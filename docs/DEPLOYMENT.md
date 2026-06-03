# LexOS 部署指南（Docker 为主）

| 字段 | 内容 |
|------|------|
| 版本 | 1.1 |
| 基准 | `architecture.md` v1.3 · `CONTEXT_SUMMARY.md` v1.1 |
| 推荐方式 | **Docker Compose**（应用层） |
| 适用 | 单律所私有化 / 内网 / 预发 |

---

## 1. 总览

LexOS v1.3 **不依赖 Redis / BullMQ**。异步流水线由 Postgres Outbox + U3 Worker 轮询驱动。

部署分为两层：

| 层级 | 内容 | 本仓库提供 |
|------|------|------------|
| **基础设施** | PostgreSQL、Auth、Object Storage | 否（Supabase 云或 [自建 Supabase Docker](https://supabase.com/docs/guides/self-hosting/docker)） |
| **应用层** | U1 Web、U2 API、U3 Pipeline、U3 Scheduler | 是（`Dockerfile` + `docker-compose.yml`） |

日常运行需 **4 个长期容器**（4 个独立镜像、各跑 1 个进程）。首次部署另跑 2 个**一次性**容器（迁移、种子管理员）。

---

## 2. 容器与镜像

`Dockerfile` 使用 **multi-stage / multi-target**：同一文件，多个 `target`，**不是**把四个进程塞进一个容器。

| Compose 服务 | Build target | 进程 | 宿主机端口 |
|--------------|--------------|------|------------|
| `web` | `web` | U1 Next.js（standalone） | `${LEXOS_WEB_PORT:-3000}` |
| `api` | `api` | U2 HTTP API | `${LEXOS_API_PORT:-4000}` |
| `worker-pipeline` | `worker-pipeline` | U3 转写（含 FFmpeg） | — |
| `worker-scheduler` | `worker-scheduler` | U3 Stalled 补偿 | — |
| `migrate`（一次性） | `migrate` | `npm run db:push` | — |
| `seed-admin`（一次性） | `seed-admin` | `npm run seed:admin` | — |

镜像关系简述：

- **`web`**：单独构建链，仅包含 Next.js `.next/standalone`，体积最小。
- **`api` / `worker-pipeline` / `worker-scheduler`**：共用中间层 `runtime-base`（`node_modules` + 源码），**最终仍是三个独立镜像**，启动命令不同。

Worker 临时文件挂载命名卷 `worker-tmp` → 容器内 `/tmp/lexos`。

---

## 3. 前置条件

### 3.1 宿主机

- [Docker Engine](https://docs.docker.com/engine/install/) 24+ 与 [Docker Compose](https://docs.docker.com/compose/install/) v2
- 能访问 Supabase（或自建等价栈）的网络
- 建议内存 ≥ 4 GiB（首次 `docker compose build` 会编译 Web）

验证：

```bash
docker compose version
```

### 3.2 Supabase（或等价栈）

须已具备并可从**容器网络**访问：

| 组件 | 说明 |
|------|------|
| PostgreSQL 15+ | RLS 已启用；连接串写入 `.env.docker` |
| Auth / GoTrue | 虚拟邮箱登录 |
| Storage | `media`、`exports` 桶（迁移 `20260529110014_*` 可自动创建） |

**开发/试点**：可直接使用远端 Supabase 云项目（在 `.env.docker` 中填写 Dashboard 密钥即可）。

**律所内网**：部署 [Supabase 自建 Docker](https://supabase.com/docs/guides/self-hosting/docker) 或 GoTrue + Postgres + MinIO，再将 `.env.docker` 指向内网 Kong 网关 URL。

### 3.3 仓库文件

| 文件 | 用途 |
|------|------|
| `Dockerfile` | 多 target 构建 |
| `docker-compose.yml` | 服务编排 |
| `.env.docker.example` | 环境变量模板 → 复制为 `.env.docker` |

---

## 4. 环境配置

### 4.1 创建 `.env.docker`

在仓库根目录：

```bash
# Linux / macOS
cp .env.docker.example .env.docker

# Windows PowerShell
copy .env.docker.example .env.docker
```

编辑 `.env.docker`，**禁止提交 Git**（已在 `.gitignore`）。

### 4.2 必填与易错项

| 变量 | 说明 |
|------|------|
| `SUPABASE_URL` | **浏览器与 TUS 客户端可访问**的 URL；勿填 `http://api` 等 Docker 内部名 |
| `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_JWT_SECRET` | Dashboard → Project Settings → API |
| `SUPABASE_DB_URL` | API 用；云项目推荐 Transaction pooler **6543** |
| `WORKER_DB_URL` | Worker 用；推荐 Session pooler **5432**（长事务 / FFmpeg 期间更稳） |
| `AI_CREDENTIALS_ENCRYPTION_KEY` | 32 字节随机值 base64；缺失则无法加解密 AI 凭证 |
| `AUTH_INITIAL_PASSWORD` | 内置 admin 初始口令；生产须强口令 |
| `CAPTCHA_PROVIDER=none` | 私有化常见；须同时配置 `LOGIN_IP_ALLOWLIST` |
| `APP_URL` | 用户浏览器入口，如 `http://localhost:3000` 或 `https://lexos.intra.example.com` |

生成 `AI_CREDENTIALS_ENCRYPTION_KEY`：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

完整变量清单见 `architecture.md` §4.2；模板见 `.env.docker.example`、`.env.production.example`。

### 4.3 Compose 自动覆盖的变量

`docker-compose.yml` 会为容器注入部分值，**无需在 `.env.docker` 中写 Docker 内部地址**：

| 服务 | 覆盖项 | 值 |
|------|--------|-----|
| `web` | `API_URL` | `http://api:4000`（Next 服务端反代 U2） |
| `api` | `API_URL` | `http://127.0.0.1:4000`（健康检查 / 监听端口） |
| `worker-pipeline` | `FFMPEG_PATH` / `WORKER_TMP_DIR` | `ffmpeg` / `/tmp/lexos` |

`web` 镜像构建时 `ARG API_URL=http://api:4000`，须与运行时一致。

---

## 5. 首次部署（推荐流程）

在仓库根目录执行。

### 5.1 构建镜像

```bash
docker compose build
# 或仅构建应用服务
docker compose build web api worker-pipeline worker-scheduler
```

首次构建 Web 可能需数分钟。

### 5.2 数据库迁移

```bash
npm run docker:migrate
# 等价：docker compose run --rm migrate
```

成功输出 `Applied migrations:` 或 `No pending migrations.`。

### 5.3 种子管理员（仅首次）

```bash
npm run docker:seed
# 等价：docker compose --profile init run --rm seed-admin
```

依赖 `AUTH_INITIAL_PASSWORD`。若 admin 已存在，命令幂等，可重复执行。

可选：在 Auth 用户已存在时同步 `profiles`：

```bash
docker compose run --rm migrate npm run seed:sql
```

### 5.4 启动四个应用容器

```bash
npm run docker:up
# 等价：docker compose up -d --build
```

### 5.5 验证

```bash
# API 健康
curl http://localhost:4000/health

# Worker FFmpeg（日志中应有 ffmpeg ok）
docker compose logs worker-pipeline | head -30

# 容器状态
docker compose ps
```

浏览器访问 **`APP_URL`**（默认 http://localhost:3000），使用 `admin` / `AUTH_INITIAL_PASSWORD` 登录；首次登录强制改密（PRD §1.4 A3）。

### 5.6 流程图

```
Supabase 就绪
    → docker compose build
    → docker compose run --rm migrate
    → docker compose --profile init run --rm seed-admin   # 仅首次
    → docker compose up -d
    → GET /health + 登录冒烟
```

---

## 6. 日常运维

### 6.1 常用命令

| 操作 | 命令 |
|------|------|
| 启动 | `npm run docker:up` 或 `docker compose up -d` |
| 停止 | `npm run docker:down` 或 `docker compose down` |
| 日志 | `npm run docker:logs` 或 `docker compose logs -f` |
| 单服务日志 | `docker compose logs -f api` |
| 重启单服务 | `docker compose restart worker-pipeline` |
| 重建单镜像 | `docker compose build api && docker compose up -d api` |
| 查看镜像 | `docker compose images` |

### 6.2 版本升级（含数据库变更）

```bash
git pull
docker compose build
npm run docker:migrate
docker compose up -d
```

### 6.3 建议

| 项 | 建议 |
|----|------|
| 日志 | `docker compose logs` 采集 stdout；禁止输出 API Key / 密文 |
| Worker 临时目录 | 使用卷 `worker-tmp`；重启容器数据可清，任务可重试 |
| 并发 | `WORKER_MAX_CONCURRENCY=5`（首期上限，勿擅自提高） |
| 备份 | Postgres 全量 + WAL；Storage 桶由运维定义同步策略 |
| 反向代理 | 生产在 `web` / `api` 前加 Nginx/Caddy，TLS 终止于网关 |

### 6.4 仅重启 Worker（转写异常排查）

```bash
docker compose restart worker-pipeline worker-scheduler
docker compose logs -f worker-pipeline
```

---

## 7. 验收清单

### 7.1 部署后自检

| 检查项 | 命令 / 预期 |
|--------|-------------|
| 四容器运行 | `docker compose ps` → `web` `api` `worker-pipeline` `worker-scheduler` 为 `running` |
| Postgres | `GET /health` → `checks.postgres.ok === true` |
| Storage | `checks.storage.media.ok` 与 `checks.storage.exports.ok` 均为 `true` |
| FFmpeg | `docker compose logs worker-pipeline` 含 `ffmpeg ok:` |
| 登录 | `admin` 可登录并进入强制改密 / 业务壳 |
| 合规扫描 | `npm run test:compliance` |
| 私有化模板 | `npm run check:privatization` |

### 7.2 私有化替代矩阵

对照 `architecture.md` §4.4 逐行勾选（Docker 与裸机部署共用）。

| 能力 | 开发期（云） | 私有化交付 | 验收 |
|------|--------------|------------|:----:|
| Auth | Supabase Auth | GoTrue 自建或内网 Supabase | ☐ |
| Postgres | Supabase DB | 自建 PostgreSQL 15+ | ☐ |
| Storage | Supabase Storage | MinIO / SeaweedFS（S3 API） | ☐ |
| Realtime | 可选 | **默认关闭** `REALTIME_ENABLED=false` | ☐ |
| 异步调度 | Postgres Outbox | 同左（无 Redis） | ☐ |
| 验证码 | Turnstile/Geetest | `CAPTCHA_PROVIDER=none` + `LOGIN_IP_ALLOWLIST` | ☐ |
| ASR/LLM | 公网 API | 内网 HTTP + 控制台配置凭证 | ☐ |

人工 E2E：`E2E_MANUAL_CHECKLIST.md`。

---

## 8. 性能冒烟（可选）

轻量 API 压测（PRD §5.1 · QPS≤10），预发/生产手动执行。

**前置**：`api` 容器已启动；宿主机可访问 `http://localhost:4000`。

```bash
API_URL=http://localhost:4000 \
SMOKE_USERNAME=admin \
SMOKE_PASSWORD=your-password \
node scripts/load/smoke-auth-session.mjs

node scripts/load/smoke-profile.mjs
```

退出码 `0` = 通过。

---

## 9. 故障排查

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| `web` 构建失败 | TypeScript / Next 编译错误 | 宿主机先执行 `npm run build -w @lexos/web` 定位 |
| `migrate` 连不上库 | `SUPABASE_DB_URL` 错误或防火墙 | 从宿主机用 `psql` 或 `npm run verify:supabase` 验证 |
| `/health` storage 失败 | 桶未创建或密钥错误 | 检查迁移是否执行、`STORAGE_BUCKET_*` |
| 登录 CAPTCHA / IP | `CAPTCHA_PROVIDER=none` 但未配白名单 | 设置 `LOGIN_IP_ALLOWLIST` |
| TUS 上传失败 | `SUPABASE_URL` 填了容器内地址 | 改为浏览器可访问的公网/内网 URL |
| Worker 无 FFmpeg | 未使用 `worker-pipeline` 镜像 | 确认 `docker compose build worker-pipeline` |
| 转写不推进 | Worker 未启动或 DB 连接断开 | `docker compose logs worker-pipeline`；检查 `WORKER_DB_URL` |

---

## 附录 A. 裸机部署（无 Docker）

仅在无法使用容器时采用：宿主机安装 **Node.js ≥ 20**、**FFmpeg**，四个进程分别由 systemd / supervisord 托管。

### A.1 环境文件

```bash
cp .env.production.example .env.production
# 填写内网端点；NODE_ENV=production
```

应用通过 `loadLexosRuntimeEnvFiles` 加载 `.env` + `.env.production`（`NODE_ENV=production` 时）。

### A.2 启动顺序

```
1. PostgreSQL + Auth + Storage
2. npm run db:push
3. npm run seed:admin          # 仅首次
4. npm run build:shared
5. npm run build -w @lexos/api && npm run start -w @lexos/api
6. npm run build -w @lexos/web && npm run start -w @lexos/web
7. npm run worker:pipeline
8. npm run scheduler:stalled
```

健康检查与 Docker 部署相同：`GET /health`、Worker 日志 `ffmpeg ok:`。

---

## 9. SOP Worker（U3 · Milestone 14）

SOP 异步阶段与转写共用 **U3 单进程** Outbox 消费者（`worker:pipeline`），无 Redis。

| 环境变量 | 默认 | 说明 |
|----------|------|------|
| `SOP_PDF_MAX_CONCURRENT` | `1` | 无头 PDF 并发上限 |
| `SOP_DEEP_RESEARCH_MAX_CONCURRENT` | `2` | Deep Research 并发上限 |
| `SOP_DEEP_RESEARCH_TIMEOUT_MS` | `1800000` | DR 硬性超时（30min） |
| `SOP_EXTERNAL_SEARCH_PROBE_URL` | （空） | 可选外网 Search 探测 URL；不可达则 LLM-only 降级 |

**Outbox `stage`**：`sop.media.ocr` · `sop.deep_research` · `sop.pdf_export`

**Playwright（PDF 导出）**：Worker 镜像或宿主机需安装 Chromium：

```bash
cd workers/pipeline
npx playwright install chromium
```

PDF 输出桶为 **`exports`**，路径 `{owner_id}/sops/{pipeline_id}/{artifact_id}.pdf`（见 `database.md` §3.16.8）。

---

## 附录 B. npm 脚本速查

| 脚本 | 说明 |
|------|------|
| `npm run docker:build` | `docker compose build` |
| `npm run docker:up` | 构建并后台启动 |
| `npm run docker:down` | 停止并移除容器 |
| `npm run docker:migrate` | 一次性迁移 |
| `npm run docker:seed` | 一次性 admin 种子 |
| `npm run docker:logs` | 跟踪所有服务日志 |

---

## 10. 相关文档

| 文档 / 文件 | 内容 |
|-------------|------|
| `Dockerfile` | 多 target 镜像定义 |
| `docker-compose.yml` | 服务编排 |
| `.env.docker.example` | Docker 环境变量模板 |
| `.env.production.example` | 裸机生产模板 |
| `architecture.md` §4 | 环境变量与私有化矩阵 |
| `OPEN_ISSUES.md` | 待确认项签收 |
| `E2E_MANUAL_CHECKLIST.md` | 人工 E2E 验收 |
