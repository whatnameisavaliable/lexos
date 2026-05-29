import {
  AuthErrorCode,
  type AuthChangePasswordBody,
  hasCurrentPassword,
} from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import type { AuthContext } from "@lexos/shared";
import type { SupabaseAuthAdapter } from "../adapters/auth/supabase-auth.adapter.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AuditLogRepository } from "../repositories/audit-log.repository.js";
import type { ProfileAdminRepository } from "../repositories/profile-admin.repository.js";

export interface AuthChangePasswordMeta {
  readonly ip?: string;
  readonly userAgent?: string;
}

/**
 * 改密服务：主动改密校验原密码；强制改密可省略；完成后 RPC 清除标记。
 */
export class AuthChangePasswordService {
  constructor(
    private readonly authAdapter: SupabaseAuthAdapter,
    private readonly profileAdminRepository: ProfileAdminRepository,
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  async changePassword(
    auth: AuthContext,
    accessToken: string,
    body: AuthChangePasswordBody,
    meta: AuthChangePasswordMeta = {},
  ): Promise<void> {
    if (!auth.requiresPasswordChange) {
      if (!hasCurrentPassword(body)) {
        throw new AppHttpError(
          ErrorCode.VALIDATION_FAILED,
          "currentPassword is required",
        );
      }
      try {
        await this.authAdapter.signInWithPassword(
          auth.username,
          body.currentPassword,
        );
      } catch {
        throw new AppHttpError(
          AuthErrorCode.AUTH_INVALID_CREDENTIALS,
          "Current password is incorrect",
        );
      }
    }

    await this.authAdapter.updateUserPasswordWithSession(
      accessToken,
      body.newPassword,
    );

    await this.profileAdminRepository.completePasswordChange(accessToken);

    await this.auditLogRepository.append({
      actorId: auth.userId,
      action: "auth.password_change",
      targetType: "profile",
      targetId: auth.userId,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
    });
  }
}
