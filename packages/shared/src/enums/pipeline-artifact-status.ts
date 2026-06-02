/**
 * `pipeline_artifact_status` 枚举（`database.md` §3.16.5 · PRD-SOP-15）。
 */
export const PipelineArtifactStatus = {
  RUNNING: "running",
  DRAFT: "draft",
  FAILED: "failed",
  FINALIZED: "finalized",
} as const;

/** 流水线产出物状态。 */
export type PipelineArtifactStatus =
  (typeof PipelineArtifactStatus)[keyof typeof PipelineArtifactStatus];

/** 全部合法 `pipeline_artifact_status` 字面量。 */
export const PIPELINE_ARTIFACT_STATUS_VALUES: readonly PipelineArtifactStatus[] =
  Object.values(PipelineArtifactStatus);

/**
 * 判断字符串是否为合法 {@link PipelineArtifactStatus}。
 */
export function isPipelineArtifactStatus(
  value: string,
): value is PipelineArtifactStatus {
  return PIPELINE_ARTIFACT_STATUS_VALUES.includes(
    value as PipelineArtifactStatus,
  );
}
