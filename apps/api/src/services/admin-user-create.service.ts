import type { AdminUserCreateBody, AuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import type { SupabaseAuthAdapter } from "../adapters/auth/supabase-auth.adapter.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AuditLogRepository } from "../repositories/audit-log.repository.js";
import type { AdminUserRepository } from "../repositories/admin-user.repository.js";
import { toAdminUserDetailDto, type AdminUserDetailDto } from "./admin-user-mapper.js";

export interface AdminUserCreateMeta {
  readonly ip?: string;
  readonly userAgent?: string;
}

/**
 * 管理员创建用户（Auth + profiles + 云盘根目录 + 审计）。
 */
export class AdminUserCreateService {
  constructor(
    private readonly authAdapter: SupabaseAuthAdapter,
    private readonly adminUserRepository: AdminUserRepository,
    private readonly auditLogRepository: AuditLogRepository,
    private readonly initialPassword: string,
  ) {}

  async create(
    actor: AuthContext,
    body: AdminUserCreateBody,
    meta: AdminUserCreateMeta = {},
  ): Promise<AdminUserDetailDto> {
    const username = body.username;
    const existing = await this.adminUserRepository.findUserByUsername(username);
    if (existing) {
      throw new AppHttpError(
        ErrorCode.VALIDATION_FAILED,
        "Username already exists",
      );
    }

    const virtualEmail = this.authAdapter.resolveVirtualEmail(username);
    let userId: string | undefined;

    try {
      const created = await this.authAdapter.adminCreateUser(
        virtualEmail,
        this.initialPassword,
      );
      userId = created.userId;

      const profile = await this.adminUserRepository.insertProfileAfterAuth({
        id: userId,
        username,
        displayName: body.displayName,
        role: body.role,
        contact: body.contact ?? null,
      });

      await this.adminUserRepository.seedDriveRootFolder(userId);

      await this.auditLogRepository.append({
        actorId: actor.userId,
        action: "user.create",
        targetType: "profile",
        targetId: userId,
        ip: meta.ip ?? null,
        userAgent: meta.userAgent ?? null,
        metadata: { username, role: body.role },
      });

      return toAdminUserDetailDto(profile);
    } catch (err) {
      if (userId) {
        await this.adminUserRepository.deleteProfile(userId).catch(() => undefined);
        await this.authAdapter.adminDeleteUser(userId).catch(() => undefined);
      }
      throw err;
    }
  }
}
