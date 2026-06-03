import { describe, expect, it } from "vitest";
import { CasePipelineStatus } from "../enums/case-pipeline-status.js";
import { PipelineArtifactStatus } from "../enums/pipeline-artifact-status.js";
import { SopExecutionType } from "../enums/sop-execution-type.js";
import type { SopPipelineStatusResponse } from "./sop-pipeline-status-response.js";

describe("SopPipelineStatusResponse", () => {
  it("constructs status payload with step summaries", () => {
    const response: SopPipelineStatusResponse = {
      pipelineId: "p-1",
      status: CasePipelineStatus.IN_PROGRESS,
      currentStepCode: "01-A",
      deepResearchEnabled: true,
      steps: [
        {
          stepCode: "01-A",
          name: "Entry",
          executionType: SopExecutionType.MANUAL,
          inputSchema: {},
          requiresVerification: false,
          artifactStatus: PipelineArtifactStatus.DRAFT,
          artifactId: "a-1",
        },
        {
          stepCode: "01-B",
          name: "Next",
          executionType: SopExecutionType.SYNC_LLM,
          inputSchema: {},
          requiresVerification: true,
          artifactStatus: null,
          artifactId: null,
        },
      ],
    };
    expect(response.status).toBe("in_progress");
    expect(response.steps[1]?.artifactStatus).toBeNull();
    expect(response.deepResearchEnabled).toBe(true);
  });
});
