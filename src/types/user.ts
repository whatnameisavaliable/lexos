export const USER_ROLES = [
  "admin",
  "lawyer",
  "client",
  "channel_partner",
  "director",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = [
  "active",
  "disabled",
  "resigned",
  "deleted",
] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export const CREATABLE_ROLES = USER_ROLES.filter(
  (role): role is Exclude<UserRole, "admin"> => role !== "admin",
);

export type CreatableUserRole = (typeof CREATABLE_ROLES)[number];

export interface Profile {
  id: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRpcResult {
  user_id: string;
  username: string;
  reset_token: string;
}

export interface ResetUserRpcResult {
  user_id: string;
  username: string;
  reset_token: string;
}

export interface PasswordResetCompleteResult {
  user_id: string;
  username: string;
}
