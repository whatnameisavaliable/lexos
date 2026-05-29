import type { AuthContext } from "@lexos/shared";
import type { SupabaseAuthAdapter } from "../adapters/auth/supabase-auth.adapter.js";
import type { AuditLogRepository } from "../repositories/audit-log.repository.js";

export interface AuthLogoutRequestMeta {
  readonly ip?: string;
  readonly userAgent?: string;
}

/**
 * 登出服务：吊销会话并写 `auth.logout` 审计。
 */
export class AuthLogoutService {
  constructor(
    private readonly authAdapter: SupabaseAuthAdapter,
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  async logout(
    auth: AuthContext,
    accessToken: string,
    meta: AuthLogoutRequestMeta = {},
  ): Promise<void> {
    await this.authAdapter.signOut(accessToken);
    await this.auditLogRepository.append({
      actorId: auth.userId,
      action: "auth.logout",
      targetType: "profile",
      targetId: auth.userId,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
    });
  }
}
