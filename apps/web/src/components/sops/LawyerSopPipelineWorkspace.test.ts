import { describe, expect, it } from "vitest";
import { shouldForceSopPipelinePoll } from "@/lib/sop-pipeline-poll-utils";
import { SopExecutionType } from "@lexos/shared";

describe("LawyerSopPipelineWorkspace", () => {
  it("forces poll when a step is running", () => {
    expect(
      shouldForceSopPipelinePoll([
        {
          stepCode: "01",
          name: "S",
          executionType: SopExecutionType.SYNC_LLM,
          inputSchema: {},
          requiresVerification: false,
          artifactStatus: "running",
          artifactId: "a1",
        },
      ]),
    ).toBe(true);
  });
});
