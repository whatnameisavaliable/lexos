import { describe, expect, it, vi } from "vitest";
import { PipelineArtifactStatus, createAuthContext } from "@lexos/shared";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { SopArtifactRegeneratePdfService } from "./sop-artifact-regenerate-pdf.service.js";

const mockConnect = vi.fn();
const mockQuery = vi.fn();
const mockRelease = vi.fn();

vi.mock("pg", () => ({
  default: {
    Pool: vi.fn(() => ({
      connect: mockConnect,
    })),
  },
}));

describe("SopArtifactRegeneratePdfService", () => {
  it("rejects draft artifact with 422", async () => {
    const service = new SopArtifactRegeneratePdfService(
      { supabaseDbUrl: "postgres://localhost/db" } as never,
      {
        findArtifactById: vi.fn().mockResolvedValue({
          id: "a1",
          pipelineId: "p1",
          status: PipelineArtifactStatus.DRAFT,
        }),
      } as never,
      { findPipelineForLawyer: vi.fn().mockResolvedValue({ id: "p1", lawyerId: "u1" }) } as never,
      {} as never,
    );
    const actor = createAuthContext({
      userId: "u1",
      role: "lawyer",
      username: "lawyer1",
      requiresPasswordChange: false,
    });
    await expect(service.regenerate(actor, "token", "a1")).rejects.toBeInstanceOf(
      AppHttpError,
    );
  });
});
