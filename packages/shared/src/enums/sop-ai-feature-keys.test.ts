import { describe, expect, it } from "vitest";
import { AiFeatureKey } from "./ai-feature-key.js";
import { SOP_AI_FEATURE_KEY_VALUES } from "./sop-ai-feature-keys.js";

describe("SOP_AI_FEATURE_KEY_VALUES", () => {
  it("contains exactly four SOP feature keys", () => {
    expect(SOP_AI_FEATURE_KEY_VALUES).toHaveLength(4);
    expect(SOP_AI_FEATURE_KEY_VALUES).toEqual([
      AiFeatureKey.SOP_FACT_EXTRACT,
      AiFeatureKey.SOP_STRATEGY_GEN,
      AiFeatureKey.SOP_DEEP_RESEARCH,
      AiFeatureKey.SOP_VISUAL_CHARTING,
    ]);
  });
});
