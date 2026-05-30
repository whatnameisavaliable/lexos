import type { AuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AuditLogRepository } from "../repositories/audit-log.repository.js";
import type { TranscriptionTaskRecord } from "../repositories/transcription-task.types.js";
import type { TranscriptionTaskRepository } from "../repositories/transcription-task.repository.js";

/** 允许软删除的任务终态（`tasks.md` M6-D · `database.md` §6.1）。 */
const DELETABLE_TASK_STATUSES = new Set(["completed", "failed"]);

export interface TranscriptionTaskDeleteRequestMeta {
  readonly ip?: string;
  readonly userAgent?: string;
}

/**
 * `DELETE /api/transcription/tasks/:id` 业务逻辑。
 */
export class TranscriptionTaskDeleteService {
  constructor(
    private readonly taskRepository: TranscriptionTaskRepository,
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  /**
   * 软删除任务；进行中任务返回 `TASK_INVALID_STATE`。
   */
  async delete(
    actor: AuthContext,
    accessToken: string,
    taskId: string,
    meta: TranscriptionTaskDeleteRequestMeta = {},
  ): Promise<TranscriptionTaskRecord> {
    const task = await this.taskRepository.findById(accessToken, taskId);
    if (!task) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Task not found");
    }

    if (actor.role !== "admin" && task.createdBy !== actor.userId) {
      throw new AppHttpError(ErrorCode.AUTH_FORBIDDEN, "Forbidden");
    }

    if (!DELETABLE_TASK_STATUSES.has(task.status)) {
      throw new AppHttpError(
        ErrorCode.TASK_INVALID_STATE,
        "Task cannot be deleted while in progress",
      );
    }

    const deleted = await this.taskRepository.softDelete(accessToken, taskId);
    if (!deleted) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Task not found");
    }

    await this.auditLogRepository.append({
      actorId: actor.userId,
      action: "file.delete",
      targetType: "transcription_task",
      targetId: taskId,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      metadata: {
        previousStatus: task.status,
      },
    });

    return deleted;
  }
}
