import type { AdminUserUpdateBody, AuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import type { AuditLogRepository } from "../repositories/audit-log.repository.js";
import type { AdminUserRepository } from "../repositories/admin-user.repository.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { toAdminUserDetailDto, type AdminUserDetailDto } from "./admin-user-mapper.js";

export interface AdminUserUpdateMeta {
  readonly ip?: string;
  readonly userAgent?: string;
}

/**
 * 管理员更新用户资料（禁止 `username` / `status`）。
 */
export class AdminUserUpdateService {
  constructor(
    private readonly adminUserRepository: AdminUserRepository,
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  async update(
    actor: AuthContext,
    userId: string,
    body: AdminUserUpdateBody,
    meta: AdminUserUpdateMeta = {},
  ): Promise<AdminUserDetailDto> {
    const existing = await this.adminUserRepository.findUserById(userId);
    if (!existing) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "User not found");
    }

    const updated = await this.adminUserRepository.updateProfileFields(userId, {
      ...(body.displayName !== undefined
        ? { displayName: body.displayName }
        : {}),
      ...(body.role !== undefined ? { role: body.role } : {}),
      ...(body.contact !== undefined ? { contact: body.contact } : {}),
    });

    await this.auditLogRepository.append({
      actorId: actor.userId,
      action: "user.update",
      targetType: "profile",
      targetId: userId,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      metadata: {
        fields: Object.keys(body),
      },
    });

    return toAdminUserDetailDto(updated);
  }
}
