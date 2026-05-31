/**
 * 规范化 OpenAI 兼容 API 根路径（Chat / Models / ASR 共用）。
 */
export function normalizeOpenAiCompatibleBaseUrl(baseUrl: string | null): string {
  const value = (baseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");
  if (value.endsWith("/v1")) {
    return value;
  }
  // Gemini：`.../v1beta/openai`（勿再追加 `/v1`）
  if (value.endsWith("/openai")) {
    return value;
  }
  return `${value}/v1`;
}

/** 是否为 Google Gemini OpenAI 兼容端点。 */
export function isGeminiOpenAiCompatibleBaseUrl(baseUrl: string | null): boolean {
  return (baseUrl ?? "").includes("generativelanguage.googleapis.com");
}
