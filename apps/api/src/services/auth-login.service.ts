import {
  AuthErrorCode,
  AUTH_LOGIN_FAILURE_MESSAGE,
  type AuthLoginBody,
  type UserRole,
} from "@lexos/shared";
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
  readonly role: UserRole;
  readonly requiresPasswordChange: boolean;
}

/**
 * ??????????? + ??????????? audit_logs?PRD-3.7-01??
 */
export class AuthLoginService {
  constructor(
    private readonly authAdapter: SupabaseAuthAdapter,
    private readonly profileRepository: ProfileRepository,
    private readonly auditWriterService: AuditWriterService,
  ) {}

  /** ?????????? */
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
          AuthErrorCode.AUTH_INVALID_CREDENTIALS,
          AUTH_LOGIN_FAILURE_MESSAGE,
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
      this.mapLoginError(err);
    }
  }

  private mapLoginError(err: unknown): never {
    if (err instanceof AppHttpError) {
      throw err;
    }
    if (err instanceof AuthAdapterError) {
      if (err.code === "AUTH_INVALID_CREDENTIALS") {
        throw new AppHttpError(
          AuthErrorCode.AUTH_INVALID_CREDENTIALS,
          AUTH_LOGIN_FAILURE_MESSAGE,
        );
      }
    }
    throw new AppHttpError(
      ErrorCode.INTERNAL_ERROR,
      err instanceof Error ? err.message : "Login failed",
    );
  }
}
