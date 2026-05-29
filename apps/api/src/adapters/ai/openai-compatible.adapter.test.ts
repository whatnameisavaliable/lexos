import { describe, expect, it, vi, afterEach } from "vitest";
import { OpenAiCompatibleAdapter } from "./openai-compatible.adapter.js";

describe("OpenAiCompatibleAdapter.healthCheck", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns success on HTTP 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200 })),
    );
    const adapter = new OpenAiCompatibleAdapter();
    const result = await adapter.healthCheck({
      providerKind: "openai_compatible",
      modelId: "gpt-4o",
      modelName: "gpt-4o",
      apiKey: "sk-test",
      baseUrl: null,
    });
    expect(result.success).toBe(true);
  });

  it("returns failure on HTTP 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 401 })),
    );
    const adapter = new OpenAiCompatibleAdapter();
    const result = await adapter.healthCheck({
      providerKind: "openai_compatible",
      modelId: "gpt-4o",
      modelName: "gpt-4o",
      apiKey: "sk-bad",
      baseUrl: "https://api.example.com/v1",
    });
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("AI_PROVIDER_ERROR");
  });
});
