import type { PoolClient } from "pg";
import { parseTranscriptionQueuedOutboxPayload } from "@lexos/shared";

/** 待发布的 Outbox 行。 */
export interface OutboxEventRow {
  readonly id: string;
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly eventType: string;
  readonly payload: unknown;
  readonly publishAttempts: number;
}

interface OutboxEventRowDb {
  readonly id: string;
  readonly aggregate_type: string;
  readonly aggregate_id: string;
  readonly event_type: string;
  readonly payload: unknown;
  readonly publish_attempts: number;
}

/**
 * Outbox 表读写（Dispatcher 专用；`service_role` 连接）。
 */
export class OutboxEventRepository {
  /**
   * 锁定并拉取未发布事件（`FOR UPDATE SKIP LOCKED`）。
   */
  async fetchUnpublishedBatch(
    client: PoolClient,
    maxAttempts: number,
    limit = 20,
  ): Promise<OutboxEventRow[]> {
    const result = await client.query<OutboxEventRowDb>(
      `SELECT id, aggregate_type, aggregate_id, event_type, payload, publish_attempts
       FROM public.outbox_events
       WHERE published_at IS NULL
         AND publish_attempts < $1
       ORDER BY created_at ASC
       LIMIT $2
       FOR UPDATE SKIP LOCKED`,
      [maxAttempts, limit],
    );

    return result.rows.map(mapOutboxRow);
  }

  /** 标记事件已发布。 */
  async markPublished(client: PoolClient, eventId: string): Promise<void> {
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

  /** 递增投递失败次数。 */
  async incrementPublishAttempts(
    client: PoolClient,
    eventId: string,
  ): Promise<number> {
    const result = await client.query<{ publish_attempts: number }>(
      `UPDATE public.outbox_events
       SET publish_attempts = publish_attempts + 1
       WHERE id = $1::uuid
       RETURNING publish_attempts`,
      [eventId],
    );
    const attempts = result.rows[0]?.publish_attempts;
    if (attempts === undefined) {
      throw new Error(
        `outbox_events.incrementPublishAttempts failed for ${eventId}`,
      );
    }
    return attempts;
  }

  /** 解析 Outbox JSON 载荷。 */
  parsePipelinePayload(payload: unknown) {
    return parseTranscriptionQueuedOutboxPayload(payload);
  }
}

function mapOutboxRow(row: OutboxEventRowDb): OutboxEventRow {
  return {
    id: row.id,
    aggregateType: row.aggregate_type,
    aggregateId: row.aggregate_id,
    eventType: row.event_type,
    payload: row.payload,
    publishAttempts: row.publish_attempts,
  };
}
