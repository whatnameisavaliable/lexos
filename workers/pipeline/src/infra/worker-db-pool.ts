import pg from "pg";
import type { WorkerRuntimeEnvConfig } from "@lexos/shared/config";

/** 为 Supabase 云库构建 `pg.Pool` 配置（强制 SSL · 适配 PgBouncer）。 */
export function buildWorkerPgPoolConfig(
  connectionString: string,
): pg.PoolConfig {
  const isRemoteSupabase =
    connectionString.includes("supabase.co") ||
    connectionString.includes("supabase.com");

  const usesTransactionPooler =
    isRemoteSupabase && connectionString.includes(":6543");

  return {
    connectionString,
    max: usesTransactionPooler ? 3 : 5,
    application_name: "lexos-pipeline-worker",
    connectionTimeoutMillis: 15_000,
    idleTimeoutMillis: 60_000,
    keepAlive: true,
    ...(usesTransactionPooler ? { prepare: false } : {}),
    ...(isRemoteSupabase
      ? { ssl: { rejectUnauthorized: false } }
      : {}),
  };
}

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
    this.pool = poolFactory(buildWorkerPgPoolConfig(env.outboxDbUrl));
    this.pool.setMaxListeners(20);
    this.pool.on("error", (error) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[pipeline-worker] pg pool idle error: ${message}`);
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
