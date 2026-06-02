import { describe, expect, it, vi } from "vitest";
import { CasePipelineStatus, createAuthContext } from "@lexos/shared";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { SopPipelineCloseService } from "./sop-pipeline-close.service.js";

describe("SopPipelineCloseService", () => {
  it("rejects closing non in_progress pipeline", async () => {
    const repository = {
      findPipelineForLawyer: vi.fn().mockResolvedValue({
        id: "p1",
        lawyerId: "u1",
        status: CasePipelineStatus.SUSPENDED,
      }),
    };
    const service = new SopPipelineCloseService(repository as never);
    const actor = createAuthContext({
      userId: "u1",
      role: "lawyer",
      username: "lawyer1",
      requiresPasswordChange: false,
    });
    await expect(service.close(actor, "token", "p1")).rejects.toBeInstanceOf(
      AppHttpError,
    );
  });
});
