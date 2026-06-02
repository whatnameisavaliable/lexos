import { describe, expect, it } from "vitest";
import {
  AI_ACTIVE_FEATURE_KEY_VALUES,
  AI_FEATURE_KEY_VALUES,
  AiFeatureKey,
  isAiActiveFeatureKey,
  isAiFeatureKey,
} from "./ai-feature-key.js";

describe("AiFeatureKey", () => {
  it("excludes asr_semantic from active pipeline keys", () => {
    expect(AI_ACTIVE_FEATURE_KEY_VALUES).toEqual([
      AiFeatureKey.ASR_PHYSICAL,
      AiFeatureKey.LLM_TRANSCRIPT_POLISH,
      AiFeatureKey.LLM_LEGAL_SUMMARY,
    ]);
    expect(AI_FEATURE_KEY_VALUES).toContain(AiFeatureKey.ASR_SEMANTIC);
    expect(isAiActiveFeatureKey(AiFeatureKey.ASR_SEMANTIC)).toBe(false);
    expect(isAiActiveFeatureKey(AiFeatureKey.ASR_PHYSICAL)).toBe(true);
  });

  it("includes SOP feature keys from M10 enum extension", () => {
    expect(isAiFeatureKey("sop.fact_extract")).toBe(true);
    expect(isAiFeatureKey("sop.strategy_gen")).toBe(true);
    expect(isAiFeatureKey("sop.deep_research")).toBe(true);
    expect(isAiFeatureKey("sop.visual_charting")).toBe(true);
  });
});
