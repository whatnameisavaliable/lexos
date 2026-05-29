import type { AiInvocationLogsQuery } from "@lexos/shared";
import { buildPaginationMeta } from "@lexos/shared/api";
import type { AiInvocationLogRepository } from "../repositories/ai-invocation-log.repository.js";
import { toAiInvocationLogPublic } from "./ai-model-mapper.js";

export class AiInvocationLogListService {
  constructor(
    private readonly invocationLogRepository: AiInvocationLogRepository,
  ) {}

  async list(query: AiInvocationLogsQuery) {
    const result = await this.invocationLogRepository.listAdmin(query);
    return {
      items: result.items.map(toAiInvocationLogPublic),
      meta: buildPaginationMeta(query.limit, result.nextCursor),
    };
  }
}
