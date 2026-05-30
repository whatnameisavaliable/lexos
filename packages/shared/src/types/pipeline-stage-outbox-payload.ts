import {
  PIPELINE_STAGES,
  type PipelineStage,
  isPipelineStage,
} from "../constants/pipeline-stages.js";

/** U3 Worker 消费的 Outbox `payload`（全阶段）。 */
export interface PipelineStageOutboxPayload {
  readonly stage: PipelineStage;
  readonly taskId: string;
  readonly createdBy: string;
  readonly isMp4: boolean;
}

/**
 * 校验 Outbox JSON 载荷是否为可消费的流水线阶段事件。
 */
export function parsePipelineStageOutboxPayload(
  payload: unknown,
): PipelineStageOutboxPayload {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Invalid outbox payload");
  }
  const row = payload as Record<string, unknown>;
  const stageRaw = row.stage ?? row.queueName;
  if (typeof stageRaw !== "string" || !isPipelineStage(stageRaw)) {
    throw new Error(`Unknown stage: ${String(stageRaw)}`);
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
    stage: stageRaw,
    taskId: row.taskId,
    createdBy: row.createdBy,
    isMp4: row.isMp4,
  };
}

/** 全部合法阶段名（测试/文档用）。 */
export const ALL_PIPELINE_STAGES = PIPELINE_STAGES;
