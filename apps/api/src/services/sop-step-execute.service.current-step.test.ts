import { describe, expect, it, vi } from "vitest";
import { CasePipelineStatus, createAuthContext, SopExecutionType } from "@lexos/shared";
import { SopStepExecuteService } from "./sop-step-execute.service.js";

describe("SopStepExecuteService current step", () => {
  it("updates case_pipelines.current_step_code after execute", async () => {
    const casePipelineRepository = {
      findPipelineForLawyer: vi.fn().mockResolvedValue({
        id: "p1",
        lawyerId: "u1",
        templateVersionId: "tv1",
        status: CasePipelineStatus.IN_PROGRESS,
      }),
      updateCurrentStepCode: vi.fn().mockResolvedValue({}),
    };
    const service = new SopStepExecuteService(
      { supabaseDbUrl: "postgres://localhost/db" } as never,
      casePipelineRepository as never,
      {
        listStepsByTemplateVersionId: vi.fn().mockResolvedValue([
          { stepCode: "01", dependsOn: [], executionType: SopExecutionType.MANUAL },
        ]),
      } as never,
      {
        findArtifactByStep: vi.fn().mockResolvedValue(null),
        upsertArtifactForStep: vi.fn().mockResolvedValue({ id: "a1" }),
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
    await service.execute(actor, "token", "p1", "01", { formValues: {} });
    expect(casePipelineRepository.updateCurrentStepCode).toHaveBeenCalledWith(
      "token",
      "p1",
      "01",
    );
  });
});
