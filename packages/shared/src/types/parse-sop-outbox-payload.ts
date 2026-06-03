import { isSopPipelineStage } from "../constants/sop-pipeline-stages.js";
import {
  SOP_STAGE_DEEP_RESEARCH,
  SOP_STAGE_PDF_EXPORT,
} from "../constants/sop-pipeline-stages.js";
import type { SopOutboxPayload } from "./sop-outbox-payload.js";

function readNonEmptyString(
  row: Record<string, unknown>,
  snakeKey: string,
  camelKey: string,
): string | undefined {
  const raw = row[snakeKey] ?? row[camelKey];
  if (raw === undefined) {
    return undefined;
  }
  if (typeof raw !== "string" || raw.length === 0) {
    throw new Error(`Invalid outbox payload ${snakeKey}`);
  }
  return raw;
}

function requireNonEmptyString(
  row: Record<string, unknown>,
  snakeKey: string,
  camelKey: string,
): string {
  const value = readNonEmptyString(row, snakeKey, camelKey);
  if (value === undefined) {
    throw new Error(`Invalid outbox payload ${snakeKey}`);
  }
  return value;
}

/**
 * 校验 Outbox JSON 载荷是否为可消费的 SOP 流水线阶段事件。
 *
 * @param payload - `outbox_events.payload` 原始 JSON
 * @returns 规范化后的 {@link SopOutboxPayload}
 * @throws 必填字段缺失或 stage 非法时抛错
 */
export function parseSopOutboxPayload(payload: unknown): SopOutboxPayload {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Invalid outbox payload");
  }

  const row = payload as Record<string, unknown>;
  const stageRaw = row.stage ?? row.queueName;
  if (typeof stageRaw !== "string" || !isSopPipelineStage(stageRaw)) {
    throw new Error(`Unknown SOP stage: ${String(stageRaw)}`);
  }

  const pipeline_id = requireNonEmptyString(row, "pipeline_id", "pipelineId");
  const step_code = requireNonEmptyString(row, "step_code", "stepCode");
  const lawyer_id = readNonEmptyString(row, "lawyer_id", "lawyerId");
  const artifact_id = readNonEmptyString(row, "artifact_id", "artifactId");
  const storage_key_prefix = readNonEmptyString(
    row,
    "storage_key_prefix",
    "storageKeyPrefix",
  );
  const upload_session_id = readNonEmptyString(
    row,
    "upload_session_id",
    "uploadSessionId",
  );

  if (
    (stageRaw === SOP_STAGE_DEEP_RESEARCH ||
      stageRaw === SOP_STAGE_PDF_EXPORT) &&
    artifact_id === undefined
  ) {
    throw new Error("Invalid outbox payload artifact_id");
  }

  return {
    stage: stageRaw,
    pipeline_id,
    step_code,
    ...(lawyer_id !== undefined ? { lawyer_id } : {}),
    ...(artifact_id !== undefined ? { artifact_id } : {}),
    ...(storage_key_prefix !== undefined ? { storage_key_prefix } : {}),
    ...(upload_session_id !== undefined ? { upload_session_id } : {}),
  };
}
