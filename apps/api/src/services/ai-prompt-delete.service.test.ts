import { describe, expect, it, vi } from "vitest";
import { AiPromptDeleteService } from "./ai-prompt-delete.service.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";

describe("AiPromptDeleteService", () => {
  it("deletes existing prompt", async () => {
    const repo = {
      findById: vi.fn(async () => ({
        id: "p1",
        is_published: false,
      })),
      delete: vi.fn(async () => undefined),
    };
    const service = new AiPromptDeleteService(repo as never);
    await service.delete({ userId: "a", role: "admin" } as never, "p1");
    expect(repo.delete).toHaveBeenCalledWith("p1");
  });

  it("throws when prompt missing", async () => {
    const service = new AiPromptDeleteService({
      findById: vi.fn(async () => null),
      delete: vi.fn(),
    } as never);
    await expect(
      service.delete({ userId: "a", role: "admin" } as never, "missing"),
    ).rejects.toBeInstanceOf(AppHttpError);
  });
});
