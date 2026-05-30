import type { AuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AuditLogRepository } from "../repositories/audit-log.repository.js";
import type { DriveNodeRepository } from "../repositories/drive-node.repository.js";
import { DRIVE_ROOT_FOLDER_NAME } from "../repositories/drive-node.types.js";

export interface DriveNodeDeleteRequestMeta {
  readonly ip?: string;
  readonly userAgent?: string;
}

/**
 * 软删除云盘节点。
 */
export class DriveNodeDeleteService {
  constructor(
    private readonly driveNodeRepository: DriveNodeRepository,
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  async delete(
    actor: AuthContext,
    accessToken: string,
    nodeId: string,
    meta: DriveNodeDeleteRequestMeta = {},
  ): Promise<{ readonly id: string }> {
    const node = await this.driveNodeRepository.findById(accessToken, nodeId);
    if (!node) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Node not found");
    }

    if (actor.role !== "admin" && node.createdBy !== actor.userId) {
      throw new AppHttpError(ErrorCode.AUTH_FORBIDDEN, "Forbidden");
    }

    if (node.name === DRIVE_ROOT_FOLDER_NAME && node.parentId == null) {
      throw new AppHttpError(ErrorCode.OPERATION_NOT_ALLOWED, "Root folder cannot be deleted");
    }

    if (node.nodeType === "folder") {
      const childCount = await this.driveNodeRepository.countActiveChildren(
        accessToken,
        nodeId,
      );
      if (childCount > 0) {
        throw new AppHttpError(
          ErrorCode.OPERATION_NOT_ALLOWED,
          "Folder is not empty",
        );
      }
    }

    const deleted = await this.driveNodeRepository.softDelete(accessToken, nodeId);
    if (!deleted) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Node not found");
    }

    await this.auditLogRepository.append({
      actorId: actor.userId,
      action: "file.delete",
      targetType: "drive_node",
      targetId: nodeId,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      metadata: {
        nodeType: node.nodeType,
        name: node.name,
      },
    });

    return { id: nodeId };
  }
}
