import { describe, expect, it, vi } from "vitest";
import { LlmSummaryService } from "./llm-summary.service.js";

describe("LlmSummaryService", () => {
  it("invokes llm_legal_summary feature", async () => {
    const aiOrchestration = {
      invoke: vi.fn().mockResolvedValue({
        text: "summary",
        modelId: "m1",
        isFallback: false,
        latencyMs: 10,
      }),
    };
    const service = new LlmSummaryService(aiOrchestration as never);
    const text = await service.summarize({} as never, "task-1", "polished");
    expect(text).toBe("summary");
  });
});
