import { describe, expect, it, vi, afterEach } from "vitest";
import { regenerateSopArtifactPdf } from "./lawyer-sops-api.js";

describe("regenerateSopArtifactPdf", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs regenerate-pdf", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            success: true,
            data: { artifactId: "art-1", queued: true },
            meta: { requestId: "r1" },
          }),
      }),
    );

    const result = await regenerateSopArtifactPdf("art-1");
    expect(result.queued).toBe(true);
  });
});
