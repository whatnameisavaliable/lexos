import { describe, expect, it, vi, afterEach } from "vitest";
import { ApiClientError } from "./api-client.js";
import { patchSopArtifact } from "./lawyer-sops-api.js";

describe("patchSopArtifact", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("PATCHes with If-Match header", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          success: true,
          data: {
            id: "art-1",
            version: 2,
            contentRaw: "new",
            updatedAt: "2026-01-02T00:00:00.000Z",
          },
          meta: { requestId: "r1" },
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await patchSopArtifact("art-1", 1, { contentRaw: "new" });
    expect(result.version).toBe(2);
    const call = fetchMock.mock.calls[0];
    const init = call?.[1] as RequestInit;
    const headers = init?.headers as Headers;
    expect(headers.get("If-Match")).toBe("1");
    expect(init?.method).toBe("PATCH");
  });

  it("throws ApiClientError on 409 RESOURCE_CONFLICT", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        text: async () =>
          JSON.stringify({
            success: false,
            error: {
              code: "RESOURCE_CONFLICT",
              message: "Version mismatch",
              requestId: "r2",
            },
          }),
      }),
    );

    await expect(
      patchSopArtifact("art-1", 1, { contentRaw: "x" }),
    ).rejects.toBeInstanceOf(ApiClientError);
  });
});
