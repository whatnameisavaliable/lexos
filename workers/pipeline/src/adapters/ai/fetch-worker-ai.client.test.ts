import { describe, expect, it, vi, afterEach } from "vitest";
import { AiFeatureKey } from "@lexos/shared";
import { FetchWorkerAiClient } from "./fetch-worker-ai.client.js";

describe("FetchWorkerAiClient.complete", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sets temperature 0 for SOP featureKey", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "ok" } }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new FetchWorkerAiClient();
    await client.complete(
      {
        modelId: "id",
        providerKind: "openai_compatible",
        modelName: "gpt",
        apiKey: "sk",
        baseUrl: "https://api.example.com/v1",
      },
      { systemPrompt: "s", userPrompt: "u" },
      { featureKey: AiFeatureKey.SOP_DEEP_RESEARCH },
    );

    const body = JSON.parse(
      (fetchMock.mock.calls[0]?.[1] as RequestInit).body as string,
    );
    expect(body.temperature).toBe(0);
  });
});
