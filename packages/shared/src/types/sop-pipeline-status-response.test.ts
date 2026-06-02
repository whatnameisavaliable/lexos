import { describe, expect, it } from "vitest";
import { CasePipelineStatus } from "../enums/case-pipeline-status.js";
import { PipelineArtifactStatus } from "../enums/pipeline-artifact-status.js";
import type { SopPipelineStatusResponse } from "./sop-pipeline-status-response.js";

describe("SopPipelineStatusResponse", () => {
  it("constructs status payload with step summaries", () => {
    const response: SopPipelineStatusResponse = {
      pipelineId: "p-1",
      status: CasePipelineStatus.IN_PROGRESS,
      currentStepCode: "01-A",
      steps: [
        {
          stepCode: "01-A",
          artifactStatus: PipelineArtifactStatus.DRAFT,
        },
        { stepCode: "01-B", artifactStatus: null },
      ],
    };
    expect(response.status).toBe("in_progress");
    expect(response.steps[1]?.artifactStatus).toBeNull();
  });
});
