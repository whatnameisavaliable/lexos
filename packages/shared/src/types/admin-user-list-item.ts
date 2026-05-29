import type { UserRole } from "./user-role.js";
import type { ProfileStatus } from "../dto/admin-user-status.dto.js";

/**
 * `GET /api/admin/users` 列表行（`ui_design.md` §6.2；含 MFA Badge 字段）。
 */
export interface AdminUserListItem {
  readonly id: string;
  readonly username: string;
  readonly displayName: string;
  readonly role: UserRole;
  readonly status: ProfileStatus;
  readonly mfaEnabled: boolean;
  readonly createdAt: string;
  readonly contact?: string | null;
}
