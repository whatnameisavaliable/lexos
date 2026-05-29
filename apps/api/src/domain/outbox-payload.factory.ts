/** BullMQ 首期队列名（`architecture.md` §3.2.1.3）。 */
export const PIPELINE_QUEUE_MEDIA_EXTRACT = "media.extract" as const;
export const PIPELINE_QUEUE_MEDIA_PREPROCESS = "media.preprocess" as const;

/** Outbox `payload` 结构（供 `outbox_dispatcher` 投递 BullMQ）。 */
export interface TranscriptionQueuedOutboxPayload {
  readonly queueName: typeof PIPELINE_QUEUE_MEDIA_EXTRACT | typeof PIPELINE_QUEUE_MEDIA_PREPROCESS;
  readonly taskId: string;
  readonly createdBy: string;
  readonly isMp4: boolean;
}

/** `buildQueuedPayload` 入参。 */
export interface BuildQueuedPayloadInput {
  readonly taskId: string;
  readonly createdBy: string;
  readonly isMp4: boolean;
}

/**
 * 任务入队后首段 Worker 队列载荷（`tasks.md` M4-D · `architecture.md` §3.2.1.3）。
 * MP4 走抽音 `media.extract`；纯音频走 `media.preprocess`。
 */
export function buildQueuedPayload(
  task: BuildQueuedPayloadInput,
): TranscriptionQueuedOutboxPayload {
  const queueName = task.isMp4
    ? PIPELINE_QUEUE_MEDIA_EXTRACT
    : PIPELINE_QUEUE_MEDIA_PREPROCESS;

  return {
    queueName,
    taskId: task.taskId,
    createdBy: task.createdBy,
    isMp4: task.isMp4,
  };
}
