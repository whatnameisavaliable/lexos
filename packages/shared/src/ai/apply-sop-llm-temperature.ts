import { isSopAiFeatureKey } from "./is-sop-ai-feature-key.js";

/**
 * SOP 功能点强制 `temperature: 0`（`prd.md` §1.4 A8）；非 SOP 功能点不修改 body。
 */
export function applySopLlmTemperature<T extends Record<string, unknown>>(
  body: T,
  featureKey: string,
): T {
  if (!isSopAiFeatureKey(featureKey)) {
    return body;
  }
  return { ...body, temperature: 0 };
}
