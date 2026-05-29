/** BullMQ 首期队列名（`architecture.md` §3.2.1.3）。 */
export const PIPELINE_QUEUE_MEDIA_EXTRACT = "media.extract" as const;
export const PIPELINE_QUEUE_MEDIA_PREPROCESS = "media.preprocess" as const;

/** Outbox `payload` 结构（API 写入 · Dispatcher 读取）。 */
export interface TranscriptionQueuedOutboxPayload {
  readonly queueName:
    | typeof PIPELINE_QUEUE_MEDIA_EXTRACT
    | typeof PIPELINE_QUEUE_MEDIA_PREPROCESS;
  readonly taskId: string;
  readonly createdBy: string;
  readonly isMp4: boolean;
}

/** 已知可投递的 BullMQ 队列名集合。 */
export const KNOWN_PIPELINE_QUEUE_NAMES = [
  PIPELINE_QUEUE_MEDIA_EXTRACT,
  PIPELINE_QUEUE_MEDIA_PREPROCESS,
] as const;

/** `buildQueuedPayload` 入参。 */
export interface BuildQueuedPayloadInput {
  readonly taskId: string;
  readonly createdBy: string;
  readonly isMp4: boolean;
}

/**
 * 任务入队后首段 Worker 队列载荷（`tasks.md` M4-D · `architecture.md` §3.2.1.3）。
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

/**
 * 校验 Outbox JSON 载荷是否为可投递的转写入队事件。
 */
export function parseTranscriptionQueuedOutboxPayload(
  payload: unknown,
): TranscriptionQueuedOutboxPayload {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Invalid outbox payload");
  }
  const row = payload as Record<string, unknown>;
  const queueName = row.queueName;
  if (
    queueName !== PIPELINE_QUEUE_MEDIA_EXTRACT &&
    queueName !== PIPELINE_QUEUE_MEDIA_PREPROCESS
  ) {
    throw new Error(`Unknown queueName: ${String(queueName)}`);
  }
  if (typeof row.taskId !== "string" || row.taskId.length === 0) {
    throw new Error("Invalid outbox payload taskId");
  }
  if (typeof row.createdBy !== "string" || row.createdBy.length === 0) {
    throw new Error("Invalid outbox payload createdBy");
  }
  if (typeof row.isMp4 !== "boolean") {
    throw new Error("Invalid outbox payload isMp4");
  }
  return {
    queueName,
    taskId: row.taskId,
    createdBy: row.createdBy,
    isMp4: row.isMp4,
  };
}
