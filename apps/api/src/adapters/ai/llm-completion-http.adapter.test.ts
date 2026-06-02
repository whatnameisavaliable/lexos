import { describe, expect, it, vi, afterEach } from "vitest";
import { AiFeatureKey } from "@lexos/shared";
import { buildOpenAiChatCompletionBody } from "@lexos/shared";
import { postChatCompletion } from "./llm-completion-http.adapter.js";

describe("postChatCompletion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends temperature 0 for SOP feature keys", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "ok" } }],
        usage: { prompt_tokens: 1, completion_tokens: 1 },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const body = buildOpenAiChatCompletionBody(
      [
        { role: "system", content: "sys" },
        { role: "user", content: "user" },
      ],
      { model: "gpt-test" },
    );

    await postChatCompletion(
      {
        providerKind: "openai_compatible",
        modelId: "gpt-test",
        modelName: "gpt-test",
        apiKey: "sk-test",
        baseUrl: "https://api.example.com/v1",
      },
      body,
      AiFeatureKey.SOP_FACT_EXTRACT,
    );

    const sent = JSON.parse(
      (fetchMock.mock.calls[0]?.[1] as RequestInit).body as string,
    );
    expect(sent.temperature).toBe(0);
  });
});
