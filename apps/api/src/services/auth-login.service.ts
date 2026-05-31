import { AuthErrorCode, type AuthLoginBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import {
  AuthAdapterError,
  type SupabaseAuthAdapter,
} from "../adapters/auth/supabase-auth.adapter.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type {
  AuditRequestMeta,
  AuditWriterService,
} from "./audit-writer.service.js";
import type { ProfileRepository } from "../repositories/profile.repository.js";

export interface AuthLoginRequestMeta extends AuditRequestMeta {}

export interface AuthLoginResult {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly userId: string;
  readonly expiresAt: number | undefined;
  readonly role: "admin" | "lawyer";
  readonly requiresPasswordChange: boolean;
}

/**
 * 登录服务：虚拟邮箱认证 + 审计（首期不含验证码 / MFA）。
 */
export class AuthLoginService {
  constructor(
    private readonly authAdapter: SupabaseAuthAdapter,
    private readonly profileRepository: ProfileRepository,
    private readonly auditWriterService: AuditWriterService,
  ) {}

  /**
   * 执行用户名密码登录。
   */
  async login(
    body: AuthLoginBody,
    meta: AuthLoginRequestMeta = {},
  ): Promise<AuthLoginResult> {
    const username = body.username;

    try {
      const session = await this.authAdapter.signInWithPassword(
        username,
        body.password,
      );

      const profile = await this.profileRepository.findById(
        session.accessToken,
        session.userId,
      );

      if (!profile || profile.status === "disabled") {
        await this.authAdapter.signOut(session.accessToken).catch(() => undefined);
        throw new AppHttpError(
          AuthErrorCode.AUTH_ACCOUNT_DISABLED,
          "Account is disabled",
        );
      }

      await this.auditWriterService.write(
        {
          actorId: session.userId,
          action: "auth.login_success",
          targetType: "profile",
          targetId: session.userId,
        },
        { ip: meta.ip, userAgent: meta.userAgent, client: meta.client },
      );

      return {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        userId: session.userId,
        expiresAt: session.expiresAt,
        role: profile.role,
        requiresPasswordChange: profile.requiresPasswordChange,
      };
    } catch (err) {
      if (err instanceof AppHttpError) {
        throw err;
      }
      await this.auditLoginFailure(username, meta).catch(() => undefined);
      this.mapLoginError(err);
    }
  }

  private async auditLoginFailure(
    username: string,
    meta: AuthLoginRequestMeta,
  ): Promise<void> {
    await this.auditWriterService.write(
      {
        actorId: null,
        action: "auth.login_failure",
        metadata: { attempted_username: username },
      },
      { ip: meta.ip, userAgent: meta.userAgent, client: meta.client },
    );
  }

  private mapLoginError(err: unknown): never {
    if (err instanceof AppHttpError) {
      throw err;
    }
    if (err instanceof AuthAdapterError) {
      if (err.code === "AUTH_INVALID_CREDENTIALS") {
        throw new AppHttpError(
          AuthErrorCode.AUTH_INVALID_CREDENTIALS,
          "Invalid username or password",
        );
      }
    }
    throw new AppHttpError(
      ErrorCode.INTERNAL_ERROR,
      err instanceof Error ? err.message : "Login failed",
    );
  }
}
