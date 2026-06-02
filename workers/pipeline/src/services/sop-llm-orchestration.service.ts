import type { Pool } from "pg";
import type { AiFeatureKey } from "@lexos/shared";
import {
  AiOrchestrationService,
  type AiOrchestrationInvokeInput,
  type AiOrchestrationInvokeResult,
} from "./ai-orchestration.service.js";

/** Worker 侧 SOP LLM 薄封装入参（用户 Prompt 已由 U2 组装）。 */
export interface SopLlmOrchestrationInput {
  readonly pool: Pool;
  readonly pipelineId: string;
  readonly stepCode: string;
  readonly featureKey: AiFeatureKey;
  readonly llmUserPrompt: string;
  readonly idempotencyKey: string;
}

/**
 * Worker 复用 {@link AiOrchestrationService} 执行 SOP 同步 LLM 子步骤。
 */
export class SopLlmOrchestrationService {
  constructor(private readonly aiOrchestration: AiOrchestrationService) {}

  invoke(input: SopLlmOrchestrationInput): Promise<AiOrchestrationInvokeResult> {
    const invokeInput: AiOrchestrationInvokeInput = {
      pool: input.pool,
      featureKey: input.featureKey,
      idempotencyKey: input.idempotencyKey,
      llmUserPrompt: input.llmUserPrompt,
      sop: { pipelineId: input.pipelineId, stepCode: input.stepCode },
    };
    return this.aiOrchestration.invoke(invokeInput);
  }
}
