import { describe, expect, it, vi } from "vitest";
import { LlmTranscriptService } from "./llm-transcript.service.js";

describe("LlmTranscriptService", () => {
  it("invokes llm_transcript_polish feature", async () => {
    const aiOrchestration = {
      invoke: vi.fn().mockResolvedValue({
        text: "polished",
        modelId: "m1",
        isFallback: false,
        latencyMs: 10,
      }),
    };
    const service = new LlmTranscriptService(aiOrchestration as never);
    const text = await service.polish({} as never, "task-1", "raw");
    expect(text).toBe("polished");
    expect(aiOrchestration.invoke).toHaveBeenCalled();
  });
});
