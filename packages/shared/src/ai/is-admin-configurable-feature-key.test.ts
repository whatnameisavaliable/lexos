import { describe, expect, it } from "vitest";
import { AiFeatureKey } from "../enums/ai-feature-key.js";
import { isAdminConfigurableFeatureKey } from "./is-admin-configurable-feature-key.js";

describe("isAdminConfigurableFeatureKey", () => {
  it("accepts SOP and active transcript keys", () => {
    expect(isAdminConfigurableFeatureKey(AiFeatureKey.SOP_FACT_EXTRACT)).toBe(
      true,
    );
    expect(isAdminConfigurableFeatureKey(AiFeatureKey.ASR_PHYSICAL)).toBe(true);
  });

  it("rejects asr_semantic", () => {
    expect(isAdminConfigurableFeatureKey(AiFeatureKey.ASR_SEMANTIC)).toBe(false);
  });
});
