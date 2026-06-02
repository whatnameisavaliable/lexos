import { AuthErrorCode, type AuthRefreshBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import {
  AuthAdapterError,
  type SupabaseAuthAdapter,
} from "../adapters/auth/supabase-auth.adapter.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { ProfileRepository } from "../repositories/profile.repository.js";
import type { AuthLoginResult } from "./auth-login.service.js";

/**
 * 刷新 access token（不经过 Bearer 中间件）�?
 */
export class AuthRefreshService {
  constructor(
    private readonly authAdapter: SupabaseAuthAdapter,
    private readonly profileRepository: ProfileRepository,
  ) {}

  async refresh(body: AuthRefreshBody): Promise<AuthLoginResult> {
    let session;
    try {
      session = await this.authAdapter.refreshSession(body.refreshToken);
    } catch (err) {
      this.mapRefreshError(err);
    }

    const profile = await this.profileRepository.findById(
      session.accessToken,
      session.userId,
    );

    if (!profile || profile.status === "disabled") {
      throw new AppHttpError(
        AuthErrorCode.AUTH_ACCOUNT_DISABLED,
        "Account is disabled",
      );
    }

    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      userId: session.userId,
      expiresAt: session.expiresAt,
      role: profile.role,
      requiresPasswordChange: profile.requiresPasswordChange,
    };
  }

  private mapRefreshError(err: unknown): never {
    if (err instanceof AuthAdapterError && err.code === "AUTH_UNAUTHORIZED") {
      throw new AppHttpError(
        AuthErrorCode.AUTH_UNAUTHORIZED,
        "Invalid or expired refresh token",
      );
    }
    throw new AppHttpError(
      ErrorCode.INTERNAL_ERROR,
      err instanceof Error ? err.message : "Refresh failed",
    );
  }
}
