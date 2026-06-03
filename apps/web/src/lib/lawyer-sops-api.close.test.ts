import { describe, expect, it, vi, afterEach } from "vitest";
import { closeSopPipeline } from "./lawyer-sops-api.js";

describe("closeSopPipeline", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs close", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          success: true,
          data: {
            id: "p1",
            lawyerId: "l1",
            templateVersionId: "v1",
            status: "completed",
            currentStepCode: null,
            createdAt: "2026-01-01T00:00:00.000Z",
          },
          meta: { requestId: "r1" },
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await closeSopPipeline("p1");
    expect(result.status).toBe("completed");
  });
});
