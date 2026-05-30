import type { AuthContext, TranscriptDetail } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { TranscriptionTranscriptRepository } from "../repositories/transcription-transcript.repository.js";
import type { TranscriptionTaskRepository } from "../repositories/transcription-task.repository.js";

/**
 * `GET /api/transcription/tasks/:id/transcript` 业务逻辑。
 */
export class TranscriptionTranscriptGetService {
  constructor(
    private readonly taskRepository: TranscriptionTaskRepository,
    private readonly transcriptRepository: TranscriptionTranscriptRepository,
  ) {}

  /**
   * 查询任务文稿；越权或不存在返回 `RESOURCE_NOT_FOUND`。
   */
  async get(
    actor: AuthContext,
    accessToken: string,
    taskId: string,
  ): Promise<TranscriptDetail> {
    const task = await this.taskRepository.findById(accessToken, taskId);
    if (!task) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Task not found");
    }

    if (actor.role !== "admin" && task.createdBy !== actor.userId) {
      throw new AppHttpError(ErrorCode.AUTH_FORBIDDEN, "Forbidden");
    }

    const transcript = await this.transcriptRepository.findByTaskId(
      accessToken,
      taskId,
    );
    if (!transcript) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Transcript not found");
    }

    return {
      taskId: transcript.taskId,
      asrRawJson: transcript.asrRawJson,
      polishedText: transcript.polishedText,
      summaryText: transcript.summaryText,
      version: transcript.version,
      diarizationDegraded: task.diarizationDegraded,
      updatedAt: transcript.updatedAt,
    };
  }
}
