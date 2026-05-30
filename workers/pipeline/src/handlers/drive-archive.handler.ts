import { ErrorCode } from "@lexos/shared/api";
import type { StageHandler, StageHandlerContext } from "./stage-handler.js";
import type { WorkerAuditAdapter } from "../adapters/audit/worker-audit.adapter.js";
import type { WorkerDriveRepository } from "../repositories/worker-drive.repository.js";
import type { WorkerTaskRepository } from "../repositories/worker-task.repository.js";
import type { WorkerTransactionService } from "../services/worker-transaction.service.js";
import type { TempDirCleanupService } from "../services/temp-dir-cleanup.service.js";

/**
 * `drive.archive` 阶段：创建云盘目录 → `completed` + 审计。
 */
export class DriveArchiveHandler implements StageHandler {
  constructor(
    private readonly driveRepository: WorkerDriveRepository,
    private readonly taskRepository: WorkerTaskRepository,
    private readonly transactionService: WorkerTransactionService,
    private readonly auditAdapter: WorkerAuditAdapter,
    private readonly tempDirCleanup: TempDirCleanupService,
  ) {}

  async handle(context: StageHandlerContext): Promise<void> {
    const { client, event, payload } = context;
    const task = await this.taskRepository.findById(client, payload.taskId);
    if (!task) {
      throw new Error(ErrorCode.RESOURCE_NOT_FOUND);
    }
    if (task.status !== "llm_running") {
      throw new Error(`unexpected task status for drive.archive: ${task.status}`);
    }

    const folderId = await this.driveRepository.createArchiveFolder(client, {
      userId: payload.createdBy,
      taskId: payload.taskId,
      title: task.title,
    });
    await this.taskRepository.setArchiveFolderId(client, payload.taskId, folderId);

    await this.transactionService.completeStage(client, {
      outboxEventId: event.id,
      taskId: payload.taskId,
      fromStatus: "llm_running",
      toStatus: "completed",
      nextOutbox: null,
    });

    await this.auditAdapter.appendTaskComplete(payload.taskId, {
      archiveFolderId: folderId,
    });
    await this.tempDirCleanup.cleanupTaskDir(payload.taskId);
  }
}
