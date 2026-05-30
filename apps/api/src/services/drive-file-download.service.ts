import type { AuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import type { SignedDownloadUrlResult, StorageBucketName } from "../adapters/storage/storage.adapter.js";
import type { SupabaseStorageAdapter } from "../adapters/storage/supabase-storage.adapter.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AuditLogRepository } from "../repositories/audit-log.repository.js";
import type { DriveNodeRepository } from "../repositories/drive-node.repository.js";

export interface DriveFileDownloadRequestMeta {
  readonly ip?: string;
  readonly userAgent?: string;
}

/**
 * `GET /api/drive/files/:id/download` 业务逻辑（`architecture.md` §5.5.3）。
 */
export class DriveFileDownloadService {
  constructor(
    private readonly driveNodeRepository: DriveNodeRepository,
    private readonly storageAdapter: SupabaseStorageAdapter,
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  async download(
    actor: AuthContext,
    accessToken: string,
    nodeId: string,
    meta: DriveFileDownloadRequestMeta = {},
  ): Promise<SignedDownloadUrlResult> {
    const node = await this.driveNodeRepository.findById(accessToken, nodeId);
    if (!node || node.nodeType !== "file") {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "File not found");
    }

    if (actor.role !== "admin" && node.createdBy !== actor.userId) {
      throw new AppHttpError(ErrorCode.AUTH_FORBIDDEN, "Forbidden");
    }

    if (!node.storageKey) {
      throw new AppHttpError(
        ErrorCode.RESOURCE_NOT_FOUND,
        "File storage reference missing",
      );
    }

    const ownerId = node.createdBy;
    const bucket = resolveDriveFileBucket(node.storageKey);
    const signed = await this.storageAdapter.createSignedDownloadUrl(
      bucket,
      node.storageKey,
      ownerId,
    );

    await this.auditLogRepository.append({
      actorId: actor.userId,
      action: "file.download",
      targetType: "drive_node",
      targetId: nodeId,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      metadata: {
        objectKey: signed.objectKey,
        bucket: signed.bucket,
        fileName: node.name,
      },
    });

    return signed;
  }
}

/**
 * 根据对象键推断 Storage 桶（导出文件 vs 媒体文件）。
 */
export function resolveDriveFileBucket(storageKey: string): StorageBucketName {
  if (storageKey.includes("/export-") || /\.(docx|pdf|txt)$/i.test(storageKey)) {
    return "exports";
  }
  return "media";
}
