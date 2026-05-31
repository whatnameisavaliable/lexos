import {
  isGeminiOpenAiCompatibleBaseUrl,
  normalizeOpenAiCompatibleBaseUrl,
} from "@lexos/shared";
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
    const baseUrl = normalizeOpenAiCompatibleBaseUrl(credentials.baseUrl);
    const timeoutMs = options?.timeoutMs ?? 10_000;

    if (!isGeminiOpenAiCompatibleBaseUrl(credentials.baseUrl)) {
      const modelsResult = await probeGet(
        `${baseUrl}/models`,
        credentials.apiKey,
        timeoutMs,
        started,
      );
      if (modelsResult.success || modelsResult.status !== 404) {
        return toHealthCheckResult(modelsResult, started);
      }
    }

    const chatResult = await probeChatCompletion(
      `${baseUrl}/chat/completions`,
      credentials,
      timeoutMs,
      started,
    );
    return toHealthCheckResult(chatResult, started);
  }
}

interface ProbeResult {
  readonly ok: boolean;
  readonly status?: number;
  readonly detail: string;
  readonly aborted: boolean;
}

async function probeGet(
  url: string,
  apiKey: string,
  timeoutMs: number,
  started: number,
): Promise<ProbeResult & { readonly success: boolean }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });
    if (response.ok) {
      return { ok: true, detail: "OK", aborted: false, success: true };
    }
    const detail = await readResponseSnippet(response);
    return {
      ok: false,
      status: response.status,
      detail: `HTTP ${response.status}: ${detail}`,
      aborted: false,
      success: false,
    };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      ok: false,
      detail: aborted ? "timeout" : "request failed",
      aborted,
      success: false,
    };
  } finally {
    clearTimeout(timeout);
    void started;
  }
}

async function probeChatCompletion(
  url: string,
  credentials: ModelCredentials,
  timeoutMs: number,
  started: number,
): Promise<ProbeResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: credentials.modelName,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1,
      }),
      signal: controller.signal,
    });
    if (response.ok) {
      return { ok: true, detail: "chat/completions OK", aborted: false };
    }
    const detail = await readResponseSnippet(response);
    return {
      ok: false,
      status: response.status,
      detail: `HTTP ${response.status}: ${detail}`,
      aborted: false,
    };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      ok: false,
      detail: aborted ? "timeout" : "request failed",
      aborted,
    };
  } finally {
    clearTimeout(timeout);
    void started;
  }
}

function toHealthCheckResult(
  probe: ProbeResult,
  started: number,
): HealthCheckResult {
  const latencyMs = Date.now() - started;
  if (probe.ok) {
    return { success: true, latencyMs, message: probe.detail };
  }
  return {
    success: false,
    latencyMs,
    message: probe.detail,
    errorCode: probe.aborted ? "AI_PROVIDER_TIMEOUT" : "AI_PROVIDER_ERROR",
  };
}

async function readResponseSnippet(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.slice(0, 300);
  } catch {
    return response.statusText;
  }
}
