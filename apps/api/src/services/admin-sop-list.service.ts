import type { AdminSopTemplateListItem } from "@lexos/shared";
import type { AdminSopRepository } from "../repositories/admin-sop.repository.js";

export interface AdminSopListQuery {
  readonly limit?: number;
  readonly cursor?: string;
}

export interface AdminSopListResult {
  readonly items: readonly AdminSopTemplateListItem[];
  readonly meta: { readonly limit: number };
  readonly nextCursor?: string;
}

const DEFAULT_LIMIT = 50;

/**
 * `GET /api/admin/sops` 列表服务。
 */
export class AdminSopListService {
  constructor(private readonly repository: AdminSopRepository) {}

  async list(query: AdminSopListQuery = {}): Promise<AdminSopListResult> {
    const limit = query.limit ?? DEFAULT_LIMIT;
    const { items, nextCursor } = await this.repository.listTemplatesWithVersions(
      limit,
      query.cursor,
    );
    return {
      items,
      meta: { limit },
      ...(nextCursor ? { nextCursor } : {}),
    };
  }
}
