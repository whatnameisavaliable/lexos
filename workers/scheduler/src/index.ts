/**
 * LexOS Stalled 任务补偿 Cron（`architecture.md` §3.6.4.2）。
 */
import {
  loadEnvFiles,
  loadOutboxRuntimeEnvFromProcess,
  resolveRepoRoot,
} from "@lexos/shared/config";
import { createWorkerDbPool } from "../../pipeline/src/infra/worker-db-pool.js";
import { WorkerAuditAdapter } from "../../pipeline/src/adapters/audit/worker-audit.adapter.js";
import { StalledTaskScannerService } from "./stalled-task-scanner.service.js";

const repoRoot = resolveRepoRoot();
loadEnvFiles(repoRoot, [".env", ".env.development"]);

const env = loadOutboxRuntimeEnvFromProcess();
const dbPool = createWorkerDbPool(env);

const DEFAULT_SCAN_INTERVAL_MS = 600_000;
const DEFAULT_STALLED_TIMEOUT_MS = 7_200_000;
const DEFAULT_STALLED_MAX_RETRIES = 3;

const scanner = new StalledTaskScannerService(
  {
    timeoutMs: parsePositiveInt(
      process.env.STALLED_TASK_TIMEOUT_MS,
      DEFAULT_STALLED_TIMEOUT_MS,
    ),
    maxRetries: parsePositiveInt(
      process.env.STALLED_TASK_MAX_RETRIES,
      DEFAULT_STALLED_MAX_RETRIES,
    ),
  },
  new WorkerAuditAdapter(env),
);

let timer: ReturnType<typeof setInterval> | null = null;

async function runScan(): Promise<void> {
  try {
    const recovered = await scanner.scanOnce(dbPool.getPool());
    if (recovered > 0) {
      console.info(`[scheduler:stalled] recovered ${recovered} task(s)`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[scheduler:stalled] scan failed: ${message}`);
  }
}

async function bootstrap(): Promise<void> {
  const intervalMs = parsePositiveInt(
    process.env.STALLED_SCAN_INTERVAL_MS,
    DEFAULT_SCAN_INTERVAL_MS,
  );
  await runScan();
  timer = setInterval(() => {
    void runScan();
  }, intervalMs);
  console.info(`[scheduler:stalled] started (interval=${intervalMs}ms)`);
}

async function shutdown(signal: string): Promise<void> {
  console.info(`[scheduler:stalled] received ${signal}, shutting down`);
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
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
  console.error(`[scheduler:stalled] bootstrap failed: ${message}`);
  process.exit(1);
});

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw?.trim()) {
    return fallback;
  }
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid positive integer: ${raw}`);
  }
  return value;
}
