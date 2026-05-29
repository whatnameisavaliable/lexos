import type { AiAdapter } from "./ai-adapter.interface.js";
import type { HealthCheckResult, ModelCredentials } from "./model-credentials.dto.js";

/**
 * 自定义 HTTP 网关：对 `baseUrl` 根路径 GET 探活。
 */
export class CustomHttpAdapter implements AiAdapter {
  readonly providerKind = "custom_http" as const;

  async healthCheck(
    credentials: ModelCredentials,
    options?: { readonly timeoutMs?: number },
  ): Promise<HealthCheckResult> {
    const started = Date.now();
    if (!credentials.baseUrl) {
      return {
        success: false,
        latencyMs: Date.now() - started,
        message: "baseUrl is required for custom_http",
        errorCode: "VALIDATION_FAILED",
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      options?.timeoutMs ?? 10_000,
    );

    try {
      const response = await fetch(credentials.baseUrl, {
        method: "GET",
        headers: credentials.apiKey
          ? { Authorization: `Bearer ${credentials.apiKey}` }
          : undefined,
        signal: controller.signal,
      });
      const latencyMs = Date.now() - started;
      return {
        success: response.status < 500,
        latencyMs,
        message: `HTTP ${response.status}`,
        errorCode: response.status < 500 ? undefined : "AI_PROVIDER_ERROR",
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
