/**
 * LexOS U3 Pipeline Worker 入口（Postgres Outbox · 无 Redis）。
 *
 * 加载 `.env.development` / `.env`，校验 `WORKER_DB_URL`/`SUPABASE_DB_URL` 与 `FFMPEG_PATH`，
 * 启动前执行 `ffmpeg -version` 健康检查，轮询 Outbox 并按 `payload.stage` 执行流水线。
 *
 * 与 API 同机启动：`npm run worker:pipeline`（另开终端）。
 */
import {
  loadEnvFiles,
  loadWorkerRuntimeEnvFromProcess,
  resolveRepoRoot,
} from "@lexos/shared/config";
import { assertFfmpegAvailable } from "./health/ffmpeg-healthcheck.js";
import { createAsrRateLimiter } from "./infra/asr-rate-limiter.js";
import { getWorkerConcurrencyLimiter } from "./infra/worker-concurrency.js";
import { createWorkerDbPool } from "./infra/worker-db-pool.js";
import { OutboxPollerService } from "./services/outbox-poller.service.js";

const repoRoot = resolveRepoRoot();
loadEnvFiles(repoRoot, [".env", ".env.development"]);

const env = loadWorkerRuntimeEnvFromProcess();
const dbPool = createWorkerDbPool(env);
const taskConcurrency = getWorkerConcurrencyLimiter(env.workerMaxConcurrency);
const asrRateLimiter = createAsrRateLimiter(env.asrRateLimitMax);

const poller = new OutboxPollerService(env, dbPool.getPool());

async function bootstrap(): Promise<void> {
  const ffmpegVersion = await assertFfmpegAvailable(env.ffmpegPath);
  console.info(`[pipeline-worker] ffmpeg ok: ${ffmpegVersion}`);
  console.info(
    `[pipeline-worker] concurrency=${env.workerMaxConcurrency}, asrRateLimit=${env.asrRateLimitMax}/min`,
  );
  void taskConcurrency;
  void asrRateLimiter;
  poller.start();
  console.info(
    `[pipeline-worker] started (poll=${env.outboxPollIntervalMs}ms, maxAttempts=${env.outboxMaxAttempts})`,
  );
}

async function shutdown(signal: string): Promise<void> {
  console.info(`[pipeline-worker] received ${signal}, shutting down`);
  await poller.stop();
  await dbPool.end();
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[pipeline-worker] bootstrap failed: ${message}`);
  process.exit(1);
});
