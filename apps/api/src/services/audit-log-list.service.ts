import type { AuditLogsQuery } from "@lexos/shared";
import type { AuditLogItem } from "@lexos/shared";
import { buildPaginationMeta } from "@lexos/shared/api";
import type { AuditLogReadRepository } from "../repositories/audit-log-read.repository.js";

/** `GET /api/admin/audit/logs` 响应体。 */
export interface AuditLogListResponse {
  readonly items: readonly AuditLogItem[];
  readonly meta: ReturnType<typeof buildPaginationMeta>;
}

/**
 * 管理员审计日志列表（RLS 经 admin JWT 生效）。
 */
export class AuditLogListService {
  constructor(private readonly auditLogReadRepository: AuditLogReadRepository) {}

  async list(
    accessToken: string,
    query: AuditLogsQuery,
  ): Promise<AuditLogListResponse> {
    const result = await this.auditLogReadRepository.list(accessToken, query);
    return {
      items: result.items,
      meta: buildPaginationMeta(query.limit, result.nextCursor),
    };
  }
}
