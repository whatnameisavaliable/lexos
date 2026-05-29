import { AuthErrorCode, type AuthLoginBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import type { AuthRuntimeEnvConfig } from "@lexos/shared/config";
import {
  AuthAdapterError,
  type SupabaseAuthAdapter,
} from "../adapters/auth/supabase-auth.adapter.js";
import type { CaptchaAdapter } from "../adapters/auth/captcha.adapter.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AuditLogRepository } from "../repositories/audit-log.repository.js";
import type { ProfileRepository } from "../repositories/profile.repository.js";

/** 应用层连续失败阈值（PRD §2.5.3）。 */
export const LOGIN_FAILURE_CAPTCHA_THRESHOLD = 3;

export interface AuthLoginRequestMeta {
  readonly ip?: string;
  readonly userAgent?: string;
}

export interface AuthLoginResult {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly userId: string;
  readonly expiresAt: number | undefined;
}

/**
 * 登录服务：虚拟邮箱认证、验证码策略占位、审计（PRD §3.2）。
 */
export class AuthLoginService {
  private readonly failureCounts = new Map<string, number>();

  constructor(
    private readonly authAdapter: SupabaseAuthAdapter,
    private readonly profileRepository: ProfileRepository,
    private readonly auditLogRepository: AuditLogRepository,
    private readonly captchaAdapter: CaptchaAdapter,
    private readonly authEnv: AuthRuntimeEnvConfig,
  ) {}

  /**
   * 执行用户名密码登录。
   */
  async login(
    body: AuthLoginBody,
    meta: AuthLoginRequestMeta = {},
  ): Promise<AuthLoginResult> {
    const username = body.username;
    const failures = this.failureCounts.get(username) ?? 0;

    if (failures >= LOGIN_FAILURE_CAPTCHA_THRESHOLD) {
      if (!body.captchaToken) {
        throw new AppHttpError(
          AuthErrorCode.AUTH_CAPTCHA_REQUIRED,
          "Captcha verification required",
        );
      }
      const captcha = await this.captchaAdapter.verify(
        body.captchaToken,
        meta.ip,
      );
      if (!captcha.success) {
        throw new AppHttpError(
          AuthErrorCode.AUTH_CAPTCHA_REQUIRED,
          "Captcha verification failed",
        );
      }
    }

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

      if (
        this.authEnv.mfaRequiredRoles.includes(profile.role) &&
        profile.mfaEnabled &&
        !body.totpCode
      ) {
        throw new AppHttpError(
          AuthErrorCode.AUTH_MFA_REQUIRED,
          "TOTP code required",
        );
      }

      this.failureCounts.delete(username);

      await this.auditLogRepository.append({
        actorId: session.userId,
        action: "auth.login_success",
        targetType: "profile",
        targetId: session.userId,
        ip: meta.ip ?? null,
        userAgent: meta.userAgent ?? null,
      });

      return {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        userId: session.userId,
        expiresAt: session.expiresAt,
      };
    } catch (err) {
      if (err instanceof AppHttpError) {
        throw err;
      }
      this.recordFailure(username);
      await this.auditLoginFailure(username, meta);
      this.mapLoginError(err);
    }
  }

  private recordFailure(username: string): void {
    this.failureCounts.set(username, (this.failureCounts.get(username) ?? 0) + 1);
  }

  private async auditLoginFailure(
    username: string,
    meta: AuthLoginRequestMeta,
  ): Promise<void> {
    await this.auditLogRepository.append({
      actorId: null,
      action: "auth.login_failure",
      metadata: { attempted_username: username },
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
    });
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
