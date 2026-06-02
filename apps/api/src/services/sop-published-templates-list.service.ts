import type { AuthContext } from "@lexos/shared";
import { parseLimit, type SopPublishedTemplateItem } from "@lexos/shared";
import type {
  PublishedTemplatesListResult,
  SopTemplateReadRepository,
} from "../repositories/sop-template-read.repository.js";

export interface SopPublishedTemplatesListQuery {
  readonly limit?: string | number;
  readonly cursor?: string;
}

export interface SopPublishedTemplatesListResult {
  readonly items: readonly SopPublishedTemplateItem[];
  readonly nextCursor?: string;
}

/**
 * 律师端已发布 SOP 模板列表。
 */
export class SopPublishedTemplatesListService {
  constructor(private readonly templateReadRepository: SopTemplateReadRepository) {}

  async list(
    _actor: AuthContext,
    accessToken: string,
    query: SopPublishedTemplatesListQuery,
  ): Promise<SopPublishedTemplatesListResult> {
    const limit = parseLimit({ requested: query.limit });
    const result: PublishedTemplatesListResult =
      await this.templateReadRepository.listPublishedTemplates(accessToken, {
        limit,
        cursor: query.cursor,
      });
    return {
      items: result.items,
      ...(result.nextCursor ? { nextCursor: result.nextCursor } : {}),
    };
  }
}
