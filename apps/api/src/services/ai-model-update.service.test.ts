import { describe, expect, it, vi } from "vitest";
import { AiModelUpdateService } from "./ai-model-update.service.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";

const aiEnv = {
  aiCredentialsEncryptionKey: Buffer.alloc(32, 2),
  aiTestTimeoutMs: 10_000,
  aiDefaultTimeoutMs: 60_000,
};

describe("AiModelUpdateService", () => {
  it("throws NOT_FOUND when model missing", async () => {
    const repo = { findById: vi.fn(async () => null) };
    const service = new AiModelUpdateService(
      repo as never,
      { append: vi.fn() } as never,
      aiEnv,
    );
    await expect(
      service.update({ userId: "a", role: "admin" } as never, "id", {
        name: "x",
      }),
    ).rejects.toBeInstanceOf(AppHttpError);
  });
});
