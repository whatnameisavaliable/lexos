import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { SopArtifactGetService } from "./sop-artifact-get.service.js";

describe("SopArtifactGetService", () => {
  it("returns artifact for same lawyer pipeline", async () => {
    const service = new SopArtifactGetService(
      { findArtifactById: vi.fn().mockResolvedValue({ id: "a1", pipelineId: "p1" }) } as never,
      { findPipelineForLawyer: vi.fn().mockResolvedValue({ id: "p1", lawyerId: "u1" }) } as never,
    );
    const actor = createAuthContext({
      userId: "u1",
      role: "lawyer",
      username: "lawyer1",
      requiresPasswordChange: false,
    });
    const row = await service.get(actor, "token", "a1");
    expect(row.id).toBe("a1");
  });
});
