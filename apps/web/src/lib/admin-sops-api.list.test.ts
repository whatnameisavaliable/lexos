import { describe, expect, it, vi, afterEach } from "vitest";
import { buildAdminSopsQueryString, listAdminSops } from "./admin-sops-api.js";

describe("buildAdminSopsQueryString", () => {
  it("builds query string for list params", () => {
    expect(buildAdminSopsQueryString({ limit: "50", cursor: "abc" })).toBe(
      "?limit=50&cursor=abc",
    );
  });

  it("returns empty string when no params", () => {
    expect(buildAdminSopsQueryString()).toBe("");
  });
});

describe("listAdminSops", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses items array from success response", async () => {
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
                  templateId: "t1",
                  name: "模板 A",
                  caseType: "civil",
                  createdAt: "2026-01-01T00:00:00.000Z",
                  versions: [],
                },
              ],
              meta: { limit: 50 },
            },
            meta: { requestId: "r1" },
          }),
      }),
    );

    const data = await listAdminSops();
    expect(data.items).toHaveLength(1);
    expect(data.items[0]?.name).toBe("模板 A");
  });
});
