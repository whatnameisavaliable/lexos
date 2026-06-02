import type { AuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { TranscriptionTaskDetail } from "@lexos/shared";
import type { TranscriptionTaskRepository } from "../repositories/transcription-task.repository.js";

/**
 * `GET /api/transcription/tasks/:id` ??????
 */
export class TranscriptionTaskGetService {
  constructor(private readonly taskRepository: TranscriptionTaskRepository) {}

  /**
   * ????????????????`RESOURCE_NOT_FOUND`?????????????
   */
  async get(
    actor: AuthContext,
    accessToken: string,
    taskId: string,
  ): Promise<TranscriptionTaskDetail> {
    const owned = await this.taskRepository.findById(accessToken, taskId);
    if (!owned || owned.createdBy !== actor.userId) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Task not found");
    }

    const task = await this.taskRepository.findDetailForUser(accessToken, taskId);
    if (!task) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Task not found");
    }

    return task;
  }
}
