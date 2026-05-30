import { ErrorCode } from "@lexos/shared/api";
import { PIPELINE_STAGE_MEDIA_PREPROCESS } from "@lexos/shared";
import { buildNextStageOutboxRow } from "../domain/worker-outbox.factory.js";
import type { StageHandler, StageHandlerContext } from "./stage-handler.js";
import type { MediaPreprocessService } from "../services/media-preprocess.service.js";
import type { WorkerTaskRepository } from "../repositories/worker-task.repository.js";
import type { WorkerTransactionService } from "../services/worker-transaction.service.js";

/**
 * `media.preprocess` 阶段：下载音频 → 重采样切片 → `asr`。
 */
export class MediaPreprocessHandler implements StageHandler {
  constructor(
    private readonly mediaPreprocess: MediaPreprocessService,
    private readonly taskRepository: WorkerTaskRepository,
    private readonly transactionService: WorkerTransactionService,
  ) {}

  async handle(context: StageHandlerContext): Promise<void> {
    const { client, event, payload } = context;
    const task = await this.taskRepository.findById(client, payload.taskId);
    if (!task) {
      throw new Error(ErrorCode.RESOURCE_NOT_FOUND);
    }

    if (task.status === "queued") {
      await this.taskRepository.transitionTaskStatus(
        client,
        payload.taskId,
        "queued",
        "preprocessing",
      );
    } else if (task.status !== "preprocessing") {
      throw new Error(
        `unexpected task status for media.preprocess: ${task.status}`,
      );
    }

    const storageKey = task.audioStorageKey ?? task.sourceStorageKey;
    await this.mediaPreprocess.preprocess({
      taskId: payload.taskId,
      storageKey,
    });

    await this.transactionService.completeStage(client, {
      outboxEventId: event.id,
      taskId: payload.taskId,
      fromStatus: "preprocessing",
      toStatus: "asr_running",
      nextOutbox: buildNextStageOutboxRow({
        currentStage: PIPELINE_STAGE_MEDIA_PREPROCESS,
        taskId: payload.taskId,
        createdBy: payload.createdBy,
        isMp4: payload.isMp4,
      }),
    });
  }
}
