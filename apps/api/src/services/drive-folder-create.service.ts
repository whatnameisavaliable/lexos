import type { AuthContext, DriveFolderCreateBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import {
  assertSameOwnerParent,
  DriveNodeRuleError,
} from "../domain/drive-node-rules.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { DriveNodeRepository } from "../repositories/drive-node.repository.js";
import {
  DRIVE_ROOT_FOLDER_NAME,
  mapDriveNodeSummary,
} from "../repositories/drive-node.types.js";
import type { DriveNodeGetResponse } from "./drive-node-get.service.js";

/**
 * 创建云盘子文件夹。
 */
export class DriveFolderCreateService {
  constructor(private readonly driveNodeRepository: DriveNodeRepository) {}

  async create(
    actor: AuthContext,
    accessToken: string,
    body: DriveFolderCreateBody,
  ): Promise<DriveNodeGetResponse> {
    const parent = await this.driveNodeRepository.findById(
      accessToken,
      body.parentId,
    );
    if (!parent || parent.nodeType !== "folder") {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Parent folder not found");
    }

    if (actor.role !== "admin" && parent.createdBy !== actor.userId) {
      throw new AppHttpError(ErrorCode.AUTH_FORBIDDEN, "Forbidden");
    }

    try {
      assertSameOwnerParent(parent, actor.userId);
    } catch (err) {
      if (err instanceof DriveNodeRuleError) {
        throw new AppHttpError(err.code, err.message);
      }
      throw err;
    }

    if (body.name === DRIVE_ROOT_FOLDER_NAME) {
      throw new AppHttpError(ErrorCode.VALIDATION_FAILED, "Invalid folder name");
    }

    try {
      const created = await this.driveNodeRepository.createFolder(accessToken, {
        createdBy: actor.userId,
        parentId: body.parentId,
        name: body.name,
      });
      const summary = mapDriveNodeSummary({
        id: created.id,
        node_type: created.nodeType,
        name: created.name,
        size_bytes: created.sizeBytes,
        mime_type: created.mimeType,
        linked_task_id: created.linkedTaskId,
        updated_at: created.updatedAt,
      });
      return { ...summary, parentId: created.parentId };
    } catch (err) {
      if (isDuplicateNameError(err)) {
        throw new AppHttpError(
          ErrorCode.VALIDATION_FAILED,
          "A folder with this name already exists",
        );
      }
      throw err;
    }
  }
}

function isDuplicateNameError(err: unknown): boolean {
  const message = err instanceof Error ? err.message.toLowerCase() : "";
  return (
    message.includes("duplicate") ||
    message.includes("unique") ||
    message.includes("drive_nodes_created_by_parent_name_uidx")
  );
}
