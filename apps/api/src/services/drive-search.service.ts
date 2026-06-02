import type { AuthContext, DriveSearchQuery } from "@lexos/shared";
import { buildPaginationMeta } from "@lexos/shared/api";
import type { DriveSearchRepository } from "../repositories/drive-search.repository.js";

/** 检索结果项（含跳转信息）�?*/
export interface DriveSearchResultItem {
  readonly taskId: string;
  readonly taskTitle: string;
  readonly archiveFolderId: string | null;
  readonly matchedField: "polished_text" | "summary_text";
  readonly snippet: string;
  readonly score: number;
}

/** `GET /api/drive/search` 响应�?*/
export interface DriveSearchResponse {
  readonly items: readonly DriveSearchResultItem[];
  readonly meta: ReturnType<typeof buildPaginationMeta>;
}

/**
 * 云盘全文检索（仅本人任务文�?· `database.md` §7.3.2）�?
 */
export class DriveSearchService {
  constructor(private readonly driveSearchRepository: DriveSearchRepository) {}

  async search(
    actor: AuthContext,
    query: DriveSearchQuery,
  ): Promise<DriveSearchResponse> {
    const result = await this.driveSearchRepository.searchTranscripts(
      actor.userId,
      query,
    );

    return {
      items: result.items,
      meta: buildPaginationMeta(query.limit, result.nextCursor),
    };
  }
}
