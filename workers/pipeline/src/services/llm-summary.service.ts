import type { PoolClient } from "pg";
import { AiFeatureKey } from "@lexos/shared";
import { WorkerAiRepository } from "../repositories/worker-ai.repository.js";
import type { AiOrchestrationService } from "./ai-orchestration.service.js";

/**
 * 法律摘要 LLM 服务（`llm_legal_summary`）。
 */
export class LlmSummaryService {
  constructor(private readonly aiOrchestration: AiOrchestrationService) {}

  async summarize(
    client: PoolClient,
    taskId: string,
    polishedText: string,
  ): Promise<string> {
    const result = await this.aiOrchestration.invoke({
      client,
      taskId,
      featureKey: AiFeatureKey.LLM_LEGAL_SUMMARY,
      idempotencyKey: WorkerAiRepository.buildIdempotencyKey([
        taskId,
        AiFeatureKey.LLM_LEGAL_SUMMARY,
        "0",
        "1",
      ]),
      llmUserPrompt: polishedText,
    });
    return result.text;
  }
}
