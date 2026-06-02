import { describe, expect, it, vi } from "vitest";
import { AiFeatureMappingUpsertService } from "./ai-feature-mapping-upsert.service.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";

describe("AiFeatureMappingUpsertService", () => {
  it("allows sop.fact_extract upsert", async () => {
    const upsert = vi.fn(async () => ({
      feature_key: "sop.fact_extract",
      primary_model_id: "00000000-0000-4000-8000-000000000001",
      fallback_model_id: null,
      updated_at: "t",
    }));
    const service = new AiFeatureMappingUpsertService(
      { upsert } as never,
      { write: vi.fn() } as never,
    );
    const result = await service.upsert(
      { userId: "a", role: "admin" } as never,
      "sop.fact_extract",
      { primaryModelId: "00000000-0000-4000-8000-000000000001" },
    );
    expect(result.featureKey).toBe("sop.fact_extract");
  });

  it("rejects invalid feature key", async () => {
    const service = new AiFeatureMappingUpsertService(
      { upsert: vi.fn() } as never,
      { write: vi.fn() } as never,
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
