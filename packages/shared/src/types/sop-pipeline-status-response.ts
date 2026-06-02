import type { CasePipelineStatus } from "../enums/case-pipeline-status.js";
import type { PipelineArtifactStatus } from "../enums/pipeline-artifact-status.js";

/**
 * 单步骤产出物状态摘要（`GET .../pipelines/:id/status` 内 `steps` 元素）。
 */
export interface SopPipelineStepStatusItem {
  readonly stepCode: string;
  readonly artifactStatus: PipelineArtifactStatus | null;
}

/**
 * `GET /api/sops/pipelines/:id/status` 成功响应 `data`（`architecture.md` §3.2.6.5）。
 */
export interface SopPipelineStatusResponse {
  readonly pipelineId: string;
  readonly status: CasePipelineStatus;
  readonly currentStepCode: string | null;
  readonly steps: readonly SopPipelineStepStatusItem[];
}
