import { describe, expect, it, vi } from "vitest";
import { AiFeatureMappingUpsertService } from "./ai-feature-mapping-upsert.service.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";

describe("AiFeatureMappingUpsertService", () => {
  it("rejects invalid feature key", async () => {
    const service = new AiFeatureMappingUpsertService(
      { upsert: vi.fn() } as never,
      { append: vi.fn() } as never,
    );
    await expect(
      service.upsert(
        { userId: "a", role: "admin" } as never,
        "invalid_key",
        { primaryModelId: "00000000-0000-4000-8000-000000000001" },
      ),
    ).rejects.toBeInstanceOf(AppHttpError);
  });
});
