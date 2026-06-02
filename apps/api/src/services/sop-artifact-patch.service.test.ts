import { describe, expect, it, vi } from "vitest";
import { PipelineArtifactStatus, createAuthContext } from "@lexos/shared";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { SopArtifactPatchService } from "./sop-artifact-patch.service.js";

describe("SopArtifactPatchService", () => {
  it("throws RESOURCE_CONFLICT when version is stale", async () => {
    const service = new SopArtifactPatchService(
      {
        findArtifactById: vi.fn().mockResolvedValue({
          id: "a1",
          pipelineId: "p1",
          status: PipelineArtifactStatus.DRAFT,
        }),
        patchContentRaw: vi.fn().mockResolvedValue(null),
      } as never,
      { findPipelineForLawyer: vi.fn().mockResolvedValue({ id: "p1", lawyerId: "u1" }) } as never,
    );
    const actor = createAuthContext({
      userId: "u1",
      role: "lawyer",
      username: "lawyer1",
      requiresPasswordChange: false,
    });
    await expect(
      service.patch(actor, "token", "a1", "2", { contentRaw: "x" }),
    ).rejects.toBeInstanceOf(AppHttpError);
  });
});
