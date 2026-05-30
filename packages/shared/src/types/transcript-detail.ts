/**
 * `GET /api/transcription/tasks/:id/transcript` 响应体（`tasks.md` M6-A · `architecture.md` §6.5）。
 */
export interface TranscriptDetail {
  readonly taskId: string;
  /** ASR 原始 JSON（校对模式只读数据源）。 */
  readonly asrRawJson: unknown | null;
  /** LLM 润色文稿（编辑模式唯一可写字段）。 */
  readonly polishedText: string | null;
  /** LLM 法律摘要。 */
  readonly summaryText: string | null;
  /** 乐观锁版本（PATCH `If-Match`）。 */
  readonly version: number;
  /** 来自关联任务的 Diarization 降级标记（`prd.md` §4.3）。 */
  readonly diarizationDegraded: boolean;
  readonly updatedAt: string;
}
