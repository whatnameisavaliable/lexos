import type { AuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import type { DocxExportAdapter } from "../adapters/export/docx-export.adapter.js";
import type { SignedDownloadUrlResult } from "../adapters/storage/storage.adapter.js";
import type { SupabaseStorageAdapter } from "../adapters/storage/supabase-storage.adapter.js";
import {
  buildExportObjectKey,
  EXPORT_CONTENT_TYPES,
} from "../lib/transcription-export-key.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AuditLogRepository } from "../repositories/audit-log.repository.js";
import type { TranscriptionTranscriptRepository } from "../repositories/transcription-transcript.repository.js";
import type { TranscriptionTaskRepository } from "../repositories/transcription-task.repository.js";

export interface TranscriptionExportRequestMeta {
  readonly ip?: string;
  readonly userAgent?: string;
}

/**
 * `POST /api/transcription/tasks/:id/export/docx` 业务逻辑。
 */
export class TranscriptionExportDocxService {
  constructor(
    private readonly taskRepository: TranscriptionTaskRepository,
    private readonly transcriptRepository: TranscriptionTranscriptRepository,
    private readonly exportAdapter: DocxExportAdapter,
    private readonly storageAdapter: SupabaseStorageAdapter,
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  /** 生成 DOCX → 上传 exports 桶 → 返回签名 URL。 */
  async exportDocx(
    actor: AuthContext,
    accessToken: string,
    taskId: string,
    meta: TranscriptionExportRequestMeta = {},
  ): Promise<SignedDownloadUrlResult> {
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

    const buffer = await this.exportAdapter.generate({
      title: task.title,
      polishedText: transcript.polishedText,
      summaryText: transcript.summaryText,
    });

    const ownerId = task.createdBy;
    const objectKey = buildExportObjectKey(ownerId, taskId, "docx");
    await this.storageAdapter.uploadObject(
      "exports",
      objectKey,
      ownerId,
      buffer,
      EXPORT_CONTENT_TYPES.docx,
    );

    const signed = await this.storageAdapter.createSignedDownloadUrl(
      "exports",
      objectKey,
      ownerId,
    );

    await this.auditLogRepository.append({
      actorId: actor.userId,
      action: "file.export",
      targetType: "transcription_task",
      targetId: taskId,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      metadata: {
        format: "docx",
        objectKey,
      },
    });

    return signed;
  }
}
