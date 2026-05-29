import type { AiAdapter } from "./ai-adapter.interface.js";
import type { HealthCheckResult, ModelCredentials } from "./model-credentials.dto.js";

/**
 * OpenAI 兼容网关适配器（Chat/Models 探活）。
 */
export class OpenAiCompatibleAdapter implements AiAdapter {
  readonly providerKind = "openai_compatible" as const;

  async healthCheck(
    credentials: ModelCredentials,
    options?: { readonly timeoutMs?: number },
  ): Promise<HealthCheckResult> {
    const started = Date.now();
    const baseUrl = normalizeBaseUrl(credentials.baseUrl);
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      options?.timeoutMs ?? 10_000,
    );

    try {
      const response = await fetch(`${baseUrl}/models`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${credentials.apiKey}`,
        },
        signal: controller.signal,
      });
      const latencyMs = Date.now() - started;
      if (!response.ok) {
        return {
          success: false,
          latencyMs,
          message: `HTTP ${response.status}`,
          errorCode: "AI_PROVIDER_ERROR",
        };
      }
      return { success: true, latencyMs, message: "OK" };
    } catch (err) {
      const latencyMs = Date.now() - started;
      const aborted = err instanceof Error && err.name === "AbortError";
      return {
        success: false,
        latencyMs,
        message: aborted ? "timeout" : "request failed",
        errorCode: aborted ? "AI_PROVIDER_TIMEOUT" : "AI_PROVIDER_ERROR",
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

function normalizeBaseUrl(baseUrl: string | null): string {
  const value = (baseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");
  return value.endsWith("/v1") ? value : `${value}/v1`;
}
