# Lexos 私有化交付包敏感内容扫描

## 目标

`npm run release:sensitive:check` 用于在私有化交付包清单核对之后，对允许进入交付包的源码、脚本、测试、迁移和文档做一次只读敏感内容扫描。

该命令用于发现疑似真实密钥、私钥、数据库连接串、访问令牌，以及本期明确暂缓的真实短信、AI 辅助、新手保护期、新兵引流池和证据矩阵相关线索。第一版只输出本地 Markdown 检查结果，不生成交付包，不读取 `.env.local`，不连接线上 Supabase，不执行迁移，不写入业务数据。

## 使用方式

```bash
npm run release:sensitive:check
```

命令返回：

- 阻断项：疑似真实私钥、带密码的数据库连接串、JWT/Supabase key、OpenAI key、GitHub token、AWS access key 等真实凭据样式。存在阻断项时命令返回非零退出码。
- 人工复核项：源码、脚本或迁移中出现真实短信、AI 辅助、新手保护期、新兵引流池或证据矩阵等本期暂缓能力线索。该类命中不会直接阻断，但交付负责人必须确认只是边界说明、测试占位或扫描规则本身。
- 跳过文件：超过大小限制或不属于文本类型的文件。

## 扫描范围

第一版扫描以下交付允许范围：

- `app`
- `src`
- `scripts`
- `tests`
- `docs`
- `supabase/migrations`
- 根目录配置文件：`package.json`、`package-lock.json`、`next.config.mjs`、`tsconfig.json`、`tailwind.config.ts`、`postcss.config.mjs`、`eslint.config.mjs`、`playwright.config.ts`、`playwright.preview.config.ts`
- `.env.example`

扫描仅处理常见文本文件，单个文件超过 512 KiB 会跳过并列入报告。

## 排除路径

以下路径不会被读取，也不得进入正式交付包：

- `.env`
- `.env.local`
- `.env.production`
- `.env.development`
- `.next`
- `node_modules`
- `reports`
- `backups`
- `ops-logs`
- `playwright-report`
- `test-results`
- `coverage`

`.env.example` 可以进入扫描范围，但只能包含空值或占位说明，不得写入真实密钥、真实连接串或客户资料。

## 交付要求

正式交付前建议按顺序执行：

```bash
npm run release:package:check
npm run release:sensitive:check
```

如果 `release:sensitive:check` 出现阻断项，应先从源码、文档或配置中移除真实敏感值，再重新执行检查。对于人工复核项，应在交付记录中说明命中位置、判断结论和处理人。

## 边界

本扫描不是完整 DLP 系统，也不会替代人工交付复核。它不扫描 `.env.local`、备份目录、报告目录、构建产物和依赖目录；这些路径必须由交付负责人在打包前确认未进入交付包。

本轮不开发真实短信接入、新手保护期、新兵引流池、证据矩阵或 AI 辅助功能。
