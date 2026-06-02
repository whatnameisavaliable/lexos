import type { AuthContext } from "@lexos/shared";
import type { ProfileRecord } from "../repositories/profile.types.js";

/** `GET /api/auth/session` 响应数据�?*/
export interface AuthSessionDto {
  readonly userId: string;
  readonly username: string;
  readonly displayName: string;
  readonly role: AuthContext["role"];
  readonly contact: string | null;
  readonly requiresPasswordChange: boolean;
  readonly mfaEnabled: boolean;
  readonly status: ProfileRecord["status"];
}

/**
 * 组装当前会话摘要（`architecture.md` §7 `/api/auth/session`）�?
 */
export class AuthSessionService {
  /**
   * @param auth - 中间件注入的 {@link AuthContext}
   * @param profile - 中间件加载的 `profiles` �?
   */
  buildSession(auth: AuthContext, profile: ProfileRecord): AuthSessionDto {
    return {
      userId: auth.userId,
      username: auth.username,
      displayName: profile.displayName,
      role: auth.role,
      contact: profile.contact,
      requiresPasswordChange: auth.requiresPasswordChange,
      mfaEnabled: profile.mfaEnabled,
      status: profile.status,
    };
  }
}
