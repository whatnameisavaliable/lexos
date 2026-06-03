import { describe, expect, it, vi, afterEach } from "vitest";
import { buildSopTemplatesQueryString, listSopTemplates } from "./lawyer-sops-api.js";

describe("buildSopTemplatesQueryString", () => {
  it("builds cursor query", () => {
    expect(buildSopTemplatesQueryString({ limit: 10, cursor: "c1" })).toBe(
      "?limit=10&cursor=c1",
    );
  });
});

describe("listSopTemplates", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses published templates", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            success: true,
            data: {
              items: [
                {
                  templateVersionId: "v1",
                  templateName: "模板",
                  caseType: "civil",
                  versionNumber: 1,
                },
              ],
            },
            meta: { requestId: "r1" },
          }),
      }),
    );

    const data = await listSopTemplates();
    expect(data.items).toHaveLength(1);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/sops/templates"),
      expect.any(Object),
    );
  });
});
