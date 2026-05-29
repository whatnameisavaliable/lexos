import type { AdminUserListItem } from "@lexos/shared";
import type { AdminProfileRecord } from "../repositories/admin-user.types.js";

/** 管理员用户详情 API 响应。 */
export interface AdminUserDetailDto {
  readonly id: string;
  readonly username: string;
  readonly displayName: string;
  readonly role: AdminProfileRecord["role"];
  readonly contact: string | null;
  readonly status: AdminProfileRecord["status"];
  readonly requiresPasswordChange: boolean;
  readonly mfaEnabled: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * 将仓库记录映射为详情 DTO。
 */
export function toAdminUserDetailDto(
  record: AdminProfileRecord,
): AdminUserDetailDto {
  return {
    id: record.id,
    username: record.username,
    displayName: record.displayName,
    role: record.role,
    contact: record.contact,
    status: record.status,
    requiresPasswordChange: record.requiresPasswordChange,
    mfaEnabled: record.mfaEnabled,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/**
 * 列表项与详情 DTO 字段对齐（列表无 `requiresPasswordChange`）。
 */
export function toAdminUserListDto(
  item: AdminUserListItem,
): AdminUserListItem {
  return item;
}
