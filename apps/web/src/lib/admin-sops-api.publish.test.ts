import { describe, expect, it, vi, afterEach } from "vitest";
import { publishAdminSopTemplateVersion } from "./admin-sops-api.js";

describe("publishAdminSopTemplateVersion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs publish and returns version number", async () => {
    const versionId = "00000000-0000-4000-8000-000000000002";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            success: true,
            data: { versionId, versionNumber: 1 },
            meta: { requestId: "r1" },
          }),
      }),
    );

    const result = await publishAdminSopTemplateVersion(versionId);
    expect(result.versionNumber).toBe(1);
  });
});
