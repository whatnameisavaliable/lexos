/** Worker AI 调用凭证（禁止写入日志）。 */
export interface WorkerAiCredentials {
  readonly modelId: string;
  readonly providerKind: string;
  readonly modelName: string;
  readonly apiKey: string;
  readonly baseUrl: string | null;
}

/** ASR 调用结果。 */
export interface WorkerAsrResult {
  readonly text: string;
  readonly speakerLabel?: string | null;
  readonly diarizationDegraded?: boolean;
}

/** LLM 调用结果。 */
export interface WorkerLlmResult {
  readonly content: string;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly latencyMs: number;
}

/**
 * Worker 侧 AI HTTP 客户端端口（U6 适配层抽象）。
 */
export interface WorkerAiClient {
  transcribe(
    credentials: WorkerAiCredentials,
    localAudioPath: string,
    options?: { readonly timeoutMs?: number },
  ): Promise<WorkerAsrResult>;

  complete(
    credentials: WorkerAiCredentials,
    request: {
      readonly systemPrompt: string;
      readonly userPrompt: string;
    },
    options?: { readonly timeoutMs?: number; readonly featureKey?: string },
  ): Promise<WorkerLlmResult>;
}
