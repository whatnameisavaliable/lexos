import { describe, expect, it, vi } from "vitest";
import { ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES } from "@lexos/shared";
import { AiFeatureMappingListService } from "./ai-feature-mapping-list.service.js";

describe("AiFeatureMappingListService", () => {
  it("returns active feature keys with empty slots", async () => {
    const repo = { listAll: vi.fn(async () => []) };
    const service = new AiFeatureMappingListService(repo as never);
    const result = await service.list();
    expect(result.items).toHaveLength(ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES.length);
    expect(result.items.some((i) => i.featureKey === "sop.visual_charting")).toBe(
      true,
    );
    expect(result.items.every((i) => i.primaryModelId === null)).toBe(true);
  });
});
