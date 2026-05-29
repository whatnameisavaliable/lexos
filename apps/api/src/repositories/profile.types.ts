import type { UserRole } from "@lexos/shared";

/** `profiles.status`（`database.md` §1.2）。 */
export type ProfileStatus = "enabled" | "disabled";

/**
 * `public.profiles` 行（API 层只读/受限写字段）。
 */
export interface ProfileRecord {
  readonly id: string;
  readonly username: string;
  readonly displayName: string;
  readonly role: UserRole;
  readonly contact: string | null;
  readonly status: ProfileStatus;
  readonly requiresPasswordChange: boolean;
  readonly mfaEnabled: boolean;
}

/** Supabase 返回的 snake_case 行。 */
export interface ProfileRowDb {
  readonly id: string;
  readonly username: string;
  readonly display_name: string;
  readonly role: UserRole;
  readonly contact: string | null;
  readonly status: ProfileStatus;
  readonly requires_password_change: boolean;
  readonly mfa_enabled: boolean;
}

/**
 * 将数据库行映射为 {@link ProfileRecord}。
 */
export function mapProfileRow(row: ProfileRowDb): ProfileRecord {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    contact: row.contact,
    status: row.status,
    requiresPasswordChange: row.requires_password_change,
    mfaEnabled: row.mfa_enabled,
  };
}
