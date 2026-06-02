import { AiFeatureKey } from "./ai-feature-key.js";

/**
 * SOP 四功能点 `feature_key` 只读数组（`CONTEXT_SUMMARY.md` §6.2 · M10 种子）。
 */
export const SOP_AI_FEATURE_KEY_VALUES = [
  AiFeatureKey.SOP_FACT_EXTRACT,
  AiFeatureKey.SOP_STRATEGY_GEN,
  AiFeatureKey.SOP_DEEP_RESEARCH,
  AiFeatureKey.SOP_VISUAL_CHARTING,
] as const;

/** SOP AI 功能点字面量联合类型。 */
export type SopAiFeatureKey = (typeof SOP_AI_FEATURE_KEY_VALUES)[number];
