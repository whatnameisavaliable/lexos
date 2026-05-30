import type { PoolClient } from "pg";

/** 文稿 upsert 入参。 */
export interface WorkerTranscriptUpsertInput {
  readonly taskId: string;
  readonly asrRawJson?: unknown;
  readonly polishedText?: string;
  readonly summaryText?: string;
}

/**
 * Worker 侧文稿写入（`transcription_transcripts`）。
 */
export class WorkerTranscriptRepository {
  /**
   * 插入或更新任务文稿（Worker 阶段无乐观锁冲突处理）。
   */
  async upsertTranscript(
    client: PoolClient,
    input: WorkerTranscriptUpsertInput,
  ): Promise<void> {
    const result = await client.query(
      `INSERT INTO public.transcription_transcripts (
         task_id,
         asr_raw_json,
         polished_text,
         summary_text,
         updated_at
       ) VALUES (
         $1::uuid,
         $2::jsonb,
         $3,
         $4,
         now()
       )
       ON CONFLICT (task_id) DO UPDATE SET
         asr_raw_json = COALESCE(EXCLUDED.asr_raw_json, public.transcription_transcripts.asr_raw_json),
         polished_text = COALESCE(EXCLUDED.polished_text, public.transcription_transcripts.polished_text),
         summary_text = COALESCE(EXCLUDED.summary_text, public.transcription_transcripts.summary_text),
         updated_at = now()`,
      [
        input.taskId,
        input.asrRawJson ? JSON.stringify(input.asrRawJson) : null,
        input.polishedText ?? null,
        input.summaryText ?? null,
      ],
    );
    if ((result.rowCount ?? 0) < 1) {
      throw new Error("transcription_transcripts.upsert failed");
    }
  }
}
