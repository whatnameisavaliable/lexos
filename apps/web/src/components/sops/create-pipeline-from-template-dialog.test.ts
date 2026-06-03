import { describe, expect, it } from "vitest";
import { lawyerSopPipelinePath } from "@/lib/sop-pipeline-poll-utils";

describe("CreatePipelineFromTemplateDialog", () => {
  it("navigates to pipeline workspace after create", () => {
    expect(lawyerSopPipelinePath("p1")).toBe("/sops/pipelines/p1");
  });
});
