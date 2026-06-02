/**
 * AI 功能点枚举（与 `public.ai_feature_key` / `database.md` §1.2 一致）。
 */
export const AiFeatureKey = {
  ASR_PHYSICAL: "asr_physical",
  /** DB 枚举保留；首期不单独调用，听写后改顺由 `llm_transcript_polish` 承担（PRD-3-01）。 */
  ASR_SEMANTIC: "asr_semantic",
  LLM_TRANSCRIPT_POLISH: "llm_transcript_polish",
  LLM_LEGAL_SUMMARY: "llm_legal_summary",
} as const;

/** `ai_feature_model_mappings.feature_key` / `ai_prompt_templates.feature_key` 合法取值。 */
export type AiFeatureKey = (typeof AiFeatureKey)[keyof typeof AiFeatureKey];

/** 全部功能点字面量（含 DB 历史枚举；校验、日志筛选用）。 */
export const AI_FEATURE_KEY_VALUES: readonly AiFeatureKey[] =
  Object.values(AiFeatureKey);

/**
 * 流水线与管理端可绑定/配置的功能点（不含预留 `asr_semantic`）。
 */
export const AI_ACTIVE_FEATURE_KEY_VALUES: readonly AiFeatureKey[] = [
  AiFeatureKey.ASR_PHYSICAL,
  AiFeatureKey.LLM_TRANSCRIPT_POLISH,
  AiFeatureKey.LLM_LEGAL_SUMMARY,
];

export type AiActiveFeatureKey = (typeof AI_ACTIVE_FEATURE_KEY_VALUES)[number];

/**
 * 判断字符串是否为合法 {@link AiFeatureKey}。
 */
export function isAiFeatureKey(value: string): value is AiFeatureKey {
  return AI_FEATURE_KEY_VALUES.includes(value as AiFeatureKey);
}

/**
 * 判断是否为首期启用的功能点（可绑定模型 / 新建 Prompt）。
 */
export function isAiActiveFeatureKey(value: string): value is AiActiveFeatureKey {
  return AI_ACTIVE_FEATURE_KEY_VALUES.includes(value as AiActiveFeatureKey);
}
