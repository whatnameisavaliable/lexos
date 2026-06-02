import { AuthErrorCode, type UserRole } from "@lexos/shared";
import type { AuthContext } from "@lexos/shared";
import type { AuthRuntimeEnvConfig } from "@lexos/shared/config";
import type {
  AuthMfaEnrollResult,
  SupabaseAuthAdapter,
} from "../adapters/auth/supabase-auth.adapter.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { ProfileAdminRepository } from "../repositories/profile-admin.repository.js";
import type { ProfileRecord } from "../repositories/profile.types.js";

export interface AuthMfaStatusDto {
  readonly mfaEnabled: boolean;
  readonly required: boolean;
  readonly currentLevel: string | null;
  readonly nextLevel: string | null;
}

/**
 * MFA 注册/校验服务（PRD §2.5.2）�?
 */
export class AuthMfaService {
  constructor(
    private readonly authAdapter: SupabaseAuthAdapter,
    private readonly profileAdminRepository: ProfileAdminRepository,
    private readonly authEnv: Pick<AuthRuntimeEnvConfig, "mfaRequiredRoles">,
  ) {}

  assertMfaEligible(role: UserRole): void {
    if (!this.authEnv.mfaRequiredRoles.includes(role)) {
      throw new AppHttpError(
        AuthErrorCode.AUTH_FORBIDDEN,
        "MFA is not required for this role",
      );
    }
  }

  async enroll(
    auth: AuthContext,
    accessToken: string,
  ): Promise<AuthMfaEnrollResult> {
    this.assertMfaEligible(auth.role);
    return this.authAdapter.enrollMfa(accessToken);
  }

  async verify(
    auth: AuthContext,
    accessToken: string,
    factorId: string,
    code: string,
  ): Promise<void> {
    this.assertMfaEligible(auth.role);
    await this.authAdapter.verifyMfa(accessToken, factorId, code);
    await this.profileAdminRepository.setMfaEnabled(
      accessToken,
      auth.userId,
      true,
    );
  }

  async getStatus(
    auth: AuthContext,
    accessToken: string,
    profile: ProfileRecord,
  ): Promise<AuthMfaStatusDto> {
    const assurance =
      await this.authAdapter.getMfaAuthenticatorAssuranceLevel(accessToken);

    const required = this.authEnv.mfaRequiredRoles.includes(auth.role);
    if (required && !profile.mfaEnabled) {
      throw new AppHttpError(
        AuthErrorCode.AUTH_MFA_REQUIRED,
        "MFA enrollment required",
      );
    }

    return {
      mfaEnabled: profile.mfaEnabled,
      required,
      currentLevel: assurance.currentLevel,
      nextLevel: assurance.nextLevel,
    };
  }
}
