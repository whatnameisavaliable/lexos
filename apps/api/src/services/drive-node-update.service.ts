import type { AuthContext, DriveNodeUpdateBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { DriveNodeRepository } from "../repositories/drive-node.repository.js";
import {
  DRIVE_ROOT_FOLDER_NAME,
  mapDriveNodeSummary,
} from "../repositories/drive-node.types.js";
import type { DriveNodeGetResponse } from "./drive-node-get.service.js";

/**
 * 重命�?/ 移动云盘节点�?
 */
export class DriveNodeUpdateService {
  constructor(private readonly driveNodeRepository: DriveNodeRepository) {}

  async update(
    actor: AuthContext,
    accessToken: string,
    nodeId: string,
    body: DriveNodeUpdateBody,
  ): Promise<DriveNodeGetResponse> {
    const node = await this.driveNodeRepository.findById(accessToken, nodeId);
    if (!node) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Node not found");
    }

    if (node.createdBy !== actor.userId) {
      throw new AppHttpError(ErrorCode.AUTH_FORBIDDEN, "Forbidden");
    }

    if (node.name === DRIVE_ROOT_FOLDER_NAME && node.parentId == null) {
      throw new AppHttpError(ErrorCode.OPERATION_NOT_ALLOWED, "Root folder is immutable");
    }

    if (body.parentId) {
      if (body.parentId === nodeId) {
        throw new AppHttpError(
          ErrorCode.VALIDATION_FAILED,
          "Cannot move folder into itself",
        );
      }

      const targetParent = await this.driveNodeRepository.findById(
        accessToken,
        body.parentId,
      );
      if (!targetParent || targetParent.nodeType !== "folder") {
        throw new AppHttpError(
          ErrorCode.RESOURCE_NOT_FOUND,
          "Target folder not found",
        );
      }

      if (targetParent.createdBy !== actor.userId) {
        throw new AppHttpError(ErrorCode.AUTH_FORBIDDEN, "Forbidden");
      }

      if (node.nodeType === "folder") {
        const ancestors = await this.driveNodeRepository.listAncestorIds(
          accessToken,
          body.parentId,
        );
        if (ancestors.includes(nodeId)) {
          throw new AppHttpError(
            ErrorCode.VALIDATION_FAILED,
            "Cannot move folder into its own subtree",
          );
        }
      }
    }

    if (body.name === DRIVE_ROOT_FOLDER_NAME) {
      throw new AppHttpError(ErrorCode.VALIDATION_FAILED, "Invalid folder name");
    }

    try {
      const updated = await this.driveNodeRepository.updateNode(
        accessToken,
        nodeId,
        body,
      );
      const summary = mapDriveNodeSummary({
        id: updated.id,
        node_type: updated.nodeType,
        name: updated.name,
        size_bytes: updated.sizeBytes,
        mime_type: updated.mimeType,
        linked_task_id: updated.linkedTaskId,
        updated_at: updated.updatedAt,
      });
      return { ...summary, parentId: updated.parentId };
    } catch (err) {
      if (isDuplicateNameError(err)) {
        throw new AppHttpError(
          ErrorCode.VALIDATION_FAILED,
          "A sibling item with this name already exists",
        );
      }
      throw err;
    }
  }
}

function isDuplicateNameError(err: unknown): boolean {
  const message = err instanceof Error ? err.message.toLowerCase() : "";
  return message.includes("duplicate") || message.includes("unique");
}
