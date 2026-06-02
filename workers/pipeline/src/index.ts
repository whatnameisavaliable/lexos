/**
 * LexOS U3 Pipeline Worker 入口（Postgres Outbox · 无 Redis）。
 *
 * 加载 `.env.development` / `.env`，校验 `WORKER_DB_URL`/`SUPABASE_DB_URL` 与 `FFMPEG_PATH`，
 * 启动前执行 `ffmpeg -version` 健康检查，轮询 Outbox 并按 `payload.stage` 执行流水线。
 *
 * 与 API 同机启动：`npm run worker:pipeline`（另开终端）。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  describeDatabaseEndpoint,
  loadLexosRuntimeEnvFiles,
  loadWorkerRuntimeEnvFromProcess,
  resolveRepoRoot,
} from "@lexos/shared/config";
import {
  formatWorkerHealthLogLine,
  runWorkerHealthCheck,
} from "./health/worker-health.js";
import { isSafeFfmpegPathOrFileArg } from "./adapters/ffmpeg/ffmpeg.runner.js";
import { assertWorkerDatabaseReachable } from "./infra/assert-worker-database.js";
import { createAsrRateLimiter } from "./infra/asr-rate-limiter.js";
import { getWorkerConcurrencyLimiter } from "./infra/worker-concurrency.js";
import { createWorkerDbPool } from "./infra/worker-db-pool.js";
import { OutboxPollerService } from "./services/outbox-poller.service.js";
import { createPipelineStageProcessor } from "./bootstrap/create-pipeline-deps.js";

/** 优先从 worker 包位置定位 monorepo 根目录（npm -w 时 cwd 常为 workers/pipeline）。 */
function resolvePipelineRepoRoot(): string {
  const fromModule = resolveRepoRoot(
    path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", ".."),
  );
  if (fs.existsSync(path.join(fromModule, ".env.development"))) {
    return fromModule;
  }
  return resolveRepoRoot();
}

const repoRoot = resolvePipelineRepoRoot();
loadLexosRuntimeEnvFiles(repoRoot);

const env = loadWorkerRuntimeEnvFromProcess();
const dbEndpoint = describeDatabaseEndpoint(env.outboxDbUrl);
const dbPool = createWorkerDbPool(env);
const taskConcurrency = getWorkerConcurrencyLimiter(env.workerMaxConcurrency);
const asrRateLimiter = createAsrRateLimiter(env.asrRateLimitMax);
const stageProcessor = createPipelineStageProcessor(env);

const poller = new OutboxPollerService(env, dbPool.getPool(), stageProcessor);

async function bootstrap(): Promise<void> {
  const healthReport = await runWorkerHealthCheck(env.ffmpegPath);
  console.info(formatWorkerHealthLogLine(healthReport));
  if (healthReport.status !== "ok") {
    throw new Error(
      `Worker health check failed: ${healthReport.checks.ffmpeg.errorMessage ?? "unknown"}`,
    );
  }
  const ffmpegVersion = healthReport.checks.ffmpeg.versionLine ?? "unknown";
  console.info(`[pipeline-worker] ffmpeg ok: ${ffmpegVersion}`);
  const segmentTemplateProbe = path.join(
    env.workerTmpDir,
    "probe",
    "segment_%03d.mp3",
  );
  if (!isSafeFfmpegPathOrFileArg(segmentTemplateProbe)) {
    throw new Error(
      `FFmpeg path validation rejects segment templates: ${segmentTemplateProbe}`,
    );
  }
  console.info(
    "[pipeline-worker] ffmpeg path validation ok (segment_%03d allowed)",
  );
  console.info(`[pipeline-worker] database ${dbEndpoint}`);
  if (env.outboxDbUrl.includes(":6543")) {
    console.warn(
      "[pipeline-worker] using transaction pooler :6543 — set WORKER_DB_URL to Session pooler :5432 in .env.development to avoid disconnects during FFmpeg",
    );
  }
  await assertWorkerDatabaseReachable(dbPool.getPool());
  console.info("[pipeline-worker] database ok");
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
