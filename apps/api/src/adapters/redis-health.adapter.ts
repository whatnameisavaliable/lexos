import { createClient, type RedisClientType } from "redis";

/** Redis 健康检查结果。 */
export interface RedisHealthResult {
  readonly ok: boolean;
  readonly latencyMs?: number;
  readonly warning?: string;
}

/**
 * 使用 `REDIS_URL` 探测 Redis（M0-D：失败仅警告，不阻断整体健康）。
 */
export class RedisHealthAdapter {
  /**
   * @param redisUrl - `REDIS_URL`
   */
  constructor(private readonly redisUrl: string) {}

  /**
   * PING Redis；失败时返回 `ok: false` 与 `warning` 文案（不含密钥）。
   */
  async ping(): Promise<RedisHealthResult> {
    const started = Date.now();
    let client: RedisClientType | undefined;

    try {
      client = createClient({ url: this.redisUrl });
      client.on("error", () => undefined);
      await client.connect();
      await client.ping();
      return { ok: true, latencyMs: Date.now() - started };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        latencyMs: Date.now() - started,
        warning: `Redis unreachable: ${message}`,
      };
    } finally {
      await client?.quit().catch(() => undefined);
    }
  }
}
