import type { AuthContext, DriveNodesListQuery } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { buildPaginationMeta } from "@lexos/shared/api";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { DriveNodeRepository } from "../repositories/drive-node.repository.js";
import { DRIVE_ROOT_FOLDER_NAME } from "../repositories/drive-node.types.js";
import type { DriveArchiveBackfillService } from "./drive-archive-backfill.service.js";

/** `GET /api/drive/nodes` 响应。 */
export interface DriveNodesListResponse {
  readonly items: Awaited<
    ReturnType<DriveNodeRepository["listChildren"]>
  >["items"];
  readonly meta: ReturnType<typeof buildPaginationMeta>;
}

/**
 * 云盘目录子节点列表（分页默认 50）。
 */
export class DriveNodesListService {
  constructor(
    private readonly driveNodeRepository: DriveNodeRepository,
    private readonly archiveBackfillService: DriveArchiveBackfillService,
  ) {}

  async list(
    actor: AuthContext,
    accessToken: string,
    query: DriveNodesListQuery,
  ): Promise<DriveNodesListResponse> {
    const parent = await this.driveNodeRepository.findById(
      accessToken,
      query.parentId,
    );
    if (!parent) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Folder not found");
    }

    if (actor.role !== "admin" && parent.createdBy !== actor.userId) {
      throw new AppHttpError(ErrorCode.AUTH_FORBIDDEN, "Forbidden");
    }

    if (parent.name === DRIVE_ROOT_FOLDER_NAME && parent.parentId == null) {
      // 允许列出根目录内容
    }

    if (parent.linkedTaskId != null) {
      await this.archiveBackfillService.ensureArchiveFilesForFolder(
        actor,
        accessToken,
        parent.id,
      );
    }

    const result = await this.driveNodeRepository.listChildren(accessToken, {
      parentId: query.parentId,
      limit: query.limit,
      cursor: query.cursor,
    });

    return {
      items: result.items.filter((item) => item.name !== DRIVE_ROOT_FOLDER_NAME),
      meta: buildPaginationMeta(query.limit, result.nextCursor),
    };
  }
}
