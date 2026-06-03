import { describe, expect, it, vi, afterEach } from "vitest";
import { resumeSopPipeline } from "./lawyer-sops-api.js";

describe("resumeSopPipeline", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs resume", async () => {
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
            status: "in_progress",
            currentStepCode: "01",
            createdAt: "2026-01-01T00:00:00.000Z",
          },
          meta: { requestId: "r1" },
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await resumeSopPipeline("p1");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/pipelines/p1/resume"),
      expect.objectContaining({ method: "POST" }),
    );
  });
});
