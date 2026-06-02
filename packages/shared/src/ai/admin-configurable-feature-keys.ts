import { AI_ACTIVE_FEATURE_KEY_VALUES } from "../enums/ai-feature-key.js";
import { SOP_AI_FEATURE_KEY_VALUES } from "../enums/sop-ai-feature-keys.js";

/**
 * Admin `/admin/ai` 可配置的功能点：转写三活跃 + 四 SOP（不含 `asr_semantic`）。
 */
export const ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES = [
  ...AI_ACTIVE_FEATURE_KEY_VALUES,
  ...SOP_AI_FEATURE_KEY_VALUES,
] as const;

/** Admin 可配置功能点字面量联合类型。 */
export type AdminConfigurableFeatureKey =
  (typeof ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES)[number];
