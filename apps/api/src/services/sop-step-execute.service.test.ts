import { describe, expect, it, vi } from "vitest";
import { CasePipelineStatus, createAuthContext, SopExecutionType } from "@lexos/shared";
import { SopStepExecuteService } from "./sop-step-execute.service.js";

describe("SopStepExecuteService", () => {
  it("rejects when dependency artifact not finalized", async () => {
    const service = new SopStepExecuteService(
      { supabaseDbUrl: "postgres://localhost/db" } as never,
      {
        findPipelineForLawyer: vi.fn().mockResolvedValue({
          id: "p1",
          lawyerId: "u1",
          templateVersionId: "tv1",
          status: CasePipelineStatus.IN_PROGRESS,
        }),
        updateCurrentStepCode: vi.fn(),
      } as never,
      {
        listStepsByTemplateVersionId: vi.fn().mockResolvedValue([
          { stepCode: "02", dependsOn: ["01"], executionType: SopExecutionType.MANUAL },
        ]),
      } as never,
      {
        findArtifactByStep: vi.fn().mockResolvedValue({ status: "draft" }),
      } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
    const actor = createAuthContext({
      userId: "u1",
      role: "lawyer",
      username: "lawyer1",
      requiresPasswordChange: false,
    });

    await expect(
      service.execute(actor, "token", "p1", "02", { formValues: {} }),
    ).rejects.toMatchObject({ code: "OPERATION_NOT_ALLOWED" });
  });
});
