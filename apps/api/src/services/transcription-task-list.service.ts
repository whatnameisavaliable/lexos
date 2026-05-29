import type { AuthContext, TranscriptionTaskListQuery } from "@lexos/shared";
import { buildPaginationMeta } from "@lexos/shared/api";
import type { TranscriptionTaskListResult } from "../repositories/transcription-task.types.js";
import type { TranscriptionTaskRepository } from "../repositories/transcription-task.repository.js";

/** `GET /api/transcription/tasks` 响应。 */
export interface TranscriptionTaskListResponse {
  readonly items: TranscriptionTaskListResult["items"];
  readonly meta: ReturnType<typeof buildPaginationMeta>;
}

/**
 * 转写任务列表（律师本人；管理员全量，RLS 区分）。
 */
export class TranscriptionTaskListService {
  constructor(private readonly taskRepository: TranscriptionTaskRepository) {}

  /**
   * 分页列表。
   */
  async list(
    actor: AuthContext,
    accessToken: string,
    query: TranscriptionTaskListQuery,
  ): Promise<TranscriptionTaskListResponse> {
    const result =
      actor.role === "admin"
        ? await this.taskRepository.listAll(accessToken, query)
        : await this.taskRepository.listForUser(accessToken, query);

    return {
      items: result.items,
      meta: buildPaginationMeta(query.limit, result.nextCursor),
    };
  }
}
