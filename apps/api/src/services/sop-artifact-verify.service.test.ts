import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { SopArtifactVerifyService } from "./sop-artifact-verify.service.js";

describe("SopArtifactVerifyService", () => {
  it("writes sop.artifact.verify audit log", async () => {
    const auditWriterService = { write: vi.fn().mockResolvedValue("log-1") };
    const service = new SopArtifactVerifyService(
      { findArtifactById: vi.fn().mockResolvedValue({ id: "a1", pipelineId: "p1", stepCode: "01" }) } as never,
      { findPipelineForLawyer: vi.fn().mockResolvedValue({ id: "p1", lawyerId: "u1" }) } as never,
      auditWriterService as never,
    );
    const actor = createAuthContext({
      userId: "u1",
      role: "lawyer",
      username: "lawyer1",
      requiresPasswordChange: false,
    });
    const result = await service.verify(actor, "token", "a1");
    expect(result.verified).toBe(true);
    expect(auditWriterService.write).toHaveBeenCalled();
  });
});
