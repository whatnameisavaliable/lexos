import type { PoolClient } from "pg";

/** `uploads/complete` 阶段任务字段更新。 */
export interface CompleteTaskWriteInput {
  readonly sourceStorageKey: string;
  readonly durationSec?: number | null;
}

/**
 * 转写任务事务内写入（`service_role` 连接上下文内执行）。
 */
export class TranscriptionTaskWriteRepository {
  /**
   * 在 complete 事务内更新源文件键（v1.3 起不再写入 `asr_queue_tier`）。
   */
  async updateForUploadComplete(
    client: PoolClient,
    taskId: string,
    input: CompleteTaskWriteInput,
  ): Promise<void> {
    const result = await client.query(
      `UPDATE public.transcription_tasks
       SET source_storage_key = $2,
           duration_sec = COALESCE($3::integer, duration_sec),
           updated_at = now(),
           last_progress_at = now()
       WHERE id = $1::uuid
         AND deleted_at IS NULL`,
      [taskId, input.sourceStorageKey, input.durationSec ?? null],
    );
    if (result.rowCount !== 1) {
      throw new Error("transcription_tasks.updateForUploadComplete failed");
    }
  }
}
