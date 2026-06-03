import { isSopPipelineStage } from "../constants/sop-pipeline-stages.js";
import {
  parsePipelineStageOutboxPayload,
  type PipelineStageOutboxPayload,
} from "./pipeline-stage-outbox-payload.js";
import { parseSopOutboxPayload } from "./parse-sop-outbox-payload.js";
import type { SopOutboxPayload } from "./sop-outbox-payload.js";

/** U3 Worker 可消费的 Outbox 载荷联合类型。 */
export type WorkerOutboxPayload = PipelineStageOutboxPayload | SopOutboxPayload;

/**
 * 按 `payload.stage` 分流解析转写或 SOP Outbox 载荷。
 *
 * @param payload - `outbox_events.payload` 原始 JSON
 */
export function parseWorkerOutboxPayload(payload: unknown): WorkerOutboxPayload {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Invalid outbox payload");
  }
  const row = payload as Record<string, unknown>;
  const stageRaw = row.stage ?? row.queueName;
  if (typeof stageRaw !== "string") {
    throw new Error("Invalid outbox payload stage");
  }
  if (isSopPipelineStage(stageRaw)) {
    return parseSopOutboxPayload(payload);
  }
  return parsePipelineStageOutboxPayload(payload);
}
