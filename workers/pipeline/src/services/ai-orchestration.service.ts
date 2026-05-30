import type { PoolClient } from "pg";
import type { AiFeatureKey } from "@lexos/shared";
import type { WorkerAiClient } from "../adapters/ai/worker-ai-client.port.js";
import {
  WorkerAiRepository,
  toWorkerAiCredentials,
  type AiInvocationLogInput,
} from "../repositories/worker-ai.repository.js";

/** AI 编排调用入参。 */
export interface AiOrchestrationInvokeInput {
  readonly client: PoolClient;
  readonly taskId: string;
  readonly featureKey: AiFeatureKey;
  readonly idempotencyKey: string;
  readonly transcribePath?: string;
  readonly llmUserPrompt?: string;
}

/** AI 编排调用结果。 */
export interface AiOrchestrationInvokeResult {
  readonly text: string;
  readonly modelId: string;
  readonly isFallback: boolean;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly latencyMs: number;
}

/**
 * AI 编排：功能映射 → 主模型 → fallback 一次；写 `ai_invocation_logs`。
 */
export class AiOrchestrationService {
  constructor(
    private readonly aiRepository: WorkerAiRepository,
    private readonly aiClient: WorkerAiClient,
    private readonly defaultTimeoutMs: number,
  ) {}

  async invoke(
    input: AiOrchestrationInvokeInput,
  ): Promise<AiOrchestrationInvokeResult> {
    const { primary, fallback } =
      await this.aiRepository.resolveModelsForFeature(input.featureKey);

    try {
      const result = await this.callModel(primary, input);
      await this.logSuccess(input, {
        modelId: primary.modelUuid,
        isFallback: false,
        latencyMs: result.latencyMs,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
      });
      return {
        text: result.text,
        modelId: primary.modelUuid,
        isFallback: false,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        latencyMs: result.latencyMs,
      };
    } catch (primaryError) {
      if (!fallback) {
        await this.logFailure(input, primary.modelUuid, false, primaryError);
        throw primaryError;
      }
      try {
        const result = await this.callModel(fallback, input);
        await this.logSuccess(input, {
          modelId: fallback.modelUuid,
          isFallback: true,
          latencyMs: result.latencyMs,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
        });
        return {
          text: result.text,
          modelId: fallback.modelUuid,
          isFallback: true,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          latencyMs: result.latencyMs,
        };
      } catch (fallbackError) {
        await this.logFailure(input, fallback.modelUuid, true, fallbackError);
        throw fallbackError;
      }
    }
  }

  private async callModel(
    model: Awaited<
      ReturnType<WorkerAiRepository["resolveModelsForFeature"]>
    >["primary"],
    input: AiOrchestrationInvokeInput,
  ): Promise<{
    readonly text: string;
    readonly latencyMs: number;
    readonly inputTokens?: number;
    readonly outputTokens?: number;
  }> {
    const credentials = toWorkerAiCredentials(model);
    if (input.transcribePath) {
      const started = Date.now();
      const asr = await this.aiClient.transcribe(
        credentials,
        input.transcribePath,
        { timeoutMs: this.defaultTimeoutMs },
      );
      return { text: asr.text, latencyMs: Date.now() - started };
    }
    if (input.llmUserPrompt !== undefined) {
      const systemPrompt = await this.aiRepository.findPublishedPrompt(
        input.featureKey,
      );
      const llm = await this.aiClient.complete(
        credentials,
        { systemPrompt, userPrompt: input.llmUserPrompt },
        { timeoutMs: this.defaultTimeoutMs },
      );
      return {
        text: llm.content,
        latencyMs: llm.latencyMs,
        inputTokens: llm.inputTokens,
        outputTokens: llm.outputTokens,
      };
    }
    throw new Error("AiOrchestrationService: missing transcribePath or llmUserPrompt");
  }

  private async logSuccess(
    input: AiOrchestrationInvokeInput,
    meta: Omit<AiInvocationLogInput, keyof AiOrchestrationInvokeInput | "outcome" | "errorCode" | "idempotencyKey">,
  ): Promise<void> {
    await this.aiRepository.insertInvocationLog(input.client, {
      taskId: input.taskId,
      featureKey: input.featureKey,
      modelId: meta.modelId,
      isFallback: meta.isFallback,
      latencyMs: meta.latencyMs,
      outcome: "success",
      inputTokens: meta.inputTokens,
      outputTokens: meta.outputTokens,
      idempotencyKey: input.idempotencyKey,
    });
  }

  private async logFailure(
    input: AiOrchestrationInvokeInput,
    modelId: string,
    isFallback: boolean,
    error: unknown,
  ): Promise<void> {
    await this.aiRepository.insertInvocationLog(input.client, {
      taskId: input.taskId,
      featureKey: input.featureKey,
      modelId,
      isFallback,
      latencyMs: 0,
      outcome: "failure",
      errorCode: error instanceof Error ? error.message.slice(0, 64) : "AI_ERROR",
      idempotencyKey: input.idempotencyKey,
    });
  }
}
