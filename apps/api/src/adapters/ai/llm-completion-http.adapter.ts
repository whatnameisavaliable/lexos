import {
  applySopLlmTemperature,
  buildOpenAiChatCompletionBody,
  normalizeOpenAiCompatibleBaseUrl,
} from "@lexos/shared";
import type { ModelCredentials } from "./model-credentials.dto.js";

/** LLM Chat Completions 成功结果。 */
export interface LlmCompletionResult {
  readonly content: string;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly latencyMs: number;
}

/**
 * OpenAI 兼容 `POST /chat/completions`（SOP 经 {@link applySopLlmTemperature} 锁定 temperature）。
 */
export async function postChatCompletion(
  credentials: ModelCredentials,
  body: ReturnType<typeof buildOpenAiChatCompletionBody>,
  featureKey: string,
  options?: { readonly timeoutMs?: number },
): Promise<LlmCompletionResult> {
  const started = Date.now();
  const baseUrl = normalizeOpenAiCompatibleBaseUrl(credentials.baseUrl);
  const requestBody = applySopLlmTemperature(body, featureKey);

  const controller = new AbortController();
  const timeoutMs = options?.timeoutMs ?? 60_000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`LLM HTTP ${response.status}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    return {
      content: payload.choices?.[0]?.message?.content ?? "",
      inputTokens: payload.usage?.prompt_tokens,
      outputTokens: payload.usage?.completion_tokens,
      latencyMs: Date.now() - started,
    };
  } finally {
    clearTimeout(timer);
  }
}
