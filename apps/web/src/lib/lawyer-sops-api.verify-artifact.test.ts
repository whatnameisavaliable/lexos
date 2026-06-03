import { describe, expect, it, vi, afterEach } from "vitest";
import { verifySopArtifact } from "./lawyer-sops-api.js";

describe("verifySopArtifact", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs verify", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            success: true,
            data: { artifactId: "art-1", verified: true },
            meta: { requestId: "r1" },
          }),
      }),
    );

    const result = await verifySopArtifact("art-1");
    expect(result.verified).toBe(true);
  });
});
