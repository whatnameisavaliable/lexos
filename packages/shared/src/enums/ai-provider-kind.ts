/**
 * AI 提供商类型（与 `public.ai_provider_kind` / `database.md` §1.2 一致）。
 */
export const AiProviderKind = {
  OPENAI_COMPATIBLE: "openai_compatible",
  AZURE_OPENAI: "azure_openai",
  CUSTOM_HTTP: "custom_http",
} as const;

/** `ai_model_credentials.provider_kind` 合法取值。 */
export type AiProviderKind = (typeof AiProviderKind)[keyof typeof AiProviderKind];

/** 全部提供商类型字面量。 */
export const AI_PROVIDER_KIND_VALUES: readonly AiProviderKind[] =
  Object.values(AiProviderKind);

/**
 * 判断字符串是否为合法 {@link AiProviderKind}。
 */
export function isAiProviderKind(value: string): value is AiProviderKind {
  return AI_PROVIDER_KIND_VALUES.includes(value as AiProviderKind);
}
