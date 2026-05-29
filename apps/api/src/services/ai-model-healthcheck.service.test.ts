import { describe, expect, it, vi } from "vitest";
import { AiModelHealthcheckService } from "./ai-model-healthcheck.service.js";

const aiEnv = {
  aiCredentialsEncryptionKey: Buffer.alloc(32, 3),
  aiTestTimeoutMs: 50,
  aiDefaultTimeoutMs: 60_000,
};

describe("AiModelHealthcheckService", () => {
  it("returns timeout failure when adapter hangs", async () => {
    const row = {
      id: "m1",
      provider_kind: "openai_compatible" as const,
      model_id: "gpt",
      model_name: "gpt",
      api_key_ciphertext: "",
      base_url: null,
    };
    const { encryptAiCredential } = await import("../lib/ai-credential-crypto.js");
    row.api_key_ciphertext = encryptAiCredential(
      "sk-x",
      aiEnv.aiCredentialsEncryptionKey,
    );

    const repo = {
      findById: vi.fn(async () => ({
        ...row,
        name: "M",
        is_enabled: true,
        is_default_fallback: false,
        created_by: "a",
        created_at: "t",
        updated_at: "t",
      })),
    };

    const adapterFactory = {
      get: () => ({
        healthCheck: () => new Promise(() => {}),
      }),
    };

    const service = new AiModelHealthcheckService(
      repo as never,
      adapterFactory as never,
      30,
      aiEnv,
    );

    const result = await service.test("m1");
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("AI_PROVIDER_TIMEOUT");
  });
});
