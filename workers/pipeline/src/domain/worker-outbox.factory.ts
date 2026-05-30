import {
  nextPipelineStage,
  type PipelineStage,
} from "@lexos/shared";
import type { OutboxInsertRow } from "../repositories/worker-outbox.repository.js";

/** 下一阶段 Outbox 载荷字段。 */
export interface PipelineStageOutboxPayload {
  readonly stage: PipelineStage;
  readonly taskId: string;
  readonly createdBy: string;
  readonly isMp4: boolean;
}

/** 构建下一阶段 Outbox 行入参。 */
export interface BuildNextStageOutboxInput {
  readonly currentStage: PipelineStage;
  readonly taskId: string;
  readonly createdBy: string;
  readonly isMp4: boolean;
}

/**
 * 生成下一阶段 Outbox 行（`architecture.md` §3.2.1.4）。
 *
 * @returns 末阶段完成后返回 `null`
 */
export function buildNextStageOutboxRow(
  input: BuildNextStageOutboxInput,
): OutboxInsertRow | null {
  const nextStage = nextPipelineStage(input.currentStage);
  if (!nextStage) {
    return null;
  }

  const payload: PipelineStageOutboxPayload = {
    stage: nextStage,
    taskId: input.taskId,
    createdBy: input.createdBy,
    isMp4: input.isMp4,
  };

  return {
    aggregateType: "transcription_task",
    aggregateId: input.taskId,
    eventType: `task.stage.${nextStage}`,
    payload,
  };
}

/**
 * 非 MP4 任务跳过 `media.extract` 时，直接进入 `media.preprocess`。
 */
export function buildInitialStageOutboxRow(input: {
  readonly taskId: string;
  readonly createdBy: string;
  readonly isMp4: boolean;
}): OutboxInsertRow {
  const stage: PipelineStage = input.isMp4
    ? "media.extract"
    : "media.preprocess";
  const payload: PipelineStageOutboxPayload = {
    stage,
    taskId: input.taskId,
    createdBy: input.createdBy,
    isMp4: input.isMp4,
  };
  return {
    aggregateType: "transcription_task",
    aggregateId: input.taskId,
    eventType: `task.stage.${stage}`,
    payload,
  };
}
