import { describe, expect, it, vi } from "vitest";
import { AiPromptUpdateService } from "./ai-prompt-update.service.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";

describe("AiPromptUpdateService", () => {
  it("blocks editing published prompt", async () => {
    const repo = {
      findById: vi.fn(async () => ({
        id: "p1",
        is_published: true,
      })),
    };
    const service = new AiPromptUpdateService(repo as never);
    await expect(
      service.update("p1", { name: "x" }),
    ).rejects.toBeInstanceOf(AppHttpError);
  });
});
