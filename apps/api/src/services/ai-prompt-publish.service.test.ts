import { describe, expect, it, vi } from "vitest";
import { AiPromptPublishService } from "./ai-prompt-publish.service.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";

describe("AiPromptPublishService", () => {
  it("throws when prompt missing", async () => {
    const service = new AiPromptPublishService(
      { findById: vi.fn(async () => null), publish: vi.fn() } as never,
      { append: vi.fn() } as never,
    );
    await expect(
      service.publish({ userId: "a", role: "admin" } as never, "p1"),
    ).rejects.toBeInstanceOf(AppHttpError);
  });
});
