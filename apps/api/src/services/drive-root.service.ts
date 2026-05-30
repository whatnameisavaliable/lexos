import type { AuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { DriveNodeRepository } from "../repositories/drive-node.repository.js";
import type { DriveNodeRecord } from "../repositories/drive-node.types.js";

/** `GET /api/drive/root` 响应。 */
export interface DriveRootResponse {
  readonly rootId: string;
}

/**
 * 获取或创建用户云盘虚拟根目录（`database.md` §7.2.1）。
 */
export class DriveRootService {
  constructor(private readonly driveNodeRepository: DriveNodeRepository) {}

  /**
   * 返回 `__root__` 文件夹 id；不存在时创建。
   */
  async getOrCreateRoot(
    actor: AuthContext,
    accessToken: string,
  ): Promise<DriveRootResponse> {
    const existing = await this.driveNodeRepository.findRootByUser(accessToken);
    if (existing) {
      return { rootId: existing.id };
    }

    try {
      const created = await this.driveNodeRepository.createRootFolder(
        accessToken,
        actor.userId,
      );
      return { rootId: created.id };
    } catch (err) {
      const retry = await this.driveNodeRepository.findRootByUser(accessToken);
      if (retry) {
        return { rootId: retry.id };
      }
      throw err;
    }
  }

  /** 内部：获取根目录记录。 */
  async requireRootRecord(
    actor: AuthContext,
    accessToken: string,
  ): Promise<DriveNodeRecord> {
    const response = await this.getOrCreateRoot(actor, accessToken);
    const root = await this.driveNodeRepository.findById(
      accessToken,
      response.rootId,
    );
    if (!root) {
      throw new AppHttpError(ErrorCode.INTERNAL_ERROR, "Drive root unavailable");
    }
    return root;
  }
}
