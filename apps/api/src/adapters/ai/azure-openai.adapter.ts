import type { AiAdapter } from "./ai-adapter.interface.js";
import type { HealthCheckResult, ModelCredentials } from "./model-credentials.dto.js";

/**
 * Azure OpenAI 适配器（最小桩：对 deployments 端点 HEAD/GET 探活）。
 */
export class AzureOpenAiAdapter implements AiAdapter {
  readonly providerKind = "azure_openai" as const;

  async healthCheck(
    credentials: ModelCredentials,
    options?: { readonly timeoutMs?: number },
  ): Promise<HealthCheckResult> {
    const started = Date.now();
    if (!credentials.baseUrl) {
      return {
        success: false,
        latencyMs: Date.now() - started,
        message: "baseUrl is required for azure_openai",
        errorCode: "VALIDATION_FAILED",
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      options?.timeoutMs ?? 10_000,
    );

    try {
      const url = `${credentials.baseUrl.replace(/\/$/, "")}/openai/deployments/${encodeURIComponent(credentials.modelId)}?api-version=2024-02-15-preview`;
      const response = await fetch(url, {
        method: "GET",
        headers: { "api-key": credentials.apiKey },
        signal: controller.signal,
      });
      const latencyMs = Date.now() - started;
      return {
        success: response.ok,
        latencyMs,
        message: response.ok ? "OK" : `HTTP ${response.status}`,
        errorCode: response.ok ? undefined : "AI_PROVIDER_ERROR",
      };
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
