import { USER_ROLE_VALUES, type UserRole } from "@lexos/shared";

/** 角色中文展示名。 */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "管理员",
  lawyer: "律师",
  director: "主任",
  client: "客户",
  channel: "渠道",
};

/** 用户管理表单可选角色（与 PRD 矩阵一致）。 */
export const ASSIGNABLE_ROLES: readonly UserRole[] = USER_ROLE_VALUES;
