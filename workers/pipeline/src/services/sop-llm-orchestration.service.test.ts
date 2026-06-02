import { describe, expect, it, vi } from "vitest";
import { SopLlmOrchestrationService } from "./sop-llm-orchestration.service.js";

describe("SopLlmOrchestrationService", () => {
  it("delegates to AiOrchestrationService with sop context", async () => {
    const invoke = vi.fn(async () => ({
      text: "ok",
      modelId: "m1",
      isFallback: false,
      latencyMs: 1,
    }));
    const service = new SopLlmOrchestrationService({ invoke } as never);
    await service.invoke({
      pool: {} as never,
      pipelineId: "pipe-1",
      stepCode: "01-A",
      featureKey: "sop.fact_extract",
      llmUserPrompt: "assembled",
      idempotencyKey: "idem",
    });
    expect(invoke).toHaveBeenCalledWith(
      expect.objectContaining({
        sop: { pipelineId: "pipe-1", stepCode: "01-A" },
        llmUserPrompt: "assembled",
      }),
    );
  });
});
