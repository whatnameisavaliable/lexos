import pg from "pg";
import type { WorkerRuntimeEnvConfig } from "@lexos/shared/config";

/** U3 Worker Postgres 连接池（`architecture.md` §3.5.4.2）。 */
export class WorkerDbPool {
  private readonly pool: pg.Pool;

  /**
   * @param env - Worker 运行时配置（使用 `outboxDbUrl` / `WORKER_DB_URL`）
   * @param poolFactory - 可注入 Pool 工厂（测试用）
   */
  constructor(
    env: Pick<WorkerRuntimeEnvConfig, "outboxDbUrl">,
    poolFactory: (options: pg.PoolConfig) => pg.Pool = (options) =>
      new pg.Pool(options),
  ) {
    this.pool = poolFactory({
      connectionString: env.outboxDbUrl,
      max: 10,
      application_name: "lexos-pipeline-worker",
    });
  }

  /** 底层 `pg.Pool` 实例。 */
  getPool(): pg.Pool {
    return this.pool;
  }

  /** 优雅关闭连接池。 */
  async end(): Promise<void> {
    await this.pool.end();
  }
}

/**
 * 创建 Worker 数据库连接池。
 */
export function createWorkerDbPool(
  env: Pick<WorkerRuntimeEnvConfig, "outboxDbUrl">,
): WorkerDbPool {
  return new WorkerDbPool(env);
}
