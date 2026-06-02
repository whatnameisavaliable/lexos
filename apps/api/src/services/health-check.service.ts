import type { PostgresHealthRepository } from "../repositories/postgres-health.repository.js";
import type { StorageHealthRepository } from "../repositories/storage-health.repository.js";

/** 单项依赖检查结果�?*/
export interface DependencyCheckResult {
  readonly ok: boolean;
  readonly latencyMs?: number;
  readonly errorMessage?: string;
}

/** Storage 桶检查结果（含桶名）�?*/
export interface StorageBucketCheckResult extends DependencyCheckResult {
  readonly bucket: string;
}

/** `/health` 聚合结果�?*/
export interface HealthCheckReport {
  readonly status: "ok" | "unhealthy";
  readonly checks: {
    readonly postgres: DependencyCheckResult;
    readonly storage: {
      readonly media: StorageBucketCheckResult;
      readonly exports: StorageBucketCheckResult;
    };
  };
}

/** Storage 健康仓储最小端口（便于测试注入）�?*/
export interface StorageHealthProbe {
  pingBuckets(): Promise<{
    media: { ok: boolean; bucket: string; latencyMs?: number; errorMessage?: string };
    exports: { ok: boolean; bucket: string; latencyMs?: number; errorMessage?: string };
  }>;
}

/**
 * 聚合 Postgres �?Storage 健康检查（v1.3 起不探测 Redis）�?
 */
export class HealthCheckService {
  constructor(
    private readonly postgresRepository: PostgresHealthRepository,
    private readonly storageRepository: StorageHealthProbe,
  ) {}

  /**
   * 执行健康探测；任一子系统失�?�?`unhealthy`�?
   */
  async runChecks(): Promise<HealthCheckReport> {
    const [postgres, storage] = await Promise.all([
      this.postgresRepository.ping(),
      this.storageRepository.pingBuckets(),
    ]);

    const postgresCheck: DependencyCheckResult = {
      ok: postgres.ok,
      latencyMs: postgres.latencyMs,
      errorMessage: postgres.errorMessage,
    };

    const mediaCheck: StorageBucketCheckResult = {
      ok: storage.media.ok,
      bucket: storage.media.bucket,
      latencyMs: storage.media.latencyMs,
      errorMessage: storage.media.errorMessage,
    };

    const exportsCheck: StorageBucketCheckResult = {
      ok: storage.exports.ok,
      bucket: storage.exports.bucket,
      latencyMs: storage.exports.latencyMs,
      errorMessage: storage.exports.errorMessage,
    };

    const allOk =
      postgres.ok && storage.media.ok && storage.exports.ok;

    return {
      status: allOk ? "ok" : "unhealthy",
      checks: {
        postgres: postgresCheck,
        storage: {
          media: mediaCheck,
          exports: exportsCheck,
        },
      },
    };
  }
}
