import type { AuthContext } from "@lexos/shared";
import type { ProfileUpdateBody } from "@lexos/shared";
import type { ProfileRepository } from "../repositories/profile.repository.js";
import type { ProfileRecord } from "../repositories/profile.types.js";

/** `GET /api/profile` 响应。 */
export interface ProfileDto {
  readonly userId: string;
  readonly username: string;
  readonly displayName: string;
  readonly role: AuthContext["role"];
  readonly contact: string | null;
  readonly mfaEnabled: boolean;
  readonly status: ProfileRecord["status"];
}

/**
 * 个人资料读写（禁止修改 `role/status/username/mfa_enabled`）。
 */
export class ProfileService {
  constructor(private readonly profileRepository: ProfileRepository) {}

  getProfile(profile: ProfileRecord): ProfileDto {
    return {
      userId: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      role: profile.role,
      contact: profile.contact,
      mfaEnabled: profile.mfaEnabled,
      status: profile.status,
    };
  }

  async updateProfile(
    accessToken: string,
    auth: AuthContext,
    body: ProfileUpdateBody,
  ): Promise<ProfileDto> {
    const updated = await this.profileRepository.updateDisplayContact(
      accessToken,
      auth.userId,
      {
        ...(body.displayName !== undefined
          ? { displayName: body.displayName }
          : {}),
        ...(body.contact !== undefined ? { contact: body.contact } : {}),
      },
    );
    return this.getProfile(updated);
  }
}
