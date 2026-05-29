import type { PoolClient } from "pg";

/** `outbox_events` 插入行（`database.md` §3.15）。 */
export interface OutboxInsertRow {
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly eventType: string;
  readonly payload: Readonly<Record<string, unknown>>;
}

/**
 * Outbox 出站事件写入（仅事务内插入；`architecture.md` §3.7）。
 */
export class OutboxRepository {
  /**
   * 在调用方开启的 Postgres 事务内插入未发布事件。
   * @param client - 事务绑定的 `PoolClient`
   * @param row - 出站事件字段
   * @returns 新行 `id`
   */
  async insertInTransaction(
    client: PoolClient,
    row: OutboxInsertRow,
  ): Promise<string> {
    const result = await client.query<{ id: string }>(
      `INSERT INTO public.outbox_events (
         aggregate_type,
         aggregate_id,
         event_type,
         payload
       ) VALUES ($1, $2::uuid, $3, $4::jsonb)
       RETURNING id`,
      [
        row.aggregateType,
        row.aggregateId,
        row.eventType,
        JSON.stringify(row.payload),
      ],
    );

    const id = result.rows[0]?.id;
    if (!id) {
      throw new Error("outbox_events.insert returned no id");
    }
    return id;
  }
}
