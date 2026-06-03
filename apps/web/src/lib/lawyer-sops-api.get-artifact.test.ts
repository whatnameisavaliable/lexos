import { describe, expect, it, vi, afterEach } from "vitest";
import { getSopArtifact } from "./lawyer-sops-api.js";

describe("getSopArtifact", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("GETs artifact by id", async () => {
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
              contentType: "html",
              contentRaw: "<p>x</p>",
              version: 1,
              status: "draft",
              linkedDriveNodeId: null,
              finalizedSnapshotRaw: null,
              updatedBy: null,
              updatedAt: "2026-01-01T00:00:00.000Z",
            },
            meta: { requestId: "r1" },
          }),
      }),
    );

    const artifact = await getSopArtifact("art-1");
    expect(artifact.contentType).toBe("html");
  });
});
