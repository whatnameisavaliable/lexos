import type { Pool } from "pg";
import { withPgClient } from "./with-pg-client.js";

/** 启动前探测 Postgres（失败则立即退出并给出明确错误）。 */
export async function assertWorkerDatabaseReachable(pool: Pool): Promise<void> {
  await withPgClient(pool, async (client) => {
    await client.query("SELECT 1 AS ok");
    await client.query("BEGIN");
    try {
      await client.query(
        `SELECT id FROM public.outbox_events
         WHERE published_at IS NULL
         LIMIT 1`,
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    }
  });
}
