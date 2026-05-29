/**
 * LexOS Outbox Dispatcher 入口（U2 侧独立进程）。
 *
 * 加载 `.env.development` / `.env`，连接 `OUTBOX_DB_URL`（默认同 `SUPABASE_DB_URL`）
 * 与 `REDIS_URL`，轮询未发布 Outbox 行并投递 BullMQ。
 *
 * 与 API 同机启动：`npm run outbox:dispatcher`（另开终端）。
 */
import {
  loadEnvFiles,
  loadOutboxRuntimeEnvFromProcess,
  resolveRepoRoot,
} from "@lexos/shared/config";
import { OutboxPollerService } from "./src/outbox-poller.service.js";

const repoRoot = resolveRepoRoot();
loadEnvFiles(repoRoot, [".env", ".env.development"]);

const env = loadOutboxRuntimeEnvFromProcess();
const poller = new OutboxPollerService(env);

poller.start();

async function shutdown(signal: string): Promise<void> {
  console.info(`[outbox-dispatcher] received ${signal}, shutting down`);
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
  `[outbox-dispatcher] started (poll=${env.outboxPollIntervalMs}ms, maxAttempts=${env.outboxMaxAttempts})`,
);
