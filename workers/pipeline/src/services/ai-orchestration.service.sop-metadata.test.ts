import { describe, expect, it, vi } from "vitest";
import { AiOrchestrationService } from "./ai-orchestration.service.js";

describe("AiOrchestrationService SOP metadata", () => {
  it("writes null task_id and sop metadata on success", async () => {
    const insertInvocationLog = vi.fn(async () => {});
    const aiRepository = {
      resolveModelsForFeature: vi.fn(async () => ({
        primary: {
          modelUuid: "m1",
          providerKind: "openai_compatible",
          modelId: "gpt",
          modelName: "gpt",
          apiKey: "k",
          baseUrl: "https://api.example.com/v1",
        },
        fallback: null,
      })),
      findPublishedPrompt: vi.fn(async () => "system"),
      insertInvocationLog,
    };
    const aiClient = {
      complete: vi.fn(async () => ({
        content: "ok",
        latencyMs: 5,
      })),
    };

    const service = new AiOrchestrationService(
      aiRepository as never,
      aiClient as never,
      5_000,
    );

    const pool = {
      connect: vi.fn(async () => ({ release: vi.fn() })),
    };

    await service.invoke({
      pool: pool as never,
      featureKey: "sop.fact_extract",
      idempotencyKey: "idem",
      llmUserPrompt: "user",
      sop: { pipelineId: "pipe-1", stepCode: "01-A" },
    });

    expect(insertInvocationLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        taskId: null,
        metadata: { pipeline_id: "pipe-1", step_code: "01-A" },
      }),
    );
  });
});
