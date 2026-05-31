import { describe, expect, it, vi, afterEach } from "vitest";
import { OpenAiCompatibleAdapter } from "./openai-compatible.adapter.js";

describe("OpenAiCompatibleAdapter.healthCheck", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns success on HTTP 200 from /models", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200, text: async () => "" })),
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
      vi.fn(async () => ({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => "",
      })),
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

  it("falls back to chat/completions when /models returns 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.endsWith("/models")) {
          return {
            ok: false,
            status: 404,
            statusText: "Not Found",
            text: async () => "",
          };
        }
        return { ok: true, status: 200, text: async () => "" };
      }),
    );
    const adapter = new OpenAiCompatibleAdapter();
    const result = await adapter.healthCheck({
      providerKind: "openai_compatible",
      modelId: "gpt-4o",
      modelName: "gpt-4o",
      apiKey: "sk-test",
      baseUrl: "https://api.example.com/v1",
    });
    expect(result.success).toBe(true);
    expect(result.message).toContain("chat/completions");
  });

  it("uses chat/completions directly for Gemini base URL", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => "",
    }));
    vi.stubGlobal("fetch", fetchMock);
    const adapter = new OpenAiCompatibleAdapter();
    const result = await adapter.healthCheck({
      providerKind: "openai_compatible",
      modelId: "gemini-2.5-flash",
      modelName: "gemini-2.5-flash",
      apiKey: "gemini-key",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    });
    expect(result.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/chat/completions");
  });
});
