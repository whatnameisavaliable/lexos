import { ErrorCode } from "@lexos/shared/api";
import { PIPELINE_STAGE_LLM } from "@lexos/shared";
import { buildNextStageOutboxRow } from "../domain/worker-outbox.factory.js";
import { withPgClient } from "../infra/with-pg-client.js";
import type { StageHandler, StageHandlerContext } from "./stage-handler.js";
import type { LlmTranscriptService } from "../services/llm-transcript.service.js";
import type { LlmSummaryService } from "../services/llm-summary.service.js";
import type { WorkerTaskRepository } from "../repositories/worker-task.repository.js";
import type { WorkerTranscriptRepository } from "../repositories/worker-transcript.repository.js";
import type { WorkerTransactionService } from "../services/worker-transaction.service.js";

/**
 * `llm` 阶段：文稿润色 + 法律摘要 → `drive.archive`。
 */
export class LlmHandler implements StageHandler {
  constructor(
    private readonly llmTranscript: LlmTranscriptService,
    private readonly llmSummary: LlmSummaryService,
    private readonly taskRepository: WorkerTaskRepository,
    private readonly transcriptRepository: WorkerTranscriptRepository,
    private readonly transactionService: WorkerTransactionService,
  ) {}

  async handle(context: StageHandlerContext): Promise<void> {
    const { pool, event, payload } = context;

    await withPgClient(pool, async (client) => {
      const task = await this.taskRepository.findById(client, payload.taskId);
      if (!task) {
        throw new Error(ErrorCode.RESOURCE_NOT_FOUND);
      }
      if (task.status !== "llm_running") {
        throw new Error(`unexpected task status for llm: ${task.status}`);
      }
    });

    const rawText = await withPgClient(pool, (client) =>
      this.loadAsrPlainText(client, payload.taskId),
    );
    const polishedText = await this.llmTranscript.polish(
      pool,
      payload.taskId,
      rawText,
    );
    const summaryText = await this.llmSummary.summarize(
      pool,
      payload.taskId,
      polishedText,
    );

    await withPgClient(pool, async (client) => {
      await this.transcriptRepository.upsertTranscript(client, {
        taskId: payload.taskId,
        polishedText,
        summaryText,
      });
      await this.transactionService.completeStage(client, {
        outboxEventId: event.id,
        taskId: payload.taskId,
        nextOutbox: buildNextStageOutboxRow({
          currentStage: PIPELINE_STAGE_LLM,
          taskId: payload.taskId,
          createdBy: payload.createdBy,
          isMp4: payload.isMp4,
        }),
      });
    });
  }

  private async loadAsrPlainText(
    client: import("pg").PoolClient,
    taskId: string,
  ): Promise<string> {
    const result = await client.query<{ asr_raw_json: unknown }>(
      `SELECT asr_raw_json
       FROM public.transcription_transcripts
       WHERE task_id = $1::uuid`,
      [taskId],
    );
    const raw = result.rows[0]?.asr_raw_json as
      | { segments?: Array<{ text?: string }> }
      | undefined;
    const segments = raw?.segments ?? [];
    const text = segments.map((item) => item.text ?? "").join("\n").trim();
    if (!text) {
      throw new Error(ErrorCode.AI_PROVIDER_ERROR);
    }
    return text;
  }
}
