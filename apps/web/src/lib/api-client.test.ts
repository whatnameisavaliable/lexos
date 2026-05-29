import { describe, expect, it, vi, afterEach } from "vitest";
import { apiFetch, ApiClientError } from "./api-client.js";

describe("apiFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses success response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { ok: true },
          meta: { requestId: "r1" },
        }),
      }),
    );

    const res = await apiFetch<{ ok: boolean }>("/auth/session", { method: "GET" });
    expect(res.data.ok).toBe(true);
  });

  it("throws ApiClientError on error body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: {
            code: "AUTH_UNAUTHORIZED",
            message: "Authentication required",
            requestId: "r2",
          },
        }),
      }),
    );

    await expect(apiFetch("/profile")).rejects.toBeInstanceOf(ApiClientError);
  });
});
