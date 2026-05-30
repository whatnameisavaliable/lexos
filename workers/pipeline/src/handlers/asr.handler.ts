import { ErrorCode } from "@lexos/shared/api";
import { PIPELINE_STAGE_ASR } from "@lexos/shared";
import { buildNextStageOutboxRow } from "../domain/worker-outbox.factory.js";
import type { StageHandler, StageHandlerContext } from "./stage-handler.js";
import type { AsrSegmentRunnerService } from "../services/asr-segment-runner.service.js";
import type { MediaPreprocessService } from "../services/media-preprocess.service.js";
import type { WorkerTaskRepository } from "../repositories/worker-task.repository.js";
import type { WorkerTranscriptRepository } from "../repositories/worker-transcript.repository.js";
import type { WorkerTransactionService } from "../services/worker-transaction.service.js";

/**
 * `asr` 阶段：切片 ASR → 合并写入文稿 → `llm`。
 */
export class AsrHandler implements StageHandler {
  constructor(
    private readonly asrRunner: AsrSegmentRunnerService,
    private readonly mediaPreprocess: MediaPreprocessService,
    private readonly taskRepository: WorkerTaskRepository,
    private readonly transcriptRepository: WorkerTranscriptRepository,
    private readonly transactionService: WorkerTransactionService,
  ) {}

  async handle(context: StageHandlerContext): Promise<void> {
    const { client, event, payload } = context;
    const task = await this.taskRepository.findById(client, payload.taskId);
    if (!task) {
      throw new Error(ErrorCode.RESOURCE_NOT_FOUND);
    }
    if (task.status !== "asr_running") {
      throw new Error(`unexpected task status for asr: ${task.status}`);
    }

    const segments = await this.mediaPreprocess.loadPreparedSegments(
      payload.taskId,
    );

    const asrResult = await this.asrRunner.run(client, payload.taskId, segments);
    await this.transcriptRepository.upsertTranscript(client, {
      taskId: payload.taskId,
      asrRawJson: asrResult.asrRawJson,
    });
    if (asrResult.diarizationDegraded) {
      await this.taskRepository.updateDiarizationDegraded(
        client,
        payload.taskId,
        true,
      );
    }

    await this.transactionService.completeStage(client, {
      outboxEventId: event.id,
      taskId: payload.taskId,
      fromStatus: "asr_running",
      toStatus: "llm_running",
      nextOutbox: buildNextStageOutboxRow({
        currentStage: PIPELINE_STAGE_ASR,
        taskId: payload.taskId,
        createdBy: payload.createdBy,
        isMp4: payload.isMp4,
      }),
    });
  }
}
