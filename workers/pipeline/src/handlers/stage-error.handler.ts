import { ErrorCode } from "@lexos/shared/api";
import type { PipelineStageOutboxPayload } from "@lexos/shared";
import type { OutboxEventRow } from "../repositories/outbox-event.repository.js";
import type { PoolClient } from "pg";
import { MediaExtractError } from "../services/media-extract.service.js";
import { MediaPreprocessError } from "../services/media-preprocess.service.js";
import type { WorkerTaskRepository } from "../repositories/worker-task.repository.js";
import type { TempDirCleanupService } from "../services/temp-dir-cleanup.service.js";

/**
 * 阶段未捕获异常：标记 `failed`、写入 `error_code`、清理临时目录。
 */
export class StageErrorHandler {
  constructor(
    private readonly taskRepository: WorkerTaskRepository,
    private readonly tempDirCleanup: TempDirCleanupService,
  ) {}

  async handle(
    client: PoolClient,
    event: OutboxEventRow,
    payload: PipelineStageOutboxPayload,
    error: unknown,
  ): Promise<void> {
    const task = await this.taskRepository.findById(client, payload.taskId);
    if (!task || task.status === "completed" || task.status === "failed") {
      return;
    }

    const errorCode = resolveErrorCode(error);
    const errorMessage =
      error instanceof Error ? error.message.slice(0, 500) : "Stage failed";

    await this.taskRepository.failTask(
      client,
      payload.taskId,
      task.status,
      errorCode,
      errorMessage,
    );
    await this.tempDirCleanup.cleanupTaskDir(payload.taskId);
    void event;
  }
}

function resolveErrorCode(error: unknown): string {
  if (error instanceof MediaExtractError) {
    return error.code;
  }
  if (error instanceof MediaPreprocessError) {
    return error.code;
  }
  if (error instanceof Error && error.message in ErrorCode) {
    return error.message;
  }
  return ErrorCode.INTERNAL_ERROR;
}
