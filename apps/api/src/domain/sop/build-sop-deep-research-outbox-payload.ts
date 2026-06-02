import {
  SOP_OUTBOX_AGGREGATE_TYPE,
  SOP_STAGE_DEEP_RESEARCH,
  type SopOutboxPayload,
} from "@lexos/shared";

/** {@link buildSopDeepResearchOutboxPayload} 入参。 */
export interface BuildSopDeepResearchOutboxPayloadInput {
  readonly pipelineId: string;
  readonly stepCode: string;
  readonly artifactId: string;
}

/**
 * 构建 `async_deep_research` 步骤的 Outbox 载荷（`stage=sop.deep_research`）。
 */
export function buildSopDeepResearchOutboxPayload(
  input: BuildSopDeepResearchOutboxPayloadInput,
): SopOutboxPayload {
  return {
    stage: SOP_STAGE_DEEP_RESEARCH,
    pipeline_id: input.pipelineId,
    step_code: input.stepCode,
    artifact_id: input.artifactId,
  };
}

/** Outbox 聚合类型（`case_pipeline`）。 */
export const SOP_CASE_PIPELINE_AGGREGATE_TYPE = SOP_OUTBOX_AGGREGATE_TYPE;
