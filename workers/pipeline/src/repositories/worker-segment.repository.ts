import type { PoolClient } from "pg";

/** 写入 `upsert_task_segments` 的片段字段。 */
export interface WorkerSegmentInput {
  readonly segmentIndex: number;
  readonly startMs: number;
  readonly endMs: number;
  readonly chunkSizeBytes?: number;
  readonly localPathHint?: string;
  readonly asrText?: string;
  readonly speakerLabel?: string;
  readonly status?: string;
}

/**
 * Worker 片段批量写入（`database.md` §4.4.2 · `upsert_task_segments`）。
 */
export class WorkerSegmentRepository {
  /**
   * 批量 upsert 任务片段。
   * @returns 写入/更新条数
   */
  async upsertTaskSegments(
    client: PoolClient,
    taskId: string,
    segments: readonly WorkerSegmentInput[],
  ): Promise<number> {
    const payload = segments.map((segment) => ({
      segment_index: segment.segmentIndex,
      start_ms: segment.startMs,
      end_ms: segment.endMs,
      chunk_size_bytes: segment.chunkSizeBytes,
      local_path_hint: segment.localPathHint,
      asr_text: segment.asrText,
      speaker_label: segment.speakerLabel,
      status: segment.status ?? "pending",
    }));

    const result = await client.query<{ upsert_task_segments: number }>(
      `SELECT public.upsert_task_segments($1::uuid, $2::jsonb) AS upsert_task_segments`,
      [taskId, JSON.stringify(payload)],
    );
    const count = result.rows[0]?.upsert_task_segments;
    if (count === undefined) {
      throw new Error("upsert_task_segments returned no count");
    }
    return count;
  }
}
