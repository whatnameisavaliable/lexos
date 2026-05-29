import pg from "pg";

/** Postgres 健康检查结果。 */
export interface PostgresHealthResult {
  readonly ok: boolean;
  readonly latencyMs?: number;
  readonly errorMessage?: string;
}

/**
 * 使用 `SUPABASE_DB_URL` 执行 `SELECT 1` 探测 Postgres。
 */
export class PostgresHealthRepository {
  /**
   * @param connectionString - `SUPABASE_DB_URL`（池化连接串）
   */
  constructor(private readonly connectionString: string) {}

  /**
   * 探测数据库连通性。
   */
  async ping(): Promise<PostgresHealthResult> {
    const started = Date.now();
    const pool = new pg.Pool({
      connectionString: this.connectionString,
      max: 1,
      connectionTimeoutMillis: 5_000,
    });

    try {
      await pool.query("SELECT 1");
      return { ok: true, latencyMs: Date.now() - started };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        latencyMs: Date.now() - started,
        errorMessage: message,
      };
    } finally {
      await pool.end().catch(() => undefined);
    }
  }
}
