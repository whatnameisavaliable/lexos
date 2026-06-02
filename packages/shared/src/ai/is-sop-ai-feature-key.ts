import { SOP_AI_FEATURE_KEY_VALUES, type SopAiFeatureKey } from "../enums/sop-ai-feature-keys.js";

/**
 * 判断字符串是否为 SOP 四功能点之一（`CONTEXT_SUMMARY.md` §6.2）。
 */
export function isSopAiFeatureKey(value: string): value is SopAiFeatureKey {
  return (SOP_AI_FEATURE_KEY_VALUES as readonly string[]).includes(value);
}
