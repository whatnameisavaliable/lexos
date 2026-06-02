import {
  AuthErrorCode,
  type AuthChangePasswordBody,
  hasCurrentPassword,
} from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import type { AuthContext } from "@lexos/shared";
import type { SupabaseAuthAdapter } from "../adapters/auth/supabase-auth.adapter.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AuditWriterService, AuditRequestMeta } from "./audit-writer.service.js";
import type { ProfileAdminRepository } from "../repositories/profile-admin.repository.js";
import { clearProfileStatusCache } from "../middleware/auth.middleware.js";

export interface AuthChangePasswordMeta {
  readonly ip?: string;
  readonly userAgent?: string;
}

/** 改密成功后会话（刷新 access token 供前端写�?Cookie）�?*/
export interface AuthChangePasswordResult {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt?: number;
}

/**
 * 改密服务：主动改密校验原密码；强制改密可省略；完成后 RPC 清除标记�?
 */
export class AuthChangePasswordService {
  constructor(
    private readonly authAdapter: SupabaseAuthAdapter,
    private readonly profileAdminRepository: ProfileAdminRepository,
    private readonly auditWriterService: AuditWriterService,
  ) {}

  async changePassword(
    auth: AuthContext,
    _accessToken: string,
    body: AuthChangePasswordBody,
    meta: AuthChangePasswordMeta = {},
  ): Promise<AuthChangePasswordResult> {
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

    // 服务端仅�?access token，Supabase `updateUser` �?setSession；经鉴权后走 Admin API�?
    await this.authAdapter.updateUserPasswordAsAdmin(
      auth.userId,
      body.newPassword,
    );

    await this.profileAdminRepository.setRequiresPasswordChange(
      auth.userId,
      false,
    );
    clearProfileStatusCache(auth.userId);

    const session = await this.authAdapter.signInWithPassword(
      auth.username,
      body.newPassword,
    );

    await this.auditWriterService.write({actorId: auth.userId,
      action: "auth.password_change",
      targetType: "profile",
      targetId: auth.userId}, { ip: meta.ip ?? null, userAgent: meta.userAgent ?? null });

    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
    };
  }
}
