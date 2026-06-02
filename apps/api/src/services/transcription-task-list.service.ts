import type { AuthContext, TranscriptionTaskListQuery } from "@lexos/shared";
import { buildPaginationMeta } from "@lexos/shared/api";
import type { TranscriptionTaskListResult } from "../repositories/transcription-task.types.js";
import type { TranscriptionTaskRepository } from "../repositories/transcription-task.repository.js";

/** `GET /api/transcription/tasks` ??? */
export interface TranscriptionTaskListResponse {
  readonly items: TranscriptionTaskListResult["items"];
  readonly meta: ReturnType<typeof buildPaginationMeta>;
}

/**
 * ?????????????admin ?????????PRD-2-06??
 */
export class TranscriptionTaskListService {
  constructor(private readonly taskRepository: TranscriptionTaskRepository) {}

  /**
   * ?????
   */
  async list(
    _actor: AuthContext,
    accessToken: string,
    query: TranscriptionTaskListQuery,
  ): Promise<TranscriptionTaskListResponse> {
    const result = await this.taskRepository.listForUser(accessToken, query);

    return {
      items: result.items,
      meta: buildPaginationMeta(query.limit, result.nextCursor),
    };
  }
}
