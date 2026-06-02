import { describe, expect, it } from "vitest";
import { AiFeatureKey } from "../enums/ai-feature-key.js";
import { isSopAiFeatureKey } from "./is-sop-ai-feature-key.js";

describe("isSopAiFeatureKey", () => {
  it("returns true for four SOP keys", () => {
    expect(isSopAiFeatureKey(AiFeatureKey.SOP_FACT_EXTRACT)).toBe(true);
    expect(isSopAiFeatureKey(AiFeatureKey.SOP_STRATEGY_GEN)).toBe(true);
    expect(isSopAiFeatureKey(AiFeatureKey.SOP_DEEP_RESEARCH)).toBe(true);
    expect(isSopAiFeatureKey(AiFeatureKey.SOP_VISUAL_CHARTING)).toBe(true);
  });

  it("returns false for transcript polish", () => {
    expect(isSopAiFeatureKey(AiFeatureKey.LLM_TRANSCRIPT_POLISH)).toBe(false);
  });
});
