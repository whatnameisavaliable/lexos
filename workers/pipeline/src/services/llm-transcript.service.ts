import type { Pool } from "pg";
import { AiFeatureKey } from "@lexos/shared";
import { WorkerAiRepository } from "../repositories/worker-ai.repository.js";
import type { AiOrchestrationService } from "./ai-orchestration.service.js";

/**
 * 文稿润色 LLM 服务（`llm_transcript_polish`）。
 */
export class LlmTranscriptService {
  constructor(private readonly aiOrchestration: AiOrchestrationService) {}

  async polish(pool: Pool, taskId: string, rawText: string): Promise<string> {
    const result = await this.aiOrchestration.invoke({
      pool,
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
