import { describe, expect, it, vi, afterEach } from "vitest";
import { createAdminSopTemplate } from "./admin-sops-api.js";

describe("createAdminSopTemplate", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs template body and returns ids", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () =>
        JSON.stringify({
          success: true,
          data: {
            templateId: "00000000-0000-4000-8000-000000000001",
            versionId: "00000000-0000-4000-8000-000000000002",
          },
          meta: { requestId: "r1" },
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await createAdminSopTemplate({
      name: "民事一审",
      caseType: "civil",
    });

    expect(result.templateId).toBe("00000000-0000-4000-8000-000000000001");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/admin/sops/templates"),
      expect.objectContaining({ method: "POST" }),
    );
  });
});
