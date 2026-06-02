import type { AuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AuditWriterService, AuditRequestMeta } from "./audit-writer.service.js";
import type { DriveNodeAdminRepository } from "../repositories/drive-node-admin.repository.js";
import type { DriveNodeRepository } from "../repositories/drive-node.repository.js";
import { DRIVE_ROOT_FOLDER_NAME } from "../repositories/drive-node.types.js";

export interface DriveNodeDeleteRequestMeta {
  readonly ip?: string;
  readonly userAgent?: string;
}

export interface DriveNodeDeleteResult {
  readonly id: string;
  readonly deletedCount: number;
}

/**
 * ?????????????????????admin ???????PRD-3.6-02/03??
 */
export class DriveNodeDeleteService {
  constructor(
    private readonly driveNodeRepository: DriveNodeRepository,
    private readonly driveNodeAdminRepository: DriveNodeAdminRepository,
    private readonly auditWriterService: AuditWriterService,
  ) {}

  async delete(
    actor: AuthContext,
    accessToken: string,
    nodeId: string,
    meta: DriveNodeDeleteRequestMeta = {},
  ): Promise<DriveNodeDeleteResult> {
    const node =
      actor.role === "admin"
        ? await this.driveNodeAdminRepository.findById(nodeId)
        : await this.driveNodeRepository.findById(accessToken, nodeId);

    if (!node) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Node not found");
    }

    if (actor.role !== "admin" && node.createdBy !== actor.userId) {
      throw new AppHttpError(ErrorCode.AUTH_FORBIDDEN, "Forbidden");
    }

    if (node.name === DRIVE_ROOT_FOLDER_NAME && node.parentId == null) {
      throw new AppHttpError(
        ErrorCode.OPERATION_NOT_ALLOWED,
        "Root folder cannot be deleted",
      );
    }

    const deletedCount =
      actor.role === "admin"
        ? await this.driveNodeAdminRepository.softDeleteSubtree(nodeId)
        : await this.driveNodeRepository.softDeleteSubtree(accessToken, nodeId);

    if (deletedCount === 0) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Node not found");
    }

    await this.auditWriterService.write(
      {
        actorId: actor.userId,
        action: "file.delete",
        targetType: "drive_node",
        targetId: nodeId,
        metadata: {
          nodeType: node.nodeType,
          name: node.name,
          deletedCount,
          cascade: node.nodeType === "folder" && deletedCount > 1,
          ownerId: node.createdBy,
          deletedByAdmin: actor.role === "admin",
        },
      },
      { ip: meta.ip ?? null, userAgent: meta.userAgent ?? null },
    );

    return { id: nodeId, deletedCount };
  }
}
