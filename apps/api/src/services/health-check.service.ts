import type { RedisHealthAdapter } from "../adapters/redis-health.adapter.js";
import type { PostgresHealthRepository } from "../repositories/postgres-health.repository.js";

/** 单项依赖检查结果。 */
export interface DependencyCheckResult {
  readonly ok: boolean;
  readonly latencyMs?: number;
  readonly errorMessage?: string;
  readonly warning?: string;
}

/** `/health` 聚合结果。 */
export interface HealthCheckReport {
  readonly status: "ok" | "degraded" | "unhealthy";
  readonly checks: {
    readonly postgres: DependencyCheckResult;
    readonly redis: DependencyCheckResult;
  };
}

/**
 * 聚合 Postgres（必达）与 Redis（可降级警告）健康检查。
 */
export class HealthCheckService {
  constructor(
    private readonly postgresRepository: PostgresHealthRepository,
    private readonly redisAdapter: RedisHealthAdapter,
  ) {}

  /**
   * 执行健康探测；Postgres 失败 → `unhealthy`，仅 Redis 失败 → `degraded`。
   */
  async runChecks(): Promise<HealthCheckReport> {
    const [postgres, redis] = await Promise.all([
      this.postgresRepository.ping(),
      this.redisAdapter.ping(),
    ]);

    const postgresCheck: DependencyCheckResult = {
      ok: postgres.ok,
      latencyMs: postgres.latencyMs,
      errorMessage: postgres.errorMessage,
    };

    const redisCheck: DependencyCheckResult = {
      ok: redis.ok,
      latencyMs: redis.latencyMs,
      warning: redis.warning,
    };

    let status: HealthCheckReport["status"] = "ok";
    if (!postgres.ok) {
      status = "unhealthy";
    } else if (!redis.ok) {
      status = "degraded";
    }

    return {
      status,
      checks: { postgres: postgresCheck, redis: redisCheck },
    };
  }
}
