import { describe, expect, it, vi, afterEach } from "vitest";
import { createAdminSopTemplateVersion } from "./admin-sops-api.js";

describe("createAdminSopTemplateVersion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs new draft version", async () => {
    const templateId = "00000000-0000-4000-8000-000000000001";
    const newVersionId = "00000000-0000-4000-8000-000000000003";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        text: async () =>
          JSON.stringify({
            success: true,
            data: { versionId: newVersionId },
            meta: { requestId: "r1" },
          }),
      }),
    );

    const result = await createAdminSopTemplateVersion(templateId);
    expect(result.versionId).toBe(newVersionId);
  });
});
