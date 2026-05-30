/** Worker 侧 Outbox 插入行（与 API `OutboxRepository` 对齐）。 */
export interface OutboxInsertRow {
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly eventType: string;
  readonly payload: Readonly<Record<string, unknown>>;
}

/**
 * Worker Outbox 写入（`architecture.md` §3.7）。
 */
export class WorkerOutboxRepository {
  /**
   * 在事务内插入未发布 Outbox 行。
   */
  async insertInTransaction(
    client: import("pg").PoolClient,
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

  /** 标记当前 Outbox 事件已发布。 */
  async markPublished(
    client: import("pg").PoolClient,
    eventId: string,
  ): Promise<void> {
    const result = await client.query(
      `UPDATE public.outbox_events
       SET published_at = now()
       WHERE id = $1::uuid AND published_at IS NULL`,
      [eventId],
    );
    if (result.rowCount !== 1) {
      throw new Error(
        `outbox_events.markPublished unexpected rowCount for ${eventId}`,
      );
    }
  }
}
