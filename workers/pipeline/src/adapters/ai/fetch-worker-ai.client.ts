import { readFile } from "node:fs/promises";
import path from "node:path";
import type {
  WorkerAiClient,
  WorkerAiCredentials,
  WorkerAsrResult,
  WorkerLlmResult,
} from "./worker-ai-client.port.js";

/**
 * 基于 `fetch` 的 Worker AI 客户端（OpenAI 兼容 ASR/Chat）。
 */
export class FetchWorkerAiClient implements WorkerAiClient {
  async transcribe(
    credentials: WorkerAiCredentials,
    localAudioPath: string,
    options?: { readonly timeoutMs?: number },
  ): Promise<WorkerAsrResult> {
    const started = Date.now();
    const baseUrl = normalizeBaseUrl(credentials.baseUrl);
    const audioBytes = await readFile(localAudioPath);
    const form = new FormData();
    form.append(
      "file",
      new Blob([audioBytes]),
      path.basename(localAudioPath),
    );
    form.append("model", credentials.modelName);
    form.append("response_format", "json");

    const response = await fetchWithTimeout(
      `${baseUrl}/audio/transcriptions`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${credentials.apiKey}` },
        body: form,
      },
      options?.timeoutMs ?? 120_000,
    );

    if (!response.ok) {
      throw new Error(`ASR HTTP ${response.status}`);
    }

    const body = (await response.json()) as { text?: string };
    void started;
    return {
      text: body.text ?? "",
      diarizationDegraded: true,
    };
  }

  async complete(
    credentials: WorkerAiCredentials,
    request: { readonly systemPrompt: string; readonly userPrompt: string },
    options?: { readonly timeoutMs?: number },
  ): Promise<WorkerLlmResult> {
    const started = Date.now();
    const baseUrl = normalizeBaseUrl(credentials.baseUrl);
    const response = await fetchWithTimeout(
      `${baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credentials.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: credentials.modelName,
          messages: [
            { role: "system", content: request.systemPrompt },
            { role: "user", content: request.userPrompt },
          ],
        }),
      },
      options?.timeoutMs ?? 60_000,
    );

    if (!response.ok) {
      throw new Error(`LLM HTTP ${response.status}`);
    }

    const body = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const content = body.choices?.[0]?.message?.content ?? "";
    return {
      content,
      inputTokens: body.usage?.prompt_tokens,
      outputTokens: body.usage?.completion_tokens,
      latencyMs: Date.now() - started,
    };
  }
}

function normalizeBaseUrl(baseUrl: string | null): string {
  const value = (baseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");
  return value.endsWith("/v1") ? value : `${value}/v1`;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
