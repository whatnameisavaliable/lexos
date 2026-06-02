import { describe, expect, it, vi } from "vitest";
import { SopAiOrchestrationService } from "./sop-ai-orchestration.service.js";

describe("SopAiOrchestrationService", () => {
  it("uses fallback when primary fails", async () => {
    const configRepo = {
      findPublishedPrompt: vi.fn(async () => "system"),
      resolveModelsForFeature: vi.fn(async () => ({
        primary: {
          modelUuid: "p1",
          contextWindow: 100_000,
          credentials: {
            providerKind: "openai_compatible",
            modelId: "m",
            modelName: "gpt",
            apiKey: "k",
            baseUrl: "https://api.example.com/v1",
          },
        },
        fallback: {
          modelUuid: "f1",
          contextWindow: 100_000,
          credentials: {
            providerKind: "openai_compatible",
            modelId: "m2",
            modelName: "gpt-f",
            apiKey: "k2",
            baseUrl: "https://api.example.com/v1",
          },
        },
      })),
    };

    const logRepo = { insertInvocationLog: vi.fn(async () => {}) };

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockRejectedValueOnce(new Error("primary down"))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: "fallback ok" } }],
            usage: { prompt_tokens: 1, completion_tokens: 2 },
          }),
        }),
    );

    const service = new SopAiOrchestrationService(
      configRepo as never,
      logRepo as never,
      5_000,
    );

    const result = await service.invokeSopLlm({
      pipelineId: "00000000-0000-4000-8000-000000000010",
      stepCode: "01-A",
      featureKey: "sop.fact_extract",
      userPromptTemplate: "do {{sop_media_extracted_text}}",
      promptContext: {
        finalizedArtifacts: [],
        formValues: {},
        sopMediaExtractedText: "x",
      },
    });

    expect(result.isFallback).toBe(true);
    expect(result.content).toBe("fallback ok");
    vi.unstubAllGlobals();
  });

  it("throws when mapping is missing", async () => {
    const configRepo = {
      findPublishedPrompt: vi.fn(async () => "system"),
      resolveModelsForFeature: vi.fn(async () => {
        throw new Error("AI mapping not found");
      }),
    };
    const service = new SopAiOrchestrationService(
      configRepo as never,
      { insertInvocationLog: vi.fn() } as never,
      5_000,
    );
    await expect(
      service.invokeSopLlm({
        pipelineId: "p",
        stepCode: "01-A",
        featureKey: "sop.fact_extract",
        userPromptTemplate: "u",
        promptContext: {
          finalizedArtifacts: [],
          formValues: {},
          sopMediaExtractedText: "",
        },
      }),
    ).rejects.toThrow(/AI mapping not found/);
  });
});
