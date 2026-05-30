import type { AuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import type { SignedDownloadUrlResult } from "../adapters/storage/storage.adapter.js";
import type { SupabaseStorageAdapter } from "../adapters/storage/supabase-storage.adapter.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AuditLogRepository } from "../repositories/audit-log.repository.js";
import type { TranscriptionTaskRepository } from "../repositories/transcription-task.repository.js";

/** 下载类型：音频抽音或原始源文件。 */
export type TranscriptionDownloadType = "audio" | "source";

export interface TranscriptionTaskDownloadRequestMeta {
  readonly ip?: string;
  readonly userAgent?: string;
}

/**
 * `GET /api/transcription/tasks/:id/download` 业务逻辑（`architecture.md` §5.5.3）。
 */
export class TranscriptionTaskDownloadService {
  constructor(
    private readonly taskRepository: TranscriptionTaskRepository,
    private readonly storageAdapter: SupabaseStorageAdapter,
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  /**
   * 签发签名下载 URL 并写 `file.download` 审计。
   */
  async download(
    actor: AuthContext,
    accessToken: string,
    taskId: string,
    type: TranscriptionDownloadType,
    meta: TranscriptionTaskDownloadRequestMeta = {},
  ): Promise<SignedDownloadUrlResult> {
    const task = await this.taskRepository.findById(accessToken, taskId);
    if (!task) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Task not found");
    }

    if (actor.role !== "admin" && task.createdBy !== actor.userId) {
      throw new AppHttpError(ErrorCode.AUTH_FORBIDDEN, "Forbidden");
    }

    let objectKey: string | null;
    let effectiveType: TranscriptionDownloadType = type;

    if (type === "audio") {
      objectKey = task.audioStorageKey;
      if (!objectKey && task.sourceStorageKey) {
        objectKey = task.sourceStorageKey;
        effectiveType = "source";
      }
    } else {
      objectKey = task.sourceStorageKey;
    }

    if (!objectKey) {
      throw new AppHttpError(
        ErrorCode.RESOURCE_NOT_FOUND,
        "Download object not available",
      );
    }

    const ownerId = actor.role === "admin" ? task.createdBy : actor.userId;
    const signed = await this.storageAdapter.createSignedDownloadUrl(
      "media",
      objectKey,
      ownerId,
    );

    await this.auditLogRepository.append({
      actorId: actor.userId,
      action: "file.download",
      targetType: "transcription_task",
      targetId: taskId,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      metadata: {
        downloadType: effectiveType,
        requestedType: type,
        objectKey: signed.objectKey,
        bucket: signed.bucket,
      },
    });

    return signed;
  }
}
