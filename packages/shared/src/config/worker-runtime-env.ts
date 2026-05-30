import { requireEnv } from "./env.js";
import {
  loadOutboxRuntimeEnvFromProcess,
  type OutboxRuntimeEnvConfig,
} from "./outbox-runtime-env.js";

/** U3 Pipeline Worker 完整运行时配置（`architecture.md` §4.2 · v1.3 无 Redis）。 */
export interface WorkerRuntimeEnvConfig extends OutboxRuntimeEnvConfig {
  /** FFmpeg 可执行路径；默认 `ffmpeg`。 */
  readonly ffmpegPath: string;
  /** 同时处理的转写任务数；默认 5。 */
  readonly workerMaxConcurrency: number;
  /** ASR 全局限流：每分钟最大调用次数；默认 50。 */
  readonly asrRateLimitMax: number;
  /** Worker 本地临时目录；默认 `/tmp/lexos`。 */
  readonly workerTmpDir: string;
  /** FFmpeg 子进程最大并发；默认 2。 */
  readonly ffmpegMaxConcurrent: number;
  /** FFmpeg 单任务超时（毫秒）；默认 3_600_000。 */
  readonly ffmpegTimeoutMs: number;
  /** ASR 物理切片时长（秒）；默认 900。 */
  readonly asrSegmentDurationSec: number;
  /** ASR 单切片最大体积（MB）；默认 20。 */
  readonly asrMaxChunkSizeMb: number;
}

const DEFAULT_FFMPEG_PATH = "ffmpeg";
const DEFAULT_WORKER_MAX_CONCURRENCY = 5;
const DEFAULT_ASR_RATE_LIMIT_MAX = 50;
const DEFAULT_WORKER_TMP_DIR = "/tmp/lexos";
const DEFAULT_FFMPEG_MAX_CONCURRENT = 2;
const DEFAULT_FFMPEG_TIMEOUT_MS = 3_600_000;
const DEFAULT_ASR_SEGMENT_DURATION_SEC = 900;
const DEFAULT_ASR_MAX_CHUNK_SIZE_MB = 20;

/**
 * 从 `process.env` 加载 U3 Worker 配置；校验 DB 连接串与 FFmpeg 路径配置项存在。
 * **不**校验 `REDIS_URL`。
 */
export function loadWorkerRuntimeEnvFromProcess(): WorkerRuntimeEnvConfig {
  const outbox = loadOutboxRuntimeEnvFromProcess();

  const workerDbUrl =
    process.env.WORKER_DB_URL?.trim() ||
    process.env.OUTBOX_DB_URL?.trim() ||
    requireEnv("SUPABASE_DB_URL");

  const ffmpegRaw = process.env.FFMPEG_PATH;
  let ffmpegPath: string;
  if (ffmpegRaw !== undefined) {
    const trimmed = ffmpegRaw.trim();
    if (trimmed.length === 0) {
      throw new Error("FFMPEG_PATH must not be empty");
    }
    ffmpegPath = trimmed;
  } else {
    ffmpegPath = DEFAULT_FFMPEG_PATH;
  }

  return {
    ...outbox,
    outboxDbUrl: workerDbUrl,
    ffmpegPath,
    workerMaxConcurrency: parsePositiveInt(
      process.env.WORKER_MAX_CONCURRENCY,
      DEFAULT_WORKER_MAX_CONCURRENCY,
    ),
    asrRateLimitMax: parsePositiveInt(
      process.env.ASR_RATE_LIMIT_MAX,
      DEFAULT_ASR_RATE_LIMIT_MAX,
    ),
    workerTmpDir: process.env.WORKER_TMP_DIR?.trim() || DEFAULT_WORKER_TMP_DIR,
    ffmpegMaxConcurrent: parsePositiveInt(
      process.env.FFMPEG_MAX_CONCURRENT,
      DEFAULT_FFMPEG_MAX_CONCURRENT,
    ),
    ffmpegTimeoutMs: parsePositiveInt(
      process.env.FFMPEG_TIMEOUT_MS,
      DEFAULT_FFMPEG_TIMEOUT_MS,
    ),
    asrSegmentDurationSec: parsePositiveInt(
      process.env.ASR_SEGMENT_DURATION_SEC,
      DEFAULT_ASR_SEGMENT_DURATION_SEC,
    ),
    asrMaxChunkSizeMb: parsePositiveInt(
      process.env.ASR_MAX_CHUNK_SIZE_MB,
      DEFAULT_ASR_MAX_CHUNK_SIZE_MB,
    ),
  };
}

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
