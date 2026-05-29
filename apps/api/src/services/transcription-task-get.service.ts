import type { AuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { TranscriptionTaskRecord } from "../repositories/transcription-task.types.js";
import type { TranscriptionTaskRepository } from "../repositories/transcription-task.repository.js";

/**
 * `GET /api/transcription/tasks/:id` 业务逻辑。
 */
export class TranscriptionTaskGetService {
  constructor(private readonly taskRepository: TranscriptionTaskRepository) {}

  /**
   * 查询任务详情；越权或不存在返回 `RESOURCE_NOT_FOUND`（不泄露存在性给律师）。
   */
  async get(
    actor: AuthContext,
    accessToken: string,
    taskId: string,
  ): Promise<TranscriptionTaskRecord> {
    const task = await this.taskRepository.findById(accessToken, taskId);
    if (!task) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Task not found");
    }

    if (actor.role !== "admin" && task.createdBy !== actor.userId) {
      throw new AppHttpError(ErrorCode.AUTH_FORBIDDEN, "Forbidden");
    }

    return task;
  }
}
