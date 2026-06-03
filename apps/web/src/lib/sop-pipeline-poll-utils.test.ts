import { describe, expect, it } from "vitest";
import { SopExecutionType } from "@lexos/shared";
import {
  detectSopArtifactStatusTransitions,
  lawyerSopPipelinePath,
  shouldForceSopPipelinePoll,
  sopArtifactTransitionToastMessage,
} from "./sop-pipeline-poll-utils.js";

describe("shouldForceSopPipelinePoll", () => {
  it("returns true when any step is running", () => {
    expect(
      shouldForceSopPipelinePoll([
        {
          stepCode: "a",
          name: "A",
          executionType: SopExecutionType.MANUAL,
          inputSchema: {},
          requiresVerification: false,
          artifactStatus: "running",
          artifactId: "art-1",
        },
      ]),
    ).toBe(true);
  });
});

describe("detectSopArtifactStatusTransitions", () => {
  it("detects running to draft", () => {
    const prev = [
      {
        stepCode: "a",
        name: "A",
        executionType: SopExecutionType.SYNC_LLM,
        inputSchema: {},
        requiresVerification: false,
        artifactStatus: "running" as const,
        artifactId: "1",
      },
    ];
    const next = [{ ...prev[0]!, artifactStatus: "draft" as const }];
    expect(detectSopArtifactStatusTransitions(prev, next)).toEqual([
      { stepCode: "a", transition: "running_to_draft" },
    ]);
  });
});

describe("sopArtifactTransitionToastMessage", () => {
  it("returns draft completion message", () => {
    expect(sopArtifactTransitionToastMessage("running_to_draft")).toContain(
      "审阅定稿",
    );
  });
});

describe("lawyerSopPipelinePath", () => {
  it("builds pipeline workspace path", () => {
    expect(lawyerSopPipelinePath("pid-1")).toBe("/sops/pipelines/pid-1");
  });
});
