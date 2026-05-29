import { describe, expect, it, vi } from "vitest";
import { AiModelDeleteService } from "./ai-model-delete.service.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";

describe("AiModelDeleteService", () => {
  it("blocks delete when mapping references model", async () => {
    const repo = {
      findById: vi.fn(async () => ({ id: "m1" })),
      hasMappingReference: vi.fn(async () => true),
      delete: vi.fn(),
    };
    const service = new AiModelDeleteService(repo as never);
    await expect(
      service.delete({ userId: "a", role: "admin" } as never, "m1"),
    ).rejects.toBeInstanceOf(AppHttpError);
    expect(repo.delete).not.toHaveBeenCalled();
  });
});
