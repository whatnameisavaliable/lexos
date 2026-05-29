import pg from "pg";

/** `SELECT 1` 探测结果。 */
export interface PostgresSmokeResult {
  readonly ok: boolean;
  readonly latencyMs: number;
  readonly errorMessage?: string;
}

/**
 * 对 `SUPABASE_DB_URL` 执行 `SELECT 1`（M0-D 数据库连通性 smoke）。
 */
export async function probePostgresSelectOne(
  connectionString: string,
): Promise<PostgresSmokeResult> {
  const started = Date.now();
  const pool = new pg.Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 10_000,
  });

  try {
    const result = await pool.query<{ one: number }>("SELECT 1 AS one");
    const ok = result.rows[0]?.one === 1;
    return {
      ok,
      latencyMs: Date.now() - started,
      errorMessage: ok ? undefined : "Unexpected SELECT 1 result",
    };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  } finally {
    await pool.end().catch(() => undefined);
  }
}

/**
 * 断言 Postgres 可达；失败时抛出（用于集成测试 / smoke）。
 */
export async function assertPostgresSelectOne(
  connectionString: string,
): Promise<PostgresSmokeResult> {
  const result = await probePostgresSelectOne(connectionString);
  if (!result.ok) {
    throw new Error(
      `Postgres smoke failed: ${result.errorMessage ?? "unknown error"}`,
    );
  }
  return result;
}
