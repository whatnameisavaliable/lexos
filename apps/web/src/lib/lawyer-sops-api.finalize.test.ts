import { describe, expect, it, vi, afterEach } from "vitest";
import { ApiClientError } from "./api-client.js";
import { finalizeSopStep } from "./lawyer-sops-api.js";

describe("finalizeSopStep", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs finalize on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            success: true,
            data: {
              id: "art-1",
              pipelineId: "p1",
              stepCode: "01",
              contentType: "json",
              contentRaw: "{}",
              version: 2,
              status: "finalized",
              linkedDriveNodeId: null,
              finalizedSnapshotRaw: "{}",
              updatedBy: null,
              updatedAt: "2026-01-01T00:00:00.000Z",
            },
            meta: { requestId: "r1" },
          }),
      }),
    );

    const artifact = await finalizeSopStep("p1", "01");
    expect(artifact.status).toBe("finalized");
  });

  it("throws ApiClientError when not verified (422)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        text: async () =>
          JSON.stringify({
            success: false,
            error: {
              code: "OPERATION_NOT_ALLOWED",
              message: "Verification required",
              requestId: "r2",
            },
          }),
      }),
    );

    await expect(finalizeSopStep("p1", "01")).rejects.toBeInstanceOf(
      ApiClientError,
    );
  });
});
