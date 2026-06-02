import { describe, expect, it, vi } from "vitest";
import { CasePipelineStatus, createAuthContext } from "@lexos/shared";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { SopPipelineResumeService } from "./sop-pipeline-resume.service.js";

describe("SopPipelineResumeService", () => {
  it("resumes suspended pipeline", async () => {
    const repository = {
      findPipelineForLawyer: vi.fn().mockResolvedValue({
        id: "p1",
        lawyerId: "u1",
        status: CasePipelineStatus.SUSPENDED,
      }),
      updatePipelineStatus: vi.fn().mockResolvedValue({
        id: "p1",
        status: CasePipelineStatus.IN_PROGRESS,
      }),
    };
    const service = new SopPipelineResumeService(repository as never);
    const actor = createAuthContext({
      userId: "u1",
      role: "lawyer",
      username: "lawyer1",
      requiresPasswordChange: false,
    });

    const result = await service.resume(actor, "token", "p1");
    expect(result.status).toBe(CasePipelineStatus.IN_PROGRESS);
  });

  it("rejects non-suspended pipeline", async () => {
    const repository = {
      findPipelineForLawyer: vi.fn().mockResolvedValue({
        id: "p1",
        lawyerId: "u1",
        status: CasePipelineStatus.IN_PROGRESS,
      }),
    };
    const service = new SopPipelineResumeService(repository as never);
    const actor = createAuthContext({
      userId: "u1",
      role: "lawyer",
      username: "lawyer1",
      requiresPasswordChange: false,
    });

    await expect(service.resume(actor, "token", "p1")).rejects.toBeInstanceOf(
      AppHttpError,
    );
  });
});
