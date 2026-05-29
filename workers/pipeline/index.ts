/**
 * LexOS U3 Pipeline Worker 入口（Postgres Outbox · 无 Redis）。
 *
 * 加载 `.env.development` / `.env`，连接 `WORKER_DB_URL`（默认同 `SUPABASE_DB_URL`），
 * 轮询未发布 Outbox 行并按 `payload.stage` 执行流水线（M5-I 注册 Handler）。
 *
 * 与 API 同机启动：`npm run worker:pipeline`（另开终端）。
 */
import {
  loadEnvFiles,
  loadOutboxRuntimeEnvFromProcess,
  resolveRepoRoot,
} from "@lexos/shared/config";
import { OutboxPollerService } from "./src/services/outbox-poller.service.js";

const repoRoot = resolveRepoRoot();
loadEnvFiles(repoRoot, [".env", ".env.development"]);

const env = loadOutboxRuntimeEnvFromProcess();
const poller = new OutboxPollerService(env);

poller.start();

async function shutdown(signal: string): Promise<void> {
  console.info(`[pipeline-worker] received ${signal}, shutting down`);
  await poller.stop();
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

console.info(
  `[pipeline-worker] started (poll=${env.outboxPollIntervalMs}ms, maxAttempts=${env.outboxMaxAttempts})`,
);
