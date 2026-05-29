/** 流水线首阶段名（`architecture.md` §3.2.1.3 · `database.md` v1.4）。 */
export const PIPELINE_STAGE_MEDIA_EXTRACT = "media.extract" as const;
export const PIPELINE_STAGE_MEDIA_PREPROCESS = "media.preprocess" as const;

/** @deprecated M5-K 前保留；请使用 `PIPELINE_STAGE_*`。 */
export const PIPELINE_QUEUE_MEDIA_EXTRACT = PIPELINE_STAGE_MEDIA_EXTRACT;
/** @deprecated M5-K 前保留；请使用 `PIPELINE_STAGE_*`。 */
export const PIPELINE_QUEUE_MEDIA_PREPROCESS = PIPELINE_STAGE_MEDIA_PREPROCESS;

/** 首期 Outbox 入队阶段（complete 后首段 Handler）。 */
export type TranscriptionQueuedStage =
  | typeof PIPELINE_STAGE_MEDIA_EXTRACT
  | typeof PIPELINE_STAGE_MEDIA_PREPROCESS;

/** Outbox `payload` 结构（API 写入 · U3 Worker 读取）。 */
export interface TranscriptionQueuedOutboxPayload {
  /** 逻辑阶段名（v1.3 主字段）。 */
  readonly stage: TranscriptionQueuedStage;
  readonly taskId: string;
  readonly createdBy: string;
  readonly isMp4: boolean;
  /**
   * @deprecated v1.3 起使用 `stage`；M5-K 后删除。
   * 只读别名，与 `stage` 同值。
   */
  readonly queueName: TranscriptionQueuedStage;
}

/** 已知可消费的入队阶段集合。 */
export const KNOWN_PIPELINE_STAGES = [
  PIPELINE_STAGE_MEDIA_EXTRACT,
  PIPELINE_STAGE_MEDIA_PREPROCESS,
] as const;

/** @deprecated 使用 `KNOWN_PIPELINE_STAGES`。 */
export const KNOWN_PIPELINE_QUEUE_NAMES = KNOWN_PIPELINE_STAGES;

/** `buildQueuedPayload` 入参。 */
export interface BuildQueuedPayloadInput {
  readonly taskId: string;
  readonly createdBy: string;
  readonly isMp4: boolean;
}

/**
 * 任务入队后首段 Worker 载荷（`tasks.md` M4-D · `architecture.md` §3.2.1.3）。
 */
export function buildQueuedPayload(
  task: BuildQueuedPayloadInput,
): TranscriptionQueuedOutboxPayload {
  const stage: TranscriptionQueuedStage = task.isMp4
    ? PIPELINE_STAGE_MEDIA_EXTRACT
    : PIPELINE_STAGE_MEDIA_PREPROCESS;

  return {
    stage,
    queueName: stage,
    taskId: task.taskId,
    createdBy: task.createdBy,
    isMp4: task.isMp4,
  };
}

function resolveStageFromPayload(row: Record<string, unknown>): TranscriptionQueuedStage {
  const stageRaw = row.stage ?? row.queueName;
  if (
    stageRaw !== PIPELINE_STAGE_MEDIA_EXTRACT &&
    stageRaw !== PIPELINE_STAGE_MEDIA_PREPROCESS
  ) {
    throw new Error(`Unknown stage: ${String(stageRaw)}`);
  }
  return stageRaw;
}

/**
 * 校验 Outbox JSON 载荷是否为可消费的转写入队事件。
 */
export function parseTranscriptionQueuedOutboxPayload(
  payload: unknown,
): TranscriptionQueuedOutboxPayload {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Invalid outbox payload");
  }
  const row = payload as Record<string, unknown>;
  const stage = resolveStageFromPayload(row);
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
    stage,
    queueName: stage,
    taskId: row.taskId,
    createdBy: row.createdBy,
    isMp4: row.isMp4,
  };
}
