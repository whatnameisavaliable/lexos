import { describe, expect, it, vi, afterEach } from "vitest";
import { completeSopUpload } from "./lawyer-sops-api.js";

describe("completeSopUpload", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs upload session id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            success: true,
            data: { pipelineId: "p1", status: "queued" },
            meta: { requestId: "r1" },
          }),
      }),
    );

    const result = await completeSopUpload({ uploadSessionId: "sess-1" });
    expect(result.status).toBe("queued");
  });
});
