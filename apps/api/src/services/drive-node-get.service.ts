import type { AuthContext } from "@lexos/shared";
import type { DriveNodeSummary } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { isArchiveFolderNode } from "../domain/drive-archive-detect.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { DriveNodeRepository } from "../repositories/drive-node.repository.js";
import { DRIVE_ROOT_FOLDER_NAME } from "../repositories/drive-node.types.js";
import { mapDriveNodeSummary } from "../repositories/drive-node.types.js";

/** `GET /api/drive/nodes/:id` 响应。 */
export interface DriveNodeGetResponse extends DriveNodeSummary {
  readonly parentId: string | null;
}

/**
 * 云盘节点详情。
 */
export class DriveNodeGetService {
  constructor(private readonly driveNodeRepository: DriveNodeRepository) {}

  async get(
    actor: AuthContext,
    accessToken: string,
    nodeId: string,
  ): Promise<DriveNodeGetResponse> {
    const node = await this.driveNodeRepository.findById(accessToken, nodeId);
    if (!node) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Node not found");
    }

    if (actor.role !== "admin" && node.createdBy !== actor.userId) {
      throw new AppHttpError(ErrorCode.AUTH_FORBIDDEN, "Forbidden");
    }

    if (node.name === DRIVE_ROOT_FOLDER_NAME && node.parentId == null) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Node not found");
    }

    let parentName: string | null = null;
    if (node.parentId) {
      const parent = await this.driveNodeRepository.findById(
        accessToken,
        node.parentId,
      );
      parentName = parent?.name ?? null;
    }

    const summary = mapDriveNodeSummary(
      {
        id: node.id,
        node_type: node.nodeType,
        name: node.name,
        size_bytes: node.sizeBytes,
        mime_type: node.mimeType,
        linked_task_id: node.linkedTaskId,
        updated_at: node.updatedAt,
      },
      {
        isArchiveFolder: isArchiveFolderNode({
          nodeType: node.nodeType,
          name: node.name,
          linkedTaskId: node.linkedTaskId,
          parentName,
        }),
      },
    );

    return {
      ...summary,
      parentId: node.parentId,
    };
  }
}
