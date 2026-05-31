import type { AuditLogItem } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AuditLogReadRepository } from "../repositories/audit-log-read.repository.js";
import { mapAuditLogRow } from "../repositories/audit-log-read.types.js";

/**
 * 管理员审计日志详情（单条）。
 */
export class AuditLogGetService {
  constructor(private readonly auditLogReadRepository: AuditLogReadRepository) {}

  async get(accessToken: string, id: string): Promise<AuditLogItem> {
    const row = await this.auditLogReadRepository.getById(accessToken, id);
    if (!row) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Audit log not found");
    }
    return mapAuditLogRow(row);
  }
}
