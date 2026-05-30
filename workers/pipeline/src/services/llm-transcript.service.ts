import type { PoolClient } from "pg";
import { AiFeatureKey } from "@lexos/shared";
import { WorkerAiRepository } from "../repositories/worker-ai.repository.js";
import type { AiOrchestrationService } from "./ai-orchestration.service.js";

/**
 * 文稿润色 LLM 服务（`llm_transcript_polish`）。
 */
export class LlmTranscriptService {
  constructor(private readonly aiOrchestration: AiOrchestrationService) {}

  async polish(
    client: PoolClient,
    taskId: string,
    rawText: string,
  ): Promise<string> {
    const result = await this.aiOrchestration.invoke({
      client,
      taskId,
      featureKey: AiFeatureKey.LLM_TRANSCRIPT_POLISH,
      idempotencyKey: WorkerAiRepository.buildIdempotencyKey([
        taskId,
        AiFeatureKey.LLM_TRANSCRIPT_POLISH,
        "0",
        "1",
      ]),
      llmUserPrompt: rawText,
    });
    return result.text;
  }
}
