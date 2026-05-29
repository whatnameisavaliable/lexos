/**
 * AI 功能点枚举（与 `public.ai_feature_key` / `database.md` §1.2 一致）。
 */
export const AiFeatureKey = {
  ASR_PHYSICAL: "asr_physical",
  ASR_SEMANTIC: "asr_semantic",
  LLM_TRANSCRIPT_POLISH: "llm_transcript_polish",
  LLM_LEGAL_SUMMARY: "llm_legal_summary",
} as const;

/** `ai_feature_model_mappings.feature_key` / `ai_prompt_templates.feature_key` 合法取值。 */
export type AiFeatureKey = (typeof AiFeatureKey)[keyof typeof AiFeatureKey];

/** 全部功能点字面量（校验、列表占位与测试用）。 */
export const AI_FEATURE_KEY_VALUES: readonly AiFeatureKey[] =
  Object.values(AiFeatureKey);

/**
 * 判断字符串是否为合法 {@link AiFeatureKey}。
 */
export function isAiFeatureKey(value: string): value is AiFeatureKey {
  return AI_FEATURE_KEY_VALUES.includes(value as AiFeatureKey);
}
