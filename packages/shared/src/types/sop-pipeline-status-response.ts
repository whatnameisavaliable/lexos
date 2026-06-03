import type { CasePipelineStatus } from "../enums/case-pipeline-status.js";
import type { PipelineArtifactStatus } from "../enums/pipeline-artifact-status.js";
import type { SopExecutionType } from "../enums/sop-execution-type.js";

/**
 * 单步骤状态与模板快照（`GET .../pipelines/:id/status` 内 `steps` 元素）。
 */
export interface SopPipelineStepStatusItem {
  readonly stepCode: string;
  readonly name: string;
  readonly executionType: SopExecutionType;
  readonly inputSchema: Record<string, unknown>;
  readonly requiresVerification: boolean;
  readonly artifactStatus: PipelineArtifactStatus | null;
  readonly artifactId: string | null;
}

/**
 * `GET /api/sops/pipelines/:id/status` 成功响应 `data`（`architecture.md` §3.2.6.5）。
 */
export interface SopPipelineStatusResponse {
  readonly pipelineId: string;
  readonly status: CasePipelineStatus;
  readonly currentStepCode: string | null;
  readonly steps: readonly SopPipelineStepStatusItem[];
  /** 律所级 Deep Research 开关（`system_settings.sop.deep_research_enabled`）。 */
  readonly deepResearchEnabled: boolean;
}
