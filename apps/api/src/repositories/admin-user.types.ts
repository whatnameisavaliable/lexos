import type { AdminUserListItem } from "@lexos/shared";
import type { UserRole } from "@lexos/shared";
import {
  mapProfileRow,
  type ProfileRecord,
  type ProfileRowDb,
} from "./profile.types.js";
import type { ProfileStatus } from "./profile.types.js";

const ADMIN_PROFILE_SELECT =
  "id, username, display_name, role, contact, status, requires_password_change, mfa_enabled, created_at, updated_at";

/** Supabase `profiles` 管理员详情行。 */
export interface AdminProfileRowDb extends ProfileRowDb {
  readonly created_at: string;
  readonly updated_at: string;
}

/**
 * 管理员可见的完整 `profiles` 记录（含时间戳）。
 */
export interface AdminProfileRecord extends ProfileRecord {
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** `listUsers` 分页结果。 */
export interface AdminUserListResult {
  readonly items: readonly AdminUserListItem[];
  readonly nextCursor?: string;
  readonly total?: number;
}

/** `insertProfileAfterAuth` 入参。 */
export interface InsertProfileAfterAuthInput {
  readonly id: string;
  readonly username: string;
  readonly displayName: string;
  readonly role: UserRole;
  readonly contact?: string | null;
}

/** `updateProfileFields` 可写字段。 */
export interface AdminProfileFieldsPatch {
  readonly displayName?: string;
  readonly role?: UserRole;
  readonly contact?: string | null;
}

/**
 * 将数据库行映射为 {@link AdminProfileRecord}。
 */
export function mapAdminProfileRow(row: AdminProfileRowDb): AdminProfileRecord {
  return {
    ...mapProfileRow(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * 将数据库行映射为列表项 DTO。
 */
export function mapAdminUserListItem(row: AdminProfileRowDb): AdminUserListItem {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    status: row.status as ProfileStatus,
    mfaEnabled: row.mfa_enabled,
    createdAt: row.created_at,
    contact: row.contact,
  };
}

/** 列表查询 SELECT 列。 */
export const ADMIN_USER_LIST_SELECT =
  "id, username, display_name, role, contact, status, mfa_enabled, created_at";

/** 详情 SELECT 列。 */
export const ADMIN_USER_DETAIL_SELECT = ADMIN_PROFILE_SELECT;

/**
 * 编码 cursor 分页令牌（`created_at|id`）。
 */
export function encodeListCursor(createdAt: string, id: string): string {
  return `${createdAt}|${id}`;
}

/**
 * 解码 cursor；非法格式抛出。
 */
export function decodeListCursor(cursor: string): { createdAt: string; id: string } {
  const separator = cursor.indexOf("|");
  if (separator <= 0) {
    throw new Error("invalid list cursor");
  }
  const createdAt = cursor.slice(0, separator);
  const id = cursor.slice(separator + 1);
  if (!createdAt || !id) {
    throw new Error("invalid list cursor");
  }
  return { createdAt, id };
}
