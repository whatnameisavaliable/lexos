import { FetchWorkerAiClient } from "./fetch-worker-ai.client.js";
import {
  DashScopeFunAsrWorkerClient,
  usesDashScopeFunAsrApi,
} from "./dashscope-fun-asr.client.js";
import type {
  WorkerAiClient,
  WorkerAiCredentials,
  WorkerAsrResult,
  WorkerLlmResult,
} from "./worker-ai-client.port.js";
import type { WorkerStorageAdapter } from "../storage/worker-storage.adapter.js";

/**
 * 按模型路由 ASR：DashScope Fun-ASR 走原生 REST，其余走 OpenAI 兼容接口。
 */
export class RoutingWorkerAiClient implements WorkerAiClient {
  private readonly openAiClient: WorkerAiClient;
  private readonly dashScopeClient: DashScopeFunAsrWorkerClient;

  constructor(
    storage: WorkerStorageAdapter,
    openAiClient: WorkerAiClient = new FetchWorkerAiClient(),
    dashScopeClient?: DashScopeFunAsrWorkerClient,
  ) {
    this.openAiClient = openAiClient;
    this.dashScopeClient =
      dashScopeClient ?? new DashScopeFunAsrWorkerClient(storage);
  }

  transcribe(
    credentials: WorkerAiCredentials,
    localAudioPath: string,
    options?: { readonly timeoutMs?: number },
  ): Promise<WorkerAsrResult> {
    if (usesDashScopeFunAsrApi(credentials)) {
      return this.dashScopeClient.transcribe(
        credentials,
        localAudioPath,
        options,
      );
    }
    return this.openAiClient.transcribe(credentials, localAudioPath, options);
  }

  complete(
    credentials: WorkerAiCredentials,
    request: { readonly systemPrompt: string; readonly userPrompt: string },
    options?: { readonly timeoutMs?: number },
  ): Promise<WorkerLlmResult> {
    return this.openAiClient.complete(credentials, request, options);
  }
}
