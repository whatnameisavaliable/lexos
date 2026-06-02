import { createHash } from "node:crypto";
import {
  buildOpenAiChatCompletionBody,
  toSopAiInvocationMetadata,
  type AiFeatureKey,
  type SopAiInvocationMetadata,
  type SopPromptContext,
} from "@lexos/shared";
import { postChatCompletion } from "../adapters/ai/llm-completion-http.adapter.js";
import type {
  AiInvocationLogRepository,
  InsertAiInvocationLogInput,
} from "../repositories/ai-invocation-log.repository.js";
import type { SopAiConfigRepository, SopResolvedModel } from "../repositories/sop-ai-config.repository.js";
import { assembleUserPrompt } from "./sop-prompt-assembler.service.js";
import { assertSopPromptWithinModelWindow } from "./sop-token-limit-guard.service.js";

/** `invokeSopLlm` 入参。 */
export interface InvokeSopLlmInput {
  readonly pipelineId: string;
  readonly stepCode: string;
  readonly featureKey: AiFeatureKey;
  readonly userPromptTemplate: string;
  readonly promptContext: SopPromptContext;
  readonly attempt?: number;
}

/** `invokeSopLlm` 成功结果。 */
export interface InvokeSopLlmResult {
  readonly content: string;
  readonly modelId: string;
  readonly isFallback: boolean;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly latencyMs: number;
}

/** 成功日志写入入参（不含 `outcome` / `errorCode`）。 */
export type SopInvocationSuccessLogInput = Omit<
  InsertAiInvocationLogInput,
  "outcome" | "errorCode"
> & { readonly metadata: SopAiInvocationMetadata };

/**
 * 写入 SOP 成功调用日志（`task_id` 为 NULL，`metadata` 含流水线上下文）。
 */
export async function logSopInvocationSuccess(
  repository: AiInvocationLogRepository,
  input: SopInvocationSuccessLogInput,
): Promise<void> {
  await repository.insertInvocationLog({
    ...input,
    taskId: null,
    outcome: "success",
    errorCode: null,
  });
}

/** 失败日志写入入参。 */
export interface SopInvocationFailureLogInput {
  readonly featureKey: AiFeatureKey;
  readonly modelId: string;
  readonly isFallback: boolean;
  readonly metadata: SopAiInvocationMetadata;
}

/**
 * 写入 SOP 失败调用日志。
 */
export async function logSopInvocationFailure(
  repository: AiInvocationLogRepository,
  input: SopInvocationFailureLogInput,
  error: unknown,
): Promise<void> {
  await repository.insertInvocationLog({
    taskId: null,
    featureKey: input.featureKey,
    modelId: input.modelId,
    isFallback: input.isFallback,
    latencyMs: 0,
    outcome: "failure",
    errorCode:
      error instanceof Error ? error.message.slice(0, 64) : "AI_ERROR",
    metadata: input.metadata,
  });
}

/**
 * SOP LLM 编排：Prompt 组装 → Token 校验 → 主模型 → fallback 一次 → 审计日志。
 */
export class SopAiOrchestrationService {
  constructor(
    private readonly configRepository: SopAiConfigRepository,
    private readonly invocationLogRepository: AiInvocationLogRepository,
    private readonly llmTimeoutMs: number,
  ) {}

  async invokeSopLlm(input: InvokeSopLlmInput): Promise<InvokeSopLlmResult> {
    const attempt = input.attempt ?? 1;
    const idempotencyKey = buildSopIdempotencyKey(
      input.pipelineId,
      input.stepCode,
      attempt,
    );
    void idempotencyKey;

    const systemPrompt = await this.configRepository.findPublishedPrompt(
      input.featureKey,
    );
    const userPrompt = assembleUserPrompt(
      input.userPromptTemplate,
      input.promptContext,
    );
    const { primary, fallback } =
      await this.configRepository.resolveModelsForFeature(input.featureKey);

    const contextWindow =
      primary.contextWindow ?? fallback?.contextWindow ?? 128_000;
    assertSopPromptWithinModelWindow(userPrompt, systemPrompt, contextWindow);

    const metadata = toSopAiInvocationMetadata(input.pipelineId, input.stepCode);

    try {
      const result = await this.completeWithModel(
        primary,
        systemPrompt,
        userPrompt,
        input.featureKey,
      );
      await logSopInvocationSuccess(this.invocationLogRepository, {
        featureKey: input.featureKey,
        modelId: primary.modelUuid,
        isFallback: false,
        latencyMs: result.latencyMs,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        metadata,
      });
      return {
        content: result.content,
        modelId: primary.modelUuid,
        isFallback: false,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        latencyMs: result.latencyMs,
      };
    } catch (primaryError) {
      if (!fallback) {
        await logSopInvocationFailure(
          this.invocationLogRepository,
          {
            featureKey: input.featureKey,
            modelId: primary.modelUuid,
            isFallback: false,
            metadata,
          },
          primaryError,
        );
        throw primaryError;
      }

      try {
        const result = await this.completeWithModel(
          fallback,
          systemPrompt,
          userPrompt,
          input.featureKey,
        );
        await logSopInvocationSuccess(this.invocationLogRepository, {
          featureKey: input.featureKey,
          modelId: fallback.modelUuid,
          isFallback: true,
          latencyMs: result.latencyMs,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          metadata,
        });
        return {
          content: result.content,
          modelId: fallback.modelUuid,
          isFallback: true,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          latencyMs: result.latencyMs,
        };
      } catch (fallbackError) {
        await logSopInvocationFailure(
          this.invocationLogRepository,
          {
            featureKey: input.featureKey,
            modelId: fallback.modelUuid,
            isFallback: true,
            metadata,
          },
          fallbackError,
        );
        throw fallbackError;
      }
    }
  }

  private async completeWithModel(
    model: SopResolvedModel,
    systemPrompt: string,
    userPrompt: string,
    featureKey: AiFeatureKey,
  ) {
    const body = buildOpenAiChatCompletionBody(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { model: model.credentials.modelName },
    );
    return postChatCompletion(
      model.credentials,
      body,
      featureKey,
      { timeoutMs: this.llmTimeoutMs },
    );
  }
}

/** `sha256(pipeline_id:step_code:attempt)` 幂等键。 */
export function buildSopIdempotencyKey(
  pipelineId: string,
  stepCode: string,
  attempt: number,
): string {
  return createHash("sha256")
    .update(`${pipelineId}:${stepCode}:${attempt}`)
    .digest("hex");
}
