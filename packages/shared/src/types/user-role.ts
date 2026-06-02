/**
 * 业务角色枚举（与 `public.user_role` / `database.md` §1.2 一致）。
 */
export const UserRole = {
  ADMIN: "admin",
  LAWYER: "lawyer",
  DIRECTOR: "director",
  CLIENT: "client",
  CHANNEL: "channel",
} as const;

/** `profiles.role` 合法取值。 */
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/** 所有角色字面量（校验与测试用）。 */
export const USER_ROLE_VALUES: readonly UserRole[] = Object.values(UserRole);

/** 首期预留角色（无业务模块，仅个人中心只读 + 改密）。 */
export const RESERVED_USER_ROLES: readonly UserRole[] = [
  UserRole.DIRECTOR,
  UserRole.CLIENT,
  UserRole.CHANNEL,
];

/**
 * 判断字符串是否为合法 {@link UserRole}。
 */
export function isUserRole(value: string): value is UserRole {
  return USER_ROLE_VALUES.includes(value as UserRole);
}

/**
 * 是否为预留角色（`director` / `client` / `channel`）。
 */
export function isReservedUserRole(role: UserRole): boolean {
  return RESERVED_USER_ROLES.includes(role);
}
