import type {
  AuthContext,
  TranscriptionUploadInitBody,
  TranscriptionUploadInitResponse,
} from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import {
  isMp4SourceMime,
  MAX_DURATION_SEC,
  MAX_SIZE_BYTES,
} from "@lexos/shared";
import type { SupabaseStorageAdapter } from "../adapters/storage/supabase-storage.adapter.js";
import {
  buildObjectStorageKey,
  buildStorageKeyPrefix,
} from "../lib/transcription-storage-key.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AuditWriterService, AuditRequestMeta } from "./audit-writer.service.js";
import type { TranscriptionTaskRepository } from "../repositories/transcription-task.repository.js";
import type { UploadSessionRepository } from "../repositories/upload-session.repository.js";

export interface TranscriptionUploadInitRequestMeta {
  readonly ip?: string;
  readonly userAgent?: string;
}

/**
 * `POST /api/transcription/uploads/init` 业务逻辑。
 */
export class TranscriptionUploadInitService {
  constructor(
    private readonly taskRepository: TranscriptionTaskRepository,
    private readonly uploadSessionRepository: UploadSessionRepository,
    private readonly storageAdapter: SupabaseStorageAdapter,
    private readonly auditWriterService: AuditWriterService,
    private readonly storageBucketMedia: string,
  ) {}

  /**
   * 创建 uploading 任务、上传会话并签发 TUS 参数。
   */
  async init(
    actor: AuthContext,
    accessToken: string,
    body: TranscriptionUploadInitBody,
    meta: TranscriptionUploadInitRequestMeta = {},
  ): Promise<TranscriptionUploadInitResponse> {
    this.assertWithinLimits(body);

    if (body.idempotencyKey) {
      const existing = await this.taskRepository.findByIdempotencyKey(
        accessToken,
        body.idempotencyKey,
      );
      if (existing) {
        return this.buildIdempotentResponse(accessToken, existing, body.fileName);
      }
    }

    const isMp4 = isMp4SourceMime(body.mimeType);
    const placeholderKey = `${actor.userId}/pending/${crypto.randomUUID()}`;
    const task = await this.taskRepository.createUploading(accessToken, {
      createdBy: actor.userId,
      title: body.title,
      sourceMime: body.mimeType,
      sourceStorageKey: placeholderKey,
      sizeBytes: Number(body.sizeBytes),
      durationSec: body.durationSec ?? null,
      isMp4,
      idempotencyKey: body.idempotencyKey ?? null,
    });

    const storageKeyPrefix = buildStorageKeyPrefix(actor.userId, task.id);
    const sourceStorageKey = buildObjectStorageKey(storageKeyPrefix, body.fileName);
    await this.taskRepository.updateSourceStorageKey(
      accessToken,
      task.id,
      sourceStorageKey,
    );

    const session = await this.uploadSessionRepository.create(accessToken, {
      taskId: task.id,
      ownerId: actor.userId,
      storageKeyPrefix,
      expectedMaxBytes: Number(body.sizeBytes),
    });

    const tus = await this.storageAdapter.createResumableUploadUrl({
      objectKey: sourceStorageKey,
    });

    await this.auditWriterService.write({actorId: actor.userId,
      action: "task.create",
      targetType: "transcription_task",
      targetId: task.id,
      metadata: {
        uploadSessionId: session.id,
        sizeBytes: Number(body.sizeBytes),
        mimeType: body.mimeType,
      }}, { ip: meta.ip ?? null, userAgent: meta.userAgent ?? null });

    return {
      uploadSessionId: session.id,
      taskId: task.id,
      storageKeyPrefix,
      storageObjectKey: sourceStorageKey,
      storageBucket: this.storageBucketMedia,
      tusEndpoint: tus.tusEndpoint,
      tusHeaders: tus.tusHeaders,
    };
  }

  private assertWithinLimits(body: TranscriptionUploadInitBody): void {
    if (body.sizeBytes > BigInt(MAX_SIZE_BYTES)) {
      throw new AppHttpError(
        ErrorCode.RESOURCE_LIMIT_EXCEEDED,
        "File size exceeds 1 GB limit",
      );
    }
    if (body.durationSec != null && body.durationSec > MAX_DURATION_SEC) {
      throw new AppHttpError(
        ErrorCode.RESOURCE_LIMIT_EXCEEDED,
        "Duration exceeds 5 hour limit",
      );
    }
  }

  private async buildIdempotentResponse(
    accessToken: string,
    task: Awaited<ReturnType<TranscriptionTaskRepository["findById"]>>,
    fileName: string,
  ): Promise<TranscriptionUploadInitResponse> {
    if (!task) {
      throw new AppHttpError(ErrorCode.INTERNAL_ERROR, "Idempotent task missing");
    }

    const session = await this.uploadSessionRepository.findOpenByTaskId(
      accessToken,
      task.id,
    );
    if (!session) {
      throw new AppHttpError(
        ErrorCode.RESOURCE_CONFLICT,
        "Task already exists without an open upload session",
      );
    }

    const objectKey =
      task.sourceStorageKey ||
      buildObjectStorageKey(session.storageKeyPrefix, fileName);
    const tus = await this.storageAdapter.createResumableUploadUrl({
      objectKey,
    });

    return {
      uploadSessionId: session.id,
      taskId: task.id,
      storageKeyPrefix: session.storageKeyPrefix,
      storageObjectKey: objectKey,
      storageBucket: this.storageBucketMedia,
      tusEndpoint: tus.tusEndpoint,
      tusHeaders: tus.tusHeaders,
    };
  }
}
