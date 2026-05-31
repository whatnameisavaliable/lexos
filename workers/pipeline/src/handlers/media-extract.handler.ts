import { ErrorCode } from "@lexos/shared/api";
import { PIPELINE_STAGE_MEDIA_EXTRACT } from "@lexos/shared";
import { buildNextStageOutboxRow } from "../domain/worker-outbox.factory.js";
import { withPgClient } from "../infra/with-pg-client.js";
import type { StageHandler, StageHandlerContext } from "./stage-handler.js";
import type { MediaExtractService } from "../services/media-extract.service.js";
import type { WorkerTaskRepository } from "../repositories/worker-task.repository.js";
import type { WorkerTransactionService } from "../services/worker-transaction.service.js";

/**
 * `media.extract` 阶段：MP4 抽音 → `media.preprocess`。
 */
export class MediaExtractHandler implements StageHandler {
  constructor(
    private readonly mediaExtract: MediaExtractService,
    private readonly taskRepository: WorkerTaskRepository,
    private readonly transactionService: WorkerTransactionService,
  ) {}

  async handle(context: StageHandlerContext): Promise<void> {
    const { pool, event, payload } = context;

    const task = await withPgClient(pool, (client) =>
      this.taskRepository.findById(client, payload.taskId),
    );
    if (!task) {
      throw new Error(ErrorCode.RESOURCE_NOT_FOUND);
    }

    await withPgClient(pool, (client) =>
      this.taskRepository.transitionTaskStatus(
        client,
        payload.taskId,
        "queued",
        "extracting",
      ),
    );

    const extracted = await this.mediaExtract.extract({
      taskId: payload.taskId,
      sourceStorageKey: task.sourceStorageKey,
      createdBy: payload.createdBy,
    });

    await withPgClient(pool, async (client) => {
      await this.taskRepository.updateAudioStorageKey(
        client,
        payload.taskId,
        extracted.audioStorageKey,
      );
      await this.transactionService.completeStage(client, {
        outboxEventId: event.id,
        taskId: payload.taskId,
        fromStatus: "extracting",
        toStatus: "preprocessing",
        nextOutbox: buildNextStageOutboxRow({
          currentStage: PIPELINE_STAGE_MEDIA_EXTRACT,
          taskId: payload.taskId,
          createdBy: payload.createdBy,
          isMp4: payload.isMp4,
        }),
      });
    });
  }
}
