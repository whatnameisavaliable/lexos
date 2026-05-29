import { requireEnv } from "./env.js";

/** Outbox Dispatcher 运行时配置（`architecture.md` §3.7 · §4.2.4）。 */
export interface OutboxRuntimeEnvConfig {
  /** Postgres 连接串；默认同 `SUPABASE_DB_URL`。 */
  readonly outboxDbUrl: string;
  /** BullMQ Redis 连接串。 */
  readonly redisUrl: string;
  /** 轮询间隔（毫秒）。 */
  readonly outboxPollIntervalMs: number;
  /** 单条事件最大投递尝试次数。 */
  readonly outboxMaxAttempts: number;
  /** Supabase 项目 URL（审计 RPC 用）。 */
  readonly supabaseUrl: string;
  /** Supabase service_role 密钥（审计 RPC 用）。 */
  readonly supabaseServiceRoleKey: string;
}

const DEFAULT_OUTBOX_POLL_INTERVAL_MS = 1000;
const DEFAULT_OUTBOX_MAX_ATTEMPTS = 20;

/**
 * 从 `process.env` 加载 Outbox Dispatcher 配置。
 */
export function loadOutboxRuntimeEnvFromProcess(): OutboxRuntimeEnvConfig {
  const outboxDbUrl =
    process.env.OUTBOX_DB_URL?.trim() || requireEnv("SUPABASE_DB_URL");

  return {
    outboxDbUrl,
    redisUrl: requireEnv("REDIS_URL"),
    outboxPollIntervalMs: parsePositiveInt(
      process.env.OUTBOX_POLL_INTERVAL_MS,
      DEFAULT_OUTBOX_POLL_INTERVAL_MS,
    ),
    outboxMaxAttempts: parsePositiveInt(
      process.env.OUTBOX_MAX_ATTEMPTS,
      DEFAULT_OUTBOX_MAX_ATTEMPTS,
    ),
    supabaseUrl: requireEnv("SUPABASE_URL"),
    supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
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
