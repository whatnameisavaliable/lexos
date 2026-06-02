import { describe, expect, it, vi } from "vitest";
import { SopAiConfigRepository } from "./sop-ai-config.repository.js";

describe("SopAiConfigRepository", () => {
  it("throws when mapping is missing", async () => {
    const client = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
          })),
        })),
      })),
    };
    const repo = new SopAiConfigRepository(client as never, {
      aiCredentialEncryptionKey: Buffer.alloc(32).toString("base64"),
    } as never);

    await expect(
      repo.resolveModelsForFeature("sop.fact_extract"),
    ).rejects.toThrow(/AI mapping not found/);
  });
});
