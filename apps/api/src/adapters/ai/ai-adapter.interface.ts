import type { HealthCheckResult, ModelCredentials } from "./model-credentials.dto.js";

/**
 * U6 AI 适配器接口（`architecture.md` §4.3.1）。
 */
export interface AiAdapter {
  readonly providerKind: ModelCredentials["providerKind"];
  healthCheck(
    credentials: ModelCredentials,
    options?: { readonly timeoutMs?: number },
  ): Promise<HealthCheckResult>;
  transcribe?(
    credentials: ModelCredentials,
    request: { readonly audioUrl: string },
  ): Promise<{ readonly text: string }>;
  complete?(
    credentials: ModelCredentials,
    request: {
      readonly systemPrompt: string;
      readonly userPrompt: string;
    },
  ): Promise<{ readonly content: string }>;
}
