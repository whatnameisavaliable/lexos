import { requireEnv } from "./env.js";

/** Storage 桶与操作超时配置（`architecture.md` §4.2.2 · §3.5.2.4）。 */
export interface StorageRuntimeEnvConfig {
  /** 媒体桶名（`STORAGE_BUCKET_MEDIA`）。 */
  readonly storageBucketMedia: string;
  /** 导出桶名（`STORAGE_BUCKET_EXPORTS`）。 */
  readonly storageBucketExports: string;
  /** 签名下载 URL TTL（秒）。 */
  readonly storageSignedUrlTtlSec: number;
  /** Storage SDK 操作超时（毫秒）。 */
  readonly storageOperationTimeoutMs: number;
}

const DEFAULT_STORAGE_SIGNED_URL_TTL_SEC = 300;
const DEFAULT_STORAGE_OPERATION_TIMEOUT_MS = 120_000;

/**
 * 从 `process.env` 加载 Storage 运行时配置。
 */
export function loadStorageRuntimeEnvFromProcess(): StorageRuntimeEnvConfig {
  return {
    storageBucketMedia: requireEnv("STORAGE_BUCKET_MEDIA"),
    storageBucketExports: requireEnv("STORAGE_BUCKET_EXPORTS"),
    storageSignedUrlTtlSec: parsePositiveInt(
      process.env.STORAGE_SIGNED_URL_TTL_SEC,
      DEFAULT_STORAGE_SIGNED_URL_TTL_SEC,
    ),
    storageOperationTimeoutMs: parsePositiveInt(
      process.env.STORAGE_OPERATION_TIMEOUT_MS,
      DEFAULT_STORAGE_OPERATION_TIMEOUT_MS,
    ),
  };
}

function parsePositiveInt(
  raw: string | undefined,
  fallback: number,
): number {
  if (!raw?.trim()) {
    return fallback;
  }
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid positive integer: ${raw}`);
  }
  return value;
}
