import { ErrorCode } from "@lexos/shared/api";
import { PIPELINE_STAGE_LLM, type LlmRetryMode } from "@lexos/shared";
import { buildNextStageOutboxRow } from "../domain/worker-outbox.factory.js";
import { withPgClient } from "../infra/with-pg-client.js";
import type { StageHandler, StageHandlerContext } from "./stage-handler.js";
import type { LlmTranscriptService } from "../services/llm-transcript.service.js";
import type { LlmSummaryService } from "../services/llm-summary.service.js";
import type { WorkerTaskRepository } from "../repositories/worker-task.repository.js";
import type { WorkerTranscriptRepository } from "../repositories/worker-transcript.repository.js";
import type { WorkerTransactionService } from "../services/worker-transaction.service.js";
import type { TempDirCleanupService } from "../services/temp-dir-cleanup.service.js";

/**
 * `llm` 阶段：整篇润色 + 整篇摘要（PRD-3.5-04 部分成功可保留 ASR）。
 */
export class LlmHandler implements StageHandler {
  constructor(
    private readonly llmTranscript: LlmTranscriptService,
    private readonly llmSummary: LlmSummaryService,
    private readonly taskRepository: WorkerTaskRepository,
    private readonly transcriptRepository: WorkerTranscriptRepository,
    private readonly transactionService: WorkerTransactionService,
    private readonly tempDirCleanup: TempDirCleanupService,
  ) {}

  async handle(context: StageHandlerContext): Promise<void> {
    const { pool, event, payload } = context;
    const llmRetry: LlmRetryMode = payload.llmRetry ?? "all";
    const skipArchive = payload.skipArchive === true;

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

    let polishedText: string | null = null;
    let polishFailed = false;
    const shouldPolish = llmRetry === "all" || llmRetry === "polish";

    if (shouldPolish) {
      try {
        polishedText = await this.llmTranscript.polish(
          pool,
          payload.taskId,
          rawText,
        );
        polishFailed = false;
      } catch {
        polishFailed = true;
        polishedText = rawText;
      }
    } else {
      polishedText = await withPgClient(pool, (client) =>
        this.loadExistingPolishedText(client, payload.taskId, rawText),
      );
    }

    let summaryText: string | null = null;
    let summaryFailed = false;
    const shouldSummarize = llmRetry === "all" || llmRetry === "summary";

    if (shouldSummarize) {
      const summaryInput = polishedText ?? rawText;
      try {
        summaryText = await this.llmSummary.summarize(
          pool,
          payload.taskId,
          summaryInput,
        );
        summaryFailed = false;
      } catch {
        summaryFailed = true;
        summaryText = null;
      }
    } else {
      summaryText = await withPgClient(pool, (client) =>
        this.loadExistingSummaryText(client, payload.taskId),
      );
    }

    await withPgClient(pool, async (client) => {
      await this.transcriptRepository.upsertTranscript(client, {
        taskId: payload.taskId,
        polishedText: polishedText ?? undefined,
        summaryText: summaryText ?? undefined,
      });
      await this.taskRepository.updateLlmOutcomeFlags(client, payload.taskId, {
        polishFailed: shouldPolish ? polishFailed : false,
        summaryFailed: shouldSummarize ? summaryFailed : false,
      });
      await this.taskRepository.clearTaskError(client, payload.taskId);

      if (skipArchive) {
        await this.transactionService.completeStage(client, {
          outboxEventId: event.id,
          taskId: payload.taskId,
          fromStatus: "llm_running",
          toStatus: "completed",
          nextOutbox: null,
        });
      } else {
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
      }
    });

    if (skipArchive) {
      await this.tempDirCleanup.cleanupTaskDir(payload.taskId);
    }
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

  private async loadExistingPolishedText(
    client: import("pg").PoolClient,
    taskId: string,
    fallback: string,
  ): Promise<string | null> {
    const result = await client.query<{ polished_text: string | null }>(
      `SELECT polished_text FROM public.transcription_transcripts WHERE task_id = $1::uuid`,
      [taskId],
    );
    return result.rows[0]?.polished_text ?? fallback;
  }

  private async loadExistingSummaryText(
    client: import("pg").PoolClient,
    taskId: string,
  ): Promise<string | null> {
    const result = await client.query<{ summary_text: string | null }>(
      `SELECT summary_text FROM public.transcription_transcripts WHERE task_id = $1::uuid`,
      [taskId],
    );
    return result.rows[0]?.summary_text ?? null;
  }
}
