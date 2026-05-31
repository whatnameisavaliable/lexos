import type { AuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import type { SupabaseAuthAdapter } from "../adapters/auth/supabase-auth.adapter.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AdminUserRepository } from "../repositories/admin-user.repository.js";
import { clearProfileStatusCache } from "../middleware/auth.middleware.js";

export interface AdminUserResetPasswordMeta {
  readonly ip?: string;
  readonly userAgent?: string;
}

/** 重置密码成功响应（无敏感字段）。 */
export interface AdminUserResetPasswordResult {
  readonly ok: true;
  readonly userId: string;
}

/**
 * 管理员重置密码（Auth 初始密码 → DB 事务标记+审计 → 全局登出）。
 */
export class AdminUserResetPasswordService {
  constructor(
    private readonly authAdapter: SupabaseAuthAdapter,
    private readonly adminUserRepository: AdminUserRepository,
    private readonly initialPassword: string,
  ) {}

  async resetPassword(
    actor: AuthContext,
    userId: string,
    meta: AdminUserResetPasswordMeta = {},
  ): Promise<AdminUserResetPasswordResult> {
    const target = await this.adminUserRepository.findUserById(userId);
    if (!target) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "User not found");
    }

    await this.authAdapter.adminUpdateUserPassword(userId, this.initialPassword);

    try {
      await this.adminUserRepository.applyPasswordResetAudit(userId, actor.userId, {
        ip: meta.ip,
        userAgent: meta.userAgent,
      });
    } catch {
      await this.adminUserRepository
        .setRequiresPasswordChange(userId, true)
        .catch(() => undefined);
      throw new AppHttpError(
        ErrorCode.INTERNAL_ERROR,
        "Password reset audit failed; user password was updated",
      );
    }

    await this.authAdapter.adminSignOutGlobal(userId);
    clearProfileStatusCache(userId);

    return { ok: true, userId };
  }
}
