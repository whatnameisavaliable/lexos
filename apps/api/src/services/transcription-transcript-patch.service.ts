import type { AuthContext, TranscriptPatchBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { TranscriptionTranscriptRepository } from "../repositories/transcription-transcript.repository.js";
import type { TranscriptionTaskRepository } from "../repositories/transcription-task.repository.js";

/** PATCH 成功响应。 */
export interface TranscriptPatchResult {
  readonly taskId: string;
  readonly polishedText: string;
  readonly version: number;
  readonly updatedAt: string;
}

/**
 * `PATCH /api/transcription/tasks/:id/transcript` 业务逻辑（`architecture.md` §6.5）。
 */
export class TranscriptionTranscriptPatchService {
  constructor(
    private readonly taskRepository: TranscriptionTaskRepository,
    private readonly transcriptRepository: TranscriptionTranscriptRepository,
  ) {}

  /**
   * 乐观锁更新润色文稿；冲突返回 `RESOURCE_CONFLICT`。
   */
  async patch(
    actor: AuthContext,
    accessToken: string,
    taskId: string,
    body: TranscriptPatchBody,
    expectedVersion: number,
  ): Promise<TranscriptPatchResult> {
    const task = await this.taskRepository.findById(accessToken, taskId);
    if (!task) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Task not found");
    }

    if (actor.role !== "admin" && task.createdBy !== actor.userId) {
      throw new AppHttpError(ErrorCode.AUTH_FORBIDDEN, "Forbidden");
    }

    const result = await this.transcriptRepository.updatePolishedText(
      accessToken,
      taskId,
      body.polishedText,
      expectedVersion,
      actor.userId,
    );

    if (!result.updated || !result.record) {
      throw new AppHttpError(
        ErrorCode.RESOURCE_CONFLICT,
        "Transcript version conflict",
      );
    }

    return {
      taskId: result.record.taskId,
      polishedText: result.record.polishedText ?? body.polishedText,
      version: result.record.version,
      updatedAt: result.record.updatedAt,
    };
  }
}
