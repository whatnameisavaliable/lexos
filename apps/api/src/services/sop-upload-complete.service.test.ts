import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { SopUploadCompleteService } from "./sop-upload-complete.service.js";

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

describe("SopUploadCompleteService", () => {
  it("marks session completed and enqueues sop.media.ocr event", async () => {
    mockQuery.mockReset();
    mockConnect.mockResolvedValue({ query: mockQuery, release: mockRelease });
    const uploadSessionRepository = {
      findByIdForOwner: vi.fn().mockResolvedValue({
        id: "sess-1",
        pipelineId: "pipe-1",
        storageKeyPrefix: "u1/sops/pipe-1/",
        completedAt: null,
      }),
      markCompleted: vi.fn().mockResolvedValue(undefined),
    };
    const pipelineRepository = {
      findPipelineForLawyer: vi.fn().mockResolvedValue({
        id: "pipe-1",
        lawyerId: "u1",
        currentStepCode: "01-A",
      }),
    };
    const outboxRepository = {
      insertSopOutboxInTransaction: vi.fn().mockResolvedValue("outbox-1"),
    };
    const service = new SopUploadCompleteService(
      { supabaseDbUrl: "postgres://localhost/db" } as never,
      pipelineRepository as never,
      uploadSessionRepository as never,
      {
        listObjectsByPrefix: vi.fn().mockResolvedValue([
          { name: "u1/sops/pipe-1/evidence.mp3", sizeBytes: 100, mimeType: "audio/mpeg" },
        ]),
      } as never,
      outboxRepository as never,
    );
    const actor = createAuthContext({
      userId: "u1",
      role: "lawyer",
      username: "lawyer1",
      requiresPasswordChange: false,
    });

    const result = await service.complete(actor, "token", {
      uploadSessionId: "sess-1",
    });

    expect(result.status).toBe("queued");
    expect(uploadSessionRepository.markCompleted).toHaveBeenCalled();
    expect(outboxRepository.insertSopOutboxInTransaction).toHaveBeenCalled();
  });
});
