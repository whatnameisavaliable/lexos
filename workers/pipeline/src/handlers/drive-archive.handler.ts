import { ErrorCode } from "@lexos/shared/api";
import { withPgClient } from "../infra/with-pg-client.js";
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
    const { pool, event, payload } = context;

    const folderId = await withPgClient(pool, async (client) => {
      const task = await this.taskRepository.findById(client, payload.taskId);
      if (!task) {
        throw new Error(ErrorCode.RESOURCE_NOT_FOUND);
      }
      if (task.status !== "llm_running") {
        throw new Error(`unexpected task status for drive.archive: ${task.status}`);
      }

      const id = await this.driveRepository.createArchiveFolder(client, {
        userId: payload.createdBy,
        taskId: payload.taskId,
        title: task.title,
      });
      await this.taskRepository.setArchiveFolderId(client, payload.taskId, id);

      const audioKey = task.audioStorageKey ?? task.sourceStorageKey;
      if (audioKey) {
        const audioName = resolveWorkerArchiveAudioFileName(audioKey);
        await this.driveRepository.ensureArchiveFileRef(client, {
          userId: payload.createdBy,
          folderId: id,
          taskId: payload.taskId,
          name: audioName,
          storageKey: audioKey,
          mimeType: guessWorkerMimeType(audioName),
          sizeBytes: Number(task.sizeBytes),
        });
      }

      await this.transactionService.completeStage(client, {
        outboxEventId: event.id,
        taskId: payload.taskId,
        fromStatus: "llm_running",
        toStatus: "completed",
        nextOutbox: null,
      });
      return id;
    });

    await this.auditAdapter.appendTaskComplete(payload.taskId, {
      archiveFolderId: folderId,
    });
    await this.tempDirCleanup.cleanupTaskDir(payload.taskId);
  }
}

function resolveWorkerArchiveAudioFileName(storageKey: string): string {
  const base = storageKey.replace(/\\/g, "/").split("/").pop()?.trim();
  const fileName = base && base.length > 0 ? base : "audio.mp3";
  const dot = fileName.lastIndexOf(".");
  const ext = dot > 0 ? fileName.slice(dot) : ".mp3";
  return `录音${ext}`;
}

function guessWorkerMimeType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".mp3")) {
    return "audio/mpeg";
  }
  if (lower.endsWith(".wav")) {
    return "audio/wav";
  }
  if (lower.endsWith(".m4a")) {
    return "audio/mp4";
  }
  if (lower.endsWith(".mp4")) {
    return "video/mp4";
  }
  return "application/octet-stream";
}
