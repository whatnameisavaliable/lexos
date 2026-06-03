import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { SopPipelineStatusService } from "./sop-pipeline-status.service.js";

describe("SopPipelineStatusService", () => {
  it("throws AUTH_FORBIDDEN when lawyer cannot access pipeline", async () => {
    const casePipelineRepository = {
      findPipelineForLawyer: vi.fn().mockResolvedValue(null),
    };
    const service = new SopPipelineStatusService(
      casePipelineRepository as never,
      {} as never,
      {} as never,
      { isDeepResearchEnabled: vi.fn().mockResolvedValue(true) } as never,
    );
    const actor = createAuthContext({
      userId: "u1",
      role: "lawyer",
      username: "lawyer1",
      requiresPasswordChange: false,
    });

    await expect(service.getStatus(actor, "token", "pipeline-1")).rejects.toBeInstanceOf(
      AppHttpError,
    );
  });
});
