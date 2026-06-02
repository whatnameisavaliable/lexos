import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { SopUploadInitService } from "./sop-upload-init.service.js";

describe("SopUploadInitService", () => {
  it("rejects init when pipeline does not belong to actor", async () => {
    const service = new SopUploadInitService(
      {
        findPipelineForLawyer: vi.fn().mockResolvedValue(null),
      } as never,
      {} as never,
      {} as never,
      "media",
    );
    const actor = createAuthContext({
      userId: "lawyer-b",
      role: "lawyer",
      username: "b",
      requiresPasswordChange: false,
    });

    await expect(
      service.init(actor, "token-b", {
        pipelineId: "00000000-0000-4000-8000-000000000101",
        fileName: "evidence.mp3",
        mimeType: "audio/mpeg",
        sizeBytes: 100n,
      }),
    ).rejects.toBeInstanceOf(AppHttpError);
  });
});
