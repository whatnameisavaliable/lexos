import { describe, expect, it, vi } from "vitest";
import { CasePipelineStatus, createAuthContext } from "@lexos/shared";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { SopStepFinalizeService } from "./sop-step-finalize.service.js";

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

describe("SopStepFinalizeService", () => {
  it("throws 422 when requires verification but none exists", async () => {
    const service = new SopStepFinalizeService(
      { supabaseDbUrl: "postgres://localhost/db" } as never,
      {
        findPipelineForLawyer: vi.fn().mockResolvedValue({
          id: "p1",
          lawyerId: "u1",
          templateVersionId: "tv1",
          status: CasePipelineStatus.IN_PROGRESS,
        }),
      } as never,
      {
        listStepsByTemplateVersionId: vi.fn().mockResolvedValue([
          { stepCode: "01", requiresVerification: true },
        ]),
      } as never,
      { findArtifactByStep: vi.fn().mockResolvedValue({ id: "a1" }) } as never,
      {
        hasAutoVerification: vi.fn().mockResolvedValue(false),
        hasManualVerification: vi.fn().mockResolvedValue(false),
      } as never,
      {} as never,
    );
    const actor = createAuthContext({
      userId: "u1",
      role: "lawyer",
      username: "lawyer1",
      requiresPasswordChange: false,
    });
    await expect(service.finalize(actor, "token", "p1", "01")).rejects.toBeInstanceOf(
      AppHttpError,
    );
  });
});
