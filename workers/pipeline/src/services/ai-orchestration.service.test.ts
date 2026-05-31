import { describe, expect, it, vi } from "vitest";
import { AiFeatureKey } from "@lexos/shared";
import { createMockPool } from "../test/pg-test-helpers.js";
import { AiOrchestrationService } from "./ai-orchestration.service.js";

describe("AiOrchestrationService", () => {
  it("uses primary model on success", async () => {
    const pool = createMockPool();
    const aiRepository = {
      resolveModelsForFeature: vi.fn().mockResolvedValue({
        primary: {
          modelUuid: "m1",
          providerKind: "openai_compatible",
          modelName: "whisper-1",
          apiKey: "k",
          baseUrl: null,
          modelId: "whisper-1",
        },
        fallback: null,
      }),
      findPublishedPrompt: vi.fn(),
      insertInvocationLog: vi.fn(),
    };
    const aiClient = {
      transcribe: vi.fn().mockResolvedValue({ text: "hello" }),
      complete: vi.fn(),
    };
    const service = new AiOrchestrationService(
      aiRepository as never,
      aiClient as never,
      30_000,
    );

    const result = await service.invoke({
      pool,
      taskId: "task-1",
      featureKey: AiFeatureKey.ASR_PHYSICAL,
      idempotencyKey: "idem-1",
      transcribePath: "/tmp/a.mp3",
    });

    expect(result.text).toBe("hello");
    expect(result.isFallback).toBe(false);
    expect(aiClient.transcribe).toHaveBeenCalledTimes(1);
  });

  it("falls back once when primary fails", async () => {
    const pool = createMockPool();
    const aiRepository = {
      resolveModelsForFeature: vi.fn().mockResolvedValue({
        primary: {
          modelUuid: "m1",
          providerKind: "openai_compatible",
          modelName: "whisper-1",
          apiKey: "k",
          baseUrl: null,
          modelId: "whisper-1",
        },
        fallback: {
          modelUuid: "m2",
          providerKind: "openai_compatible",
          modelName: "whisper-1",
          apiKey: "k2",
          baseUrl: null,
          modelId: "whisper-1",
        },
      }),
      insertInvocationLog: vi.fn(),
    };
    const aiClient = {
      transcribe: vi
        .fn()
        .mockRejectedValueOnce(new Error("primary down"))
        .mockResolvedValueOnce({ text: "fallback text" }),
      complete: vi.fn(),
    };
    const service = new AiOrchestrationService(
      aiRepository as never,
      aiClient as never,
      30_000,
    );

    const result = await service.invoke({
      pool,
      taskId: "task-1",
      featureKey: AiFeatureKey.ASR_PHYSICAL,
      idempotencyKey: "idem-2",
      transcribePath: "/tmp/a.mp3",
    });

    expect(result.isFallback).toBe(true);
    expect(result.text).toBe("fallback text");
    expect(aiClient.transcribe).toHaveBeenCalledTimes(2);
  });
});
