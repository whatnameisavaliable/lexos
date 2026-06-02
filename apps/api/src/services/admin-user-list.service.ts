import type { AdminUserListQuery } from "@lexos/shared";
import { buildPaginationMeta } from "@lexos/shared/api";
import type { AdminUserRepository } from "../repositories/admin-user.repository.js";
import type { AdminUserListItem } from "@lexos/shared";

/** `GET /api/admin/users` 响应体�?*/
export interface AdminUserListResponse {
  readonly items: readonly AdminUserListItem[];
  readonly meta: ReturnType<typeof buildPaginationMeta> & {
    readonly total?: number;
  };
}

/**
 * 管理员用户列表（分页 meta �?`packages/shared` 对齐）�?
 */
export class AdminUserListService {
  constructor(private readonly adminUserRepository: AdminUserRepository) {}

  async list(query: AdminUserListQuery): Promise<AdminUserListResponse> {
    const result = await this.adminUserRepository.listUsers(query);
    return {
      items: result.items,
      meta: {
        ...buildPaginationMeta(query.limit, result.nextCursor),
        ...(result.total !== undefined ? { total: result.total } : {}),
      },
    };
  }
}
