import { describe, expect, it } from "vitest";
import { SopExecutionType } from "@lexos/shared";
import {
  detectSopArtifactStatusTransitions,
  sopArtifactTransitionToastMessage,
} from "@/lib/sop-pipeline-poll-utils";

describe("LawyerSopPipelineWorkspace status transition", () => {
  it("toast on running to draft", () => {
    const prev = [
      {
        stepCode: "01",
        name: "事实",
        executionType: SopExecutionType.SYNC_LLM,
        inputSchema: {},
        requiresVerification: false,
        artifactStatus: "running" as const,
        artifactId: "a1",
      },
    ];
    const next = [{ ...prev[0]!, artifactStatus: "draft" as const }];
    const transitions = detectSopArtifactStatusTransitions(prev, next);
    expect(
      sopArtifactTransitionToastMessage(transitions[0]!.transition, "事实"),
    ).toContain("审阅定稿");
  });

  it("toast on running to failed", () => {
    const prev = [
      {
        stepCode: "01",
        name: "检索",
        executionType: SopExecutionType.ASYNC_DEEP_RESEARCH,
        inputSchema: {},
        requiresVerification: false,
        artifactStatus: "running" as const,
        artifactId: "a1",
      },
    ];
    const next = [{ ...prev[0]!, artifactStatus: "failed" as const }];
    const transitions = detectSopArtifactStatusTransitions(prev, next);
    expect(
      sopArtifactTransitionToastMessage(transitions[0]!.transition, "检索"),
    ).toContain("失败");
  });
});
