import { describe, expect, it, vi } from "vitest";
import { AiModelRepository } from "./ai-model.repository.js";

describe("AiModelRepository.create", () => {
  it("persists api_key_ciphertext not plaintext apiKey column", async () => {
    const insertPayload: Record<string, unknown> = {};
    const serviceClient = {
      from: vi.fn(() => ({
        insert: vi.fn((row: Record<string, unknown>) => {
          Object.assign(insertPayload, row);
          return {
            select: () => ({
              single: async () => ({
                data: {
                  id: "m1",
                  name: row.name,
                  provider_kind: row.provider_kind,
                  model_name: row.model_name,
                  model_id: row.model_id,
                  api_key_ciphertext: row.api_key_ciphertext,
                  base_url: null,
                  context_window: null,
                  is_enabled: true,
                  is_default_fallback: false,
                  created_by: row.created_by,
                  created_at: "2026-01-01T00:00:00Z",
                  updated_at: "2026-01-01T00:00:00Z",
                },
                error: null,
              }),
            }),
          };
        }),
      })),
    };

    const repo = new AiModelRepository(serviceClient as never);
    await repo.create({
      name: "Test",
      providerKind: "openai_compatible",
      modelName: "gpt",
      modelId: "gpt",
      apiKeyCiphertext: "cipher:not-plain",
      isEnabled: true,
      isDefaultFallback: false,
      createdBy: "admin-id",
    });

    expect(insertPayload.api_key_ciphertext).toBe("cipher:not-plain");
    expect(insertPayload).not.toHaveProperty("api_key");
    expect(insertPayload).not.toHaveProperty("apiKey");
  });
});
