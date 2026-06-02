import type { AdminUserStatusBody, AuthContext } from "@lexos/shared";
import { BUILTIN_ADMIN_USERNAME } from "@lexos/shared/config";
import { ErrorCode } from "@lexos/shared/api";
import type { SupabaseAuthAdapter } from "../adapters/auth/supabase-auth.adapter.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AuditWriterService, AuditRequestMeta } from "./audit-writer.service.js";
import type { AdminUserRepository } from "../repositories/admin-user.repository.js";
import { clearProfileStatusCache } from "../middleware/auth.middleware.js";
import { toAdminUserDetailDto, type AdminUserDetailDto } from "./admin-user-mapper.js";

export interface AdminUserStatusMeta {
  readonly ip?: string;
  readonly userAgent?: string;
}

/**
 * ??/????????????????????? admin / ?? admin ????
 */
export class AdminUserStatusService {
  constructor(
    private readonly authAdapter: SupabaseAuthAdapter,
    private readonly adminUserRepository: AdminUserRepository,
    private readonly auditWriterService: AuditWriterService,
  ) {}

  async setStatus(
    actor: AuthContext,
    userId: string,
    body: AdminUserStatusBody,
    meta: AdminUserStatusMeta = {},
  ): Promise<AdminUserDetailDto> {
    const target = await this.adminUserRepository.findUserById(userId);
    if (!target) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "User not found");
    }

    if (body.status === "disabled") {
      if (target.username === BUILTIN_ADMIN_USERNAME) {
        throw new AppHttpError(
          ErrorCode.OPERATION_NOT_ALLOWED,
          "Cannot disable built-in admin account",
        );
      }
      if (target.role === "admin" && target.status === "enabled") {
        const enabledAdmins =
          await this.adminUserRepository.countEnabledAdmins();
        if (enabledAdmins <= 1) {
          throw new AppHttpError(
            ErrorCode.OPERATION_NOT_ALLOWED,
            "Cannot disable the last enabled admin",
          );
        }
      }
    }

    const updated = await this.adminUserRepository.setUserStatus(
      userId,
      body.status,
    );

    if (body.status === "disabled") {
      clearProfileStatusCache(userId);
    }

    await this.auditWriterService.write({actorId: actor.userId,
      action: body.status === "disabled" ? "user.disable" : "user.enable",
      targetType: "profile",
      targetId: userId}, { ip: meta.ip ?? null, userAgent: meta.userAgent ?? null });

    return toAdminUserDetailDto(updated);
  }
}
