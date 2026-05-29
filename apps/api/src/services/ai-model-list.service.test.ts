import { describe, expect, it, vi } from "vitest";
import { encryptAiCredential } from "../lib/ai-credential-crypto.js";
import { AiModelListService } from "./ai-model-list.service.js";

const aiEnv = {
  aiCredentialsEncryptionKey: Buffer.alloc(32, 1),
  aiTestTimeoutMs: 10_000,
  aiDefaultTimeoutMs: 60_000,
};

describe("AiModelListService", () => {
  it("returns masked models without plaintext apiKey", async () => {
    const cipher = encryptAiCredential("sk-secret", aiEnv.aiCredentialsEncryptionKey);
    const repo = {
      list: vi.fn(async () => ({
        items: [
          {
            id: "1",
            name: "M",
            provider_kind: "openai_compatible",
            model_name: "gpt",
            model_id: "gpt",
            api_key_ciphertext: cipher,
            base_url: null,
            context_window: null,
            is_enabled: true,
            is_default_fallback: false,
            created_by: "a",
            created_at: "t",
            updated_at: "t",
          },
        ],
      })),
    };

    const service = new AiModelListService(repo as never, aiEnv);
    const result = await service.list({ limit: 50 });
    expect(result.items[0]?.apiKeyMasked).toBe("sk-***");
    expect(JSON.stringify(result)).not.toContain("sk-secret");
  });
});
