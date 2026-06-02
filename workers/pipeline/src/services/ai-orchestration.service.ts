import type { Pool } from "pg";
import { toSopAiInvocationMetadata, type AiFeatureKey } from "@lexos/shared";
import type { WorkerAiClient } from "../adapters/ai/worker-ai-client.port.js";
import { withPgClient } from "../infra/with-pg-client.js";
import {
  WorkerAiRepository,
  toWorkerAiCredentials,
  type AiInvocationLogInput,
} from "../repositories/worker-ai.repository.js";

/** AI 编排调用入参。 */
export interface AiOrchestrationInvokeInput {
  readonly pool: Pool;
  readonly taskId?: string;
  readonly featureKey: AiFeatureKey;
  readonly idempotencyKey: string;
  readonly transcribePath?: string;
  readonly llmUserPrompt?: string;
  readonly sop?: {
    readonly pipelineId: string;
    readonly stepCode: string;
  };
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
 * AI 编排：功能映射 → 主模型 → `fallback_model_id` **1 次**（PRD-3-02）。
 * 写入 `ai_invocation_logs`（含 `is_fallback`）；**不**写 `audit_logs`。
 * 外部 HTTP 调用期间不占用 Postgres 连接。
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
      await withPgClient(input.pool, (client) =>
        this.logSuccess({ ...input, client }, {
          modelId: primary.modelUuid,
          isFallback: false,
          latencyMs: result.latencyMs,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
        }),
      );
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
        await withPgClient(input.pool, (client) =>
          this.logFailure({ ...input, client }, primary.modelUuid, false, primaryError),
        );
        throw primaryError;
      }
      try {
        const result = await this.callModel(fallback, input);
        await withPgClient(input.pool, (client) =>
          this.logSuccess({ ...input, client }, {
            modelId: fallback.modelUuid,
            isFallback: true,
            latencyMs: result.latencyMs,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
          }),
        );
        return {
          text: result.text,
          modelId: fallback.modelUuid,
          isFallback: true,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          latencyMs: result.latencyMs,
        };
      } catch (fallbackError) {
        await withPgClient(input.pool, (client) =>
          this.logFailure(
            { ...input, client },
            fallback.modelUuid,
            true,
            fallbackError,
          ),
        );
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
        {
          timeoutMs: this.defaultTimeoutMs,
          featureKey: input.featureKey,
        },
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
    input: AiOrchestrationInvokeInput & {
      readonly client: import("pg").PoolClient;
    },
    meta: Omit<
      AiInvocationLogInput,
      "taskId" | "featureKey" | "outcome" | "errorCode" | "idempotencyKey"
    >,
  ): Promise<void> {
    await this.aiRepository.insertInvocationLog(input.client, {
      taskId: input.sop ? null : (input.taskId ?? null),
      featureKey: input.featureKey,
      modelId: meta.modelId,
      isFallback: meta.isFallback,
      latencyMs: meta.latencyMs,
      outcome: "success",
      inputTokens: meta.inputTokens,
      outputTokens: meta.outputTokens,
      idempotencyKey: input.idempotencyKey,
      metadata: input.sop
        ? toSopAiInvocationMetadata(input.sop.pipelineId, input.sop.stepCode)
        : undefined,
    });
  }

  private async logFailure(
    input: AiOrchestrationInvokeInput & {
      readonly client: import("pg").PoolClient;
    },
    modelId: string,
    isFallback: boolean,
    error: unknown,
  ): Promise<void> {
    await this.aiRepository.insertInvocationLog(input.client, {
      taskId: input.sop ? null : (input.taskId ?? null),
      featureKey: input.featureKey,
      modelId,
      isFallback,
      latencyMs: 0,
      outcome: "failure",
      errorCode: error instanceof Error ? error.message.slice(0, 64) : "AI_ERROR",
      idempotencyKey: input.idempotencyKey,
      metadata: input.sop
        ? toSopAiInvocationMetadata(input.sop.pipelineId, input.sop.stepCode)
        : undefined,
    });
  }
}
