import { requireEnv } from "./env.js";

/** AI 凭证加解密与连通性测试相关环境变量。 */
export interface AiRuntimeEnvConfig {
  /** AES-256 密钥（32 字节，base64 编码）。 */
  readonly aiCredentialsEncryptionKey: Buffer;
  /** 连通性测试超时（毫秒）。 */
  readonly aiTestTimeoutMs: number;
  /** LLM/通用 AI HTTP 默认超时（毫秒）。 */
  readonly aiDefaultTimeoutMs: number;
}

const DEFAULT_AI_TEST_TIMEOUT_MS = 10_000;
const DEFAULT_AI_DEFAULT_TIMEOUT_MS = 60_000;

/**
 * 从 `process.env` 加载 AI 运行时配置。
 */
export function loadAiRuntimeEnvFromProcess(): AiRuntimeEnvConfig {
  const keyB64 = requireEnv("AI_CREDENTIALS_ENCRYPTION_KEY");
  const key = Buffer.from(keyB64, "base64");
  if (key.length !== 32) {
    throw new Error(
      "AI_CREDENTIALS_ENCRYPTION_KEY must decode to exactly 32 bytes (AES-256)",
    );
  }

  const testTimeout = parsePositiveInt(
    process.env.AI_TEST_TIMEOUT_MS,
    DEFAULT_AI_TEST_TIMEOUT_MS,
  );
  const defaultTimeout = parsePositiveInt(
    process.env.AI_DEFAULT_TIMEOUT_MS,
    DEFAULT_AI_DEFAULT_TIMEOUT_MS,
  );

  return {
    aiCredentialsEncryptionKey: key,
    aiTestTimeoutMs: testTimeout,
    aiDefaultTimeoutMs: defaultTimeout,
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
