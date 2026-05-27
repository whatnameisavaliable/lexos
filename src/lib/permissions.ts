import type { UserRole } from "@/types/user";

export const PERMISSION_KEYS = [
  "dashboard.view",
  "users.manage",
  "users.view",
  "audit.view",
  "cases.view",
  "cases.view_own",
  "referrals.view",
  "reports.view",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export function roleHasPermission(
  role: UserRole,
  permissions: PermissionKey[],
  required: PermissionKey,
): boolean {
  if (permissions.includes(required)) {
    return true;
  }
  return false;
}
