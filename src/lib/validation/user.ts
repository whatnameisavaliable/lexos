import {
  CREATABLE_ROLES,
  type CreatableUserRole,
  type UserStatus,
  USER_STATUSES,
} from "@/types/user";
import { isValidUsername } from "@/lib/auth/username";

export function parseCreatableRole(value: unknown): CreatableUserRole | null {
  if (typeof value !== "string") {
    return null;
  }
  return CREATABLE_ROLES.includes(value as CreatableUserRole)
    ? (value as CreatableUserRole)
    : null;
}

export function parseUsername(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed !== value || trimmed.length === 0) {
    return null;
  }
  return isValidUsername(trimmed) ? trimmed : null;
}

export function parsePassword(value: unknown): string | null {
  if (typeof value !== "string" || value.length < 8) {
    return null;
  }
  return value;
}

export function parseUserStatus(value: unknown): UserStatus | null {
  if (typeof value !== "string") {
    return null;
  }
  return USER_STATUSES.includes(value as UserStatus)
    ? (value as UserStatus)
    : null;
}
