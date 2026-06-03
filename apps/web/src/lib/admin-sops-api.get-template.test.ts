import { describe, expect, it, vi, afterEach } from "vitest";
import { getAdminSopTemplate } from "./admin-sops-api.js";

describe("getAdminSopTemplate", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("GETs template detail by id", async () => {
    const templateId = "00000000-0000-4000-8000-000000000001";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            success: true,
            data: {
              templateId,
              name: "模板",
              caseType: "civil",
              createdAt: "2026-01-01T00:00:00.000Z",
              versions: [],
            },
            meta: { requestId: "r1" },
          }),
      }),
    );

    const detail = await getAdminSopTemplate(templateId);
    expect(detail.templateId).toBe(templateId);
  });
});
