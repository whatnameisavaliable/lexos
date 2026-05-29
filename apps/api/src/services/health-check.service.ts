import type { PostgresHealthRepository } from "../repositories/postgres-health.repository.js";

/** 单项依赖检查结果。 */
export interface DependencyCheckResult {
  readonly ok: boolean;
  readonly latencyMs?: number;
  readonly errorMessage?: string;
}

/** `/health` 聚合结果。 */
export interface HealthCheckReport {
  readonly status: "ok" | "unhealthy";
  readonly checks: {
    readonly postgres: DependencyCheckResult;
  };
}

/**
 * 聚合 Postgres 健康检查（v1.3 起不探测 Redis）。
 */
export class HealthCheckService {
  constructor(private readonly postgresRepository: PostgresHealthRepository) {}

  /**
   * 执行健康探测；Postgres 失败 → `unhealthy`。
   */
  async runChecks(): Promise<HealthCheckReport> {
    const postgres = await this.postgresRepository.ping();

    const postgresCheck: DependencyCheckResult = {
      ok: postgres.ok,
      latencyMs: postgres.latencyMs,
      errorMessage: postgres.errorMessage,
    };

    const status: HealthCheckReport["status"] = postgres.ok ? "ok" : "unhealthy";

    return {
      status,
      checks: { postgres: postgresCheck },
    };
  }
}
