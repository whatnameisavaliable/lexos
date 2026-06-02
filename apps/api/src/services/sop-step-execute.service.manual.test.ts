import { describe, expect, it, vi } from "vitest";
import { CasePipelineStatus, createAuthContext, SopExecutionType } from "@lexos/shared";
import { SopStepExecuteService } from "./sop-step-execute.service.js";

describe("SopStepExecuteService manual", () => {
  it("writes manual artifact as json draft", async () => {
    const artifactRepository = {
      findArtifactByStep: vi.fn().mockResolvedValue(null),
      upsertArtifactForStep: vi.fn().mockResolvedValue({ id: "a1" }),
    };
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
          { stepCode: "01", dependsOn: [], executionType: SopExecutionType.MANUAL },
        ]),
      } as never,
      artifactRepository as never,
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
    const result = await service.execute(actor, "token", "p1", "01", {
      formValues: { a: 1 },
    });
    expect(result.statusCode).toBe(200);
    expect(artifactRepository.upsertArtifactForStep).toHaveBeenCalled();
  });
});
