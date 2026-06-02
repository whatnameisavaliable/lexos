import type { AuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import type { TxtExportAdapter } from "../adapters/export/txt-export.adapter.js";
import type { SignedDownloadUrlResult } from "../adapters/storage/storage.adapter.js";
import type { SupabaseStorageAdapter } from "../adapters/storage/supabase-storage.adapter.js";
import {
  buildExportObjectKey,
  EXPORT_CONTENT_TYPES,
} from "../lib/transcription-export-key.js";
import { resolveTranscriptExportSections } from "../lib/export-transcript-text.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AuditWriterService, AuditRequestMeta } from "./audit-writer.service.js";
import type { TranscriptionTranscriptRepository } from "../repositories/transcription-transcript.repository.js";
import type { TranscriptionTaskRepository } from "../repositories/transcription-task.repository.js";
import type { TranscriptionExportRequestMeta } from "./transcription-export-docx.service.js";

/**
 * `POST /api/transcription/tasks/:id/export/txt` 业务逻辑�?
 */
export class TranscriptionExportTxtService {
  constructor(
    private readonly taskRepository: TranscriptionTaskRepository,
    private readonly transcriptRepository: TranscriptionTranscriptRepository,
    private readonly exportAdapter: TxtExportAdapter,
    private readonly storageAdapter: SupabaseStorageAdapter,
    private readonly auditWriterService: AuditWriterService,
  ) {}

  /** 生成 TXT �?上传 exports �?�?返回签名 URL�?*/
  async exportTxt(
    actor: AuthContext,
    accessToken: string,
    taskId: string,
    meta: TranscriptionExportRequestMeta = {},
  ): Promise<SignedDownloadUrlResult> {
    const task = await this.taskRepository.findById(accessToken, taskId);
    if (!task) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Task not found");
    }

    if (task.createdBy !== actor.userId) {
      throw new AppHttpError(ErrorCode.AUTH_FORBIDDEN, "Forbidden");
    }

    const transcript = await this.transcriptRepository.findByTaskId(
      accessToken,
      taskId,
    );
    if (!transcript) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Transcript not found");
    }

    const buffer = await this.exportAdapter.generate(
      resolveTranscriptExportSections({
        title: task.title,
        polishedText: transcript.polishedText,
        summaryText: transcript.summaryText,
        asrRawJson: transcript.asrRawJson,
      }),
    );

    const ownerId = task.createdBy;
    const objectKey = buildExportObjectKey(ownerId, taskId, "txt");
    await this.storageAdapter.uploadObject(
      "exports",
      objectKey,
      ownerId,
      buffer,
      EXPORT_CONTENT_TYPES.txt,
    );

    const signed = await this.storageAdapter.createSignedDownloadUrl(
      "exports",
      objectKey,
      ownerId,
    );

    await this.auditWriterService.write({actorId: actor.userId,
      action: "file.export",
      targetType: "transcription_task",
      targetId: taskId,
      metadata: {
        format: "txt",
        objectKey,
      }}, { ip: meta.ip ?? null, userAgent: meta.userAgent ?? null });

    return signed;
  }
}
