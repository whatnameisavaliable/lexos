import { describe, expect, it, vi, afterEach } from "vitest";
import { getAdminSopTemplateVersion } from "./admin-sops-api.js";

describe("getAdminSopTemplateVersion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("GETs version detail by id", async () => {
    const versionId = "00000000-0000-4000-8000-000000000002";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            success: true,
            data: {
              versionId,
              templateId: "00000000-0000-4000-8000-000000000001",
              templateName: "模板",
              caseType: "civil",
              versionNumber: 1,
              isPublished: false,
              publishedAt: null,
              createdAt: "2026-01-01T00:00:00.000Z",
              steps: [],
            },
            meta: { requestId: "r1" },
          }),
      }),
    );

    const detail = await getAdminSopTemplateVersion(versionId);
    expect(detail.versionId).toBe(versionId);
  });
});
