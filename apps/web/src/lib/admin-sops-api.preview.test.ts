import { describe, expect, it, vi, afterEach } from "vitest";
import { previewAdminSopPipeline } from "./admin-sops-api.js";

describe("previewAdminSopPipeline", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs preview body and returns LLM content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            success: true,
            data: {
              content: "# 预览输出",
              modelId: "00000000-0000-4000-8000-000000000099",
              isFallback: false,
              latencyMs: 1200,
            },
            meta: { requestId: "r1" },
          }),
      }),
    );

    const result = await previewAdminSopPipeline({
      templateVersionId: "00000000-0000-4000-8000-000000000002",
      stepCode: "strategy",
      formValues: {},
      finalizedArtifacts: [],
      sopMediaExtractedText: "",
    });

    expect(result.content).toBe("# 预览输出");
    expect(result.latencyMs).toBe(1200);
  });
});
